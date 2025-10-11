import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure slug uniqueness
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db.select()
      .from(artists)
      .where(eq(artists.slug, slug))
      .limit(1);
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { artistNames } = await request.json();

    // Input validation
    if (!artistNames || !Array.isArray(artistNames)) {
      return NextResponse.json({ 
        error: "artistNames must be an array",
        code: "INVALID_INPUT" 
      }, { status: 400 });
    }

    if (artistNames.length === 0) {
      return NextResponse.json({ 
        error: "At least one artist name is required",
        code: "EMPTY_ARRAY" 
      }, { status: 400 });
    }

    const results = [];
    let createdCount = 0;
    let existingCount = 0;

    for (const rawName of artistNames) {
      // Validate and sanitize individual name
      if (typeof rawName !== 'string') {
        return NextResponse.json({ 
          error: "All artist names must be strings",
          code: "INVALID_NAME_TYPE" 
        }, { status: 400 });
      }

      const name = rawName.trim();
      
      if (!name) {
        return NextResponse.json({ 
          error: "Artist names cannot be empty",
          code: "EMPTY_NAME" 
        }, { status: 400 });
      }

      // Check if artist already exists (case-insensitive)
      const existingArtist = await db.select()
        .from(artists)
        .where(sql`lower(${artists.name}) = lower(${name})`)
        .limit(1);

      if (existingArtist.length > 0) {
        // Artist already exists
        results.push({
          name: existingArtist[0].name,
          id: existingArtist[0].id,
          created: false
        });
        existingCount++;
      } else {
        // Create new artist
        const baseSlug = generateSlug(name);
        const uniqueSlug = await ensureUniqueSlug(baseSlug);
        
        const newArtist = await db.insert(artists)
          .values({
            name: name,
            slug: uniqueSlug,
            bio: null,
            imageUrl: null,
            bannerUrl: null,
            popularity: 0,
            userId: null,
            isVerified: false,
            monthlyListeners: 0,
            createdAt: new Date()
          })
          .returning();

        results.push({
          name: newArtist[0].name,
          id: newArtist[0].id,
          created: true
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      results: results,
      summary: {
        total: results.length,
        created: createdCount,
        existing: existingCount
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/artists/auto-create error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}