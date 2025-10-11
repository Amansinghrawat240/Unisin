import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user as usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}

async function ensureUserExists(userId: string, email?: string | null, name?: string | null) {
  try {
    // Try to find user by ID first
    let existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      return existingUser[0];
    }

    // If not found by ID but we have email, try to find by email
    if (email) {
      const userByEmail = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (userByEmail.length > 0) {
        // Reuse existing user record
        return userByEmail[0];
      }
    }

    // Create new user record
    const now = new Date();
    const newUser = await db.insert(usersTable)
      .values({
        id: userId,
        name: name || 'Anonymous User',
        email: email || `${userId}@placeholder.com`,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return newUser[0];
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await ensureUserExists(authUser.id, authUser.email, authUser.name);

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || null
    };

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('GET profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Validate name field
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ 
        error: "Name is required and must be a string",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json({ 
        error: "Name must be between 2 and 50 characters",
        code: "INVALID_NAME_LENGTH" 
      }, { status: 400 });
    }

    if (!/^[A-Za-z0-9._'\- ]+$/.test(trimmedName)) {
      return NextResponse.json({ 
        error: "Name contains invalid characters. Only letters, numbers, spaces, underscore, dot, hyphen, and apostrophe are allowed",
        code: "INVALID_NAME_FORMAT" 
      }, { status: 400 });
    }

    // Ensure user exists
    const user = await ensureUserExists(authUser.id, authUser.email, authUser.name);

    // Update user record
    const updated = await db.update(usersTable)
      .set({
        name: trimmedName,
        updatedAt: new Date()
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = {
      id: updated[0].id,
      name: updated[0].name,
      email: updated[0].email
    };

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('PATCH profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}