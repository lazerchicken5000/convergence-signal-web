import { NextResponse } from 'next/server';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * Human audit feedback endpoint.
 *
 * POST /api/feedback
 * Body: { type: "source_quality" | "pattern_useful" | "general", ... }
 *
 * Logs feedback to data/feedback.jsonl for review.
 * No auth required — anyone interacting with the dashboard can submit.
 */

const FEEDBACK_PATH = path.join(process.cwd(), 'data', 'feedback.jsonl');

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const entry = {
      timestamp: new Date().toISOString(),
      type: body.type || 'general',
      // Source quality feedback
      source_id: body.source_id || null,
      source_url: body.source_url || null,
      quality: body.quality || null, // "good" | "bad" | "broken_link" | "outdated"
      // Pattern feedback
      pattern_id: body.pattern_id || null,
      useful: body.useful || null,   // true | false
      // Leader feedback
      leader_id: body.leader_id || null,
      // Free text
      note: body.note?.slice(0, 500) || null,
      // Context
      page: body.page || null,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    };

    // Ensure data dir exists
    const dir = path.dirname(FEEDBACK_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    appendFileSync(FEEDBACK_PATH, JSON.stringify(entry) + '\n');

    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST feedback here',
    types: ['source_quality', 'pattern_useful', 'general'],
    quality_options: ['good', 'bad', 'broken_link', 'outdated'],
  });
}
