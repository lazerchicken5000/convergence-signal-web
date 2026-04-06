import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = 'verg5000';
const USERNAME = 'signal';

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
