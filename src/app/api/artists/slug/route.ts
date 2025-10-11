import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, tracks, trackArtists, playlists } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ 
        error: "Slug parameter is required",
        code: "MISSING_SLUG" 
      }, { status: 400 });
    }

    // Get artist by slug
    const artistResult = await db.select().from(artists)
      .where(eq(artists.slug, slug))
      .limit(1);

    if (artistResult.length === 0) {
      return NextResponse.json({ 
        error: 'Artist not found',
        code: 'ARTIST_NOT_FOUND' 
      }, { status: 404 });
    }

    const artist = artistResult[0];

    // Get all track IDs by this artist
    const artistTrackIds = await db
      .select({ trackId: trackArtists.trackId })
      .from(trackArtists)
      .where(eq(trackArtists.artistId, artist.id));

    const trackIds = artistTrackIds.map(row => row.trackId);

    // Get track details for all tracks by this artist
    let finalTracks: any[] = [];
    if (trackIds.length > 0) {
      const trackDetails = await db
        .select({
          id: tracks.id,
          title: tracks.title,
          imageUrl: tracks.imageUrl,
          audioUrl: tracks.audioUrl,
          explicit: tracks.explicit,
          durationSec: tracks.durationSec,
          popularity: tracks.popularity
        })
        .from(tracks)
        .where(inArray(tracks.id, trackIds))
        .orderBy(desc(tracks.popularity));

      // Get all artists for each track
      const trackArtistRelations = await db
        .select({
          trackId: trackArtists.trackId,
          artistName: artists.name
        })
        .from(trackArtists)
        .innerJoin(artists, eq(trackArtists.artistId, artists.id))
        .where(inArray(trackArtists.trackId, trackIds));

      // Group artists by track ID
      const artistsByTrackId: Record<number, string[]> = {};
      trackArtistRelations.forEach(relation => {
        if (!artistsByTrackId[relation.trackId]) {
          artistsByTrackId[relation.trackId] = [];
        }
        artistsByTrackId[relation.trackId].push(relation.artistName);
      });

      // Build final tracks array with artist names
      finalTracks = trackDetails.map(track => ({
        id: track.id,
        title: track.title,
        imageUrl: track.imageUrl,
        audioUrl: track.audioUrl,
        explicit: track.explicit,
        durationSec: track.durationSec,
        artists: artistsByTrackId[track.id] || []
      }));
    }

    // Fetch playlists if this artist is linked to unisin-system user
    let artistPlaylists: any[] = [];
    if (artist.userId === 'unisin-system') {
      const playlistsData = await db
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
        .where(eq(playlists.ownerId, 'unisin-system'))
        .orderBy(desc(playlists.updatedAt))
        .limit(50);

      artistPlaylists = playlistsData;
    }

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
      createdAt: artist.createdAt,
      tracks: finalTracks,
      trackCount: finalTracks.length,
      playlists: artistPlaylists,
      playlistCount: artistPlaylists.length,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET slug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
