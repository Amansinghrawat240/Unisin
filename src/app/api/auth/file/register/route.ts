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
function generateJWT(dbUserId: string, user: { email: string; username: string; name: string }): string {
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

async function writeUsers(users: UserRecord[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(users, null, 2), "utf8");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, password } = body || {};
    if (!name || !email || !password || !username) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const users = await readUsers();
    const exists = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) {
      return NextResponse.json({ error: "USER_ALREADY_EXISTS" }, { status: 409 });
    }

    const usernameTaken = users.some(
      (u) => u.username.trim().toLowerCase() === String(username).trim().toLowerCase()
    );
    if (usernameTaken) {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }

    const id = users.length ? users[users.length - 1].id + 1 : 1;
    const user: UserRecord = { id, name, username, email, password, createdAt: Date.now() };
    users.push(user);
    await writeUsers(users);

    // CRITICAL: Sync user to database with proper error handling
    const dbUserId = `local_${id}`;
    
    try {
      // Check if user already exists in database by email
      const existingUser = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
      
      if (existingUser.length > 0) {
        // User already exists in database, use that ID
        const token = generateJWT(existingUser[0].id, user);
        return NextResponse.json({
          user: { id: existingUser[0].id, name, username, email },
          token,
        });
      }
      
      // Create new database user
      await db.insert(userTable).values({
        id: dbUserId,
        name,
        email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const token = generateJWT(dbUserId, user);

      return NextResponse.json({
        user: { id: dbUserId, name, username, email },
        token,
      });
    } catch (dbError: any) {
      // Handle database conflicts gracefully
      console.error("Database sync error during registration:", dbError);
      
      // If unique constraint error on email, find and use existing user
      if (dbError?.message?.includes("UNIQUE") || dbError?.code === "SQLITE_CONSTRAINT") {
        try {
          const existingUser = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
          if (existingUser.length > 0) {
            const token = generateJWT(existingUser[0].id, user);
            return NextResponse.json({
              user: { id: existingUser[0].id, name, username, email },
              token,
            });
          }
        } catch (e) {
          console.error("Fallback query error:", e);
        }
      }
      
      // If all else fails, return success with file user ID
      const token = generateJWT(dbUserId, user);
      return NextResponse.json({
        user: { id: dbUserId, name, username, email },
        token,
      });
    }
  } catch (e) {
    console.error("Registration error:", e);
    return NextResponse.json({ error: "SERVER_ERROR", details: String(e) }, { status: 500 });
  }
}