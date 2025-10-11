import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { like, or, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const conflictingEmails = [
      'sameermistry14@gmail.com',
      'skyhighpool@gmail.com',
      'help.mindmate@gmail.com',
      'sammistri14@gmail.com',
      'team.unisin@gmail.com',
      'test2@example.com',
      'newtest@example.com'
    ];

    // Get total user count
    const totalUsersResult = await db.select({ count: count() }).from(user);
    const totalUsers = totalUsersResult[0].count;

    // Get sample of users (limit 10)
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })
    .from(user)
    .limit(10);

    // Get users with "local_" prefix in ID
    const localUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })
    .from(user)
    .where(like(user.id, 'local_%'));

    // Get users with conflicting emails
    const emailConditions = conflictingEmails.map(email => like(user.email, email));
    const conflictingEmailUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })
    .from(user)
    .where(or(...emailConditions));

    return NextResponse.json({
      totalUsers,
      users,
      localUsers,
      conflictingEmails: conflictingEmailUsers
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}