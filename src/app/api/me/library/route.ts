import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists, playlistFollows, user, playlistTracks, artistFollows, artists } from '@/db/schema';
import { eq, count, desc, or, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Use the same auth helper as /api/playlists for consistency
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
    const decoded = verifyAdminToken(token);
    if (decoded?.email) {
      return { email: decoded.email, id: decoded.userId || decoded.email };
    }
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    // Return 401 when not authenticated
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's own playlists with track counts using LEFT JOIN
    const ownPlaylistsWithCounts = await db
      .select({
        id: playlists.id,
        ownerId: playlists.ownerId,
        title: playlists.title,
        description: playlists.description,
        coverUrl: playlists.coverUrl,
        isPublic: playlists.isPublic,
        createdAt: playlists.createdAt,
        updatedAt: playlists.updatedAt,
        tracksCount: count(playlistTracks.trackId),
      })
      .from(playlists)
      .leftJoin(playlistTracks, eq(playlists.id, playlistTracks.playlistId))
      .where(eq(playlists.ownerId, currentUser.id))
      .groupBy(
        playlists.id,
        playlists.ownerId,
        playlists.title,
        playlists.description,
        playlists.coverUrl,
        playlists.isPublic,
        playlists.createdAt,
        playlists.updatedAt
      )
      .orderBy(desc(playlists.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get playlists the user follows (with owner info and track counts)
    const followedPlaylistsQuery = await db
      .select({
        playlistId: playlists.id,
        ownerId: playlists.ownerId,
        title: playlists.title,
        description: playlists.description,
        coverUrl: playlists.coverUrl,
        isPublic: playlists.isPublic,
        playlistCreatedAt: playlists.createdAt,
        playlistUpdatedAt: playlists.updatedAt,
        userId: user.id,
        userName: user.name,
        userImage: user.image,
        followedAt: playlistFollows.createdAt,
        tracksCount: count(playlistTracks.trackId),
      })
      .from(playlistFollows)
      .innerJoin(playlists, eq(playlistFollows.playlistId, playlists.id))
      .leftJoin(user, eq(playlists.ownerId, user.id))
      .leftJoin(playlistTracks, eq(playlists.id, playlistTracks.playlistId))
      .where(eq(playlistFollows.userId, currentUser.id))
      .groupBy(
        playlists.id,
        playlists.ownerId,
        playlists.title,
        playlists.description,
        playlists.coverUrl,
        playlists.isPublic,
        playlists.createdAt,
        playlists.updatedAt,
        user.id,
        user.name,
        user.image,
        playlistFollows.createdAt
      )
      .orderBy(desc(playlistFollows.createdAt))
      .limit(limit)
      .offset(offset);

    // Format followed playlists
    const followedPlaylists = followedPlaylistsQuery.map(item => ({
      id: item.playlistId,
      ownerId: item.ownerId,
      title: item.title,
      description: item.description,
      coverUrl: item.coverUrl,
      isPublic: item.isPublic,
      createdAt: item.playlistCreatedAt,
      updatedAt: item.playlistUpdatedAt,
      owner: item.userId ? {
        id: item.userId,
        name: item.userName,
        image: item.userImage,
      } : null,
      ownerName: item.userName || 'Unknown',
      followedAt: item.followedAt,
      tracksCount: item.tracksCount,
    }));

    // Get artists the user follows
    const followedArtistsQuery = await db
      .select({
        artistId: artists.id,
        artistName: artists.name,
        artistSlug: artists.slug,
        artistImageUrl: artists.imageUrl,
        artistIsVerified: artists.isVerified,
        artistMonthlyListeners: artists.monthlyListeners,
        followedAt: artistFollows.createdAt,
      })
      .from(artistFollows)
      .innerJoin(artists, eq(artistFollows.artistId, artists.id))
      .where(eq(artistFollows.userId, currentUser.id))
      .orderBy(desc(artistFollows.createdAt))
      .limit(limit)
      .offset(offset);

    // Format followed artists
    const followedArtists = followedArtistsQuery.map(item => ({
      id: item.artistId,
      name: item.artistName,
      slug: item.artistSlug,
      imageUrl: item.artistImageUrl,
      isVerified: item.artistIsVerified,
      monthlyListeners: item.artistMonthlyListeners,
      followedAt: item.followedAt,
    }));

    const library = {
      own: ownPlaylistsWithCounts,
      followed: followedPlaylists,
      followedArtists: followedArtists,
    };

    return NextResponse.json(library, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}
