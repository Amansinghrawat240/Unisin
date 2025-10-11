import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editorRevisions, homepageSections, sectionItems, artists, trackArtists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Bearer token required' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Authentication token required' }, { status: 401 });
  }

  // Here you would verify the token and get user email
  // For now, assuming token contains email or you have a way to get user email
  // This is a placeholder - implement based on your auth system
  const userEmail = 'user@example.com'; // Replace with actual token verification

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const adminUsers = process.env.ADMIN_ADMINS?.split(',') || [];
  const allAdmins = [...adminEmails, ...adminUsers];

  if (!allAdmins.includes(userEmail)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const authError = await verifyAdminAccess(request);
    if (authError) return authError;

    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid revision ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const revisionId = parseInt(id);

    // Get the revision to redo
    const revision = await db.select()
      .from(editorRevisions)
      .where(eq(editorRevisions.id, revisionId))
      .limit(1);

    if (revision.length === 0) {
      return NextResponse.json({ 
        error: 'Revision not found',
        code: 'REVISION_NOT_FOUND' 
      }, { status: 404 });
    }

    const rev = revision[0];

    // Check if revision is currently undone
    if (!rev.isUndone) {
      return NextResponse.json({ 
        error: 'Revision is not undone and cannot be redone',
        code: 'REVISION_NOT_UNDONE' 
      }, { status: 400 });
    }

    // Parse the new state to apply
    let newState;
    try {
      newState = rev.newState ? JSON.parse(rev.newState) : null;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid revision state data',
        code: 'INVALID_STATE_JSON' 
      }, { status: 400 });
    }

    // Apply the redo operation based on action type
    switch (rev.actionType) {
      case 'artist_delete':
        // Delete the artist again
        const deleteResult = await db.delete(artists)
          .where(eq(artists.id, rev.entityId))
          .returning();

        if (deleteResult.length === 0) {
          return NextResponse.json({ 
            error: 'Artist not found for deletion',
            code: 'ARTIST_NOT_FOUND' 
          }, { status: 400 });
        }

        // Also delete track-artist relationships
        await db.delete(trackArtists)
          .where(eq(trackArtists.artistId, rev.entityId));
        break;

      case 'section_create':
        if (!newState) {
          return NextResponse.json({ 
            error: 'No section data to recreate',
            code: 'MISSING_SECTION_DATA' 
          }, { status: 400 });
        }
        
        // Recreate the section with the original data
        await db.insert(homepageSections).values({
          id: rev.entityId,
          title: newState.title,
          subtitle: newState.subtitle || null,
          type: newState.type,
          position: newState.position,
          isVisible: newState.isVisible ?? true,
          createdBy: newState.createdBy || null,
          createdAt: new Date(newState.createdAt),
          updatedAt: new Date()
        });
        break;

      case 'section_update':
        if (!newState) {
          return NextResponse.json({ 
            error: 'No section data to update',
            code: 'MISSING_SECTION_DATA' 
          }, { status: 400 });
        }

        // Apply the new section state
        const updateResult = await db.update(homepageSections)
          .set({
            title: newState.title,
            subtitle: newState.subtitle || null,
            type: newState.type,
            position: newState.position,
            isVisible: newState.isVisible ?? true,
            updatedAt: new Date()
          })
          .where(eq(homepageSections.id, rev.entityId))
          .returning();

        if (updateResult.length === 0) {
          return NextResponse.json({ 
            error: 'Section not found for update',
            code: 'SECTION_NOT_FOUND' 
          }, { status: 400 });
        }
        break;

      case 'section_delete':
        // Delete the section again
        const sectionDeleteResult = await db.delete(homepageSections)
          .where(eq(homepageSections.id, rev.entityId))
          .returning();

        if (sectionDeleteResult.length === 0) {
          return NextResponse.json({ 
            error: 'Section not found for deletion',
            code: 'SECTION_NOT_FOUND' 
          }, { status: 400 });
        }

        // Also delete associated section items
        await db.delete(sectionItems)
          .where(eq(sectionItems.sectionId, rev.entityId));
        break;

      case 'item_add':
        if (!newState) {
          return NextResponse.json({ 
            error: 'No item data to add',
            code: 'MISSING_ITEM_DATA' 
          }, { status: 400 });
        }

        // Add the item back
        await db.insert(sectionItems).values({
          id: rev.entityId,
          sectionId: newState.sectionId,
          itemType: newState.itemType,
          itemId: newState.itemId,
          position: newState.position,
          createdAt: new Date(newState.createdAt)
        });
        break;

      case 'item_remove':
        // Remove the item again
        const itemDeleteResult = await db.delete(sectionItems)
          .where(eq(sectionItems.id, rev.entityId))
          .returning();

        if (itemDeleteResult.length === 0) {
          return NextResponse.json({ 
            error: 'Item not found for removal',
            code: 'ITEM_NOT_FOUND' 
          }, { status: 400 });
        }
        break;

      case 'sections_reorder':
        if (!newState || !Array.isArray(newState.sections)) {
          return NextResponse.json({ 
            error: 'Invalid section reorder data',
            code: 'INVALID_REORDER_DATA' 
          }, { status: 400 });
        }

        // Apply new section positions
        for (const section of newState.sections) {
          await db.update(homepageSections)
            .set({ 
              position: section.position,
              updatedAt: new Date()
            })
            .where(eq(homepageSections.id, section.id));
        }
        break;

      case 'items_reorder':
        if (!newState || !Array.isArray(newState.items)) {
          return NextResponse.json({ 
            error: 'Invalid item reorder data',
            code: 'INVALID_REORDER_DATA' 
          }, { status: 400 });
        }

        // Apply new item positions
        for (const item of newState.items) {
          await db.update(sectionItems)
            .set({ position: item.position })
            .where(eq(sectionItems.id, item.id));
        }
        break;

      default:
        return NextResponse.json({ 
          error: `Unsupported action type: ${rev.actionType}`,
          code: 'UNSUPPORTED_ACTION_TYPE' 
        }, { status: 400 });
    }

    // Mark the revision as not undone
    const updatedRevision = await db.update(editorRevisions)
      .set({ isUndone: false })
      .where(eq(editorRevisions.id, revisionId))
      .returning();

    return NextResponse.json({
      message: 'Revision redone successfully',
      revision: updatedRevision[0],
      actionType: rev.actionType,
      entityType: rev.entityType,
      entityId: rev.entityId
    }, { status: 200 });

  } catch (error) {
    console.error('POST redo error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}