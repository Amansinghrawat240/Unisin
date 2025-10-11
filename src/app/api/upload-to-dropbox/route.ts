import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function getDropboxAccessToken(): Promise<string | null> {
  try {
    console.log('[DROPBOX] Starting token retrieval...');
    const settings = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, 'dropbox_access_token'))
      .limit(1);

    console.log('[DROPBOX] Query result:', {
      found: settings.length > 0,
      count: settings.length,
      hasValue: settings.length > 0 ? !!settings[0]?.settingValue : false,
      valueLength: settings.length > 0 ? settings[0]?.settingValue?.length : 0
    });

    if (settings.length === 0) {
      console.log('[DROPBOX] No token found in database');
      return null;
    }

    const token = settings[0].settingValue;
    console.log('[DROPBOX] Token retrieved:', {
      length: token?.length,
      preview: token?.substring(0, 20),
      type: typeof token
    });

    return token;
  } catch (error) {
    console.error('[DROPBOX] Error fetching token:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    console.log('[DROPBOX UPLOAD] Starting upload request...');
    
    const accessToken = await getDropboxAccessToken();
    console.log('[DROPBOX UPLOAD] Token check result:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length
    });

    if (!accessToken) {
      console.log('[DROPBOX UPLOAD] Returning 503 - no token');
      return NextResponse.json(
        { 
          error: 'Dropbox not configured', 
          message: 'Please configure Dropbox credentials in admin settings',
          code: 'DROPBOX_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    console.log('[Dropbox Upload] File received:', file ? file.name : 'No file');

    if (!file) {
      console.error('[Dropbox Upload] No file in request');
      return NextResponse.json(
        { error: 'No file provided', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }

    // Validate file type
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];
    const validExtensions = ['.mp3', '.m4a'];
    const isValidType = validAudioTypes.some(type => file.type.includes(type));
    const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    console.log('[Dropbox Upload] File validation:', {
      name: file.name,
      type: file.type,
      size: file.size,
      isValidType,
      isValidExtension
    });
    
    if (!isValidType && !isValidExtension) {
      console.error('[Dropbox Upload] Invalid file type');
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3 and M4A audio files are allowed.', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      console.error('[Dropbox Upload] File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    console.log('[Dropbox Upload] Initializing Dropbox client...');
    // Initialize Dropbox client with fetch polyfill for Node.js
    const dbx = new Dropbox({ 
      accessToken,
      fetch: fetch as any // Ensure fetch is available
    });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const dropboxPath = `/unisin-uploads/${timestamp}-${sanitizedName}`;
    console.log('[Dropbox Upload] Dropbox path:', dropboxPath);

    // Convert file to buffer
    console.log('[Dropbox Upload] Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('[Dropbox Upload] Buffer created, size:', buffer.length);

    // Upload to Dropbox
    console.log('[Dropbox Upload] Starting Dropbox upload...');
    const uploadResponse = await dbx.filesUpload({
      path: dropboxPath,
      contents: buffer,
      mode: { '.tag': 'add' },
      autorename: true,
      mute: false,
    });
    console.log('[Dropbox Upload] Upload successful:', uploadResponse.result.path_display);

    // Create shareable link
    console.log('[Dropbox Upload] Creating shareable link...');
    const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: uploadResponse.result.path_display || dropboxPath,
      settings: {
        requested_visibility: { '.tag': 'public' },
      },
    });
    console.log('[Dropbox Upload] Shareable link created:', linkResponse.result.url);

    // Convert to direct download link
    let directUrl = linkResponse.result.url;
    directUrl = directUrl.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    console.log('[Dropbox Upload] Direct URL:', directUrl);

    return NextResponse.json({
      success: true,
      url: directUrl,
      filename: file.name,
      size: file.size,
      dropboxPath: uploadResponse.result.path_display,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Dropbox Upload] Unhandled error:', error);
    
    // Parse specific Dropbox errors
    if (error?.error?.error_summary) {
      return NextResponse.json(
        { 
          error: 'Dropbox upload failed', 
          message: error.error.error_summary,
          code: 'DROPBOX_API_ERROR'
        },
        { status: 500 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        message: error?.message || 'An unknown error occurred during upload',
        code: 'UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
}