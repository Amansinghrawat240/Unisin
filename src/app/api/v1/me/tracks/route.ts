import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions, creators } from '@/db/schema';
import { eq, and, desc, inArray, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Simple auth helper for testing
async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const key = userId;
  const limit = 5; // 5 requests per minute
  const windowMs = 60 * 1000; // 1 minute
  
  const userLimit = rateLimitStore.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function isPrivateIP(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check for localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    
    // Check for IPv4 private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    
    if (match) {
      const [, a, b, c, d] = match.map(Number);
      
      // Private IP ranges
      if (a === 10) return true; // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true; // 192.168.0.0/16
      if (a === 127) return true; // 127.0.0.0/8 (loopback)
      if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local)
    }
    
    return false;
  } catch {
    return true; // If URL parsing fails, treat as potentially dangerous
  }
}

// Normalize common external share links to direct file URLs where possible
function normalizeExternalUrl(raw: string): string {
  try {
    // Google Drive: https://drive.google.com/file/d/<ID>/view?...
    const gdriveMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (gdriveMatch?.[1]) {
      const id = gdriveMatch[1];
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    if (raw.includes('drive.google.com') && (raw.includes('uc?export=download') || raw.includes('uc?id='))) {
      return raw; // already direct
    }

    // Dropbox shared/scl links -> dl.dropboxusercontent.com (streamable)
    const u = new URL(raw);
    if (u.hostname.endsWith('dropbox.com')) {
      u.hostname = 'dl.dropboxusercontent.com';
      // Remove forced download flags; content served inline by this host
      u.searchParams.delete('dl');
      u.searchParams.delete('raw');
      return u.toString();
    }

    return raw;
  } catch {
    return raw;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Reconcile submissions possibly saved under the creator's linked userId
    const candidateUserIds = new Set<string>([user.id]);

    // Collect candidate creatorIds as well (by userId OR email)
    const candidateCreatorIds = new Set<number>();

    // Find creator by exact email if provided
    if (user.email) {
      const byEmail = await db
        .select({ id: creators.id, userId: creators.userId })
        .from(creators)
        .where(eq(creators.email, user.email))
        .limit(5);
      for (const c of byEmail) {
        if (c.userId) candidateUserIds.add(c.userId);
        if (typeof c.id === 'number') candidateCreatorIds.add(c.id);
      }
    }

    // Also include any creators owned by this userId
    const byUser = await db
      .select({ id: creators.id, userId: creators.userId })
      .from(creators)
      .where(eq(creators.userId, user.id))
      .limit(10);
    for (const c of byUser) {
      if (c.userId) candidateUserIds.add(c.userId);
      if (typeof c.id === 'number') candidateCreatorIds.add(c.id);
    }

    const ids = Array.from(candidateUserIds);
    const cids = Array.from(candidateCreatorIds);

    // Get user's track submissions (by userId OR creatorId)
    const submissions = await db
      .select({
        trackId: trackSubmissions.id,
        title: trackSubmissions.title,
        state: trackSubmissions.state,
        createdAt: trackSubmissions.createdAt,
        lastUpdate: trackSubmissions.lastUpdate,
        rejectionReason: trackSubmissions.rejectionReason,
      })
      .from(trackSubmissions)
      .where(
        ids.length && cids.length
          ? or(inArray(trackSubmissions.userId, ids), inArray(trackSubmissions.creatorId, cids))
          : ids.length
          ? inArray(trackSubmissions.userId, ids)
          : inArray(trackSubmissions.creatorId, cids)
      )
      .orderBy(desc(trackSubmissions.createdAt));

    // Format response to match expected structure
    const formattedSubmissions = submissions.map((submission) => ({
      trackId: submission.trackId,
      title: submission.title,
      state: submission.state,
      createdAt: Math.floor((submission.createdAt as Date).getTime() / 1000),
      lastUpdate: Math.floor((submission.lastUpdate as Date).getTime() / 1000),
      notes: submission.rejectionReason || undefined,
    }));

    return NextResponse.json(formattedSubmissions, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Maximum 5 requests per minute.',
        code: 'RATE_LIMIT_EXCEEDED' 
      }, { status: 429 });
    }

    // Check if user is an approved creator (by userId first, then reconcile by email)
    let creator = await db.select()
      .from(creators)
      .where(and(eq(creators.userId, user.id), eq(creators.status, 'approved')))
      .limit(1);

    if (creator.length === 0 && user.email) {
      const byEmail = await db.select()
        .from(creators)
        .where(and(eq(creators.email, user.email), eq(creators.status, 'approved')))
        .limit(1);
      if (byEmail.length > 0) {
        creator = byEmail;
        // Optional reconciliation is skipped here to avoid FK issues; other routes handle it.
      }
    }

    if (creator.length === 0) {
      return NextResponse.json({ 
        error: 'User must be an approved creator to submit tracks',
        code: 'CREATOR_NOT_APPROVED' 
      }, { status: 403 });
    }

    const requestBody = await request.json();

    const { title, artists, artistName, album, releaseDate, genre, explicit, cover_url, source } = requestBody;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: "Title is required and must be a non-empty string",
        code: "INVALID_TITLE" 
      }, { status: 400 });
    }

    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ 
        error: "Artists is required and must be a non-empty array",
        code: "INVALID_ARTISTS" 
      }, { status: 400 });
    }

    // Validate all artists are strings
    if (!artists.every(artist => typeof artist === 'string' && artist.trim().length > 0)) {
      return NextResponse.json({ 
        error: "All artists must be non-empty strings",
        code: "INVALID_ARTISTS" 
      }, { status: 400 });
    }

    if (typeof explicit !== 'boolean') {
      return NextResponse.json({ 
        error: "Explicit must be a boolean",
        code: "INVALID_EXPLICIT" 
      }, { status: 400 });
    }

    // Require cover image URL
    if (!cover_url || typeof cover_url !== 'string' || cover_url.trim().length === 0) {
      return NextResponse.json({
        error: "Cover image is required",
        code: "MISSING_COVER_URL"
      }, { status: 400 });
    }

    if (!source || typeof source !== 'object') {
      return NextResponse.json({ 
        error: "Source is required and must be an object",
        code: "INVALID_SOURCE" 
      }, { status: 400 });
    }

    if (!source.type || !['external', 'upload'].includes(source.type)) {
      return NextResponse.json({ 
        error: "Source type must be 'external' or 'upload'",
        code: "INVALID_SOURCE_TYPE" 
      }, { status: 400 });
    }

    // Validate external URL and SSRF protection
    let normalizedOriginalUrl: string | null = null;
    if (source.type === 'external') {
      if (!source.original_url || typeof source.original_url !== 'string') {
        return NextResponse.json({ 
          error: "Original URL is required for external source type",
          code: "MISSING_ORIGINAL_URL" 
        }, { status: 400 });
      }

      // Validate URL format
      try {
        const url = new URL(source.original_url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json({ 
            error: "Original URL must use HTTP or HTTPS protocol",
            code: "INVALID_URL_PROTOCOL" 
          }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ 
          error: "Original URL is not a valid URL",
          code: "INVALID_URL_FORMAT" 
        }, { status: 400 });
      }

      // SSRF protection
      if (isPrivateIP(source.original_url)) {
        return NextResponse.json({ 
          error: "Access to private IP addresses is not allowed",
          code: "PRIVATE_IP_BLOCKED" 
        }, { status: 400 });
      }

      // Normalize supported share links (Google Drive, Dropbox)
      normalizedOriginalUrl = normalizeExternalUrl(source.original_url);
    }

    const now = new Date();

    // CRITICAL: Use artistName if provided (creates Artist Profile), otherwise fall back to username
    const finalArtistsCsv = (artistName && typeof artistName === 'string' && artistName.trim().length > 0)
      ? artistName.trim()
      : artists.map((artist: string) => artist.trim()).join(',');

    // Prepare submission data
    const submissionData = {
      // Use the creator's userId to satisfy FK constraints even if header userId differs
      userId: creator[0].userId,
      creatorId: creator[0].id,
      title: title.trim(),
      artistsCsv: finalArtistsCsv,
      album: album ? album.trim() : null,
      releaseDate: releaseDate ? new Date(releaseDate * 1000) : null,
      genre: genre ? genre.trim() : null,
      explicit,
      coverUrl: cover_url.trim(),
      sourceType: source.type,
      originalUrl: normalizedOriginalUrl ?? (source.original_url || null),
      state: 'submitted',
      processingLog: 'enqueued',
      createdAt: now,
      updatedAt: now,
      lastUpdate: now,
    };

    const createdRows = await db
      .insert(trackSubmissions)
      .values(submissionData)
      .returning({ id: trackSubmissions.id, state: trackSubmissions.state });

    if (!createdRows.length) {
      return NextResponse.json({
        error: 'Failed to create track submission',
        code: 'CREATION_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json({
      trackId: createdRows[0].id,
      state: createdRows[0].state
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}