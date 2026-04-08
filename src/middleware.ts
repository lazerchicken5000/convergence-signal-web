import { NextRequest, NextResponse } from 'next/server';

// Dashboard auth credentials are read from environment variables.
// Set DASHBOARD_USERNAME and DASHBOARD_PASSWORD in .env.local (locally)
// or via Vercel project env vars (prod). If either is missing, the
// middleware FAILS CLOSED — every protected route returns 503 with a
// clear setup message rather than silently allowing access or falling
// back to a hardcoded value.
//
// Var names match the existing DASHBOARD_PASSWORD convention already
// in .env.local from a prior partial migration.
const USERNAME = process.env.DASHBOARD_USERNAME;
const PASSWORD = process.env.DASHBOARD_PASSWORD;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Markdown files and llms discovery files — public, with markdown headers
  // Static .md files live in public/ and are served by Next.js automatically.
  // Blog markdown files are copied to public/blog/<slug>.md by the prebuild step.
  const isMarkdownFile = pathname.endsWith('.md');
  const isLlmsFile = pathname === '/llms.txt' || pathname === '/llms-full.txt';

  if (isMarkdownFile || isLlmsFile) {
    const res = NextResponse.next();
    res.headers.set('Content-Type', 'text/markdown; charset=utf-8');
    res.headers.set('X-Robots-Tag', 'noindex');
    res.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  }

  // Public routes — no auth required
  if (pathname.startsWith('/api/') ||
      pathname.startsWith('/glossary') ||
      pathname.startsWith('/tip') ||
      pathname.startsWith('/whitepaper') ||
      pathname.startsWith('/blog') ||
      pathname.startsWith('/docs')) {
    return NextResponse.next();
  }

  // Fail safely if credentials are not configured. Refuses access
  // rather than allowing unauthenticated requests through.
  if (!USERNAME || !PASSWORD) {
    return new NextResponse(
      'Dashboard auth not configured. Set VERG_DASHBOARD_USERNAME and VERG_DASHBOARD_PASSWORD env vars.',
      { status: 503 },
    );
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
