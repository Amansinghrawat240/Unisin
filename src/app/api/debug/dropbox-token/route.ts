import { NextResponse } from 'next/server';
import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all admin settings to debug
    const allSettings = await db.select()
      .from(adminSettings)
      .limit(10);

    // Try to get the specific dropbox token
    const dropboxToken = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, 'dropbox_access_token'))
      .limit(1);

    return NextResponse.json({
      success: true,
      allSettings: allSettings.map(s => ({
        id: s.id,
        key: s.settingKey,
        valueLength: s.settingValue?.length || 0,
        valuePreview: s.settingValue?.substring(0, 20) + '...',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      })),
      dropboxToken: dropboxToken.length > 0 ? {
        exists: true,
        key: dropboxToken[0].settingKey,
        valueLength: dropboxToken[0].settingValue?.length || 0,
        valuePreview: dropboxToken[0].settingValue?.substring(0, 20) + '...',
        startsWithSl: dropboxToken[0].settingValue?.startsWith('sl.') || false
      } : {
        exists: false
      }
    });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}