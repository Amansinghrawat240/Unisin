import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { playlists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Admin authentication
    const authorization = request.headers.get('authorization');
    const testUserEmail = request.headers.get('x-test-user-email');

    if (!authorization || !testUserEmail) {
      return NextResponse.json({ 
        error: 'Missing authorization header or test user email',
        code: 'MISSING_AUTH_HEADERS'
      }, { status: 401 });
    }

    const token = authorization.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ 
        error: 'Invalid authorization header format',
        code: 'INVALID_AUTH_HEADER'
      }, { status: 401 });
    }

    // Parse admin emails from environment variables
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase()) : [];
    const adminAdmins = process.env.ADMIN_ADMINS ? 
      process.env.ADMIN_ADMINS.split(',').map(pair => {
        const [email] = pair.split(':');
        return email.trim().toLowerCase();
      }) : [];

    const allAdminEmails = [...adminEmails, ...adminAdmins];
    const userEmail = testUserEmail.toLowerCase();

    // Check if user is admin
    if (!allAdminEmails.includes(userEmail)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Admin access required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, { status: 403 });
    }

    // Log the operation for audit purposes
    console.log(`[ADMIN OPERATION] User ${userEmail} initiated bulk playlist public update`);

    // Find all private playlists (isPublic = false)
    const privatePlaylistsQuery = await db.select({
      id: playlists.id,
      title: playlists.title,
      ownerId: playlists.ownerId
    })
    .from(playlists)
    .where(eq(playlists.isPublic, false));

    const totalPrivatePlaylistsFound = privatePlaylistsQuery.length;

    if (totalPrivatePlaylistsFound === 0) {
      console.log(`[ADMIN OPERATION] No private playlists found to update`);
      return NextResponse.json({
        success: true,
        message: "No private playlists found to update",
        summary: {
          totalPrivatePlaylistsFound: 0,
          playlistsUpdated: 0,
          updatedPlaylists: []
        }
      }, { status: 200 });
    }

    // Update all private playlists to public
    const updatedPlaylists = await db.update(playlists)
      .set({
        isPublic: true,
        updatedAt: new Date()
      })
      .where(eq(playlists.isPublic, false))
      .returning({
        id: playlists.id,
        title: playlists.title,
        ownerId: playlists.ownerId
      });

    const playlistsUpdated = updatedPlaylists.length;

    // Log successful operation
    console.log(`[ADMIN OPERATION] Successfully updated ${playlistsUpdated} playlists to public. User: ${userEmail}`);
    console.log(`[ADMIN OPERATION] Updated playlist IDs: ${updatedPlaylists.map(p => p.id).join(', ')}`);

    return NextResponse.json({
      success: true,
      message: "Successfully updated playlists to public",
      summary: {
        totalPrivatePlaylistsFound,
        playlistsUpdated,
        updatedPlaylists: updatedPlaylists.map(playlist => ({
          id: playlist.id,
          title: playlist.title,
          ownerId: playlist.ownerId
        }))
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[ADMIN OPERATION] Bulk playlist update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}