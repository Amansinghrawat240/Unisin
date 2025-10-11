import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSections } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    // Validate required field
    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    const now = new Date();
    console.log('Attempting to insert into homepage_sections with data:', {
      title,
      type: "playlist_carousel",
      position: 1,
      isVisible: true,
      createdBy: null,
      createdAt: now,
      updatedAt: now
    });

    // Insert with minimal required fields - deliberately NOT specifying id
    const newSection = await db.insert(homepageSections)
      .values({
        title: title.trim(),
        type: "playlist_carousel",
        position: 1,
        isVisible: true,
        createdBy: null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    console.log('Successfully inserted homepage section:', newSection[0]);

    return NextResponse.json({
      success: true,
      message: "Homepage section created successfully with auto-increment ID",
      data: newSection[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST homepage_sections test error:', error);
    console.error('Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      cause: (error as any)?.cause
    });

    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      details: {
        name: (error as any)?.name,
        message: (error as any)?.message
      }
    }, { status: 500 });
  }
}
