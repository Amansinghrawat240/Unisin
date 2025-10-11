import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sectionItems, homepageSections, editorRevisions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Admin authorization check
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const adminAdmins = process.env.ADMIN_ADMINS?.split(',').map(email => email.trim()) || [];
    const allAdminEmails = [...adminEmails, ...adminAdmins];

    if (!allAdminEmails.includes(user.email)) {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Validate section ID
    const { id } = await params;
    const sectionId = parseInt(id);
    if (!sectionId || isNaN(sectionId)) {
      return NextResponse.json({ 
        error: 'Valid section ID is required',
        code: 'INVALID_SECTION_ID' 
      }, { status: 400 });
    }

    // Check if section exists
    const section = await db.select()
      .from(homepageSections)
      .where(eq(homepageSections.id, sectionId))
      .limit(1);

    if (section.length === 0) {
      return NextResponse.json({ 
        error: 'Section not found',
        code: 'SECTION_NOT_FOUND' 
      }, { status: 404 });
    }

    // Parse request body
    const { items } = await request.json();

    // Validate items array
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ 
        error: 'Items array is required',
        code: 'MISSING_ITEMS_ARRAY' 
      }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ 
        error: 'Items array cannot be empty',
        code: 'EMPTY_ITEMS_ARRAY' 
      }, { status: 400 });
    }

    // Validate item structure
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.id || !Number.isInteger(item.id)) {
        return NextResponse.json({ 
          error: `Item at index ${i} must have a valid integer ID`,
          code: 'INVALID_ITEM_ID' 
        }, { status: 400 });
      }

      if (!Number.isInteger(item.position)) {
        return NextResponse.json({ 
          error: `Item at index ${i} must have a valid integer position`,
          code: 'INVALID_ITEM_POSITION' 
        }, { status: 400 });
      }
    }

    // Check for duplicate IDs
    const itemIds = items.map(item => item.id);
    const uniqueIds = [...new Set(itemIds)];
    if (itemIds.length !== uniqueIds.length) {
      return NextResponse.json({ 
        error: 'Duplicate item IDs are not allowed',
        code: 'DUPLICATE_ITEM_IDS' 
      }, { status: 400 });
    }

    // Check for duplicate positions
    const positions = items.map(item => item.position);
    const uniquePositions = [...new Set(positions)];
    if (positions.length !== uniquePositions.length) {
      return NextResponse.json({ 
        error: 'Duplicate positions are not allowed',
        code: 'DUPLICATE_POSITIONS' 
      }, { status: 400 });
    }

    // Verify all items exist and belong to the section
    const existingItems = await db.select()
      .from(sectionItems)
      .where(and(
        eq(sectionItems.sectionId, sectionId),
        inArray(sectionItems.id, itemIds)
      ));

    if (existingItems.length !== itemIds.length) {
      const foundIds = existingItems.map(item => item.id);
      const missingIds = itemIds.filter(id => !foundIds.includes(id));
      return NextResponse.json({ 
        error: `Items not found or don't belong to this section: ${missingIds.join(', ')}`,
        code: 'INVALID_ITEMS' 
      }, { status: 404 });
    }

    // Get current state for revision tracking
    const currentItems = await db.select()
      .from(sectionItems)
      .where(eq(sectionItems.sectionId, sectionId))
      .orderBy(sectionItems.position);

    const previousState = currentItems.map(item => ({
      id: item.id,
      position: item.position
    }));

    // Update positions in bulk using a transaction-like approach
    const updatePromises = items.map(item => 
      db.update(sectionItems)
        .set({
          position: item.position
        })
        .where(and(
          eq(sectionItems.id, item.id),
          eq(sectionItems.sectionId, sectionId)
        ))
        .returning()
    );

    const updateResults = await Promise.all(updatePromises);
    const updatedItems = updateResults.flat();

    if (updatedItems.length !== items.length) {
      return NextResponse.json({ 
        error: 'Failed to update all items',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    // Create revision record
    const newState = items.map(item => ({
      id: item.id,
      position: item.position
    }));

    await db.insert(editorRevisions).values({
      editorId: user.id,
      actionType: 'items_reorder',
      entityType: 'section_items',
      entityId: sectionId,
      previousState: JSON.stringify(previousState),
      newState: JSON.stringify(newState),
      createdAt: new Date()
    });

    // Get the final ordered items to return
    const finalItems = await db.select()
      .from(sectionItems)
      .where(eq(sectionItems.sectionId, sectionId))
      .orderBy(sectionItems.position);

    return NextResponse.json(finalItems, { status: 200 });

  } catch (error) {
    console.error('POST /api/editor/sections/[id]/items/reorder error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
