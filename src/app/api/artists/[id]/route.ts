import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, albums, tracks, trackArtists } from '@/db/schema';
import { eq, desc, ne, and } from 'drizzle-orm';
import crypto from 'crypto';
import { auth } from '@/lib/auth';

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db.select({ id: artists.id })
      .from(artists)
      .where(excludeId ? 
        and(eq(artists.slug, slug), ne(artists.id, excludeId)) :
        eq(artists.slug, slug)
      )
      .limit(1);
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Admin/Editor authorization check
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
    if (!payload || (payload.role !== 'admin' && payload.role !== 'editor')) return null;
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Admin-only authorization check
function verifyAdminOnlyToken(authHeader?: string | null) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid artist ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);

    // Get artist details
    const artist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found' 
      }, { status: 404 });
    }

    // Get all albums by this artist
    const artistAlbums = await db.select({
      id: albums.id,
      title: albums.title,
      releaseDate: albums.releaseDate,
      coverUrl: albums.coverUrl,
      popularity: albums.popularity
    })
    .from(albums)
    .where(eq(albums.artistId, artistId))
    .orderBy(desc(albums.releaseDate));

    // Get top 10 tracks by popularity from all albums by this artist
    const topTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      durationSec: tracks.durationSec,
      audioUrl: tracks.audioUrl,
      imageUrl: tracks.imageUrl,
      popularity: tracks.popularity,
      explicit: tracks.explicit,
      albumId: tracks.albumId,
      albumTitle: albums.title,
      albumCoverUrl: albums.coverUrl
    })
    .from(tracks)
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
    .where(eq(trackArtists.artistId, artistId))
    .orderBy(desc(tracks.popularity))
    .limit(10);

    const artistDetails = {
      ...artist[0],
      albums: artistAlbums,
      topTracks: topTracks
    };

    return NextResponse.json(artistDetails, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin/editor authorization (bearer token OR session)
    let isAuthorized = false;
    
    // Try bearer token first
    const admin = verifyAdminToken(request.headers.get('authorization'));
    if (admin) {
      isAuthorized = true;
    } else {
      // Try session as fallback
      const session = await auth.api.getSession({ headers: request.headers });
      if (session?.user?.role === 'admin' || session?.user?.role === 'editor') {
        isAuthorized = true;
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Admin or editor authorization required', 
        code: 'NOT_AUTHORIZED' 
      }, { status: 403 });
    }

    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid artist ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);
    const requestBody = await request.json();
    const { name, bio, imageUrl, bannerUrl, isVerified, userId, monthlyListeners } = requestBody;

    // Check if artist exists
    const existingArtist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (existingArtist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {};
    
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updateData.name = name.trim();
      // If name changes, regenerate slug
      const baseSlug = generateSlug(name.trim());
      updateData.slug = await ensureUniqueSlug(baseSlug, artistId);
    }
    
    if (bio !== undefined) updateData.bio = bio ? bio.trim() : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl ? bannerUrl.trim() : null;
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);
    if (userId !== undefined) updateData.userId = userId ? userId.trim() : null;
    if (monthlyListeners !== undefined) {
      const listeners = parseInt(monthlyListeners);
      if (isNaN(listeners) || listeners < 0) {
        return NextResponse.json({ 
          error: "Monthly listeners must be a non-negative number",
          code: "INVALID_MONTHLY_LISTENERS" 
        }, { status: 400 });
      }
      updateData.monthlyListeners = listeners;
    }

    const updated = await db.update(artists)
      .set(updateData)
      .where(eq(artists.id, artistId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin-only authorization (bearer token OR session)
    let isAdmin = false;
    
    // Try bearer token first
    const authHeader = request.headers.get('authorization');
    console.log('[DELETE Artist] Auth header:', authHeader ? 'Present' : 'Missing');
    
    const bearerAdmin = verifyAdminOnlyToken(authHeader);
    if (bearerAdmin) {
      console.log('[DELETE Artist] Bearer token valid, role:', bearerAdmin.role);
      isAdmin = true;
    } else {
      console.log('[DELETE Artist] Bearer token failed, trying session...');
      // Try session as fallback
      const session = await auth.api.getSession({ headers: request.headers });
      console.log('[DELETE Artist] Session:', session ? {
        userId: session.user?.id,
        email: session.user?.email,
        role: session.user?.role
      } : 'No session');
      
      if (session?.user?.role === 'admin') {
        console.log('[DELETE Artist] Session admin check passed');
        isAdmin = true;
      }
    }
    
    console.log('[DELETE Artist] Final isAdmin:', isAdmin);
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin authorization required', 
        code: 'NOT_ADMIN' 
      }, { status: 403 });
    }

    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid artist ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);

    // Check if artist exists
    const existingArtist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (existingArtist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete associated relationships first (to handle foreign key constraints)
    await db.delete(trackArtists)
      .where(eq(trackArtists.artistId, artistId));

    // Delete the artist
    const deleted = await db.delete(artists)
      .where(eq(artists.id, artistId))
      .returning();

    return NextResponse.json({
      message: 'Artist deleted successfully',
      deletedArtist: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}