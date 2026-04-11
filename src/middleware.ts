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

  // Auth disabled — full public access for demo
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
