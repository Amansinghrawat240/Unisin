import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homepageSections } from '@/db/schema';

export async function POST(request: NextRequest) {
  console.log('=== TEST INSERT API ROUTE START ===');
  
  try {
    // Parse request body
    console.log('Step 1: Parsing request body...');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { title } = body;
    
    // Validate required field
    console.log('Step 2: Validating required fields...');
    if (!title) {
      console.log('❌ Validation failed: title is missing');
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }
    console.log('✅ Validation passed: title provided:', title);
    
    // Prepare insert data with minimal required fields and integer timestamps
    console.log('Step 3: Preparing insert data...');
    const now = new Date();
    console.log('Current timestamp:', now);
    
    // Remove type annotation to let TypeScript infer naturally
    const insertData = {
      title: title.toString().trim(),
      type: 'playlist_carousel' as const,
      position: 1,
      isVisible: true,
      createdBy: null,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('Insert data prepared:', JSON.stringify(insertData, null, 2));
    
    // Perform database insert
    console.log('Step 4: Performing database insert...');
    console.log('Table schema being used: homepageSections');
    console.log('Expected columns: id (auto-increment), title, subtitle, type, position, isVisible, createdBy, createdAt, updatedAt');
    
    const result = await db.insert(homepageSections)
      .values(insertData)
      .returning();
    
    console.log('✅ Insert successful!');
    console.log('Returned result:', JSON.stringify(result, null, 2));
    console.log('Number of records returned:', result.length);
    
    if (result.length === 0) {
      console.log('⚠️ Warning: Insert succeeded but no record returned');
      return NextResponse.json({ 
        error: "Insert succeeded but no record returned",
        code: "NO_RECORD_RETURNED",
        insertData: insertData
      }, { status: 500 });
    }
    
    const newRecord = result[0];
    console.log('New record ID:', newRecord.id);
    console.log('New record details:', JSON.stringify(newRecord, null, 2));
    
    console.log('=== TEST INSERT API ROUTE SUCCESS ===');
    return NextResponse.json(newRecord, { status: 201 });
    
  } catch (error) {
    console.error('=== TEST INSERT API ROUTE ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', (error as any)?.constructor?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    
    // Check for specific SQLite errors
    if ((error as any)?.message) {
      console.log('Analyzing error message for patterns...');
      
      if ((error as any).message.includes('AUTOINCREMENT')) {
        console.log('❌ AUTOINCREMENT related error detected');
      }
      
      if ((error as any).message.includes('PRIMARY KEY')) {
        console.log('❌ Primary key constraint error detected');
      }
      
      if ((error as any).message.includes('NOT NULL')) {
        console.log('❌ NOT NULL constraint error detected');
      }
      
      if ((error as any).message.includes('UNIQUE')) {
        console.log('❌ UNIQUE constraint error detected');
      }
      
      if ((error as any).message.includes('FOREIGN KEY')) {
        console.log('❌ Foreign key constraint error detected');
      }
    }
    
    console.log('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return NextResponse.json({ 
      error: 'Database insert failed',
      code: 'INSERT_ERROR',
      details: {
        message: (error as any)?.message || 'Unknown error',
        name: (error as any)?.constructor?.name || 'Unknown',
        stack: (error as any)?.stack || 'No stack trace available'
      },
      timestamp: new Date().toISOString(),
      insertAttempt: {
        expectedFields: ['title', 'type', 'position', 'isVisible', 'createdBy', 'createdAt', 'updatedAt']
      }
    }, { status: 500 });
  }
}
