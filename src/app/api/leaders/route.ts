import { getRPGProfiles, getLeaderContribution, getLeaderLinks } from '@/lib/data';
import { NextResponse } from 'next/server';

/**
 * Public API — discovered thought leaders ranked by contribution.
 *
 * GET /api/leaders                      → top 10 leaders
 * GET /api/leaders?limit=30             → top N
 * GET /api/leaders?type=architect       → filter by leader type
 * GET /api/leaders?min_score=0.2        → filter by minimum score
 */

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
  if (entry.count > RATE_LIMIT) return { limited: true, remaining: 0 };
  return { limited: false, remaining: RATE_LIMIT - entry.count };
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { limited, remaining } = isRateLimited(ip);

  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 60 requests/minute.' },
      { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Limit': String(RATE_LIMIT), 'X-RateLimit-Remaining': '0' } },
    );
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10') || 10;
  const typeFilter = url.searchParams.get('type');
  const minScore = parseFloat(url.searchParams.get('min_score') || '0') || 0;

  let leaders = getRPGProfiles();
  if (typeFilter) leaders = leaders.filter(l => l.leader_type === typeFilter);
  if (minScore > 0) leaders = leaders.filter(l => l.leader_score >= minScore);
  leaders = leaders.slice(0, limit);

  const enriched = leaders.map(l => {
    const contrib = getLeaderContribution(l);
    const links = getLeaderLinks(l);
    return {
      id: l.id,
      name: l.name,
      leader_score: l.leader_score,
      leader_type: l.leader_type,
      entity_type: l.entity_type,
      tier: l.tier,
      trajectory: l.influence_trajectory,
      domains: l.domains,
      source_types: l.source_types.filter(s => s !== 'citation'),
      contribution: {
        type: contrib.contributionType,
        originality: contrib.originality,
        independence: contrib.independence,
        centrality: contrib.centrality,
        source_depth: contrib.sourceDepth,
      },
      pattern_count: l.convergence_patterns.length,
      tenure_weeks: l.tenure_weeks,
      themes: l.recurring_themes.slice(0, 5).map(t => ({ topic: t.topic, frequency: t.frequency })),
      links: links.map(link => ({ platform: link.platform, url: link.url })),
    };
  });

  return NextResponse.json({
    meta: {
      total_returned: enriched.length,
      generated_at: new Date().toISOString(),
    },
    leaders: enriched,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
      'X-RateLimit-Limit': String(RATE_LIMIT),
      'X-RateLimit-Remaining': String(remaining),
    },
  });
}
