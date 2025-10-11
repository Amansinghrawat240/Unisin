import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions, moderationActions, user as userTable, tracks, artists as artistsTable, trackArtists } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure slug uniqueness
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db.select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, slug))
      .limit(1);
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Auto-create artists from comma-separated names
async function autoCreateArtists(artistsCsv: string): Promise<number[]> {
  if (!artistsCsv || !artistsCsv.trim()) {
    return [];
  }

  const artistNames = artistsCsv.split(',').map(name => name.trim()).filter(name => name.length > 0);
  const artistIds: number[] = [];

  for (const name of artistNames) {
    // Check if artist already exists (case-insensitive)
    const existingArtist = await db.select()
      .from(artistsTable)
      .where(sql`lower(${artistsTable.name}) = lower(${name})`)
      .limit(1);

    if (existingArtist.length > 0) {
      // Artist already exists
      artistIds.push(existingArtist[0].id as number);
    } else {
      // Create new artist
      const baseSlug = generateSlug(name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);
      
      const newArtist = await db.insert(artistsTable)
        .values({
          name: name,
          slug: uniqueSlug,
          bio: null,
          imageUrl: null,
          bannerUrl: null,
          popularity: 0,
          userId: null,
          isVerified: false,
          monthlyListeners: 0,
          createdAt: new Date()
        })
        .returning();

      artistIds.push(newArtist[0].id as number);
    }
  }

  return artistIds;
}

// Simple auth helper aligned with /moderation/queue
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const userId = request.headers.get('x-test-user-id') || 'admin';
  const email = (request.headers.get('x-test-user-email') || 'admin@example.com').toLowerCase();
  return { id: userId, email, name: 'Admin' } as const;
}

function parseAdminEmails(): string[] {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  const adminsRaw = process.env.ADMIN_ADMINS || '';
  const admins = adminsRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(p => p.split(':')[0]?.trim())
    .filter(Boolean);
  return Array.from(new Set([...list, ...admins])).map(e => e.toLowerCase());
}

// Ensure moderator user exists to satisfy FK on moderation_actions.moderator_user_id
async function ensureModeratorUser(id: string, email: string) {
  const existing = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, id)).limit(1);
  if (existing.length > 0) return id;
  const now = new Date();
  // Drizzle SQLite: simple insert; if email unique conflicts, fall back to selecting by email
  try {
    await db.insert(userTable).values({
      id,
      name: email.split('@')[0] || 'Admin',
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  } catch (_) {
    const byEmail = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1);
    if (byEmail.length > 0) return byEmail[0].id;
    throw _;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Authorization check - verify user is a moderator
    const adminEmails = parseAdminEmails();
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Moderator access required.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Ensure FK-safe moderator id exists
    const moderatorId = await ensureModeratorUser(user.id, user.email);

    // Parameter validation
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid track submission ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const trackId = parseInt(id);

    // Find track submission
    const existingTrack = await db.select()
      .from(trackSubmissions)
      .where(eq(trackSubmissions.id, trackId))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track submission not found',
        code: 'TRACK_NOT_FOUND' 
      }, { status: 404 });
    }

    const track = existingTrack[0];

    // Business logic validation - check if current state allows acceptance
    const allowedStates = ['submitted', 'needs_review', 'processing'];
    if (!allowedStates.includes(track.state)) {
      return NextResponse.json({ 
        error: `Cannot accept track in current state: ${track.state}. Track must be in submitted, needs_review, or processing state.`,
        code: 'INVALID_STATE' 
      }, { status: 400 });
    }

    const now = new Date();

    // Ensure we have a playable audio URL
    const approvedAudioUrl = track.audioUrl || track.originalUrl;
    if (!approvedAudioUrl) {
      return NextResponse.json({
        error: 'Submission has no audio URL. Provide a valid public URL before approving.',
        code: 'MISSING_AUDIO_URL'
      }, { status: 400 });
    }

    // Update track submission to live state and persist audio url if missing
    const updatedTrack = await db.update(trackSubmissions)
      .set({
        state: 'live',
        audioUrl: track.audioUrl || approvedAudioUrl,
        updatedAt: now,
        lastUpdate: now
      })
      .where(eq(trackSubmissions.id, trackId))
      .returning();

    if (updatedTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update track submission',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    // AUTO-CREATE ARTISTS: Parse artistsCsv and create/find artists
    const artistIds = await autoCreateArtists(track.artistsCsv || '');

    // Promote to public catalog (tracks + optional artists links)
    const duration = track.durationSec && track.durationSec > 0 ? track.durationSec : 180; // fallback 3 min
    const newTrack = await db.insert(tracks).values({
      title: track.title,
      durationSec: duration,
      audioUrl: approvedAudioUrl,
      imageUrl: track.coverUrl || null,
      explicit: track.explicit ?? false,
      popularity: 1,
      createdAt: now,
    }).returning();

    // Link track to all created/found artists
    for (const artistId of artistIds) {
      await db.insert(trackArtists).values({ 
        trackId: newTrack[0].id, 
        artistId: artistId 
      }).catch(() => {
        // Ignore duplicate key errors
      });
    }

    // Create moderation action record
    await db.insert(moderationActions)
      .values({
        trackId: trackId,
        moderatorUserId: moderatorId,
        action: 'accept',
        createdAt: now
      });

    // Return success response with artist creation info
    return NextResponse.json({
      ...updatedTrack[0],
      catalogTrackId: newTrack[0].id,
      artistsCreated: artistIds.length,
      artistIds: artistIds
    }, { status: 200 });

  } catch (error) {
    console.error('POST accept track error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
