import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tracks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { trackId, eventType, positionSec, deviceId } = await request.json();

    // Validate required fields
    if (!trackId) {
      return NextResponse.json({ 
        error: "Track ID is required",
        code: "MISSING_TRACK_ID" 
      }, { status: 400 });
    }

    if (!eventType) {
      return NextResponse.json({ 
        error: "Event type is required",
        code: "MISSING_EVENT_TYPE" 
      }, { status: 400 });
    }

    if (positionSec === undefined || positionSec === null) {
      return NextResponse.json({ 
        error: "Position in seconds is required",
        code: "MISSING_POSITION" 
      }, { status: 400 });
    }

    // Validate trackId is a valid integer
    if (isNaN(parseInt(trackId))) {
      return NextResponse.json({ 
        error: "Track ID must be a valid number",
        code: "INVALID_TRACK_ID" 
      }, { status: 400 });
    }

    // Validate eventType is one of the allowed values
    const validEventTypes = ['play', 'pause', 'seek', 'end'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ 
        error: "Event type must be one of: play, pause, seek, end",
        code: "INVALID_EVENT_TYPE" 
      }, { status: 400 });
    }

    // Validate positionSec is a number
    if (isNaN(parseFloat(positionSec))) {
      return NextResponse.json({ 
        error: "Position must be a valid number",
        code: "INVALID_POSITION" 
      }, { status: 400 });
    }

    // Validate trackId exists in database
    const track = await db.select()
      .from(tracks)
      .where(eq(tracks.id, parseInt(trackId)))
      .limit(1);

    if (track.length === 0) {
      return NextResponse.json({ 
        error: "Track not found",
        code: "TRACK_NOT_FOUND" 
      }, { status: 404 });
    }

    // For MVP: Log to console (no database storage yet)
    const playbackEvent = {
      trackId: parseInt(trackId),
      eventType,
      positionSec: parseFloat(positionSec),
      deviceId: deviceId || null,
      timestamp: new Date().toISOString(),
      trackTitle: track[0].title
    };

    console.log('Playback Event Logged:', playbackEvent);

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Playback event logged successfully",
      event: {
        trackId: parseInt(trackId),
        eventType,
        positionSec: parseFloat(positionSec),
        timestamp: playbackEvent.timestamp
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}