import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, tracks, trackArtists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required', code: 'MISSING_SLUG' },
        { status: 400 }
      );
    }

    // Get artist by slug
    const artistResult = await db
      .select()
      .from(artists)
      .where(eq(artists.slug, slug))
      .limit(1);

    if (artistResult.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found', code: 'ARTIST_NOT_FOUND' },
        { status: 404 }
      );
    }

    const artist = artistResult[0];

    // Get all tracks by this artist with all associated artists
    const tracksWithArtists = await db
      .select({
        trackId: tracks.id,
        title: tracks.title,
        imageUrl: tracks.imageUrl,
        audioUrl: tracks.audioUrl,
        explicit: tracks.explicit,
        durationSec: tracks.durationSec,
        popularity: tracks.popularity,
        artistId: artists.id,
        artistName: artists.name
      })
      .from(trackArtists)
      .innerJoin(tracks, eq(trackArtists.trackId, tracks.id))
      .innerJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(eq(trackArtists.artistId, artist.id))
      .orderBy(desc(tracks.popularity));

    // Get unique track IDs for this artist
    const trackIds = [...new Set(tracksWithArtists.map(t => t.trackId))];

    // Get all artists for all tracks by this artist
    const allTrackArtists = await db
      .select({
        trackId: trackArtists.trackId,
        artistName: artists.name
      })
      .from(trackArtists)
      .innerJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(trackIds.length > 0 ? 
        trackIds.map(id => eq(trackArtists.trackId, id)).reduce((a, b) => a || b) :
        eq(trackArtists.trackId, -1) // No tracks case
      );

    // Group artists by track
    const artistsByTrack = allTrackArtists.reduce((acc, item) => {
      if (!acc[item.trackId]) {
        acc[item.trackId] = [];
      }
      acc[item.trackId].push(item.artistName);
      return acc;
    }, {} as Record<number, string[]>);

    // Build unique tracks array with all artists
    const uniqueTracks = trackIds.map(trackId => {
      const trackData = tracksWithArtists.find(t => t.trackId === trackId);
      if (!trackData) return null;

      return {
        id: trackData.trackId,
        title: trackData.title,
        imageUrl: trackData.imageUrl,
        audioUrl: trackData.audioUrl,
        explicit: trackData.explicit,
        durationSec: trackData.durationSec,
        artists: artistsByTrack[trackId] || []
      };
    }).filter(Boolean).sort((a, b) => {
      const aPopularity = tracksWithArtists.find(t => t.trackId === a?.id)?.popularity || 0;
      const bPopularity = tracksWithArtists.find(t => t.trackId === b?.id)?.popularity || 0;
      return bPopularity - aPopularity;
    });

    const response = {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      bio: artist.bio,
      imageUrl: artist.imageUrl,
      bannerUrl: artist.bannerUrl,
      popularity: artist.popularity,
      userId: artist.userId,
      isVerified: artist.isVerified,
      monthlyListeners: artist.monthlyListeners,
      createdAt: artist.createdAt?.toISOString(),
      tracks: uniqueTracks,
      trackCount: uniqueTracks.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET artist by slug error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}