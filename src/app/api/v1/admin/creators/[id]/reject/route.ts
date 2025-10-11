import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { creators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Extract and validate bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_AUTH_HEADER' 
      }, { status: 401 });
    }

    // Get admin email from header
    const adminEmail = request.headers.get('x-test-user-email');
    if (!adminEmail) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_USER_EMAIL' 
      }, { status: 401 });
    }

    // Parse admin emails from environment variables
    const adminEmails = new Set<string>();
    
    // Parse ADMIN_EMAILS (comma-separated email list)
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    if (adminEmailsEnv) {
      adminEmailsEnv.split(',').forEach(email => {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail) {
          adminEmails.add(trimmedEmail);
        }
      });
    }

    // Parse ADMIN_ADMINS (comma-separated email:password pairs, extract emails only)
    const adminAdminsEnv = process.env.ADMIN_ADMINS;
    if (adminAdminsEnv) {
      adminAdminsEnv.split(',').forEach(pair => {
        const emailPart = pair.split(':')[0];
        if (emailPart) {
          const trimmedEmail = emailPart.trim().toLowerCase();
          if (trimmedEmail) {
            adminEmails.add(trimmedEmail);
          }
        }
      });
    }

    // Check if user email is in admin list
    const userEmailLower = adminEmail.toLowerCase();
    if (!adminEmails.has(userEmailLower)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    // Validate ID parameter
    const creatorId = parseInt(id);
    if (!id || isNaN(creatorId)) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Parse and validate request body
    const requestBody = await request.json();
    const { reason } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate reason field
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return NextResponse.json({ 
        error: "Reason is required and must be a non-empty string",
        code: "MISSING_REASON" 
      }, { status: 400 });
    }

    // Find creator by ID
    const existingCreator = await db.select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (existingCreator.length === 0) {
      return NextResponse.json({ 
        error: 'Creator not found',
        code: 'CREATOR_NOT_FOUND' 
      }, { status: 404 });
    }

    const creator = existingCreator[0];

    // Validate current status is 'pending'
    if (creator.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Creator status must be pending to reject application',
        code: 'INVALID_STATUS' 
      }, { status: 409 });
    }

    // Update creator record
    const updated = await db.update(creators)
      .set({
        status: 'suspended',
        notes: reason.trim(),
        updatedAt: new Date()
      })
      .where(eq(creators.id, creatorId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update creator',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    const updatedCreator = updated[0];

    // Return success response
    return NextResponse.json({
      id: updatedCreator.id,
      status: updatedCreator.status,
      notes: updatedCreator.notes
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
