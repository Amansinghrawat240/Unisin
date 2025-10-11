import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSections } from '@/db/schema';
import { count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug API: Starting homepage_sections query...');
    
    // Get all records from homepage_sections table
    const sections = await db.select().from(homepageSections);
    console.log('Debug API: Retrieved sections:', sections.length);
    
    // Get total count
    const totalCountResult = await db.select({ count: count() }).from(homepageSections);
    const totalCount = totalCountResult[0]?.count || 0;
    console.log('Debug API: Total count:', totalCount);
    
    // Log detailed information
    console.log('Debug API: Raw sections data:', JSON.stringify(sections, null, 2));
    
    return NextResponse.json({
      success: true,
      totalCount,
      sections,
      debug: {
        timestamp: new Date().toISOString(),
        recordsFound: sections.length,
        queryExecuted: 'db.select().from(homepageSections)'
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      debug: {
        timestamp: new Date().toISOString(),
        operation: 'GET homepage_sections debug'
      }
    }, { status: 500 });
  }
}