import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  // Define protected routes
  const protectedPaths = ['/design-2d', '/design-3d', '/my-designs'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  try {
    // Get token from localStorage through cookies
    const token = request.cookies.get('token')?.value || '';

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    
    return NextResponse.next();
  } catch (error) {
    // Redirect to login if token is invalid or missing
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/design-2d/:path*',
    '/design-3d/:path*',
    '/my-designs/:path*',
  ],
}; 