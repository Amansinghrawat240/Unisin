import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists, albums, tracks, trackArtists, playlists } from '@/db/schema';
import { like, desc, or, eq, inArray, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Validate required query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        error: "Search query 'q' is required",
        code: "MISSING_QUERY" 
      }, { status: 400 });
    }

    // Validate type parameter
    const validTypes = ['track', 'album', 'artist', 'playlist', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: "Type must be one of: track, album, artist, playlist, all",
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    const searchTerm = query.trim();
    const searchPattern = `%${searchTerm.toLowerCase()}%`;

    if (type === 'playlist') {
      // Search playlists by title (case-insensitive)
      const playlistResults = await db.select()
        .from(playlists)
        .where(sql`LOWER(${playlists.title}) LIKE ${searchPattern}`)
        .orderBy(desc(playlists.createdAt))
        .limit(limit);

      return NextResponse.json({
        query: searchTerm,
        type: 'playlist',
        results: playlistResults,
        total: playlistResults.length
      });

    } else if (type === 'track') {
      // Search by track title OR artist name (case-insensitive)
      const artistMatches = await db
        .select({ id: artists.id })
        .from(artists)
        .where(sql`LOWER(${artists.name}) LIKE ${searchPattern}`);

      const artistIds = artistMatches.map(a => a.id);

      let trackResults = [];
      
      // Get tracks by title (case-insensitive)
      const titleMatches = await db.select()
        .from(tracks)
        .where(sql`LOWER(${tracks.title}) LIKE ${searchPattern}`)
        .orderBy(desc(tracks.popularity))
        .limit(limit);

      trackResults = titleMatches;

      // Get tracks by artist name
      if (artistIds.length > 0) {
        const artistTrackLinks = await db
          .select({ trackId: trackArtists.trackId })
          .from(trackArtists)
          .where(inArray(trackArtists.artistId, artistIds));

        const trackIds = artistTrackLinks.map(at => at.trackId);

        if (trackIds.length > 0) {
          const artistTracks = await db
            .select()
            .from(tracks)
            .where(inArray(tracks.id, trackIds))
            .orderBy(desc(tracks.popularity))
            .limit(limit);

          // Merge and deduplicate
          const trackMap = new Map();
          [...trackResults, ...artistTracks].forEach(t => trackMap.set(t.id, t));
          trackResults = Array.from(trackMap.values()).slice(0, limit);
        }
      }

      // Enrich with artist names
      const enrichedTracks = await Promise.all(
        trackResults.map(async (track) => {
          const trackArtistsList = await db
            .select({ artistName: artists.name })
            .from(trackArtists)
            .leftJoin(artists, eq(trackArtists.artistId, artists.id))
            .where(eq(trackArtists.trackId, track.id));

          return {
            ...track,
            artistNames: trackArtistsList.map(ta => ta.artistName).filter(Boolean),
          };
        })
      );

      return NextResponse.json({
        query: searchTerm,
        type: 'track',
        results: enrichedTracks,
        total: enrichedTracks.length
      });

    } else if (type === 'album') {
      const albumResults = await db.select()
        .from(albums)
        .where(sql`LOWER(${albums.title}) LIKE ${searchPattern}`)
        .orderBy(desc(albums.popularity))
        .limit(limit);

      return NextResponse.json({
        query: searchTerm,
        type: 'album',
        results: albumResults,
        total: albumResults.length
      });

    } else if (type === 'artist') {
      const artistResults = await db.select()
        .from(artists)
        .where(sql`LOWER(${artists.name}) LIKE ${searchPattern}`)
        .orderBy(desc(artists.popularity))
        .limit(limit);

      return NextResponse.json({
        query: searchTerm,
        type: 'artist',
        results: artistResults,
        total: artistResults.length
      });

    } else { // type === 'all'
      // Search by track title OR artist name for tracks (case-insensitive)
      const artistMatches = await db
        .select({ id: artists.id })
        .from(artists)
        .where(sql`LOWER(${artists.name}) LIKE ${searchPattern}`);

      const artistIds = artistMatches.map(a => a.id);

      let trackResults = [];
      
      // Get tracks by title (case-insensitive)
      const titleMatches = await db.select()
        .from(tracks)
        .where(sql`LOWER(${tracks.title}) LIKE ${searchPattern}`)
        .orderBy(desc(tracks.popularity))
        .limit(3);

      trackResults = titleMatches;

      // Get tracks by artist name
      if (artistIds.length > 0) {
        const artistTrackLinks = await db
          .select({ trackId: trackArtists.trackId })
          .from(trackArtists)
          .where(inArray(trackArtists.artistId, artistIds));

        const trackIds = artistTrackLinks.map(at => at.trackId);

        if (trackIds.length > 0) {
          const artistTracks = await db
            .select()
            .from(tracks)
            .where(inArray(tracks.id, trackIds))
            .orderBy(desc(tracks.popularity))
            .limit(3);

          // Merge and deduplicate
          const trackMap = new Map();
          [...trackResults, ...artistTracks].forEach(t => trackMap.set(t.id, t));
          trackResults = Array.from(trackMap.values()).slice(0, 3);
        }
      }

      // Enrich tracks with artist names
      const enrichedTracks = await Promise.all(
        trackResults.map(async (track) => {
          const trackArtistsList = await db
            .select({ artistName: artists.name })
            .from(trackArtists)
            .leftJoin(artists, eq(trackArtists.artistId, artists.id))
            .where(eq(trackArtists.trackId, track.id));

          return {
            ...track,
            artistNames: trackArtistsList.map(ta => ta.artistName).filter(Boolean),
          };
        })
      );

      const [albumResults, artistResults] = await Promise.all([
        db.select().from(albums).where(sql`LOWER(${albums.title}) LIKE ${searchPattern}`).orderBy(desc(albums.popularity)).limit(3),
        db.select().from(artists).where(sql`LOWER(${artists.name}) LIKE ${searchPattern}`).orderBy(desc(artists.popularity)).limit(3)
      ]);

      return NextResponse.json({
        query: searchTerm,
        type: 'all',
        categories: {
          tracks: enrichedTracks,
          albums: albumResults,
          artists: artistResults
        },
        total: {
          tracks: enrichedTracks.length,
          albums: albumResults.length,
          artists: artistResults.length
        }
      });
    }

  } catch (error) {
    console.error('GET search error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}