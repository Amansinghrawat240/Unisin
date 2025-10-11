import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const DATA_PATH = path.join(process.cwd(), ".data", "local-users.json");

interface UserRecord {
  id: number;
  name: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
}

// Generate proper JWT token
function generateJWT(dbUserId: string, user: UserRecord): string {
  const secret = process.env.JWT_SECRET || "unisin-secret-key-2024";
  
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    email: user.email,
    userId: dbUserId,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days in seconds
  };
  
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

async function ensureStore() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify([]), "utf8");
  }
}

async function readUsers(): Promise<UserRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_PATH, "utf8");
  try {
    return JSON.parse(raw) as UserRecord[];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, email, username, password } = body || {};
    const idOrEmail = (identifier || email || username || "").toString().trim();
    if (!idOrEmail || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const users = await readUsers();
    const lower = idOrEmail.toLowerCase();
    const user = users.find(
      (u) => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower
    );

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // CRITICAL: Sync user to database with proper error handling
    const dbUserId = `local_${user.id}`;
    
    try {
      // First check if user exists by ID
      const existingUserById = await db.select().from(userTable).where(eq(userTable.id, dbUserId)).limit(1);
      
      if (existingUserById.length > 0) {
        // User already synced with this ID
        const token = generateJWT(dbUserId, user);
        return NextResponse.json({
          user: { id: dbUserId, name: user.name, username: user.username, email: user.email },
          token,
        });
      }
      
      // Check if user exists by email
      const existingUserByEmail = await db.select().from(userTable).where(eq(userTable.email, user.email)).limit(1);
      
      if (existingUserByEmail.length > 0) {
        // User already exists with this email (from better-auth) - use that user's ID
        const existingId = existingUserByEmail[0].id;
        const token = generateJWT(existingId, user);
        return NextResponse.json({
          user: { id: existingId, name: user.name, username: user.username, email: user.email },
          token,
        });
      }
      
      // User doesn't exist - create new one
      await db.insert(userTable).values({
        id: dbUserId,
        name: user.name,
        email: user.email,
        emailVerified: true,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(),
      });

      const token = generateJWT(dbUserId, user);

      return NextResponse.json({
        user: { id: dbUserId, name: user.name, username: user.username, email: user.email },
        token,
      });
    } catch (dbError: any) {
      // Handle database conflicts gracefully
      console.error("Database sync error:", dbError);
      
      // If unique constraint error, try to find existing user by email
      if (dbError?.message?.includes("UNIQUE") || dbError?.code === "SQLITE_CONSTRAINT") {
        try {
          const existingUser = await db.select().from(userTable).where(eq(userTable.email, user.email)).limit(1);
          if (existingUser.length > 0) {
            const token = generateJWT(existingUser[0].id, user);
            return NextResponse.json({
              user: { id: existingUser[0].id, name: user.name, username: user.username, email: user.email },
              token,
            });
          }
        } catch (e) {
          console.error("Fallback query error:", e);
        }
      }
      
      // If all else fails, generate token with file user ID
      const token = generateJWT(dbUserId, user);
      return NextResponse.json({
        user: { id: dbUserId, name: user.name, username: user.username, email: user.email },
        token,
      });
    }
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "SERVER_ERROR", details: String(e) }, { status: 500 });
  }
}