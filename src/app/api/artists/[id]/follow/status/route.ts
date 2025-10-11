import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, artistFollows } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// Helper function to get authenticated user (same pattern as follow endpoints)
async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string } | null> {
  // Try better-auth session first
  try {
    const user = await getCurrentUser(request);
    if (user) return user;
  } catch (error) {
    console.error('Better-auth session check failed:', error);
  }
  
  // Fallback to JWT token or test user ID
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    
    // For testing, allow simple token format
    const testUserId = request.headers.get('x-test-user-id');
    if (testUserId && token.includes('test')) {
      return { id: testUserId };
    }
  }
  
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate artist ID parameter
    const { id: artistId } = await params;
    if (!artistId || isNaN(parseInt(artistId))) {
      return NextResponse.json({ 
        error: "Valid artist ID is required",
        code: "INVALID_ARTIST_ID" 
      }, { status: 400 });
    }

    const parsedArtistId = parseInt(artistId);

    // Check if artist exists
    const artist = await db.select()
      .from(artists)
      .where(eq(artists.id, parsedArtistId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ isFollowing: false }, { status: 200 });
    }

    // Try to get authenticated user - gracefully handle if not authenticated
    const user = await getAuthenticatedUser(request);

    // If user is not authenticated, return isFollowing: false
    if (!user) {
      return NextResponse.json({ isFollowing: false }, { status: 200 });
    }

    // Check if follow relationship exists
    const followRecord = await db.select()
      .from(artistFollows)
      .where(and(
        eq(artistFollows.userId, user.id),
        eq(artistFollows.artistId, parsedArtistId)
      ))
      .limit(1);

    const isFollowing = followRecord.length > 0;

    return NextResponse.json({ isFollowing }, { status: 200 });

  } catch (error) {
    console.error('GET artist follow status error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}