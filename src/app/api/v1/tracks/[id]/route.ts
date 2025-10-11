import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trackSubmissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Query for track with state === 'live'
    const track = await db.select({
      id: trackSubmissions.id,
      title: trackSubmissions.title,
      artistsCsv: trackSubmissions.artistsCsv,
      album: trackSubmissions.album,
      durationSec: trackSubmissions.durationSec,
      coverUrl: trackSubmissions.coverUrl,
      audioUrl: trackSubmissions.audioUrl,
      state: trackSubmissions.state
    })
    .from(trackSubmissions)
    .where(and(
      eq(trackSubmissions.id, trackId),
      eq(trackSubmissions.state, 'live')
    ))
    .limit(1);

    // Return 404 if track not found or not live
    if (track.length === 0) {
      return NextResponse.json({ 
        error: 'Track not found',
        code: 'TRACK_NOT_FOUND' 
      }, { status: 404 });
    }

    const foundTrack = track[0];

    // Parse artists from CSV format to array
    const artists = foundTrack.artistsCsv.split(',').map(artist => artist.trim()).filter(artist => artist.length > 0);

    // Build response object
    const response: {
      title: string;
      artists: string[];
      album?: string;
      duration?: number;
      cover_url?: string;
      audio_url?: string;
      state: string;
    } = {
      title: foundTrack.title,
      artists: artists,
      state: foundTrack.state
    };

    // Add optional fields if they exist
    if (foundTrack.album) {
      response.album = foundTrack.album;
    }

    if (foundTrack.durationSec) {
      response.duration = foundTrack.durationSec;
    }

    if (foundTrack.coverUrl) {
      response.cover_url = foundTrack.coverUrl;
    }

    if (foundTrack.audioUrl) {
      response.audio_url = foundTrack.audioUrl;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET track error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
