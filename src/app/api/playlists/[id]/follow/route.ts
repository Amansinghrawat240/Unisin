import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists, playlistFollows } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
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

// Use the same auth helper as /api/me/library for consistency
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

export async function POST(
  request: NextRequest,
  _ctx: any
) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2]; // .../playlists/[id]/follow
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const playlistId = parseInt(id);

    // Validate playlist ID
    if (!id || isNaN(playlistId)) {
      return NextResponse.json({ 
        error: "Valid playlist ID is required",
        code: "INVALID_PLAYLIST_ID" 
      }, { status: 400 });
    }

    // Check if playlist exists
    const playlist = await db.select()
      .from(playlists)
      .where(eq(playlists.id, playlistId))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json({ 
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if user is trying to follow their own playlist
    if (playlist[0].ownerId === user.id) {
      return NextResponse.json({ 
        error: 'Cannot follow your own playlist',
        code: 'CANNOT_FOLLOW_OWN_PLAYLIST' 
      }, { status: 409 });
    }

    // Check if already following (idempotent operation)
    const existingFollow = await db.select()
      .from(playlistFollows)
      .where(and(
        eq(playlistFollows.playlistId, playlistId),
        eq(playlistFollows.userId, user.id)
      ))
      .limit(1);

    // If not already following, create the follow using Drizzle
    if (existingFollow.length === 0) {
      try {
        const result = await db.insert(playlistFollows).values({
          playlistId: playlistId,
          userId: user.id,
          createdAt: new Date()
        });
      } catch (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ 
          error: 'Failed to create follow: ' + insertError 
        }, { status: 500 });
      }
    }

    // Get current follower count
    const followerCountResult = await db.select({ count: count() })
      .from(playlistFollows)
      .where(eq(playlistFollows.playlistId, playlistId));

    const followerCount = followerCountResult[0]?.count || 0;

    return NextResponse.json({
      ok: true,
      followerCount,
      isFollowing: true
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  _ctx: any
) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2]; // .../playlists/[id]/follow
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const playlistId = parseInt(id);

    // Validate playlist ID
    if (!id || isNaN(playlistId)) {
      return NextResponse.json({ 
        error: "Valid playlist ID is required",
        code: "INVALID_PLAYLIST_ID" 
      }, { status: 400 });
    }

    // Check if playlist exists
    const playlist = await db.select()
      .from(playlists)
      .where(eq(playlists.id, playlistId))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json({ 
        error: 'Playlist not found',
        code: 'PLAYLIST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the follow if it exists (idempotent operation)
    await db.delete(playlistFollows)
      .where(and(
        eq(playlistFollows.playlistId, playlistId),
        eq(playlistFollows.userId, user.id)
      ));

    // Get current follower count
    const followerCountResult = await db.select({ count: count() })
      .from(playlistFollows)
      .where(eq(playlistFollows.playlistId, playlistId));

    const followerCount = followerCountResult[0]?.count || 0;

    return NextResponse.json({
      ok: true,
      followerCount,
      isFollowing: false
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}