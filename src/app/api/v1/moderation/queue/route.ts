import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions, creators } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';

// Simple auth helper for testing
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // For testing: return mock user (can change user-id for different tests)
  const userId = request.headers.get('x-test-user-id') || 'user-123';
  const email = request.headers.get('x-test-user-email') || 'user@example.com'; // Non-admin by default
  return { 
    id: userId,
    email: email,
    name: 'Test User'
  };
}

function parseAdminEmails(): string[] {
  // Support both ADMIN_EMAILS and ADMIN_ADMINS (email:pass,email2:pass2)
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

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Authorization check - simple admin email list from env
    const adminEmails = parseAdminEmails();
    const isModerator = adminEmails.includes(currentUser.email.toLowerCase());
    
    if (!isModerator) {
      return NextResponse.json({ 
        error: 'Moderator access required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Get URL search parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 1) Track submissions that need review
    const submissions = await db.select({
      id: trackSubmissions.id,
      title: trackSubmissions.title,
      artistsCsv: trackSubmissions.artistsCsv,
      album: trackSubmissions.album,
      releaseDate: trackSubmissions.releaseDate,
      genre: trackSubmissions.genre,
      explicit: trackSubmissions.explicit,
      coverUrl: trackSubmissions.coverUrl,
      sourceType: trackSubmissions.sourceType,
      originalUrl: trackSubmissions.originalUrl,
      audioUrl: trackSubmissions.audioUrl,
      durationSec: trackSubmissions.durationSec,
      bitrateKbps: trackSubmissions.bitrateKbps,
      state: trackSubmissions.state,
      rejectionReason: trackSubmissions.rejectionReason,
      processingLog: trackSubmissions.processingLog,
      createdAt: trackSubmissions.createdAt,
      updatedAt: trackSubmissions.updatedAt,
      lastUpdate: trackSubmissions.lastUpdate,
      userId: trackSubmissions.userId
    })
    .from(trackSubmissions)
    .where(
      or(
        eq(trackSubmissions.state, 'needs_review'),
        eq(trackSubmissions.state, 'submitted')
      )
    )
    .orderBy(desc(trackSubmissions.createdAt))
    .limit(limit)
    .offset(offset);

    // 2) Pending creator applications
    const creatorApps = await db.select({
      id: creators.id,
      userId: creators.userId,
      displayName: creators.displayName,
      email: creators.email,
      country: creators.country,
      bio: creators.bio,
      status: creators.status,
      termsAcceptedAt: creators.termsAcceptedAt,
      createdAt: creators.createdAt,
      updatedAt: creators.updatedAt,
    })
    .from(creators)
    .where(eq(creators.status, 'pending'))
    .orderBy(desc(creators.createdAt))
    .limit(limit)
    .offset(offset);

    // Normalize into a single queue list
    const trackItems = submissions.map((s) => ({
      kind: 'track_submission',
      id: s.id,
      status: s.state,
      createdAt: s.createdAt,
      payload: s,
    }));

    const creatorItems = creatorApps.map((c) => ({
      kind: 'creator_application',
      id: c.id,
      status: c.status,
      createdAt: c.createdAt,
      payload: c,
    }));

    // Merge and sort by createdAt desc
    const items = [...creatorItems, ...trackItems].sort((a, b) => {
      const ta = Number(new Date(a.createdAt as any));
      const tb = Number(new Date(b.createdAt as any));
      return tb - ta;
    });

    return NextResponse.json({ items }, { status: 200 });

  } catch (error) {
    console.error('GET /api/v1/moderation/queue error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}