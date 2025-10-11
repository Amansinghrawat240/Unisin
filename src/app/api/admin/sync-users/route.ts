import { NextResponse } from "next/server";
import { createClient } from '@libsql/client';
import { readFileSync } from "fs";
import { join } from "path";

export async function POST() {
  try {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Read local users
    const filePath = join(process.cwd(), ".data", "local-users.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const localUsers = JSON.parse(fileContent);

    const results = {
      total: localUsers.length,
      synced: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (const localUser of localUsers) {
      try {
        // Check if user already exists
        const existing = await client.execute({
          sql: "SELECT id FROM user WHERE email = ?",
          args: [localUser.email],
        });

        if (existing.rows.length > 0) {
          results.skipped++;
          continue;
        }

        // Convert timestamps
        const createdAt = Math.floor(localUser.createdAt / 1000);
        const updatedAt = createdAt; // Use createdAt as fallback

        // Insert user with username field
        await client.execute({
          sql: `INSERT INTO user (id, name, username, email, emailVerified, role, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `local_${localUser.id}`,
            localUser.name,
            localUser.username, // Include username from local data
            localUser.email,
            0, // emailVerified = false
            'user',
            createdAt,
            updatedAt,
          ],
        });

        results.synced++;
      } catch (err: any) {
        results.errors.push({
          id: String(localUser.id),
          email: localUser.email,
          error: err.code ? `${err.code}: ${err.message}` : err.message,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}