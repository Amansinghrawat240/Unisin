import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { creators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Authentication - Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    // Get admin email from header
    const userEmail = request.headers.get('x-test-user-email');
    if (!userEmail) {
      return NextResponse.json({ 
        error: 'Admin email header required',
        code: 'ADMIN_EMAIL_REQUIRED' 
      }, { status: 401 });
    }

    // Parse admin emails from environment variables
    const adminEmails = new Set<string>();
    
    // Parse ADMIN_EMAILS (comma-separated emails)
    const adminEmailsList = process.env.ADMIN_EMAILS;
    if (adminEmailsList) {
      adminEmailsList.split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email)
        .forEach(email => adminEmails.add(email));
    }
    
    // Parse ADMIN_ADMINS (email:password pairs, extract emails only)
    const adminAdminsList = process.env.ADMIN_ADMINS;
    if (adminAdminsList) {
      adminAdminsList.split(',')
        .map(pair => pair.trim().split(':')[0].toLowerCase())
        .filter(email => email)
        .forEach(email => adminEmails.add(email));
    }

    // Check if user email is in admin list
    if (!adminEmails.has(userEmail.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Validate ID parameter
    const creatorId = parseInt(id);
    if (isNaN(creatorId)) {
      return NextResponse.json({ 
        error: 'Valid creator ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Parse request body
    const requestBody = await request.json();
    const { notes } = requestBody;

    // Security check: reject if userId or other user identifier fields in request body
    if ('userId' in requestBody || 'user_id' in requestBody || 'creatorId' in requestBody || 'creator_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
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
        error: 'Creator status must be pending to approve',
        code: 'INVALID_STATUS' 
      }, { status: 409 });
    }

    // Update creator record
    const updatedCreator = await db.update(creators)
      .set({
        status: 'approved',
        notes: notes || null,
        updatedAt: new Date()
      })
      .where(eq(creators.id, creatorId))
      .returning();

    if (updatedCreator.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update creator',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    const updated = updatedCreator[0];

    // Return success response
    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      notes: updated.notes
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
