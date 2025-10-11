import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tracks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;

    // Validate trackId parameter
    if (!trackId || isNaN(parseInt(trackId))) {
      return NextResponse.json({ 
        error: "Valid track ID is required",
        code: "INVALID_TRACK_ID" 
      }, { status: 400 });
    }

    const trackIdNum = parseInt(trackId);

    // Query track by ID to get audio URL
    const track = await db.select({
      id: tracks.id,
      audioUrl: tracks.audioUrl,
      title: tracks.title
    })
    .from(tracks)
    .where(eq(tracks.id, trackIdNum))
    .limit(1);

    // Check if track exists
    if (track.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    const foundTrack = track[0];

    // Validate that audioUrl exists
    if (!foundTrack.audioUrl) {
      return NextResponse.json({ 
        error: 'Audio URL not available for this track',
        code: "AUDIO_URL_NOT_AVAILABLE" 
      }, { status: 404 });
    }

    // If redirect=1|true is provided, 302 redirect directly to the audio file so <audio> can stream it
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    if (redirectParam && /^(1|true)$/i.test(redirectParam)) {
      const target = new URL(foundTrack.audioUrl, request.url).toString();
      return NextResponse.redirect(target, 302);
    }

    // Return the audio stream URL (JSON) by default
    return NextResponse.json({ 
      url: foundTrack.audioUrl 
    }, { status: 200 });

  } catch (error) {
    console.error('GET stream error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}