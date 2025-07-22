import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /api/matches/send-with-explanation)
  const path = request.nextUrl.pathname;

  // Only run this middleware for API routes
  if (path.startsWith('/api/')) {
    // Get response from the origin
    const response = NextResponse.next();

    // Add the CORS headers to the response
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    return response;
  }

  return NextResponse.next();
}

// Configure matcher to run middleware only on API routes
export const config = {
  matcher: '/api/:path*',
};
