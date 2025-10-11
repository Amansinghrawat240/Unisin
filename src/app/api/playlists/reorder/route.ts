import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_AUTH' 
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { playlists: playlistsData } = body;

    // Validation
    if (!playlistsData) {
      return NextResponse.json({ 
        error: 'Playlists array is required',
        code: 'MISSING_PLAYLISTS' 
      }, { status: 400 });
    }

    if (!Array.isArray(playlistsData)) {
      return NextResponse.json({ 
        error: 'Playlists must be an array',
        code: 'INVALID_PLAYLISTS_FORMAT' 
      }, { status: 400 });
    }

    if (playlistsData.length === 0) {
      return NextResponse.json({ 
        error: 'At least one playlist is required',
        code: 'EMPTY_PLAYLISTS_ARRAY' 
      }, { status: 400 });
    }

    // Validate playlist structure and collect IDs/positions
    const playlistIds = [];
    const positions = [];
    
    for (const playlist of playlistsData) {
      if (!playlist.id || !Number.isInteger(playlist.id) || playlist.id <= 0) {
        return NextResponse.json({ 
          error: 'All playlists must have valid integer IDs',
          code: 'INVALID_PLAYLIST_ID' 
        }, { status: 400 });
      }
      
      if (!Number.isInteger(playlist.position) || playlist.position < 0) {
        return NextResponse.json({ 
          error: 'All playlists must have valid integer positions',
          code: 'INVALID_POSITION' 
        }, { status: 400 });
      }
      
      playlistIds.push(playlist.id);
      positions.push(playlist.position);
    }

    // Check for duplicate IDs
    const uniqueIds = [...new Set(playlistIds)];
    if (uniqueIds.length !== playlistIds.length) {
      return NextResponse.json({ 
        error: 'Duplicate playlist IDs are not allowed',
        code: 'DUPLICATE_PLAYLIST_IDS' 
      }, { status: 400 });
    }

    // Check for duplicate positions
    const uniquePositions = [...new Set(positions)];
    if (uniquePositions.length !== positions.length) {
      return NextResponse.json({ 
        error: 'Duplicate positions are not allowed',
        code: 'DUPLICATE_POSITIONS' 
      }, { status: 400 });
    }

    // Verify all playlist IDs exist and user has permission (owned by unisin-system)
    const existingPlaylists = await db.select({
      id: playlists.id,
      position: playlists.position,
      ownerId: playlists.ownerId
    })
    .from(playlists)
    .where(inArray(playlists.id, playlistIds));

    if (existingPlaylists.length !== playlistIds.length) {
      const existingIds = existingPlaylists.map(p => p.id);
      const missingIds = playlistIds.filter(id => !existingIds.includes(id));
      return NextResponse.json({ 
        error: `Playlist(s) not found: ${missingIds.join(', ')}`,
        code: 'PLAYLISTS_NOT_FOUND' 
      }, { status: 404 });
    }

    // Verify all playlists are owned by unisin-system
    const nonSystemPlaylists = existingPlaylists.filter(p => p.ownerId !== 'unisin-system');
    if (nonSystemPlaylists.length > 0) {
      return NextResponse.json({ 
        error: 'Can only reorder system playlists',
        code: 'PERMISSION_DENIED' 
      }, { status: 403 });
    }

    // Perform bulk update
    const updatedPlaylists = [];
    const currentTime = new Date();

    for (const playlist of playlistsData) {
      const updated = await db.update(playlists)
        .set({
          position: playlist.position,
          updatedAt: currentTime
        })
        .where(eq(playlists.id, playlist.id))
        .returning();
      
      if (updated.length > 0) {
        updatedPlaylists.push(updated[0]);
      }
    }

    // Sort updated playlists by new position order
    updatedPlaylists.sort((a, b) => a.position - b.position);

    return NextResponse.json(updatedPlaylists, { status: 200 });

  } catch (error) {
    console.error('POST playlists reorder error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}