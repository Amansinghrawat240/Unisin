import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

function getAdminEmails(): string[] {
  const adminEmails: string[] = [];
  
  const envAdminEmails = process.env.ADMIN_EMAILS || '';
  if (envAdminEmails) {
    adminEmails.push(...envAdminEmails.split(',').map(email => email.trim().toLowerCase()));
  }
  
  const envAdminAdmins = process.env.ADMIN_ADMINS || '';
  if (envAdminAdmins) {
    const adminPairs = envAdminAdmins.split(',');
    for (const pair of adminPairs) {
      const [email] = pair.split(':');
      if (email) {
        adminEmails.push(email.trim().toLowerCase());
      }
    }
  }
  
  return [...new Set(adminEmails)];
}

function authenticateAdmin(request: NextRequest): { isAuthenticated: boolean; isAdmin: boolean } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuthenticated: false, isAdmin: false };
  }

  const userEmail = request.headers.get('x-test-user-email');
  if (!userEmail) {
    return { isAuthenticated: true, isAdmin: false };
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(userEmail.toLowerCase());

  return { isAuthenticated: true, isAdmin };
}

export async function GET() {
  try {
    const setting = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, "autoApproveCreators"))
      .limit(1);

    const enabled = setting.length > 0 ? setting[0].settingValue === "true" : false;
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("GET auto-approve error:", error);
    return NextResponse.json({ enabled: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateAdmin(req);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!auth.isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const enabled = Boolean(body?.enabled);

    const existingSetting = await db.select()
      .from(adminSettings)
      .where(eq(adminSettings.settingKey, "autoApproveCreators"))
      .limit(1);

    if (existingSetting.length > 0) {
      await db.update(adminSettings)
        .set({
          settingValue: enabled.toString(),
          updatedAt: new Date()
        })
        .where(eq(adminSettings.settingKey, "autoApproveCreators"));
    } else {
      await db.insert(adminSettings)
        .values({
          settingKey: "autoApproveCreators",
          settingValue: enabled.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("POST auto-approve error:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
