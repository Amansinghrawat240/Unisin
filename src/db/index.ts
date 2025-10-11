import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

// Disable SSL certificate validation for development
// This is necessary when connecting to databases with self-signed certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create connection pool with explicit SSL configuration
const connectionString = process.env.DATABASE_URL;

// More robust SSL handling
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') 
    ? false 
    : {
        rejectUnauthorized: false,
        // Add additional SSL options for better compatibility
        checkServerIdentity: () => undefined,
      },
  max: 10,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;