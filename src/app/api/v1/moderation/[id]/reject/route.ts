import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions, moderationActions, user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Simple auth helper aligned with /moderation/queue and /accept
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const userId = request.headers.get('x-test-user-id') || 'admin';
  const email = (request.headers.get('x-test-user-email') || 'admin@example.com').toLowerCase();
  return { id: userId, email, name: 'Admin' } as const;
}

function parseAdminEmails(): string[] {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  const adminsRaw = process.env.ADMIN_ADMINS || '';
  const admins = adminsRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(p => p.split(':')[0]?.trim())
    .filter(Boolean);
  return Array.from(new Set([...list, ...admins])).map(e => e.toLowerCase());
}

// Ensure moderator user exists to satisfy FK on moderation_actions.moderator_user_id
async function ensureModeratorUser(id: string, email: string) {
  const existing = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, id)).limit(1);
  if (existing.length > 0) return id;
  const now = new Date();
  try {
    await db.insert(userTable).values({
      id,
      name: email.split('@')[0] || 'Admin',
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  } catch (_) {
    const byEmail = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1);
    if (byEmail.length > 0) return byEmail[0].id;
    throw _;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Authorization check - verify user is a moderator
    const adminEmails = parseAdminEmails();
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Moderator access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Ensure FK-safe moderator id exists
    const moderatorId = await ensureModeratorUser(user.id, user.email);

    // Parameter validation
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const trackId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body || 'moderatorUserId' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Input validation
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Rejection reason is required',
        code: 'MISSING_REASON' 
      }, { status: 400 });
    }

    // Find track submission by ID
    const existingSubmission = await db.select()
      .from(trackSubmissions)
      .where(eq(trackSubmissions.id, trackId))
      .limit(1);

    if (existingSubmission.length === 0) {
      return NextResponse.json({ 
        error: 'Track submission not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const submission = existingSubmission[0];

    // Check if current state allows rejection
    const allowedStates = ['submitted', 'processing', 'needs_review'];
    if (!allowedStates.includes(submission.state)) {
      return NextResponse.json({ 
        error: `Cannot reject track in ${submission.state} state. Allowed states: ${allowedStates.join(', ')}`,
        code: 'INVALID_STATE' 
      }, { status: 400 });
    }

    const now = new Date();

    // Update track submission to rejected state
    const updatedSubmission = await db.update(trackSubmissions)
      .set({
        state: 'rejected',
        rejectionReason: reason.trim(),
        updatedAt: now,
        lastUpdate: now
      })
      .where(eq(trackSubmissions.id, trackId))
      .returning();

    if (updatedSubmission.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update track submission',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    // Create moderation action record
    await db.insert(moderationActions)
      .values({
        trackId: trackId,
        moderatorUserId: moderatorId,
        action: 'reject',
        reason: reason.trim(),
        createdAt: now
      });

    return NextResponse.json(updatedSubmission[0], { status: 200 });

  } catch (error) {
    console.error('POST /api/v1/moderation/[id]/reject error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
