import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recentlyPlayed, tracks, albums, artists, trackArtists } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Simple auth helper - extract user from bearer token (simplified for MVP)
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  // For MVP: simplified auth - just return a mock user
  // In production, validate the JWT token and get user from session
  return { id: 'user-123' }; // Mock user ID - replace with actual auth logic
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get last 20 recently played tracks with full details
    const recentTracks = await db
      .select({
        playedAt: recentlyPlayed.playedAt,
        track: {
          id: tracks.id,
          title: tracks.title,
          durationSec: tracks.durationSec,
          audioUrl: tracks.audioUrl,
          imageUrl: tracks.imageUrl,
          popularity: tracks.popularity,
          explicit: tracks.explicit,
        },
        album: {
          id: albums.id,
          title: albums.title,
          releaseDate: albums.releaseDate,
          coverUrl: albums.coverUrl,
          popularity: albums.popularity,
        },
        artist: {
          id: artists.id,
          name: artists.name,
          imageUrl: artists.imageUrl,
          popularity: artists.popularity,
        }
      })
      .from(recentlyPlayed)
      .innerJoin(tracks, eq(recentlyPlayed.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .leftJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(eq(recentlyPlayed.userId, user.id))
      .orderBy(desc(recentlyPlayed.playedAt))
      .limit(20);

    return NextResponse.json(recentTracks);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { trackId } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!trackId) {
      return NextResponse.json({ 
        error: "Track ID is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Validate trackId is valid integer
    if (isNaN(parseInt(trackId))) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_TRACK_ID" 
      }, { status: 400 });
    }

    const trackIdInt = parseInt(trackId);

    // Validate track exists
    const existingTrack = await db.select()
      .from(tracks)
      .where(eq(tracks.id, trackIdInt))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: "Track not found",
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    const playedAt = new Date();

    // Check if entry already exists for this user and track
    const existingEntry = await db.select()
      .from(recentlyPlayed)
      .where(and(
        eq(recentlyPlayed.userId, user.id),
        eq(recentlyPlayed.trackId, trackIdInt)
      ))
      .limit(1);

    let result;

    if (existingEntry.length > 0) {
      // Update existing entry with new playedAt timestamp
      result = await db.update(recentlyPlayed)
        .set({
          playedAt: playedAt
        })
        .where(and(
          eq(recentlyPlayed.userId, user.id),
          eq(recentlyPlayed.trackId, trackIdInt)
        ))
        .returning();
    } else {
      // Insert new entry
      result = await db.insert(recentlyPlayed)
        .values({
          userId: user.id,
          trackId: trackIdInt,
          playedAt: playedAt
        })
        .returning();
    }

    // Get the full track details for response
    const trackDetails = await db
      .select({
        playedAt: recentlyPlayed.playedAt,
        track: {
          id: tracks.id,
          title: tracks.title,
          durationSec: tracks.durationSec,
          audioUrl: tracks.audioUrl,
          imageUrl: tracks.imageUrl,
          popularity: tracks.popularity,
          explicit: tracks.explicit,
        },
        album: {
          id: albums.id,
          title: albums.title,
          releaseDate: albums.releaseDate,
          coverUrl: albums.coverUrl,
          popularity: albums.popularity,
        },
        artist: {
          id: artists.id,
          name: artists.name,
          imageUrl: artists.imageUrl,
          popularity: artists.popularity,
        }
      })
      .from(recentlyPlayed)
      .innerJoin(tracks, eq(recentlyPlayed.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .leftJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(and(
        eq(recentlyPlayed.userId, user.id),
        eq(recentlyPlayed.trackId, trackIdInt)
      ))
      .limit(1);

    return NextResponse.json(trackDetails[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}