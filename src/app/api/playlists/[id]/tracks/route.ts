import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists, playlistTracks, tracks, albums } from '@/db/schema';
import { eq, and, max } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// Verify JWT token from admin login
function verifyAdminToken(token: string) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    // Verify signature
    const secret = process.env.JWT_SECRET || 'unisin-secret-key-2024';
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) return null;

    return payload;
  } catch {
    return null;
  }
}

// Enhanced auth helper - try better-auth session first, then bearer token fallback
async function getAuthenticatedUser(request: NextRequest) {
  // Try better-auth session first
  try {
    const sessionUser = await getCurrentUser(request);
    if (sessionUser) {
      return sessionUser;
    }
  } catch (error) {
    console.log('[AUTH] Session check error:', error);
  }

  // Fallback to admin bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyAdminToken(token);
    if (decoded?.email) {
      return { email: decoded.email, id: decoded.userId || decoded.email };
    }
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
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
    if ('userId' in requestBody || 'user_id' in requestBody || 'addedBy' in requestBody || 'ownerId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { trackId, position } = requestBody;

    // Validate required fields
    if (!trackId) {
      return NextResponse.json({ 
        error: "Track ID is required",
        code: "MISSING_TRACK_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(trackId))) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_TRACK_ID" 
      }, { status: 400 });
    }

    // Verify playlist exists
    const playlistRow = await db.select()
      .from(playlists)
      .where(eq(playlists.id, playlistId))
      .limit(1);

    if (playlistRow.length === 0) {
      return NextResponse.json({ 
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND'
      }, { status: 404 });
    }

    // Access: allow owner OR any authenticated user for system playlists
    const isOwner = playlistRow[0].ownerId === user.id;
    const isSystemPlaylist = playlistRow[0].ownerId === 'unisin-system';
    
    if (!isOwner && !isSystemPlaylist) {
      return NextResponse.json({ 
        error: 'Only the owner can add tracks to this playlist',
        code: 'ADD_NOT_ALLOWED' 
      }, { status: 403 });
    }

    // Verify track exists
    const track = await db.select()
      .from(tracks)
      .where(eq(tracks.id, parseInt(trackId)))
      .limit(1);

    if (track.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: 'TRACK_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if track is already in playlist
    const existingTrack = await db.select()
      .from(playlistTracks)
      .where(and(
        eq(playlistTracks.playlistId, playlistId),
        eq(playlistTracks.trackId, parseInt(trackId))
      ))
      .limit(1);

    if (existingTrack.length > 0) {
      return NextResponse.json({ 
        error: 'Track already exists in playlist',
        code: 'TRACK_ALREADY_EXISTS' 
      }, { status: 400 });
    }

    // Determine position
    let finalPosition = position;
    if (!finalPosition) {
      const maxPositionResult = await db.select({ maxPos: max(playlistTracks.position) })
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, playlistId));
      
      finalPosition = (maxPositionResult[0]?.maxPos || 0) + 1;
    }

    // Add track to playlist
    const newPlaylistTrack = await db.insert(playlistTracks)
      .values({
        playlistId: playlistId,
        trackId: parseInt(trackId),
        position: finalPosition,
        addedBy: user.id,
        addedAt: new Date()
      })
      .returning();

    // Auto-update playlist cover if it doesn't have one
    if (!playlistRow[0].coverUrl) {
      const trackImageUrl = track[0].imageUrl;
      if (trackImageUrl) {
        await db.update(playlists)
          .set({
            coverUrl: trackImageUrl,
            updatedAt: new Date()
          })
          .where(eq(playlists.id, playlistId));
      } else {
        // If track doesn't have image, try to get album cover
        if (track[0].albumId) {
          const album = await db.select()
            .from(albums)
            .where(eq(albums.id, track[0].albumId))
            .limit(1);
          
          if (album.length > 0 && album[0].coverUrl) {
            await db.update(playlists)
              .set({
                coverUrl: album[0].coverUrl,
                updatedAt: new Date()
              })
              .where(eq(playlists.id, playlistId));
          } else {
            // Just update timestamp
            await db.update(playlists)
              .set({
                updatedAt: new Date()
              })
              .where(eq(playlists.id, playlistId));
          }
        } else {
          // Just update timestamp
          await db.update(playlists)
            .set({
              updatedAt: new Date()
            })
            .where(eq(playlists.id, playlistId));
        }
      }
    } else {
      // Just update timestamp
      await db.update(playlists)
        .set({
          updatedAt: new Date()
        })
        .where(eq(playlists.id, playlistId));
    }

    return NextResponse.json(newPlaylistTrack[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
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
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const playlistId = parseInt(id);
    
    // Get trackId from query params since this route doesn't have [trackId] in the path
    const { searchParams } = new URL(request.url);
    const trackIdParam = searchParams.get('trackId');
    const trackId = trackIdParam ? parseInt(trackIdParam) : null;

    if (!playlistId || isNaN(playlistId)) {
      return NextResponse.json({ 
        error: "Valid playlist ID is required",
        code: "INVALID_PLAYLIST_ID" 
      }, { status: 400 });
    }

    if (!trackId || isNaN(trackId)) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_TRACK_ID" 
      }, { status: 400 });
    }

    // Verify playlist exists and user owns it
    const playlist = await db.select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.ownerId, user.id)))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json({ 
        error: 'Playlist not found or access denied' 
      }, { status: 404 });
    }

    // Check if track exists in playlist
    const existingTrack = await db.select()
      .from(playlistTracks)
      .where(and(
        eq(playlistTracks.playlistId, playlistId),
        eq(playlistTracks.trackId, trackId)
      ))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found in playlist' 
      }, { status: 404 });
    }

    // Remove track from playlist
    const deleted = await db.delete(playlistTracks)
      .where(and(
        eq(playlistTracks.playlistId, playlistId),
        eq(playlistTracks.trackId, trackId)
      ))
      .returning();

    // Update playlist updatedAt timestamp
    await db.update(playlists)
      .set({
        updatedAt: new Date()
      })
      .where(eq(playlists.id, playlistId));

    return NextResponse.json({
      message: 'Track removed from playlist successfully',
      deletedTrack: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
