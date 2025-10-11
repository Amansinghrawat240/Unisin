import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tracks, albums, artists, trackArtists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const trackId = parseInt(id);

    // Get track with album info
    const trackResult = await db
      .select({
        track: tracks,
        album: albums,
        albumArtist: artists
      })
      .from(tracks)
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(eq(tracks.id, trackId))
      .limit(1);

    if (trackResult.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: 'TRACK_NOT_FOUND' 
      }, { status: 404 });
    }

    const { track, album, albumArtist } = trackResult[0];

    // Get all artists associated with this track via trackArtists table
    const trackArtistsResult = await db
      .select({
        artist: artists
      })
      .from(trackArtists)
      .innerJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(eq(trackArtists.trackId, trackId));

    // Format the response
    const trackDetail = {
      id: track.id,
      title: track.title,
      durationSec: track.durationSec,
      audioUrl: track.audioUrl,
      imageUrl: track.imageUrl,
      popularity: track.popularity,
      explicit: track.explicit,
      createdAt: track.createdAt,
      album: album ? {
        id: album.id,
        title: album.title,
        releaseDate: album.releaseDate,
        coverUrl: album.coverUrl,
        popularity: album.popularity,
        artist: albumArtist ? {
          id: albumArtist.id,
          name: albumArtist.name,
          imageUrl: albumArtist.imageUrl,
          popularity: albumArtist.popularity
        } : null
      } : null,
      artists: trackArtistsResult.map(result => ({
        id: result.artist.id,
        name: result.artist.name,
        bio: result.artist.bio,
        imageUrl: result.artist.imageUrl,
        bannerUrl: result.artist.bannerUrl,
        popularity: result.artist.popularity
      }))
    };

    return NextResponse.json(trackDetail, { status: 200 });

  } catch (error) {
    console.error('GET track error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}