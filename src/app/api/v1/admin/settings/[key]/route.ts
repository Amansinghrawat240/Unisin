import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

function getAdminEmails(): string[] {
  const adminEmails: string[] = [];
  
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (adminEmailsEnv) {
    adminEmails.push(...adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()));
  }
  
  const adminAdminsEnv = process.env.ADMIN_ADMINS;
  if (adminAdminsEnv) {
    const pairs = adminAdminsEnv.split(',');
    for (const pair of pairs) {
      const [email] = pair.split(':');
      if (email) {
        adminEmails.push(email.trim().toLowerCase());
      }
    }
  }
  
  return [...new Set(adminEmails)];
}

function authenticateAdmin(request: NextRequest): { isAuthenticated: boolean; isAdmin: boolean; userEmail?: string } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuthenticated: false, isAdmin: false };
  }

  const userEmail = request.headers.get('x-test-user-email');
  if (!userEmail) {
    return { isAuthenticated: false, isAdmin: false };
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(userEmail.toLowerCase());

  return { isAuthenticated: true, isAdmin, userEmail };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const auth = authenticateAdmin(request);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required', code: 'INVALID_KEY' },
        { status: 400 }
      );
    }

    const settings = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .limit(1);

    if (settings.length === 0) {
      return NextResponse.json(
        { error: 'Setting not found', code: 'SETTING_NOT_FOUND' },
        { status: 404 }
      );
    }

    const setting = settings[0];

    return NextResponse.json({
      id: setting.id,
      settingKey: setting.settingKey,
      settingValue: setting.settingValue,
      createdAt: setting.createdAt?.toISOString(),
      updatedAt: setting.updatedAt?.toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const auth = authenticateAdmin(request);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required', code: 'INVALID_KEY' },
        { status: 400 }
      );
    }

    const existingSettings = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .limit(1);

    if (existingSettings.length === 0) {
      return NextResponse.json(
        { error: 'Setting not found', code: 'SETTING_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete setting', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    const deletedSetting = deleted[0];

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully',
      deletedSetting: {
        id: deletedSetting.id,
        settingKey: deletedSetting.settingKey,
        settingValue: deletedSetting.settingValue
      }
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}