import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists, playlistTracks, user as users } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// Verify admin token - matches the format from /api/admin/login
function verifyAdminToken(token: string) {
  try {
    const secret = process.env.ADMIN_SECRET || "dev-secret";
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expSig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expSig))) return null;
    const json = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    // Check expiry
    if (json?.exp && Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

// Verify regular user JWT token - matches the format from /api/auth/file/login
function verifyUserToken(token: string) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    // Verify signature
    const secret = process.env.JWT_SECRET || 'unisin-secret-key-2024';
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) return null;

    return payload;
  } catch {
    return null;
  }
}

// Support both session and bearer token auth
async function getAuthenticatedUser(request: NextRequest) {
  console.log('[AUTH] Starting authentication check');
  
  // Try better-auth session first
  try {
    const sessionUser = await getCurrentUser(request);
    if (sessionUser) {
      console.log('[AUTH] Session auth successful:', sessionUser.id);
      return sessionUser;
    }
    console.log('[AUTH] No session user found');
  } catch (error) {
    console.log('[AUTH] Session check error:', error);
  }
  
  // Fallback to bearer token
  const authHeader = request.headers.get('Authorization');
  console.log('[AUTH] Authorization header:', authHeader ? 'present' : 'missing');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('[AUTH] Bearer token found, length:', token.length);
    
    // Try admin token first (2-part format)
    const adminDecoded = verifyAdminToken(token);
    if (adminDecoded?.email) {
      console.log('[AUTH] Admin token verified successfully, email:', adminDecoded.email);
      return { email: adminDecoded.email, id: adminDecoded.userId || adminDecoded.email };
    }
    
    // Try user token (3-part JWT format)
    const userDecoded = verifyUserToken(token);
    if (userDecoded?.userId) {
      console.log('[AUTH] User token verified successfully, userId:', userDecoded.userId);
      return { email: userDecoded.email, id: userDecoded.userId, username: userDecoded.username };
    }
    
    console.log('[AUTH] Token verification failed');
  }
  
  console.log('[AUTH] Authentication failed - no valid session or token');
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = db.select({
      id: playlists.id,
      ownerId: playlists.ownerId,
      title: playlists.title,
      description: playlists.description,
      coverUrl: playlists.coverUrl,
      isPublic: playlists.isPublic,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
      trackCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${playlistTracks} 
        WHERE ${playlistTracks.playlistId} = ${playlists.id}
      )`.as('track_count'),
    }).from(playlists);
    
    let conditions = [] as any[];

    // If userId is provided, check if user is authenticated and if it matches their own ID
    if (userId) {
      const user = await getAuthenticatedUser(request);
      if (user && user.id === userId) {
        // Return user's own playlists (both public and private)
        conditions.push(eq(playlists.ownerId, userId));
      } else {
        // Return only public playlists for that user
        conditions.push(and(eq(playlists.ownerId, userId), eq(playlists.isPublic, true)));
      }
    } else {
      // Return only public playlists
      conditions.push(eq(playlists.isPublic, true));
    }

    // Add search condition if provided
    if (search) {
      const searchCondition = or(
        like(playlists.title, `%${search}%`),
        like(playlists.description, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      // @ts-expect-error drizzle types for variadic and(...conditions)
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(playlists.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if user ID fields provided in body
    if ('ownerId' in requestBody || 'owner_id' in requestBody || 'userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { title, description, coverUrl, isPublic } = requestBody;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: "Title is required and must be a non-empty string",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Check for system user header (for editor panel playlists)
    const systemUserHeader = request.headers.get('x-system-user');
    const userId = systemUserHeader || String(user.id);

    // Ensure owner user exists; if missing, create a minimal stub user so FK passes
    const ownerExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (ownerExists.length === 0) {
      const now = new Date();
      await db.insert(users).values({
        id: userId,
        name: 'User',
        email: `${userId}@local`,
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    // Insert playlist using Drizzle's insert method
    const now = new Date();
    const insertData = {
      ownerId: userId,
      title: title.trim(),
      description: description ? String(description).trim() : null,
      coverUrl: coverUrl ? String(coverUrl) : null,
      isPublic: isPublic === true,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(playlists).values(insertData);

    // Fetch the created playlist
    const created = await db
      .select()
      .from(playlists)
      .where(and(
        eq(playlists.ownerId, insertData.ownerId),
        eq(playlists.title, insertData.title)
      ))
      .orderBy(desc(playlists.createdAt))
      .limit(1);

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}