import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { creators, user as usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { promises as fs } from 'fs';
import path from 'path';
import { auth } from '@/lib/auth';

// Read admin settings to determine if creator applications should be auto-approved
const DATA_DIR = path.join(process.cwd(), '.data');
const SETTINGS_PATH = path.join(DATA_DIR, 'admin-settings.json');
async function readAdminSettings(): Promise<{ autoApproveCreators?: boolean }> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { autoApproveCreators: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use Better-Auth for authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const user = session.user;

    // Parse request body
    const requestBody = await request.json();
    const { displayName, bio, email, country, termsAccepted } = requestBody;

    // Validate required fields
    if (!displayName || typeof displayName !== 'string' || displayName.trim() === '') {
      return NextResponse.json({ 
        error: "Display name is required",
        code: "DISPLAY_NAME_REQUIRED" 
      }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ 
        error: "Email is required",
        code: "EMAIL_REQUIRED" 
      }, { status: 400 });
    }

    if (!country || typeof country !== 'string' || country.trim() === '') {
      return NextResponse.json({ 
        error: "Country is required",
        code: "COUNTRY_REQUIRED" 
      }, { status: 400 });
    }

    if (termsAccepted !== true) {
      return NextResponse.json({ 
        error: "Terms must be accepted",
        code: "TERMS_NOT_ACCEPTED" 
      }, { status: 400 });
    }

    const now = new Date();
    const emailLower = email.toLowerCase().trim();

    // Check if user already has a creator record
    const existingCreator = await db.select()
      .from(creators)
      .where(eq(creators.userId, user.id))
      .limit(1);

    if (existingCreator.length > 0) {
      const creator = existingCreator[0];
      
      if (creator.status === 'suspended') {
        return NextResponse.json({ 
          error: "Creator account is suspended and cannot reapply",
          code: "CREATOR_SUSPENDED" 
        }, { status: 403 });
      }

      if (creator.status === 'pending' || creator.status === 'approved') {
        return NextResponse.json({ 
          error: `Creator application already exists with status: ${creator.status}`,
          code: "CREATOR_APPLICATION_EXISTS",
          currentStatus: creator.status
        }, { status: 409 });
      }
    }

    // Determine status based on admin setting
    const settings = await readAdminSettings();
    const nextStatus: 'pending' | 'approved' = settings.autoApproveCreators ? 'approved' : 'pending';

    // Create new creator record
    const currentTimestamp = now;
    
    await db.insert(creators)
      .values({
        userId: user.id,
        displayName: displayName.trim(),
        bio: bio ? bio.trim() : null,
        email: emailLower,
        country: country.trim(),
        status: nextStatus,
        termsAcceptedAt: currentTimestamp,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      });

    return NextResponse.json({ status: nextStatus }, { status: 201 });

  } catch (error) {
    console.error('POST /api/v1/me/creator/apply error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + String(error),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}