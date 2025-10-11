import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likesTracks, tracks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { trackId } = await params;
    
    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_TRACK_ID" 
      }, { status: 400 });
    }

    const trackIdInt = parseInt(trackId);

    // Validate that track exists
    const existingTrack = await db.select()
      .from(tracks)
      .where(eq(tracks.id, trackIdInt))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await db.select()
      .from(likesTracks)
      .where(and(
        eq(likesTracks.userId, user.id),
        eq(likesTracks.trackId, trackIdInt)
      ))
      .limit(1);

    if (existingLike.length > 0) {
      return NextResponse.json({ 
        error: 'Track already liked',
        code: "DUPLICATE_LIKE" 
      }, { status: 409 });
    }

    // Create the like
    await db.insert(likesTracks)
      .values({
        userId: user.id,
        trackId: trackIdInt,
        createdAt: new Date()
      });

    return NextResponse.json({ 
      userId: user.id, 
      trackId: trackIdInt,
      createdAt: new Date()
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/me/likes/[trackId] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { trackId } = await params;
    
    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_TRACK_ID" 
      }, { status: 400 });
    }

    const trackIdInt = parseInt(trackId);

    // Validate that track exists
    const existingTrack = await db.select()
      .from(tracks)
      .where(eq(tracks.id, trackIdInt))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if like exists
    const existingLike = await db.select()
      .from(likesTracks)
      .where(and(
        eq(likesTracks.userId, user.id),
        eq(likesTracks.trackId, trackIdInt)
      ))
      .limit(1);

    if (existingLike.length === 0) {
      return NextResponse.json({ 
        error: 'Like not found',
        code: "LIKE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete the like
    await db.delete(likesTracks)
      .where(and(
        eq(likesTracks.userId, user.id),
        eq(likesTracks.trackId, trackIdInt)
      ));

    return NextResponse.json({
      message: 'Like removed successfully',
      userId: user.id,
      trackId: trackIdInt
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE /api/me/likes/[trackId] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const { trackId } = await params;
    
    if (!trackId || isNaN(parseInt(trackId))) {
      return new NextResponse(null, { status: 400 });
    }

    const trackIdInt = parseInt(trackId);

    // Check if like exists
    const existingLike = await db.select()
      .from(likesTracks)
      .where(and(
        eq(likesTracks.userId, user.id),
        eq(likesTracks.trackId, trackIdInt)
      ))
      .limit(1);

    // Return 204 always with X-Liked header to indicate status
    return new NextResponse(null, { 
      status: 204,
      headers: {
        'X-Liked': existingLike.length > 0 ? 'true' : 'false'
      }
    });

  } catch (error) {
    console.error('HEAD /api/me/likes/[trackId] error:', error);
    return new NextResponse(null, { status: 500 });
  }
}