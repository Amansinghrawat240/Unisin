import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const filePath = join(process.cwd(), ".data", "local-users.json");
    const fileContent = readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);
    
    const localUsers = Array.isArray(data) ? data : [];
    
    const results = {
      total: localUsers.length,
      synced: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const localUser of localUsers) {
      const userId = `local_${localUser.id}`;
      
      try {
        // Check if user already exists
        const existing = await db.select().from(user).where(eq(user.id, userId)).limit(1);
        
        if (existing.length > 0) {
          results.skipped++;
          continue;
        }

        // Insert new user - CRITICAL: Let Drizzle handle all timestamp logic
        const newUser = await db.insert(user).values({
          id: userId,
          name: localUser.name,
          email: localUser.email,
          emailVerified: false,
          role: "user",
          // Do not specify timestamps - let schema $defaultFn handle them automatically
        });
        
        results.synced++;
      } catch (error: any) {
        console.error('Insert error details:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        
        // Handle specific SQLite errors
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
          if (error.message.includes('user.email')) {
            results.skipped++;
            console.log(`Email already exists: ${localUser.email}`);
          } else {
            results.errors.push(`${localUser.email} (${userId}): Unique constraint violation`);
          }
        } else {
          results.errors.push(`${localUser.email} (${userId}): ${error.message || error.toString()}`);
        }
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to sync users" 
      },
      { status: 500 }
    );
  }
}