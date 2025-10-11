import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions, moderationActions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Auth helper consistent with other moderation routes
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const adminEmails = parseAdminEmails();
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Moderator access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Parameter validation
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const trackId = parseInt(id);

    // Find submission
    const existing = await db.select()
      .from(trackSubmissions)
      .where(eq(trackSubmissions.id, trackId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Track submission not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const submission = existing[0];

    // Only allow reopen from rejected or live -> set to needs_review
    const allowedFrom = ['rejected', 'live'];
    if (!allowedFrom.includes(submission.state)) {
      return NextResponse.json({ 
        error: `Cannot reopen from ${submission.state} state. Allowed from: ${allowedFrom.join(', ')}`,
        code: 'INVALID_STATE' 
      }, { status: 400 });
    }

    const now = new Date();

    const updated = await db.update(trackSubmissions)
      .set({
        state: 'needs_review',
        rejectionReason: null,
        updatedAt: now,
        lastUpdate: now,
      })
      .where(eq(trackSubmissions.id, trackId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update track submission',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    await db.insert(moderationActions).values({
      trackId,
      moderatorUserId: user.id,
      action: 'reopen',
      reason: 'Moved back to needs_review',
      createdAt: now,
    });

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('POST /api/v1/moderation/[id]/reopen error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}
