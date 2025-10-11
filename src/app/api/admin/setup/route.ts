import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, action } = await request.json();

    // List all users if action is "list"
    if (action === "list") {
      const allUsers = await db.select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }).from(user);

      return NextResponse.json({
        success: true,
        users: allUsers,
        message: `Found ${allUsers.length} users in database`,
      });
    }

    // Make user admin
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Try to find user by email
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (users.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "User not found. Make sure to login first to sync your account to the database.",
          hint: "Try POST with {\"action\": \"list\"} to see all users"
        },
        { status: 404 }
      );
    }

    const foundUser = users[0];

    // Update user role to admin
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, foundUser.id));

    return NextResponse.json({
      success: true,
      message: `User ${foundUser.email} is now an admin!`,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to setup admin" },
      { status: 500 }
    );
  }
}