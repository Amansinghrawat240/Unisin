import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

// ENV FORMAT EXAMPLES
// ADMIN_ADMINS=email1@gmail.com:pass1,email2@gmail.com:pass2
// ADMIN_SECRET=some-long-random-secret

function parseAdmins(): Record<string, string> {
  const raw = process.env.ADMIN_ADMINS || "";
  const pairs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const map: Record<string, string> = {};
  for (const p of pairs) {
    const [email, pass] = p.split(":");
    if (email && pass) map[email.trim().toLowerCase()] = pass;
  }
  return map;
}

function sign(payload: object) {
  const secret = process.env.ADMIN_SECRET || "dev-secret";
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token: string) {
  try {
    const secret = process.env.ADMIN_SECRET || "dev-secret";
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expSig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expSig))) return null;
    const json = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    // Expiry check (optional 24h)
    if (json?.exp && Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({} as any));
    if (!email || !password) {
      return NextResponse.json({ error: "MISSING_CREDENTIALS" }, { status: 400 });
    }

    const isGmail = /@gmail\.com$/i.test(email);
    if (!isGmail) {
      return NextResponse.json({ error: "EMAIL_NOT_ALLOWED" }, { status: 403 });
    }

    const admins = parseAdmins();
    const stored = admins[email.toLowerCase()];
    if (!stored || stored !== password) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // Look up user in database to get userId
    const [dbUser] = await db.select().from(user).where(eq(user.email, email.toLowerCase())).limit(1);
    
    // Update user role to admin in database if user exists
    if (dbUser) {
      await db.update(user)
        .set({ role: "admin" })
        .where(eq(user.id, dbUser.id));
    }
    
    const exp = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const token = sign({ 
      email: email.toLowerCase(), 
      role: "admin", 
      userId: dbUser?.id || null,
      exp 
    });

    return NextResponse.json({ 
      token, 
      user: { 
        email: email.toLowerCase(), 
        role: "admin",
        id: dbUser?.id || null
      } 
    }, { status: 200 });
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Verify token endpoint: /api/admin/login?token=...
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const parsed = verifyToken(token);
  if (!parsed) return NextResponse.json({ valid: false }, { status: 200 });
  return NextResponse.json({ valid: true, user: parsed }, { status: 200 });
}