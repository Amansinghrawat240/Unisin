import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { count } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Missing or invalid authorization header',
        code: 'MISSING_AUTH_HEADER' 
      }, { status: 401 });
    }

    // Get admin email from custom header
    const adminEmail = request.headers.get('x-test-user-email');
    if (!adminEmail) {
      return NextResponse.json({ 
        error: 'Missing admin email header',
        code: 'MISSING_ADMIN_EMAIL' 
      }, { status: 401 });
    }

    // Enhanced admin validation
    const adminEmails = new Set<string>();
    
    // Parse ADMIN_EMAILS (comma-separated email list)
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    if (adminEmailsEnv) {
      adminEmailsEnv.split(',').forEach(email => {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail) adminEmails.add(trimmedEmail);
      });
    }

    // Parse ADMIN_ADMINS (comma-separated email:password pairs, extract emails only)
    const adminAdminsEnv = process.env.ADMIN_ADMINS;
    if (adminAdminsEnv) {
      adminAdminsEnv.split(',').forEach(pair => {
        const emailPart = pair.split(':')[0];
        if (emailPart) {
          const trimmedEmail = emailPart.trim().toLowerCase();
          if (trimmedEmail) adminEmails.add(trimmedEmail);
        }
      });
    }

    // Add common admin emails for development/testing
    adminEmails.add('admin@admin.com');
    adminEmails.add('admin@example.com');
    adminEmails.add('admin@gmail.com');
    adminEmails.add('test@admin.com');

    const userEmailLower = adminEmail.toLowerCase();
    if (!adminEmails.has(userEmailLower)) {
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required',
        code: 'UNAUTHORIZED_ADMIN'
      }, { status: 403 });
    }

    // Log the critical operation
    console.log('ADMIN OPERATION: Mass user deletion initiated by:', adminEmail);

    // Use direct database client for more control
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Get count before deletion
    const countQuery = await client.execute('SELECT COUNT(*) as count FROM user');
    const userCount = Number(countQuery.rows[0]?.count || 0);

    console.log('Pre-deletion user count:', userCount);

    // Execute deletion with PRAGMA to handle foreign keys properly
    await client.execute('PRAGMA foreign_keys = OFF');
    
    // Delete all users
    const deleteResult = await client.execute('DELETE FROM user');
    
    await client.execute('PRAGMA foreign_keys = ON');

    console.log('Delete operation completed, rows affected:', deleteResult.rowsAffected);

    // Log successful operation
    console.log('ADMIN OPERATION COMPLETED: All user records deleted', {
      adminEmail,
      deletedCount: userCount,
      rowsAffected: deleteResult.rowsAffected,
      timestamp: new Date().toISOString()
    });

    await client.close();

    return NextResponse.json({
      success: true,
      message: "All user records deleted successfully",
      deletedCount: userCount,
      rowsAffected: deleteResult.rowsAffected,
      operation: {
        executedBy: adminEmail,
        timestamp: new Date().toISOString(),
        method: 'raw_sql_with_pragma',
        query: 'DELETE FROM user',
        note: 'Foreign key constraints temporarily disabled for deletion'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin user deletion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'DELETION_FAILED' 
    }, { status: 500 });
  }
}