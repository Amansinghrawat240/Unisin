import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Auto-admin: if current logged-in user's email matches ADMIN_ADMINS or ADMIN_EMAILS,
// mint an admin token without asking for password again.

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

// NEW: support plain email list via ADMIN_EMAILS as well
function parseAdminEmails(): string[] {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const adminsRaw = process.env.ADMIN_ADMINS || "";
  const fromAdmins = adminsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => p.split(":")[0]?.trim())
    .filter(Boolean) as string[];
  return Array.from(new Set([...list, ...fromAdmins])).map((e) => e.toLowerCase());
}

function sign(payload: object) {
  const secret = process.env.ADMIN_SECRET || "dev-secret";
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { email } = await req.json().catch(() => ({ email: "" }));
    if (!email) {
      return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
    }

    const admins = parseAdmins();
    const allowedEmails = parseAdminEmails();
    const allowed = allowedEmails.includes(email.toLowerCase()) || !!admins[email.toLowerCase()];
    if (!allowed) {
      return NextResponse.json({ error: "NOT_ADMIN" }, { status: 403 });
    }

    const exp = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const token = sign({ email: email.toLowerCase(), role: "admin", exp });

    return NextResponse.json({ token, user: { email: email.toLowerCase(), role: "admin" } }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Discovery: show if any admins configured (emails only)
  const countFromAdmins = (process.env.ADMIN_ADMINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;
  const countFromEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;
  const count = countFromAdmins + countFromEmails;
  return NextResponse.json({ configured: count > 0, count }, { status: 200 });
}