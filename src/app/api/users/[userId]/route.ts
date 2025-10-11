import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, playlists, trackSubmissions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    // Get current authenticated user
    const currentUser = await getCurrentUser(request);
    const isOwnProfile = currentUser?.id === userId;

    // Get user profile
    const userProfile = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get user's playlists
    // If viewing own profile, show ALL playlists (public + private)
    // If viewing someone else's profile, show only public playlists
    const playlistConditions = isOwnProfile
      ? eq(playlists.ownerId, userId)
      : and(eq(playlists.ownerId, userId), eq(playlists.isPublic, true));

    const userPlaylists = await db
      .select({
        id: playlists.id,
        title: playlists.title,
        description: playlists.description,
        coverUrl: playlists.coverUrl,
        isPublic: playlists.isPublic,
        createdAt: playlists.createdAt,
        updatedAt: playlists.updatedAt,
      })
      .from(playlists)
      .where(playlistConditions)
      .orderBy(desc(playlists.updatedAt))
      .limit(20);

    // Get user's uploaded tracks (approved ones that are live)
    const userSubmissions = await db
      .select({
        submissionId: trackSubmissions.id,
        trackId: trackSubmissions.id,
        title: trackSubmissions.title,
        artistsCsv: trackSubmissions.artistsCsv,
        album: trackSubmissions.album,
        coverUrl: trackSubmissions.coverUrl,
        explicit: trackSubmissions.explicit,
        audioUrl: trackSubmissions.audioUrl,
        state: trackSubmissions.state,
        createdAt: trackSubmissions.createdAt,
      })
      .from(trackSubmissions)
      .where(and(
        eq(trackSubmissions.userId, userId),
        eq(trackSubmissions.state, 'live')
      ))
      .orderBy(desc(trackSubmissions.createdAt))
      .limit(50);

    // Format uploaded tracks
    const uploadedTracks = userSubmissions.map(sub => ({
      id: sub.trackId,
      title: sub.title,
      artists: sub.artistsCsv.split(',').map(a => a.trim()),
      album: sub.album,
      coverUrl: sub.coverUrl,
      audioUrl: sub.audioUrl,
      explicit: sub.explicit,
      createdAt: sub.createdAt,
    }));

    const response = {
      user: userProfile[0],
      playlists: userPlaylists,
      uploadedTracks,
      stats: {
        playlistCount: userPlaylists.length,
        uploadedTrackCount: uploadedTracks.length,
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET user profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}