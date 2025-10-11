import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    // Test raw pg connection first
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_schema(), version()');
    client.release();
    
    await pool.end();

    return NextResponse.json({
      status: 'success',
      database: result.rows[0].current_database,
      schema: result.rows[0].current_schema,
      version: result.rows[0].version
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      details: error.toString(),
      stack: error.stack
    }, { status: 500 });
  }
}