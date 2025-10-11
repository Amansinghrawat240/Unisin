import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq, like, and, or, desc, asc, ne } from 'drizzle-orm';
import crypto from 'crypto';

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db.select({ id: artists.id })
      .from(artists)
      .where(excludeId ? 
        and(eq(artists.slug, slug), ne(artists.id, excludeId)) :
        eq(artists.slug, slug)
      )
      .limit(1);
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Admin/Editor authorization check
function verifyAdminToken(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  const [data, sig] = token.split('.') as [string, string];
  if (!data || !sig) return null;
  const secret = process.env.ADMIN_SECRET || 'dev-secret';
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload || (payload.role !== 'admin' && payload.role !== 'editor')) return null;
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const sortParam = searchParams.get('sort') || 'popularity';
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      const artistId = parseInt(id);
      if (isNaN(artistId)) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(artists)
        .where(eq(artists.id, artistId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // List with pagination and search
    const limit = Math.min(parseInt(limitParam || '20'), 100);
    const offset = parseInt(offsetParam || '0');

    const baseQuery = db.select({
      id: artists.id,
      name: artists.name,
      slug: artists.slug,
      bio: artists.bio,
      imageUrl: artists.imageUrl,
      bannerUrl: artists.bannerUrl,
      popularity: artists.popularity,
      userId: artists.userId,
      isVerified: artists.isVerified,
      monthlyListeners: artists.monthlyListeners,
      createdAt: artists.createdAt
    }).from(artists);

    // Apply search filter if query provided
    const filteredQuery = query 
      ? baseQuery.where(like(artists.name, `%${query}%`))
      : baseQuery;

    // Apply sorting
    let orderColumn;
    switch (sortParam) {
      case 'monthlyListeners':
        orderColumn = desc(artists.monthlyListeners);
        break;
      case 'name':
        orderColumn = asc(artists.name);
        break;
      case 'popularity':
      default:
        orderColumn = desc(artists.popularity);
        break;
    }
    
    const dbQuery = filteredQuery.orderBy(orderColumn);

    const results = await dbQuery.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin/editor authorization
    const admin = verifyAdminToken(request.headers.get('authorization'));
    if (!admin) {
      return NextResponse.json({ 
        error: 'Admin or editor authorization required', 
        code: 'NOT_AUTHORIZED' 
      }, { status: 403 });
    }

    const requestBody = await request.json();
    const { name, bio, imageUrl, bannerUrl, isVerified, userId } = requestBody;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    // Sanitize inputs
    const sanitizedData = {
      name: name.trim(),
      slug: uniqueSlug,
      bio: bio ? bio.trim() : null,
      imageUrl: imageUrl ? imageUrl.trim() : null,
      bannerUrl: bannerUrl ? bannerUrl.trim() : null,
      popularity: 0, // Default for new artists
      userId: userId ? userId.trim() : null,
      isVerified: isVerified !== undefined ? Boolean(isVerified) : false,
      monthlyListeners: 0, // Default for new artists
      createdAt: new Date()
    };

    const newArtist = await db.insert(artists)
      .values(sanitizedData)
      .returning();

    return NextResponse.json(newArtist[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);
    const requestBody = await request.json();
    const { name, bio, imageUrl, bannerUrl, popularity, isVerified, userId } = requestBody;

    // Check if record exists
    const existingRecord = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
      // If name changes, regenerate slug
      const baseSlug = generateSlug(name.trim());
      updateData.slug = await ensureUniqueSlug(baseSlug, artistId);
    }
    if (bio !== undefined) updateData.bio = bio ? bio.trim() : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl ? bannerUrl.trim() : null;
    if (popularity !== undefined) updateData.popularity = parseInt(popularity);
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);
    if (userId !== undefined) updateData.userId = userId ? userId.trim() : null;

    // Validate required fields if being updated
    if (updateData.name !== undefined && !updateData.name) {
      return NextResponse.json({ 
        error: "Name cannot be empty",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    const updated = await db.update(artists)
      .set(updateData)
      .where(eq(artists.id, artistId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const artistId = parseInt(id);

    // Check if record exists
    const existingRecord = await db.select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const deleted = await db.delete(artists)
      .where(eq(artists.id, artistId))
      .returning();

    return NextResponse.json({
      message: 'Artist deleted successfully',
      deletedArtist: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
