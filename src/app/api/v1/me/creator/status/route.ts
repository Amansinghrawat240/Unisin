import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { creators, user as usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Use Better-Auth for authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user;

    // Fetch creator by user id
    const creatorRecord = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, user.id))
      .limit(1);

    if (creatorRecord.length === 0) {
      return NextResponse.json({ status: 'none' });
    }

    const creator = creatorRecord[0];
    const response: { status: string; notes?: string } = {
      status: creator.status,
    };

    if (creator.notes) {
      response.notes = creator.notes;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/v1/me/creator/status error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
    }, { status: 500 });
  }
}