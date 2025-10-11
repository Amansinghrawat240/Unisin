import { NextResponse } from 'next/server';
import { db } from '@/db';
import { albums, artists, tracks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, _ctx: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid album ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const albumId = parseInt(id);

    // Fetch album with artist information
    const albumResult = await db
      .select({
        id: albums.id,
        title: albums.title,
        releaseDate: albums.releaseDate,
        coverUrl: albums.coverUrl,
        popularity: albums.popularity,
        createdAt: albums.createdAt,
        artist: {
          id: artists.id,
          name: artists.name,
          imageUrl: artists.imageUrl,
          bio: artists.bio
        }
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(eq(albums.id, albumId))
      .limit(1);

    if (albumResult.length === 0) {
      return NextResponse.json({ 
        error: 'Album not found',
        code: "ALBUM_NOT_FOUND" 
      }, { status: 404 });
    }

    const album = albumResult[0];

    // Fetch all tracks for this album
    const albumTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        durationSec: tracks.durationSec,
        audioUrl: tracks.audioUrl,
        imageUrl: tracks.imageUrl,
        popularity: tracks.popularity,
        explicit: tracks.explicit,
        createdAt: tracks.createdAt
      })
      .from(tracks)
      .where(eq(tracks.albumId, albumId))
      .orderBy(tracks.id);

    // Construct the response with album details, artist info, and tracks
    const response = {
      id: album.id,
      title: album.title,
      releaseDate: album.releaseDate,
      coverUrl: album.coverUrl,
      popularity: album.popularity,
      createdAt: album.createdAt,
      artist: album.artist,
      tracks: albumTracks
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET album error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}