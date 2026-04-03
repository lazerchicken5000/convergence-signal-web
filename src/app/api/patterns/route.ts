import { getConvergencePatterns, getPatternSources, getStats } from '@/lib/data';
import { NextResponse } from 'next/server';

/**
 * Public API — convergence patterns with source links.
 *
 * GET /api/patterns          → all patterns
 * GET /api/patterns?limit=3  → top N patterns
 * GET /api/patterns?min_ci=0.3 → filter by CI score
 *
 * No auth required — this is the "test the API surface" endpoint.
 */
export async function GET(request: Request) {
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
    },
  });
}
