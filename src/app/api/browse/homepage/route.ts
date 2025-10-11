import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSections, sectionItems, playlists, tracks, artists } from '@/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all visible homepage sections ordered by position
    const sections = await db.select()
      .from(homepageSections)
      .where(eq(homepageSections.isVisible, true))
      .orderBy(asc(homepageSections.position));

    if (sections.length === 0) {
      return NextResponse.json([]);
    }

    const sectionIds = sections.map(s => s.id);

    // FIX: Get ALL items for ALL sections in ONE query
    const allItems = await db.select()
      .from(sectionItems)
      .where(inArray(sectionItems.sectionId, sectionIds))
      .orderBy(asc(sectionItems.position));

    // Group items by type and collect IDs
    const playlistIds: number[] = [];
    const trackIds: number[] = [];
    const artistIds: number[] = [];

    allItems.forEach(item => {
      if (item.itemType === 'playlist') playlistIds.push(item.itemId);
      else if (item.itemType === 'track') trackIds.push(item.itemId);
      else if (item.itemType === 'artist') artistIds.push(item.itemId);
    });

    // FIX: Fetch ALL details in parallel with 3 queries instead of N queries
    const [allPlaylists, allTracks, allArtists] = await Promise.all([
      playlistIds.length > 0
        ? db.select({
            id: playlists.id,
            title: playlists.title,
            description: playlists.description,
            coverUrl: playlists.coverUrl,
            isPublic: playlists.isPublic,
            createdAt: playlists.createdAt,
            updatedAt: playlists.updatedAt
          })
          .from(playlists)
          .where(inArray(playlists.id, playlistIds))
        : Promise.resolve([]),
      
      trackIds.length > 0
        ? db.select({
            id: tracks.id,
            title: tracks.title,
            albumId: tracks.albumId,
            durationSec: tracks.durationSec,
            audioUrl: tracks.audioUrl,
            imageUrl: tracks.imageUrl,
            popularity: tracks.popularity,
            explicit: tracks.explicit,
            createdAt: tracks.createdAt
          })
          .from(tracks)
          .where(inArray(tracks.id, trackIds))
        : Promise.resolve([]),
      
      artistIds.length > 0
        ? db.select({
            id: artists.id,
            name: artists.name,
            slug: artists.slug,
            bio: artists.bio,
            imageUrl: artists.imageUrl,
            bannerUrl: artists.bannerUrl,
            popularity: artists.popularity,
            createdAt: artists.createdAt
          })
          .from(artists)
          .where(inArray(artists.id, artistIds))
        : Promise.resolve([])
    ]);

    // Create lookup maps for O(1) access
    const playlistMap = new Map(allPlaylists.map(p => [p.id, p]));
    const trackMap = new Map(allTracks.map(t => [t.id, t]));
    const artistMap = new Map(allArtists.map(a => [a.id, a]));

    // Group items by section
    const itemsBySectionId = new Map<number, typeof allItems>();
    allItems.forEach(item => {
      if (item.sectionId === null) return; // Skip items without section
      
      if (!itemsBySectionId.has(item.sectionId)) {
        itemsBySectionId.set(item.sectionId, []);
      }
      itemsBySectionId.get(item.sectionId)!.push(item);
    });

    // Build final response
    const sectionsWithItems = sections.map(section => {
      const items = itemsBySectionId.get(section.id) || [];
      
      const itemsWithDetails = items.map(item => {
        let details = null;

        try {
          switch (item.itemType) {
            case 'playlist':
              const playlist = playlistMap.get(item.itemId);
              if (playlist) {
                details = {
                  ...playlist,
                  description: item.customDescription || playlist.description,
                  coverUrl: item.customCoverUrl || playlist.coverUrl,
                  hasCustomDescription: !!item.customDescription,
                  hasCustomCover: !!item.customCoverUrl
                };
              }
              break;

            case 'track':
              const track = trackMap.get(item.itemId);
              if (track) {
                details = {
                  ...track,
                  imageUrl: item.customCoverUrl || track.imageUrl,
                  hasCustomCover: !!item.customCoverUrl
                };
              }
              break;

            case 'artist':
              const artist = artistMap.get(item.itemId);
              if (artist) {
                details = {
                  ...artist,
                  imageUrl: item.customCoverUrl || artist.imageUrl,
                  hasCustomCover: !!item.customCoverUrl
                };
              }
              break;

            default:
              break;
          }
        } catch (error) {
          console.error(`Error processing ${item.itemType} ${item.itemId}:`, error);
        }

        if (details) {
          return {
            id: item.id,
            itemType: item.itemType,
            itemId: item.itemId,
            position: item.position,
            details
          };
        }
        return null;
      }).filter(item => item !== null);

      return {
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        type: section.type,
        position: section.position,
        items: itemsWithDetails
      };
    });

    return NextResponse.json(sectionsWithItems, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('GET homepage error:', error);
    // Return empty array instead of 500 error for graceful degradation
    return NextResponse.json([], {
      headers: {
        'X-Database-Error': 'true'
      }
    });
  }
}
