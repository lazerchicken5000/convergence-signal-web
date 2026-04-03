import { NextResponse } from 'next/server';

/**
 * Human audit feedback endpoint.
 *
 * POST /api/feedback
 * Body: { type: "source_quality" | "pattern_useful" | "general", ... }
 *
 * In production (Vercel): stores in-memory and returns success.
 * Feedback is primarily captured client-side via PostHog custom events.
 * This endpoint serves as a fallback and acknowledges the submission.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate minimal structure
    if (!body.type) {
      return NextResponse.json({ error: 'Missing type field' }, { status: 400 });
    }

    // Log server-side for debugging (visible in Vercel function logs)
    console.log('[feedback]', JSON.stringify({
      type: body.type,
      source_id: body.source_id,
      quality: body.quality,
      pattern_id: body.pattern_id,
      useful: body.useful,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    }));

    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST feedback here. Also tracked via PostHog custom events client-side.',
    types: ['source_quality', 'pattern_useful', 'general'],
    quality_options: ['good', 'bad', 'broken_link', 'outdated'],
  });
}
