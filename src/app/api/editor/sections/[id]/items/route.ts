import { db } from "@/db";
import { sectionItems, homepageSections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// GET /api/editor/sections/[id]/items - Get all items in a section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sectionId = parseInt(id);

    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // Get all items for this section
    const items = await db
      .select()
      .from(sectionItems)
      .where(eq(sectionItems.sectionId, sectionId))
      .orderBy(sectionItems.position);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching section items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/editor/sections/[id]/items - Add a new item to a section
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sectionId = parseInt(id);

    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { trackId, albumId, artistId, playlistId } = body;

    // Determine itemType and itemId based on what was provided
    let itemType: string;
    let itemId: number;

    if (trackId) {
      itemType = "track";
      itemId = trackId;
    } else if (albumId) {
      itemType = "album";
      itemId = albumId;
    } else if (artistId) {
      itemType = "artist";
      itemId = artistId;
    } else if (playlistId) {
      itemType = "playlist";
      itemId = playlistId;
    } else {
      return NextResponse.json(
        { error: "Must provide trackId, albumId, artistId, or playlistId" },
        { status: 400 }
      );
    }

    // Verify section exists
    const section = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.id, sectionId))
      .limit(1);

    if (section.length === 0) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Get the current max position
    const maxPositionResult = await db
      .select({ maxPosition: sectionItems.position })
      .from(sectionItems)
      .where(eq(sectionItems.sectionId, sectionId))
      .orderBy(sectionItems.position)
      .limit(1);

    const nextPosition = maxPositionResult.length > 0 ? (maxPositionResult[0].maxPosition || 0) + 1 : 0;

    // Insert the new item
    const [newItem] = await db
      .insert(sectionItems)
      .values({
        sectionId,
        itemType,
        itemId,
        position: nextPosition,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating section item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
