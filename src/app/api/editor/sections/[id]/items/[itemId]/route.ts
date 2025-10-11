import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sectionItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const sectionId = parseInt(id);
    const itemIdNum = parseInt(itemId);
    
    if (isNaN(sectionId) || isNaN(itemIdNum)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    const body = await request.json();
    const { customDescription, customCoverUrl } = body;

    // Update the section item with custom fields
    await db.update(sectionItems)
      .set({
        customDescription: customDescription || null,
        customCoverUrl: customCoverUrl || null,
      })
      .where(eq(sectionItems.id, itemIdNum));

    return NextResponse.json({ 
      success: true,
      message: 'Item updated successfully' 
    });

  } catch (error) {
    console.error('PATCH section item error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const sectionId = parseInt(id);
    const itemIdNum = parseInt(itemId);
    
    if (isNaN(sectionId) || isNaN(itemIdNum)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Delete the section item
    await db.delete(sectionItems)
      .where(eq(sectionItems.id, itemIdNum));

    return NextResponse.json({ 
      success: true,
      message: 'Item removed successfully' 
    });

  } catch (error) {
    console.error('DELETE section item error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}