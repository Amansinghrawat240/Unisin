import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tracks, albums, artists, trackArtists, playlistTracks, likesTracks, recentlyPlayed } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get('query');
    const artistId = searchParams.get('artistId');
    const albumId = searchParams.get('albumId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';

    // Build where conditions
    const conditions = [];

    // Filter by query (search track titles case-insensitive)
    if (query) {
      conditions.push(like(tracks.title, `%${query}%`));
    }

    // Filter by albumId
    if (albumId) {
      const albumIdInt = parseInt(albumId);
      if (isNaN(albumIdInt)) {
        return NextResponse.json({ 
          error: "Invalid albumId parameter",
          code: "INVALID_ALBUM_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(tracks.albumId, albumIdInt));
    }

    // Filter by artistId (via trackArtists junction table)
    if (artistId) {
      const artistIdInt = parseInt(artistId);
      if (isNaN(artistIdInt)) {
        return NextResponse.json({ 
          error: "Invalid artistId parameter",
          code: "INVALID_ARTIST_ID" 
        }, { status: 400 });
      }
      
      // Get track IDs that belong to this artist
      const artistTracks = await db
        .select({ trackId: trackArtists.trackId })
        .from(trackArtists)
        .where(eq(trackArtists.artistId, artistIdInt));
      
      const trackIds = artistTracks.map(at => at.trackId);
      
      if (trackIds.length === 0) {
        return NextResponse.json([]);
      }
      
      conditions.push(or(...trackIds.map(id => eq(tracks.id, id))));
    }

    // Determine sort column
    const orderColumn = sortField === 'title' ? tracks.title :
                       sortField === 'popularity' ? tracks.popularity :
                       sortField === 'durationSec' ? tracks.durationSec :
                       tracks.createdAt;
    
    const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    // Build the base query
    const baseSelect = db
      .select({
        id: tracks.id,
        albumId: tracks.albumId,
        title: tracks.title,
        durationSec: tracks.durationSec,
        audioUrl: tracks.audioUrl,
        imageUrl: tracks.imageUrl,
        popularity: tracks.popularity,
        explicit: tracks.explicit,
        createdAt: tracks.createdAt,
        albumTitle: albums.title,
      })
      .from(tracks)
      .leftJoin(albums, eq(tracks.albumId, albums.id));

    // Apply conditions and execute query
    const results = conditions.length > 0
      ? await baseSelect
          .where(and(...conditions))
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset)
      : await baseSelect
          .orderBy(orderDirection)
          .limit(limit)
          .offset(offset);

    // Get artist names for each track
    const tracksWithArtists = await Promise.all(
      results.map(async (track) => {
        const trackArtistsList = await db
          .select({
            artistName: artists.name,
          })
          .from(trackArtists)
          .leftJoin(artists, eq(trackArtists.artistId, artists.id))
          .where(eq(trackArtists.trackId, track.id));

        return {
          ...track,
          artistNames: trackArtistsList.map(ta => ta.artistName).filter(Boolean),
        };
      })
    );

    return NextResponse.json(tracksWithArtists);

  } catch (error) {
    console.error('GET tracks error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { albumId, title, durationSec, audioUrl, imageUrl, popularity, explicit } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!durationSec || typeof durationSec !== 'number') {
      return NextResponse.json({ 
        error: "Valid duration in seconds is required",
        code: "MISSING_DURATION" 
      }, { status: 400 });
    }

    if (!audioUrl) {
      return NextResponse.json({ 
        error: "Audio URL is required",
        code: "MISSING_AUDIO_URL" 
      }, { status: 400 });
    }

    // Validate albumId if provided
    if (albumId && (typeof albumId !== 'number' || isNaN(albumId))) {
      return NextResponse.json({ 
        error: "Valid album ID is required",
        code: "INVALID_ALBUM_ID" 
      }, { status: 400 });
    }

    // Verify album exists if albumId provided
    if (albumId) {
      const albumExists = await db
        .select({ id: albums.id })
        .from(albums)
        .where(eq(albums.id, albumId))
        .limit(1);

      if (albumExists.length === 0) {
        return NextResponse.json({ 
          error: "Album not found",
          code: "ALBUM_NOT_FOUND" 
        }, { status: 404 });
      }
    }

    // Create the track
    const newTrack = await db.insert(tracks)
      .values({
        albumId: albumId || null,
        title: title.trim(),
        durationSec,
        audioUrl: audioUrl.trim(),
        imageUrl: imageUrl?.trim() || null,
        popularity: popularity || 0,
        explicit: explicit || false,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newTrack[0], { status: 201 });

  } catch (error) {
    console.error('POST tracks error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const trackId = parseInt(id);
    const body = await request.json();
    const { albumId, title, durationSec, audioUrl, imageUrl, popularity, explicit } = body;

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

    // Validate fields if provided
    if (durationSec !== undefined && (typeof durationSec !== 'number' || durationSec <= 0)) {
      return NextResponse.json({ 
        error: "Valid duration in seconds is required",
        code: "INVALID_DURATION" 
      }, { status: 400 });
    }

    if (albumId !== undefined && albumId !== null && (typeof albumId !== 'number' || isNaN(albumId))) {
      return NextResponse.json({ 
        error: "Valid album ID is required",
        code: "INVALID_ALBUM_ID" 
      }, { status: 400 });
    }

    // Verify album exists if albumId provided
    if (albumId) {
      const albumExists = await db
        .select({ id: albums.id })
        .from(albums)
        .where(eq(albums.id, albumId))
        .limit(1);

      if (albumExists.length === 0) {
        return NextResponse.json({ 
          error: "Album not found",
          code: "ALBUM_NOT_FOUND" 
        }, { status: 404 });
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (albumId !== undefined) updateData.albumId = albumId;
    if (title !== undefined) updateData.title = title.trim();
    if (durationSec !== undefined) updateData.durationSec = durationSec;
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null;
    if (popularity !== undefined) updateData.popularity = popularity;
    if (explicit !== undefined) updateData.explicit = explicit;

    // Update the track
    const updatedTrack = await db.update(tracks)
      .set(updateData)
      .where(eq(tracks.id, trackId))
      .returning();

    return NextResponse.json(updatedTrack[0]);

  } catch (error) {
    console.error('PUT tracks error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Admin auth: only admins can delete arbitrary tracks via this endpoint
    const admin = verifyAdminToken(request.headers.get('authorization'));
    if (!admin) {
      return NextResponse.json({ error: 'Admin authorization required', code: 'NOT_ADMIN' }, { status: 403 });
    }

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const trackId = parseInt(id);

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

    // Manually cascade delete dependent rows to satisfy FK constraints
    await db.delete(playlistTracks).where(eq(playlistTracks.trackId, trackId));
    await db.delete(likesTracks).where(eq(likesTracks.trackId, trackId));
    await db.delete(recentlyPlayed).where(eq(recentlyPlayed.trackId, trackId));
    await db.delete(trackArtists).where(eq(trackArtists.trackId, trackId));

    // Delete the track
    const deletedTrack = await db.delete(tracks)
      .where(eq(tracks.id, trackId))
      .returning();

    return NextResponse.json({
      message: 'Track deleted successfully',
      track: deletedTrack[0]
    });

  } catch (error) {
    console.error('DELETE tracks error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
