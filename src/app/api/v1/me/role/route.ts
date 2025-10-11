import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Role API Debug ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    console.log("Cookies:", request.cookies.getAll());
    
    // Use better-auth to get the session
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    console.log("Session:", session);
    
    if (!session?.user) {
      console.log("No session found - returning 401");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log("User ID from session:", session.user.id);
    
    // Fetch user role from database
    const userRecord = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    
    console.log("User record from DB:", userRecord);
    
    if (!userRecord.length) {
      return NextResponse.json(
        { role: "user", isAdmin: false, isEditor: false, isCreator: false },
        { status: 200 }
      );
    }
    
    const role = userRecord[0].role || "user";
    
    const response = {
      role,
      isAdmin: role === "admin",
      isEditor: role === "editor" || role === "admin",
      isCreator: role === "creator" || role === "editor" || role === "admin",
    };
    
    console.log("Returning response:", response);
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}