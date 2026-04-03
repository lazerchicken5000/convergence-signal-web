import { NextRequest, NextResponse } from 'next/server';

/**
 * Password-protect the entire dashboard via HTTP Basic Auth.
 *
 * Set DASHBOARD_PASSWORD env var on Vercel (and locally in .env.local).
 * Username: signal
 */
export function middleware(request: NextRequest) {
  // Public routes — no auth required
  if (request.nextUrl.pathname.startsWith('/api/revalidate') ||
      request.nextUrl.pathname.startsWith('/api/patterns') ||
      request.nextUrl.pathname.startsWith('/glossary')) {
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
      // Decode base64 — use TextDecoder for Edge compatibility
      const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
      const decoded = new TextDecoder().decode(bytes);
      // Split on first colon only (password may contain colons)
      const colonIdx = decoded.indexOf(':');
      if (colonIdx > 0) {
        const user = decoded.slice(0, colonIdx);
        const pass = decoded.slice(colonIdx + 1);
        if (user === 'signal' && pass === password) {
          return NextResponse.next();
        }
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
