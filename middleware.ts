import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // BETTER-AUTH: Protect editor and admin routes
  if (pathname.startsWith('/editor') || pathname.startsWith('/admin/moderation') || pathname.startsWith('/admin/tracks')) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers
      });

      // No session - redirect to login
      if (!session?.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check role for protected routes
      if (!session.user.role || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
        // User is logged in but doesn't have permission
        const homeUrl = new URL('/', request.url);
        return NextResponse.redirect(homeUrl);
      }

      // Allow access
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware auth error:', error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/editor/:path*',
    '/admin/moderation/:path*', 
    '/admin/tracks/:path*'
  ],
};