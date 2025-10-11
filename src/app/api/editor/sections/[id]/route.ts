import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSections, sectionItems, editorRevisions, playlists, tracks, artists, trackArtists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const sectionId = parseInt(id, 10);

    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    // Get section with items
    const section = await db.query.homepageSections.findFirst({
      where: eq(homepageSections.id, sectionId),
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Get section items
    const items = await db.query.sectionItems.findMany({
      where: eq(sectionItems.sectionId, sectionId),
    });

    return NextResponse.json({
      ...section,
      items,
    });
  } catch (error) {
    console.error('GET /api/editor/sections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { id } = await params;
    const sectionId = parseInt(id, 10);

    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    const body = await request.json();
    const { itemType, itemId } = body;

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'itemType and itemId required' }, { status: 400 });
    }

    // Verify section exists
    const section = await db.query.homepageSections.findFirst({
      where: eq(homepageSections.id, sectionId),
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Get next position
    const existingItems = await db.query.sectionItems.findMany({
      where: eq(sectionItems.sectionId, sectionId),
    });
    const nextPosition = existingItems.length > 0
      ? Math.max(...existingItems.map(i => i.position)) + 1
      : 0;

    // Fetch item details
    let details = null;
    if (itemType === 'playlist') {
      const playlist = await db.query.playlists.findFirst({
        where: eq(playlists.id, itemId),
      });
      if (playlist) {
        details = {
          id: playlist.id,
          title: playlist.title,
          coverUrl: playlist.coverUrl,
          description: playlist.description,
        };
      }
    } else if (itemType === 'track') {
      // FIXED: Use manual join instead of relational query
      const track = await db.query.tracks.findFirst({
        where: eq(tracks.id, itemId),
      });
      
      if (track) {
        // Manually fetch track artists
        const trackArtistRecords = await db
          .select({
            artistId: trackArtists.artistId,
            artistName: artists.name,
          })
          .from(trackArtists)
          .innerJoin(artists, eq(trackArtists.artistId, artists.id))
          .where(eq(trackArtists.trackId, itemId));

        details = {
          id: track.id,
          title: track.title,
          imageUrl: track.imageUrl,
          artists: trackArtistRecords.map(ta => ({ name: ta.artistName })),
        };
      }
    } else if (itemType === 'artist') {
      const artist = await db.query.artists.findFirst({
        where: eq(artists.id, itemId),
      });
      if (artist) {
        details = {
          id: artist.id,
          name: artist.name,
          imageUrl: artist.imageUrl,
        };
      }
    }

    if (!details) {
      return NextResponse.json({ error: `${itemType} not found` }, { status: 404 });
    }

    // Insert item
    const newItem = await db
      .insert(sectionItems)
      .values({
        sectionId,
        itemType,
        itemId,
        position: nextPosition,
        createdAt: new Date(),
      })
      .returning();

    // Log revision
    await db.insert(editorRevisions).values({
      editorId: user.id,
      actionType: 'item_add',
      entityType: 'section_item',
      entityId: newItem[0].id,
      previousState: null,
      newState: JSON.stringify(newItem[0]),
      createdAt: new Date(),
    });

    return NextResponse.json({
      ...newItem[0],
      details,
    });
  } catch (error) {
    console.error('POST /api/editor/sections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { id } = await params;
    const sectionId = parseInt(id, 10);

    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, subtitle, isVisible } = body;

    // Get current section for revision history
    const currentSection = await db.query.homepageSections.findFirst({
      where: eq(homepageSections.id, sectionId),
    });

    if (!currentSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Update section
    const updated = await db
      .update(homepageSections)
      .set({
        title: title ?? currentSection.title,
        subtitle: subtitle ?? currentSection.subtitle,
        isVisible: isVisible ?? currentSection.isVisible,
        updatedAt: new Date(),
      })
      .where(eq(homepageSections.id, sectionId))
      .returning();

    if (!updated[0]) {
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }

    // Get section items
    const items = await db.query.sectionItems.findMany({
      where: eq(sectionItems.sectionId, sectionId),
    });

    // Log revision
    await db.insert(editorRevisions).values({
      editorId: user.id,
      actionType: 'section_update',
      entityType: 'section',
      entityId: sectionId,
      previousState: JSON.stringify(currentSection),
      newState: JSON.stringify(updated[0]),
      createdAt: new Date(),
    });

    return NextResponse.json({
      ...updated[0],
      items,
    });
  } catch (error) {
    console.error('PATCH /api/editor/sections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { id } = await params;
    const sectionId = parseInt(id, 10);

    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    // Get current section for revision history
    const currentSection = await db.query.homepageSections.findFirst({
      where: eq(homepageSections.id, sectionId),
    });

    if (!currentSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Delete section items first
    await db.delete(sectionItems).where(eq(sectionItems.sectionId, sectionId));

    // Delete section
    const deleted = await db
      .delete(homepageSections)
      .where(eq(homepageSections.id, sectionId))
      .returning();

    if (!deleted[0]) {
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }

    // Log revision
    try {
      await db.insert(editorRevisions).values({
        editorId: user.id,
        actionType: 'section_delete',
        entityType: 'section',
        entityId: sectionId,
        previousState: JSON.stringify(currentSection),
        newState: null,
        createdAt: new Date(),
      });
    } catch (revisionError) {
      console.warn('Failed to log revision:', revisionError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/editor/sections/[id] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}