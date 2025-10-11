import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likesTracks, tracks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user || null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch all liked tracks for the user with track details
    const likedTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        durationSec: tracks.durationSec,
        audioUrl: tracks.audioUrl,
        imageUrl: tracks.imageUrl,
        popularity: tracks.popularity,
        explicit: tracks.explicit,
        likedAt: likesTracks.createdAt,
      })
      .from(likesTracks)
      .innerJoin(tracks, eq(likesTracks.trackId, tracks.id))
      .where(eq(likesTracks.userId, user.id))
      .orderBy(desc(likesTracks.createdAt));

    return NextResponse.json({ 
      results: likedTracks 
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/me/likes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}