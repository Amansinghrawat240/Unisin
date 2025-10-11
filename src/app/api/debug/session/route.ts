import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    // Debug information
    const cookies = request.cookies.getAll();
    const authHeader = request.headers.get('authorization');
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      hasAuthHeader: !!authHeader,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      authenticated: false 
    }, { status: 500 });
  }
}