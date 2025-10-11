import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const trackId = parseInt(id);

    // Find the track submission and verify ownership
    const trackSubmission = await db.select()
      .from(trackSubmissions)
      .where(and(
        eq(trackSubmissions.id, trackId),
        eq(trackSubmissions.userId, user.id)
      ))
      .limit(1);

    if (trackSubmission.length === 0) {
      return NextResponse.json({ 
        error: 'Track submission not found' 
      }, { status: 404 });
    }

    const track = trackSubmission[0];

    // Append to processing log
    const currentLog = track.processingLog || '';
    const newLogEntry = 'retry requested';
    const updatedLog = currentLog 
      ? `${currentLog}\n${newLogEntry}` 
      : newLogEntry;

    // Update the track submission
    const updatedTrack = await db.update(trackSubmissions)
      .set({
        state: 'submitted',
        processingLog: updatedLog,
        lastUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(trackSubmissions.id, trackId),
        eq(trackSubmissions.userId, user.id)
      ))
      .returning();

    if (updatedTrack.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update track submission' 
      }, { status: 500 });
    }

    return NextResponse.json(updatedTrack[0], { status: 200 });

  } catch (error) {
    console.error('POST retry-fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
