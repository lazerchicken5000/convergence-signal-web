import { NextResponse } from 'next/server';

/**
 * Email subscription endpoint.
 *
 * POST /api/subscribe
 * Body: { email: string }
 *
 * Logs the signup server-side (Vercel function logs) and returns success.
 * Primary tracking is via PostHog client-side events.
 * When ready, wire up Resend or Buttondown here.
 */

const seen = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email || !email.includes('@') || email.length > 320) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Dedupe within this function instance lifetime
    if (seen.has(email)) {
      return NextResponse.json({ ok: true, dedupe: true });
    }
    seen.add(email);

    // Log to Vercel function logs (queryable via vercel logs)
    console.log('[subscribe]', JSON.stringify({
      email,
      ts: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    }));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
