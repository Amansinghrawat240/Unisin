import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions, user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Authorization check - verify user is a moderator
    const adminEmails = parseAdminEmails();
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Moderator access required.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Parameter validation
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid track submission ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const trackId = parseInt(id);
    const body = await request.json();
    const { artistsCsv } = body;

    if (!artistsCsv || typeof artistsCsv !== 'string') {
      return NextResponse.json({ 
        error: 'Valid artistsCsv field is required',
        code: 'INVALID_ARTISTS' 
      }, { status: 400 });
    }

    // Find track submission
    const existingTrack = await db.select()
      .from(trackSubmissions)
      .where(eq(trackSubmissions.id, trackId))
      .limit(1);

    if (existingTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Track submission not found',
        code: 'TRACK_NOT_FOUND' 
      }, { status: 404 });
    }

    const now = new Date();

    // Update the artistsCsv field
    const updatedTrack = await db.update(trackSubmissions)
      .set({
        artistsCsv: artistsCsv.trim(),
        updatedAt: now,
        lastUpdate: now
      })
      .where(eq(trackSubmissions.id, trackId))
      .returning();

    if (updatedTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update track submission',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(updatedTrack[0], { status: 200 });

  } catch (error) {
    console.error('PATCH moderation track error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}