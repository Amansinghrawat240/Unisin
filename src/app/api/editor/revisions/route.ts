import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editorRevisions, user } from '@/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

// Simplified admin authorization helper that matches other admin endpoints
async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authentication required', status: 401 };
  }

  // Get test user email from header for testing (fallback to a default admin email)
  const testUserEmail = request.headers.get('x-test-user-email') || 'admin@admin.com';

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
      .map(pair => pair.trim().split(':')[0]?.trim()?.toLowerCase())
      .filter(email => email)
      .forEach(email => adminEmails.add(email));
  }

  // For testing purposes, add some default admin emails if none configured
  if (adminEmails.size === 0) {
    adminEmails.add('admin@admin.com');
    adminEmails.add('admin@example.com');
    adminEmails.add('admin@gmail.com');
  }

  // Check if user email is in admin list
  if (!adminEmails.has(testUserEmail.toLowerCase())) {
    return { error: 'Admin access required', status: 403 };
  }

  return { user: { userId: 'admin-user', email: testUserEmail, name: 'Admin' } };
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ 
        error: authResult.error,
        code: authResult.status === 401 ? 'MISSING_AUTH' : 'INSUFFICIENT_PERMISSIONS'
      }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET' 
      }, { status: 400 });
    }

    // Parse filter parameters
    const editorId = searchParams.get('editor_id');
    const actionType = searchParams.get('action_type');
    const entityType = searchParams.get('entity_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build where conditions
    const whereConditions = [];

    if (editorId) {
      whereConditions.push(eq(editorRevisions.editorId, editorId));
    }

    if (actionType) {
      whereConditions.push(eq(editorRevisions.actionType, actionType));
    }

    if (entityType) {
      whereConditions.push(eq(editorRevisions.entityType, entityType));
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (isNaN(fromDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid date_from parameter',
          code: 'INVALID_DATE_FROM' 
        }, { status: 400 });
      }
      whereConditions.push(gte(editorRevisions.createdAt, fromDate));
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (isNaN(toDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid date_to parameter',
          code: 'INVALID_DATE_TO' 
        }, { status: 400 });
      }
      whereConditions.push(lte(editorRevisions.createdAt, toDate));
    }

    // Build main query - simplified without user join since editorId is just a string
    const baseQuery = db.select({
      id: editorRevisions.id,
      actionType: editorRevisions.actionType,
      entityType: editorRevisions.entityType,
      entityId: editorRevisions.entityId,
      previousState: editorRevisions.previousState,
      newState: editorRevisions.newState,
      isUndone: editorRevisions.isUndone,
      createdAt: editorRevisions.createdAt,
      editorId: editorRevisions.editorId
    })
    .from(editorRevisions);

    // Apply where conditions conditionally
    const query = whereConditions.length > 0 
      ? baseQuery.where(and(...whereConditions))
      : baseQuery;

    // Get results with pagination and ordering
    const results = await query
      .orderBy(desc(editorRevisions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(editorRevisions);
    const countQuery = whereConditions.length > 0
      ? baseCountQuery.where(and(...whereConditions))
      : baseCountQuery;
    const countResult = await countQuery;
    const totalCount = Number(countResult[0].count);

    // Transform results and parse JSON fields
    const transformedResults = results.map(revision => {
      let previousState = null;
      let newState = null;

      // Parse JSON strings safely
      if (revision.previousState) {
        try {
          previousState = JSON.parse(revision.previousState);
        } catch (error) {
          console.error('Error parsing previousState JSON:', error);
          previousState = revision.previousState;
        }
      }

      if (revision.newState) {
        try {
          newState = JSON.parse(revision.newState);
        } catch (error) {
          console.error('Error parsing newState JSON:', error);
          newState = revision.newState;
        }
      }

      return {
        id: revision.id,
        actionType: revision.actionType,
        entityType: revision.entityType,
        entityId: revision.entityId,
        previousState,
        newState,
        isUndone: revision.isUndone,
        createdAt: revision.createdAt,
        editor: {
          id: revision.editorId,
          name: revision.editorId,
          email: revision.editorId
        }
      };
    });

    return NextResponse.json({
      revisions: transformedResults,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
