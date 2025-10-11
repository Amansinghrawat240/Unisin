import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSections, editorRevisions } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_AUTH' 
      }, { status: 401 });
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

    // Parse request body
    const body = await request.json();
    const { sections } = body;

    // Validation
    if (!sections) {
      return NextResponse.json({ 
        error: 'Sections array is required',
        code: 'MISSING_SECTIONS' 
      }, { status: 400 });
    }

    if (!Array.isArray(sections)) {
      return NextResponse.json({ 
        error: 'Sections must be an array',
        code: 'INVALID_SECTIONS_FORMAT' 
      }, { status: 400 });
    }

    if (sections.length === 0) {
      return NextResponse.json({ 
        error: 'At least one section is required',
        code: 'EMPTY_SECTIONS_ARRAY' 
      }, { status: 400 });
    }

    // Validate section structure and collect IDs/positions
    const sectionIds = [];
    const positions = [];
    
    for (const section of sections) {
      if (!section.id || !Number.isInteger(section.id) || section.id <= 0) {
        return NextResponse.json({ 
          error: 'All sections must have valid integer IDs',
          code: 'INVALID_SECTION_ID' 
        }, { status: 400 });
      }
      
      if (!Number.isInteger(section.position) || section.position < 0) {
        return NextResponse.json({ 
          error: 'All sections must have valid integer positions',
          code: 'INVALID_POSITION' 
        }, { status: 400 });
      }
      
      sectionIds.push(section.id);
      positions.push(section.position);
    }

    // Check for duplicate IDs
    const uniqueIds = [...new Set(sectionIds)];
    if (uniqueIds.length !== sectionIds.length) {
      return NextResponse.json({ 
        error: 'Duplicate section IDs are not allowed',
        code: 'DUPLICATE_SECTION_IDS' 
      }, { status: 400 });
    }

    // Check for duplicate positions
    const uniquePositions = [...new Set(positions)];
    if (uniquePositions.length !== positions.length) {
      return NextResponse.json({ 
        error: 'Duplicate positions are not allowed',
        code: 'DUPLICATE_POSITIONS' 
      }, { status: 400 });
    }

    // Verify all section IDs exist
    const existingSections = await db.select({
      id: homepageSections.id,
      position: homepageSections.position
    })
    .from(homepageSections)
    .where(inArray(homepageSections.id, sectionIds));

    if (existingSections.length !== sectionIds.length) {
      const existingIds = existingSections.map(s => s.id);
      const missingIds = sectionIds.filter(id => !existingIds.includes(id));
      return NextResponse.json({ 
        error: `Section(s) not found: ${missingIds.join(', ')}`,
        code: 'SECTIONS_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare previous state for revision tracking
    const previousState = {};
    const newState = {};
    
    existingSections.forEach(section => {
      previousState[section.id] = section.position;
    });
    
    sections.forEach(section => {
      newState[section.id] = section.position;
    });

    // Perform bulk update
    const updatedSections = [];
    const currentTime = new Date();

    for (const section of sections) {
      const updated = await db.update(homepageSections)
        .set({
          position: section.position,
          updatedAt: currentTime
        })
        .where(eq(homepageSections.id, section.id))
        .returning();
      
      if (updated.length > 0) {
        updatedSections.push(updated[0]);
      }
    }

    // Create revision record for the bulk reorder operation
    await db.insert(editorRevisions).values({
      editorId: user.id,
      actionType: 'sections_reorder',
      entityType: 'section',
      entityId: 0,
      previousState: JSON.stringify(previousState),
      newState: JSON.stringify(newState),
      isUndone: false,
      createdAt: currentTime
    });

    // Sort updated sections by new position order
    updatedSections.sort((a, b) => a.position - b.position);

    return NextResponse.json(updatedSections, { status: 200 });

  } catch (error) {
    console.error('POST sections reorder error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}