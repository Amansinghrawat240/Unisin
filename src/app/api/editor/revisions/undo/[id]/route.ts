import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editorRevisions, homepageSections, sectionItems, artists, trackArtists, session, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  
  try {
    // Query session separately
    const sessionResult = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0 || sessionResult[0].expiresAt < new Date()) {
      return null;
    }

    // Query user separately
    const userResult = await db.select()
      .from(user)
      .where(eq(user.id, sessionResult[0].userId))
      .limit(1);

    if (userResult.length === 0 || !userResult[0].email) {
      return null;
    }

    const userEmail = userResult[0].email;

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
    const adminAdmins = (process.env.ADMIN_ADMINS || '').split(',').map(email => email.trim());
    const allAdminEmails = [...adminEmails, ...adminAdmins].filter(email => email.length > 0);

    if (!allAdminEmails.includes(userEmail)) {
      return 'forbidden';
    }

    return userResult[0];
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin authentication
    const user = await verifyAdminAuth(request);
    if (user === null) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user === 'forbidden') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    
    // Validate revision ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid revision ID is required",
        code: "INVALID_REVISION_ID" 
      }, { status: 400 });
    }

    const revisionId = parseInt(id);

    // Find the revision
    const revision = await db.select()
      .from(editorRevisions)
      .where(eq(editorRevisions.id, revisionId))
      .limit(1);

    if (revision.length === 0) {
      return NextResponse.json({ 
        error: 'Revision not found',
        code: "REVISION_NOT_FOUND" 
      }, { status: 404 });
    }

    const revisionData = revision[0];

    // Check if already undone
    if (revisionData.isUndone) {
      return NextResponse.json({ 
        error: 'Revision is already undone',
        code: "ALREADY_UNDONE" 
      }, { status: 400 });
    }

    // Parse previous state
    let previousState = null;
    if (revisionData.previousState) {
      try {
        previousState = JSON.parse(revisionData.previousState);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Invalid previous state data',
          code: "INVALID_STATE_DATA" 
        }, { status: 400 });
      }
    }

    // Perform undo operation based on action type
    switch (revisionData.actionType) {
      case 'artist_delete':
        // Restore the deleted artist
        if (!previousState) {
          return NextResponse.json({ 
            error: 'No previous state available for artist restoration',
            code: "NO_PREVIOUS_STATE" 
          }, { status: 400 });
        }

        await db.insert(artists)
          .values({
            id: revisionData.entityId,
            name: previousState.name,
            slug: previousState.slug,
            bio: previousState.bio,
            imageUrl: previousState.imageUrl,
            bannerUrl: previousState.bannerUrl,
            popularity: previousState.popularity,
            userId: previousState.userId,
            isVerified: previousState.isVerified,
            monthlyListeners: previousState.monthlyListeners,
            createdAt: new Date(previousState.createdAt)
          });

        // Restore track-artist relationships
        if (previousState.trackArtists && Array.isArray(previousState.trackArtists)) {
          for (const rel of previousState.trackArtists) {
            await db.insert(trackArtists)
              .values({
                trackId: rel.trackId,
                artistId: rel.artistId
              })
              .onConflictDoNothing();
          }
        }
        break;

      case 'section_create':
        // Delete the created section
        const deletedSection = await db.delete(homepageSections)
          .where(eq(homepageSections.id, revisionData.entityId))
          .returning();
        
        if (deletedSection.length === 0) {
          return NextResponse.json({ 
            error: 'Section to undo creation not found',
            code: "SECTION_NOT_FOUND" 
          }, { status: 400 });
        }

        // Also delete any section items
        await db.delete(sectionItems)
          .where(eq(sectionItems.sectionId, revisionData.entityId));
        break;

      case 'section_update':
        // Restore previous section state
        if (!previousState) {
          return NextResponse.json({ 
            error: 'No previous state available for section update',
            code: "NO_PREVIOUS_STATE" 
          }, { status: 400 });
        }

        const updatedSection = await db.update(homepageSections)
          .set({
            title: previousState.title,
            subtitle: previousState.subtitle,
            type: previousState.type,
            position: previousState.position,
            isVisible: previousState.isVisible,
            updatedAt: new Date()
          })
          .where(eq(homepageSections.id, revisionData.entityId))
          .returning();

        if (updatedSection.length === 0) {
          return NextResponse.json({ 
            error: 'Section to restore not found',
            code: "SECTION_NOT_FOUND" 
          }, { status: 400 });
        }
        break;

      case 'section_delete':
        // Recreate the deleted section
        if (!previousState) {
          return NextResponse.json({ 
            error: 'No previous state available for section recreation',
            code: "NO_PREVIOUS_STATE" 
          }, { status: 400 });
        }

        await db.insert(homepageSections)
          .values({
            id: revisionData.entityId,
            title: previousState.title,
            subtitle: previousState.subtitle,
            type: previousState.type,
            position: previousState.position,
            isVisible: previousState.isVisible,
            createdBy: previousState.createdBy,
            createdAt: new Date(previousState.createdAt),
            updatedAt: new Date()
          });

        // Restore section items if they existed
        if (previousState.items && Array.isArray(previousState.items)) {
          for (const item of previousState.items) {
            await db.insert(sectionItems)
              .values({
                sectionId: revisionData.entityId,
                itemType: item.itemType,
                itemId: item.itemId,
                position: item.position,
                createdAt: new Date(item.createdAt)
              });
          }
        }
        break;

      case 'item_add':
        // Remove the added item
        const deletedItem = await db.delete(sectionItems)
          .where(eq(sectionItems.id, revisionData.entityId))
          .returning();

        if (deletedItem.length === 0) {
          return NextResponse.json({ 
            error: 'Item to remove not found',
            code: "ITEM_NOT_FOUND" 
          }, { status: 400 });
        }
        break;

      case 'item_remove':
        // Restore the removed item
        if (!previousState) {
          return NextResponse.json({ 
            error: 'No previous state available for item restoration',
            code: "NO_PREVIOUS_STATE" 
          }, { status: 400 });
        }

        await db.insert(sectionItems)
          .values({
            id: revisionData.entityId,
            sectionId: previousState.sectionId,
            itemType: previousState.itemType,
            itemId: previousState.itemId,
            position: previousState.position,
            createdAt: new Date(previousState.createdAt)
          });
        break;

      case 'sections_reorder':
        // Restore previous section positions
        if (!previousState || !previousState.sections) {
          return NextResponse.json({ 
            error: 'No previous sections state available for reordering',
            code: "NO_PREVIOUS_STATE" 
          }, { status: 400 });
        }

        for (const sectionData of previousState.sections) {
          await db.update(homepageSections)
            .set({ 
              position: sectionData.position,
              updatedAt: new Date()
            })
            .where(eq(homepageSections.id, sectionData.id));
        }
        break;

      case 'items_reorder':
        // Restore previous item positions
        if (!previousState || !previousState.items) {
          return NextResponse.json({ 
            error: 'No previous items state available for reordering',
            code: "NO_PREVIOUS_STATE" 
          }, { status: 400 });
        }

        for (const itemData of previousState.items) {
          await db.update(sectionItems)
            .set({ position: itemData.position })
            .where(eq(sectionItems.id, itemData.id));
        }
        break;

      default:
        return NextResponse.json({ 
          error: `Unsupported action type: ${revisionData.actionType}`,
          code: "UNSUPPORTED_ACTION" 
        }, { status: 400 });
    }

    // Mark revision as undone
    const undoneRevision = await db.update(editorRevisions)
      .set({ isUndone: true })
      .where(eq(editorRevisions.id, revisionId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Revision undone successfully',
      revision: undoneRevision[0],
      actionType: revisionData.actionType,
      entityType: revisionData.entityType,
      entityId: revisionData.entityId
    }, { status: 200 });

  } catch (error) {
    console.error('Undo revision error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}
