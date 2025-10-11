import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists, playlistTracks, tracks, albums, artists, trackArtists, playlistFollows, user } from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Verify admin token - matches the format from /api/admin/login
function verifyAdminToken(token: string) {
  try {
    const secret = process.env.ADMIN_SECRET || "dev-secret";
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expSig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expSig))) return null;
    const json = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    // Check expiry
    if (json?.exp && Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

// Verify regular user JWT token - matches the format from /api/auth/file/login
function verifyUserToken(token: string) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    
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

  // Fallback to bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Try admin token first (2-part format)
    const adminDecoded = verifyAdminToken(token);
    if (adminDecoded?.email) {
      return { email: adminDecoded.email, id: adminDecoded.userId || adminDecoded.email };
    }
    
    // Try user token (3-part JWT format)
    const userDecoded = verifyUserToken(token);
    if (userDecoded?.userId) {
      return { email: userDecoded.email, id: userDecoded.userId, username: userDecoded.username };
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Get authenticated user (optional for GET)
    let currentUser = null;
    try {
      currentUser = await getAuthenticatedUser(request);
    } catch (error) {
      // User not authenticated, continue with null
    }

    const playlistId = parseInt(id);

    // Get playlist
    const playlist = await db.select()
      .from(playlists)
      .where(eq(playlists.id, playlistId))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const playlistData = playlist[0];

    // Get owner information if playlist has an owner
    let owner = null;
    if (playlistData.ownerId) {
      const ownerResult = await db.select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
        .from(user)
        .where(eq(user.id, playlistData.ownerId))
        .limit(1);
      
      if (ownerResult.length > 0) {
        owner = ownerResult[0];
      }
    }

    // Check if user can access this playlist
    const isOwner = currentUser && playlistData.ownerId === currentUser.id;
    const isPublic = playlistData.isPublic;
    
    // Get follower count
    const followerCountResult = await db
      .select({ count: count() })
      .from(playlistFollows)
      .where(eq(playlistFollows.playlistId, playlistId));
    
    const followerCount = followerCountResult[0]?.count || 0;

    // Check if current user follows this playlist
    let isFollowing = false;
    if (currentUser) {
      const followResult = await db
        .select()
        .from(playlistFollows)
        .where(and(
          eq(playlistFollows.playlistId, playlistId),
          eq(playlistFollows.userId, currentUser.id)
        ))
        .limit(1);
      
      isFollowing = followResult.length > 0;
    }

    // Access control: allow if owner, public, or user follows it
    const canAccess = isOwner || isPublic || isFollowing;

    if (!canAccess) {
      return NextResponse.json({ 
        error: 'Access denied to private playlist',
        code: "ACCESS_DENIED" 
      }, { status: 403 });
    }

    // Get playlist tracks with basic information
    const playlistTracksData = await db.select({
      position: playlistTracks.position,
      addedAt: playlistTracks.addedAt,
      trackId: playlistTracks.trackId,
      track: {
        id: tracks.id,
        title: tracks.title,
        durationSec: tracks.durationSec,
        audioUrl: tracks.audioUrl,
        imageUrl: tracks.imageUrl,
        popularity: tracks.popularity,
        explicit: tracks.explicit,
        createdAt: tracks.createdAt,
      },
      album: {
        id: albums.id,
        title: albums.title,
        releaseDate: albums.releaseDate,
        coverUrl: albums.coverUrl,
        popularity: albums.popularity,
      }
    })
    .from(playlistTracks)
    .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(playlistTracks.position);

    // Get all track IDs to fetch artists
    const trackIds = playlistTracksData.map(item => item.trackId);
    
    // Fetch all artists for all tracks in one query
    const trackArtistsData = trackIds.length > 0 ? await db
      .select({
        trackId: trackArtists.trackId,
        artistId: trackArtists.artistId,
        artistName: artists.name,
        artistImageUrl: artists.imageUrl,
      })
      .from(trackArtists)
      .innerJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(sql`${trackArtists.trackId} IN ${sql.raw(`(${trackIds.join(',')})`)}`)
      : [];

    // Group artists by track ID
    const artistsByTrack = new Map<number, Array<{ id: number; name: string; imageUrl?: string | null }>>();
    for (const item of trackArtistsData) {
      if (!artistsByTrack.has(item.trackId)) {
        artistsByTrack.set(item.trackId, []);
      }
      artistsByTrack.get(item.trackId)!.push({
        id: item.artistId,
        name: item.artistName,
        imageUrl: item.artistImageUrl
      });
    }

    // Build final response with enhanced track information including all artists
    const tracksWithDetails = playlistTracksData.map(item => ({
      position: item.position,
      addedAt: item.addedAt,
      track: {
        ...item.track,
        album: item.album,
        artists: artistsByTrack.get(item.trackId) || [],
      }
    }));

    const response = {
      ...playlistData,
      tracks: tracksWithDetails,
      tracksCount: tracksWithDetails.length,
      followerCount,
      isFollowing,
      isOwner: currentUser?.id === playlistData.ownerId,
      owner
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET playlist error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();

    // Security check: reject if user identifier provided in body
    if ('ownerId' in requestBody || 'owner_id' in requestBody || 'userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { title, description, coverUrl, isPublic } = requestBody;

    // Check if playlist exists and is owned by user
    const existingPlaylist = await db.select()
      .from(playlists)
      .where(and(eq(playlists.id, parseInt(id)), eq(playlists.ownerId, user.id)))
      .limit(1);

    if (existingPlaylist.length === 0) {
      return NextResponse.json({ error: 'Playlist not found or access denied' }, { status: 404 });
    }

    // Validate required fields
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return NextResponse.json({ 
        error: "Title cannot be empty",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl?.trim() || null;
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

    // Update playlist
    const updated = await db.update(playlists)
      .set(updateData)
      .where(and(eq(playlists.id, parseInt(id)), eq(playlists.ownerId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
    }

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT playlist error:', error);
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
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if playlist exists and is owned by user
    const existingPlaylist = await db.select()
      .from(playlists)
      .where(and(eq(playlists.id, parseInt(id)), eq(playlists.ownerId, user.id)))
      .limit(1);

    if (existingPlaylist.length === 0) {
      return NextResponse.json({ error: 'Playlist not found or access denied' }, { status: 404 });
    }

    // Delete playlist tracks first (due to foreign key constraints)
    await db.delete(playlistTracks)
      .where(eq(playlistTracks.playlistId, parseInt(id)));

    // Delete playlist
    const deleted = await db.delete(playlists)
      .where(and(eq(playlists.id, parseInt(id)), eq(playlists.ownerId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Playlist deleted successfully',
      playlist: deleted[0]
    });

  } catch (error) {
    console.error('DELETE playlist error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}