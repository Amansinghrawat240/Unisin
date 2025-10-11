import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  recentlyPlayed, 
  tracks, 
  artists, 
  albums, 
  playlists, 
  trackArtists,
  trackSubmissions 
} from '@/db/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { supabaseAdmin } from '@/lib/supabase/server';

// Simple auth helper - extract user from bearer token (simplified for MVP)
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // For MVP: simplified auth - just return a mock user
  // In production, validate the JWT token and get user from session
  return { id: 'user-123' }; // Mock user ID - replace with actual auth logic
}

export async function GET(request: NextRequest) {
  try {
    // Try to get authenticated user (optional for this endpoint)
    let user = null;
    try {
      user = await getCurrentUser(request);
    } catch (error) {
      // User not authenticated, continue as public user
    }

    // Run all queries in parallel for better performance
    const [trendingTracksData, popularArtistsData, editorialPlaylistsData] = await Promise.all([
      // Trending tracks - reduced to 12 for faster initial load
      db
        .select({
          track: {
            id: tracks.id,
            title: tracks.title,
            durationSec: tracks.durationSec,
            audioUrl: tracks.audioUrl,
            imageUrl: tracks.imageUrl,
            popularity: tracks.popularity,
            explicit: tracks.explicit,
          },
          album: {
            id: albums.id,
            title: albums.title,
            coverUrl: albums.coverUrl,
          },
        })
        .from(tracks)
        .leftJoin(albums, eq(tracks.albumId, albums.id))
        .orderBy(desc(tracks.popularity))
        .limit(12),
      
      // Popular artists
      db
        .select({
          id: artists.id,
          name: artists.name,
          slug: artists.slug,
          bio: artists.bio,
          imageUrl: artists.imageUrl,
          bannerUrl: artists.bannerUrl,
          popularity: artists.popularity,
        })
        .from(artists)
        .orderBy(desc(artists.popularity))
        .limit(15),
      
      // Editorial playlists
      db
        .select({
          id: playlists.id,
          title: playlists.title,
          description: playlists.description,
          coverUrl: playlists.coverUrl,
          isPublic: playlists.isPublic,
          createdAt: playlists.createdAt,
        })
        .from(playlists)
        .where(eq(playlists.isPublic, true))
        .orderBy(desc(playlists.createdAt))
        .limit(10)
    ]);

    // FIX N+1: Fetch all artists for all tracks in ONE query
    const trackIds = trendingTracksData.map(item => item.track.id);
    const allTrackArtists = trackIds.length > 0 ? await db
      .select({
        trackId: trackArtists.trackId,
        artist: {
          id: artists.id,
          name: artists.name,
          slug: artists.slug,
          imageUrl: artists.imageUrl,
          userId: artists.userId,
        },
      })
      .from(trackArtists)
      .leftJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(inArray(trackArtists.trackId, trackIds))
    : [];

    // Group artists by track ID
    const artistsByTrackId = new Map<number, any[]>();
    allTrackArtists.forEach(ta => {
      if (!artistsByTrackId.has(ta.trackId)) {
        artistsByTrackId.set(ta.trackId, []);
      }
      artistsByTrackId.get(ta.trackId)!.push(ta.artist);
    });

    // Combine tracks with their artists
    const trendingTracksWithArtists = trendingTracksData.map(item => ({
      ...item,
      artists: artistsByTrackId.get(item.track.id) || [],
    }));

    const sections = {
      trendingTracks: trendingTracksWithArtists,
      popularArtists: popularArtistsData,
      editorialPlaylists: editorialPlaylistsData,
    };

    // Add cache headers for 5 minutes
    return NextResponse.json(sections, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}