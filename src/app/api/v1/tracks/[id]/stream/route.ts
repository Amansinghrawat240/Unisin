import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const trackId = parseInt(id);

    // Query track submission
    const track = await db.select()
      .from(trackSubmissions)
      .where(eq(trackSubmissions.id, trackId))
      .limit(1);

    // Check if track exists
    if (track.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: 'TRACK_NOT_FOUND' 
      }, { status: 404 });
    }

    const trackRecord = track[0];

    // Check if track is live
    if (trackRecord.state !== 'live') {
      return NextResponse.json({ 
        error: 'Track is not available for streaming',
        code: 'TRACK_NOT_LIVE' 
      }, { status: 404 });
    }

    // Check if audio URL is available
    if (!trackRecord.audioUrl) {
      return NextResponse.json({ 
        error: 'Audio file not available',
        code: 'AUDIO_URL_NOT_AVAILABLE' 
      }, { status: 404 });
    }

    // Return 302 redirect to audio URL
    return NextResponse.redirect(trackRecord.audioUrl, 302);

  } catch (error) {
    console.error('GET stream error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
