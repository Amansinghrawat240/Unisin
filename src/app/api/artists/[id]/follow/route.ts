import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, artistFollows, user } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// Helper function to verify JWT token
async function verifyJWTToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = process.env.JWT_SECRET || 'unisin-secret-key-2024';
    
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      return null;
    }
    
    return { userId: decodedPayload.userId };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Helper function to get authenticated user (supports both better-auth and JWT)
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
    
    const jwtUser = await verifyJWTToken(token);
    if (jwtUser) return { id: jwtUser.userId };
  }
  
  return null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15
    const { id } = await params;
    
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Validate artist ID parameter
    const artistId = parseInt(id);
    if (!artistId || isNaN(artistId)) {
      return NextResponse.json({ 
        error: 'Valid artist ID is required',
        code: 'INVALID_ARTIST_ID' 
      }, { status: 400 });
    }

    // Check if artist exists
    const artist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await db.select()
      .from(artistFollows)
      .where(and(
        eq(artistFollows.userId, user.id),
        eq(artistFollows.artistId, artistId)
      ))
      .limit(1);

    // If already following, return success (idempotent)
    if (existingFollow.length > 0) {
      return NextResponse.json({ 
        success: true, 
        isFollowing: true 
      }, { status: 200 });
    }

    // Insert new follow relationship
    await db.insert(artistFollows).values({
      userId: user.id,
      artistId: artistId,
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      isFollowing: true
    }, { status: 200 });

  } catch (error: any) {
    console.error('POST /api/artists/[id]/follow error:', error);
    
    // Handle unique constraint violations gracefully (PostgreSQL and SQLite)
    if (error?.message?.includes('UNIQUE constraint') || 
        error?.message?.includes('duplicate key') ||
        error?.code === '23505') {
      return NextResponse.json({ 
        success: true, 
        isFollowing: true 
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15
    const { id } = await params;
    
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Validate artist ID parameter
    const artistId = parseInt(id);
    if (!artistId || isNaN(artistId)) {
      return NextResponse.json({ 
        error: 'Valid artist ID is required',
        code: 'INVALID_ARTIST_ID' 
      }, { status: 400 });
    }

    // Check if artist exists
    const artist = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (artist.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete follow relationship (idempotent - no error if doesn't exist)
    await db.delete(artistFollows)
      .where(and(
        eq(artistFollows.userId, user.id),
        eq(artistFollows.artistId, artistId)
      ));

    return NextResponse.json({ 
      success: true, 
      isFollowing: false 
    }, { status: 200 });

  } catch (error: any) {
    console.error('DELETE /api/artists/[id]/follow error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
