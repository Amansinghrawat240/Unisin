import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tracks, artists as artistsTable, trackArtists } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import crypto from 'crypto';

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db.select({ id: artistsTable.id })
      .from(artistsTable)
      .where(excludeId ? 
        and(eq(artistsTable.slug, slug), ne(artistsTable.id, excludeId)) :
        eq(artistsTable.slug, slug)
      )
      .limit(1);
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function verifyAdminToken(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  const [data, sig] = token.split('.') as [string, string];
  if (!data || !sig) return null;
  const secret = process.env.ADMIN_SECRET || 'dev-secret';
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload || payload.role !== 'admin') return null;
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Admin auth check
    const admin = verifyAdminToken(request.headers.get('authorization'));
    if (!admin) {
      return NextResponse.json({ error: 'Admin authorization required', code: 'NOT_ADMIN' }, { status: 403 });
    }

    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid track ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const trackId = parseInt(id);
    const body = await request.json();
    const { artistNames } = body;

    if (!Array.isArray(artistNames) || artistNames.length === 0) {
      return NextResponse.json({ 
        error: 'Valid artistNames array is required',
        code: 'INVALID_ARTISTS' 
      }, { status: 400 });
    }

    // Check if track exists
    const existingTrack = await db
      .select()
      .from(tracks)
      .where(eq(tracks.id, trackId))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: 'TRACK_NOT_FOUND' 
      }, { status: 404 });
    }

    // Remove existing artist associations
    await db.delete(trackArtists).where(eq(trackArtists.trackId, trackId));

    const now = new Date();

    // Add new artist associations
    for (const name of artistNames) {
      const trimmedName = String(name).trim();
      if (!trimmedName) continue;

      // Find or create artist
      const existing = await db
        .select({ id: artistsTable.id })
        .from(artistsTable)
        .where(eq(artistsTable.name, trimmedName))
        .limit(1);

      let artistId: number;
      if (existing.length > 0) {
        artistId = existing[0].id as unknown as number;
      } else {
        // Generate unique slug for new artist
        const baseSlug = generateSlug(trimmedName);
        const uniqueSlug = await ensureUniqueSlug(baseSlug);
        
        const ins = await db
          .insert(artistsTable)
          .values({ 
            name: trimmedName, 
            slug: uniqueSlug,
            createdAt: now, 
            popularity: 0 
          })
          .returning();
        artistId = ins[0].id as unknown as number;
      }

      // Link track to artist
      await db.insert(trackArtists).values({ trackId, artistId }).catch(() => {
        // Ignore duplicates
      });
    }

    // Fetch updated track with artists
    const trackArtistsList = await db
      .select({
        artistName: artistsTable.name,
      })
      .from(trackArtists)
      .leftJoin(artistsTable, eq(trackArtists.artistId, artistsTable.id))
      .where(eq(trackArtists.trackId, trackId));

    const updatedArtistNames = trackArtistsList.map(ta => ta.artistName).filter(Boolean);

    return NextResponse.json({ 
      success: true,
      trackId,
      artistNames: updatedArtistNames
    }, { status: 200 });

  } catch (error) {
    console.error('PUT track artists error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
