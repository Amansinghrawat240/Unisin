import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

function getAdminEmails(): string[] {
  const adminEmails: string[] = [];
  
  const envAdminEmails = process.env.ADMIN_EMAILS || '';
  if (envAdminEmails) {
    adminEmails.push(...envAdminEmails.split(',').map(email => email.trim().toLowerCase()));
  }
  
  const envAdminAdmins = process.env.ADMIN_ADMINS || '';
  if (envAdminAdmins) {
    const adminPairs = envAdminAdmins.split(',');
    for (const pair of adminPairs) {
      const [email] = pair.split(':');
      if (email) {
        adminEmails.push(email.trim().toLowerCase());
      }
    }
  }
  
  return [...new Set(adminEmails)];
}

function authenticateAdmin(request: NextRequest): { isAuthenticated: boolean; isAdmin: boolean; userEmail: string | null } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuthenticated: false, isAdmin: false, userEmail: null };
  }

  const token = authHeader.substring(7);
  if (!token) {
    return { isAuthenticated: false, isAdmin: false, userEmail: null };
  }

  const userEmail = request.headers.get('x-test-user-email');
  if (!userEmail) {
    return { isAuthenticated: true, isAdmin: false, userEmail: null };
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(userEmail.toLowerCase());

  return { isAuthenticated: true, isAdmin, userEmail };
}

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAdmin(request);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if (!auth.isAdmin) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const settings = await db.select()
      .from(adminSettings)
      .orderBy(desc(adminSettings.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db.select()
      .from(adminSettings);

    return NextResponse.json({
      settings,
      pagination: {
        limit,
        offset,
        total: totalCount.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAdmin(request);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if (!auth.isAdmin) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { settingKey, settingValue } = body;

    if ('id' in body || 'createdAt' in body || 'updatedAt' in body) {
      return NextResponse.json({ 
        error: 'System fields (id, createdAt, updatedAt) cannot be provided in request body',
        code: 'SYSTEM_FIELDS_NOT_ALLOWED' 
      }, { status: 400 });
    }

    if (!settingKey || typeof settingKey !== 'string' || settingKey.trim() === '') {
      return NextResponse.json({ 
        error: 'settingKey is required and must be a non-empty string',
        code: 'MISSING_SETTING_KEY' 
      }, { status: 400 });
    }

    if (!settingValue || typeof settingValue !== 'string' || settingValue.trim() === '') {
      return NextResponse.json({ 
        error: 'settingValue is required and must be a non-empty string',
        code: 'MISSING_SETTING_VALUE' 
      }, { status: 400 });
    }

    const trimmedKey = settingKey.trim();
    const trimmedValue = settingValue.trim();

    const existingSetting = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, trimmedKey))
      .limit(1);

    if (existingSetting.length > 0) {
      const updated = await db.update(adminSettings)
        .set({
          settingValue: trimmedValue,
          updatedAt: new Date()
        })
        .where(eq(adminSettings.settingKey, trimmedKey))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      const created = await db.insert(adminSettings)
        .values({
          settingKey: trimmedKey,
          settingValue: trimmedValue,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return NextResponse.json(created[0], { status: 201 });
    }

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}