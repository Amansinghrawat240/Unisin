import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSections, sectionItems, editorRevisions, playlists, tracks, artists } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// BETTER-AUTH: Check if user has admin or editor role
async function verifyAdminAccess(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return { error: 'Authentication required', status: 401 };
  }

  // Check if user has admin or editor role
  if (user.role !== 'admin' && user.role !== 'editor') {
    return { error: 'Admin or editor access required', status: 403 };
  }

  return { user };
}

// Helper to get section details with items
async function getSectionWithItems(sectionId: number) {
  const section = await db.select()
    .from(homepageSections)
    .where(eq(homepageSections.id, sectionId))
    .limit(1);

  if (section.length === 0) return null;

  const items = await db.select({
    id: sectionItems.id,
    itemType: sectionItems.itemType,
    itemId: sectionItems.itemId,
    position: sectionItems.position,
    customDescription: sectionItems.customDescription,
    customCoverUrl: sectionItems.customCoverUrl
  })
  .from(sectionItems)
  .where(eq(sectionItems.sectionId, sectionId))
  .orderBy(asc(sectionItems.position));

  // Get item details based on type
  const itemsWithDetails = await Promise.all(
    items.map(async (item) => {
      let details = null;
      
      if (item.itemType === 'playlist') {
        const playlistResult = await db.select()
          .from(playlists)
          .where(eq(playlists.id, item.itemId))
          .limit(1);
        details = playlistResult[0] || null;
      } else if (item.itemType === 'track') {
        const trackResult = await db.select()
          .from(tracks)
          .where(eq(tracks.id, item.itemId))
          .limit(1);
        details = trackResult[0] || null;
        
        // Use custom overrides if provided
        if (details) {
          details = {
            ...details,
            title: details.title,
            description: item.customDescription || null,
            imageUrl: item.customCoverUrl || details.imageUrl
          };
        }
      } else if (item.itemType === 'artist') {
        const artistResult = await db.select()
          .from(artists)
          .where(eq(artists.id, item.itemId))
          .limit(1);
        details = artistResult[0] || null;
        
        // Use custom overrides if provided
        if (details) {
          details = {
            ...details,
            name: details.name,
            bio: item.customDescription || details.bio,
            imageUrl: item.customCoverUrl || details.imageUrl
          };
        }
      }

      return {
        ...item,
        details
      };
    })
  );

  return {
    ...section[0],
    items: itemsWithDetails
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includeHidden = searchParams.get('include_hidden') === 'true';

    // Build query condition
    let queryCondition = undefined;
    if (!includeHidden) {
      queryCondition = eq(homepageSections.isVisible, true);
    }

    // Get all sections ordered by position
    const sections = await db.select()
      .from(homepageSections)
      .where(queryCondition)
      .orderBy(asc(homepageSections.position));

    // Get items for all sections with details
    const sectionsWithItems = await Promise.all(
      sections.map(async (section) => {
        const items = await db.select({
          id: sectionItems.id,
          itemType: sectionItems.itemType,
          itemId: sectionItems.itemId,
          position: sectionItems.position,
          customDescription: sectionItems.customDescription,
          customCoverUrl: sectionItems.customCoverUrl
        })
        .from(sectionItems)
        .where(eq(sectionItems.sectionId, section.id))
        .orderBy(asc(sectionItems.position));

        // Get item details based on type
        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            let details = null;
            
            if (item.itemType === 'playlist') {
              const playlistResult = await db.select()
                .from(playlists)
                .where(eq(playlists.id, item.itemId))
                .limit(1);
              details = playlistResult[0] || null;
              
              // Use custom overrides if provided
              if (details) {
                details = {
                  ...details,
                  title: details.title,
                  description: item.customDescription || details.description,
                  coverUrl: item.customCoverUrl || details.coverUrl
                };
              }
            } else if (item.itemType === 'track') {
              const trackResult = await db.select()
                .from(tracks)
                .where(eq(tracks.id, item.itemId))
                .limit(1);
              details = trackResult[0] || null;
              
              // Use custom overrides if provided
              if (details) {
                details = {
                  ...details,
                  title: details.title,
                  description: item.customDescription || null,
                  imageUrl: item.customCoverUrl || details.imageUrl
                };
              }
            } else if (item.itemType === 'artist') {
              const artistResult = await db.select()
                .from(artists)
                .where(eq(artists.id, item.itemId))
                .limit(1);
              details = artistResult[0] || null;
              
              // Use custom overrides if provided
              if (details) {
                details = {
                  ...details,
                  name: details.name,
                  bio: item.customDescription || details.bio,
                  imageUrl: item.customCoverUrl || details.imageUrl
                };
              }
            }

            return {
              ...item,
              details
            };
          })
        );

        return {
          ...section,
          items: itemsWithDetails
        };
      })
    );

    return NextResponse.json(sectionsWithItems);
  } catch (error) {
    console.error('GET sections error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const requestBody = await request.json();
    const { title, subtitle, type, position, isVisible } = requestBody;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ 
        error: "Type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    if (position === undefined || position === null) {
      return NextResponse.json({ 
        error: "Position is required",
        code: "MISSING_POSITION" 
      }, { status: 400 });
    }

    // Validate section type
    const validTypes = ["playlist_carousel", "track_grid", "artist_grid"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: "Invalid section type. Must be one of: " + validTypes.join(', '),
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    // Validate position is a number
    if (isNaN(parseInt(position))) {
      return NextResponse.json({ 
        error: "Position must be a valid number",
        code: "INVALID_POSITION" 
      }, { status: 400 });
    }

    const timestamp = new Date();
    
    // CRITICAL FIX: Use proper Date objects instead of trying to pass id
    const newSection = await db.insert(homepageSections)
      .values({
        // DO NOT SPECIFY id - let SQLite auto-increment handle it
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        type,
        position: parseInt(position),
        isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
        createdBy: "admin",
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    if (newSection.length === 0) {
      return NextResponse.json({ 
        error: "Failed to create section",
        code: "CREATE_FAILED" 
      }, { status: 500 });
    }

    const createdSection = newSection[0];

    try {
      // Create revision record - also let auto-increment handle the id
      await db.insert(editorRevisions).values({
        // DO NOT SPECIFY id - let SQLite auto-increment handle it
        editorId: "admin",
        actionType: "section_create",
        entityType: "section", 
        entityId: createdSection.id,
        previousState: null,
        newState: JSON.stringify(createdSection),
        createdAt: timestamp
      });
    } catch (revisionError) {
      console.warn('Failed to create revision record:', revisionError);
      // Continue anyway since the main operation succeeded
    }

    // Return section with empty items array
    const sectionWithItems = {
      ...createdSection,
      items: []
    };

    return NextResponse.json(sectionWithItems, { status: 201 });
  } catch (error) {
    console.error('POST sections error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
