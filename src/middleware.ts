import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = 'verg5000';
const USERNAME = 'signal';

export function middleware(request: NextRequest) {
  // Public routes — no auth required
  if (request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/glossary') ||
      request.nextUrl.pathname.startsWith('/tip') ||
      request.nextUrl.pathname.startsWith('/whitepaper') ||
      request.nextUrl.pathname.startsWith('/blog') ||
      request.nextUrl.pathname === '/llms.txt') {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    try {
      const base64 = authHeader.replace('Basic ', '');
      const decoded = atob(base64);
      const [user, ...passParts] = decoded.split(':');
      const pass = passParts.join(':');

      if (user === USERNAME && pass === PASSWORD) {
        return NextResponse.next();
      }
    } catch {
      // bad header, fall through to 401
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Verg"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
