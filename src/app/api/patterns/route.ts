import { getConvergencePatterns, getPatternSources, getStats } from '@/lib/data';
import { NextResponse } from 'next/server';

/**
 * Public API — convergence patterns with source links.
 *
 * GET /api/patterns          → all patterns
 * GET /api/patterns?limit=3  → top N patterns
 * GET /api/patterns?min_ci=0.3 → filter by CI score
 *
 * Rate limited: 60 requests/minute per IP.
 */

// In-memory rate limiter (resets on cold start, which is fine for Edge/Serverless)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: RATE_LIMIT - 1 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return { limited: true, remaining: 0 };
  }
  return { limited: false, remaining: RATE_LIMIT - entry.count };
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { limited, remaining } = isRateLimited(ip);

  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 60 requests/minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '0') || undefined;
  const minCI = parseFloat(url.searchParams.get('min_ci') || '0') || 0;

  let patterns = getConvergencePatterns();

  if (minCI > 0) {
    patterns = patterns.filter(p => p.ci_score >= minCI);
  }
  if (limit) {
    patterns = patterns.slice(0, limit);
  }

  // Resolve source links for each pattern
  const enriched = patterns.map(p => {
    const sources = getPatternSources(p.vector_ids, 5);
    return {
      id: p.id,
      label: p.label,
      description: p.description,
      convergence_type: p.convergence_type,
      ci_score: p.ci_score,
      independence_score: p.independence_score,
      creator_count: p.creator_ids.length,
      stability_weeks: p.stability_weeks,
      acceleration: p.acceleration,
      presuppositions: p.presupposition_set.slice(0, 3),
      first_detected: p.first_detected,
      last_updated: p.last_updated,
      sources: sources.map(s => ({
        title: s.title,
        url: s.source_url,
        creator: s.creator.name,
        platform: s.source,
        type: s.content_type,
      })),
    };
  });

  const stats = getStats();

  return NextResponse.json({
    meta: {
      total_patterns: stats.patternCount,
      total_leaders: stats.leaderCount,
      source_platforms: stats.platforms,
      generated_at: new Date().toISOString(),
    },
    patterns: enriched,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
      'X-RateLimit-Limit': String(RATE_LIMIT),
      'X-RateLimit-Remaining': String(remaining),
    },
  });
}
