import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists, playlistTracks, tracks } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const playlistId = parseInt(id);
    if (!playlistId || isNaN(playlistId)) {
      return NextResponse.json({ 
        error: "Valid playlist ID is required",
        code: "INVALID_PLAYLIST_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    
    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'ownerId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { orderedTrackIds } = requestBody;

    // Validate required fields
    if (!orderedTrackIds || !Array.isArray(orderedTrackIds)) {
      return NextResponse.json({ 
        error: "orderedTrackIds is required and must be an array",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    if (orderedTrackIds.length === 0) {
      return NextResponse.json({ 
        error: "orderedTrackIds cannot be empty",
        code: "EMPTY_TRACK_IDS" 
      }, { status: 400 });
    }

    // Validate all track IDs are numbers
    const trackIds = orderedTrackIds.map(id => {
      const parsed = parseInt(id);
      if (isNaN(parsed)) {
        throw new Error(`Invalid track ID: ${id}`);
      }
      return parsed;
    });

    // Check if playlist exists and belongs to authenticated user
    const playlist = await db.select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.ownerId, user.id)))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json({ 
        error: 'Playlist not found or access denied' 
      }, { status: 404 });
    }

    // Get current playlist tracks to validate all track IDs exist in playlist
    const currentPlaylistTracks = await db.select()
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId));

    const existingTrackIds = currentPlaylistTracks.map(pt => pt.trackId);
    
    // Check if all provided track IDs exist in the playlist
    const missingTrackIds = trackIds.filter(trackId => !existingTrackIds.includes(trackId));
    if (missingTrackIds.length > 0) {
      return NextResponse.json({ 
        error: `Track IDs not found in playlist: ${missingTrackIds.join(', ')}`,
        code: "INVALID_TRACK_IDS" 
      }, { status: 400 });
    }

    // Check if all existing tracks are included in the reorder
    const missingExistingTracks = existingTrackIds.filter(trackId => !trackIds.includes(trackId));
    if (missingExistingTracks.length > 0) {
      return NextResponse.json({ 
        error: `All existing tracks must be included in reorder. Missing: ${missingExistingTracks.join(', ')}`,
        code: "INCOMPLETE_REORDER" 
      }, { status: 400 });
    }

    // Check for duplicates in orderedTrackIds
    const duplicates = trackIds.filter((id, index) => trackIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      return NextResponse.json({ 
        error: `Duplicate track IDs found: ${duplicates.join(', ')}`,
        code: "DUPLICATE_TRACK_IDS" 
      }, { status: 400 });
    }

    // Update positions for all tracks in the new order
    for (let i = 0; i < trackIds.length; i++) {
      const trackId = trackIds[i];
      const newPosition = i + 1;
      
      await db.update(playlistTracks)
        .set({ position: newPosition })
        .where(and(
          eq(playlistTracks.playlistId, playlistId),
          eq(playlistTracks.trackId, trackId)
        ));
    }

    // Update playlist updatedAt timestamp
    await db.update(playlists)
      .set({ updatedAt: new Date() })
      .where(eq(playlists.id, playlistId));

    // Fetch updated playlist tracks with track details in new order
    const updatedPlaylistTracks = await db.select({
      playlistId: playlistTracks.playlistId,
      trackId: playlistTracks.trackId,
      position: playlistTracks.position,
      addedBy: playlistTracks.addedBy,
      addedAt: playlistTracks.addedAt,
      track: {
        id: tracks.id,
        title: tracks.title,
        durationSec: tracks.durationSec,
        audioUrl: tracks.audioUrl,
        imageUrl: tracks.imageUrl,
        popularity: tracks.popularity,
        explicit: tracks.explicit,
        albumId: tracks.albumId,
        createdAt: tracks.createdAt
      }
    })
    .from(playlistTracks)
    .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(playlistTracks.position);

    return NextResponse.json(updatedPlaylistTracks, { status: 200 });

  } catch (error) {
    console.error('POST /api/playlists/[id]/reorder error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
