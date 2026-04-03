import { NextRequest, NextResponse } from 'next/server';

/**
 * Password-protect the entire dashboard via HTTP Basic Auth.
 *
 * Set DASHBOARD_PASSWORD env var on Vercel (and locally in .env.local).
 * Username: signal
 */
export function middleware(request: NextRequest) {
  // Skip auth for the revalidation API (has its own secret)
  if (request.nextUrl.pathname.startsWith('/api/revalidate')) {
    return NextResponse.next();
  }

  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    // No password configured — allow access (dev mode)
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(':');
      if (user === 'signal' && pass === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Convergence Signal"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
