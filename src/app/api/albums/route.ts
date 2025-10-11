import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { albums, artists } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Filter parameters
    const query = searchParams.get('query');
    const artistId = searchParams.get('artistId');
    
    // Build the base query with join to get artist name
    const baseQuery = db.select({
      id: albums.id,
      artistId: albums.artistId,
      title: albums.title,
      releaseDate: albums.releaseDate,
      coverUrl: albums.coverUrl,
      popularity: albums.popularity,
      createdAt: albums.createdAt,
      artistName: artists.name,
    })
    .from(albums)
    .leftJoin(artists, eq(albums.artistId, artists.id));
    
    // Apply filters
    const conditions = [];
    
    if (query) {
      conditions.push(like(albums.title, `%${query}%`));
    }
    
    if (artistId) {
      const parsedArtistId = parseInt(artistId);
      if (!isNaN(parsedArtistId)) {
        conditions.push(eq(albums.artistId, parsedArtistId));
      }
    }
    
    // Apply where clause conditionally
    const dbQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;
    
    // Apply ordering, pagination and execute
    const results = await dbQuery
      .orderBy(desc(albums.popularity))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
