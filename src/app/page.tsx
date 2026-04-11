import {
  getConvergencePatterns, getRPGProfiles, getLatestDiff,
  getPatternSources, getPatternTokenCost, getLeaderContribution,
  getPatternSignalQuality, getActivityCalendar, getAggregateStats,
  getLeaderLinks, getLeaderSourcedContributions, getLeaderHighlight,
  getPatternSynthesis, getScorecard, getEfficiencyTrend, getSourceRankings,
  getAudits,
} from '@/lib/data';
import Image from 'next/image';
import { deriveAccolades } from '@/components/rpg-card';
import { VergHeader } from '@/components/verg-header';
import { DashboardBody } from '@/components/dashboard-body';
import { TipInline } from '@/components/tip-inline';
import Link from 'next/link';

export const revalidate = 14400;

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days}d ago`;
  return iso.slice(0, 10);
}

export default function DashboardPage() {
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();
  const calendar = getActivityCalendar();
  const aggStats = getAggregateStats();
  const audits = getAudits().slice(0, 6);

  // Pre-compute data for all patterns
  const patternData = patterns.slice(0, 20).map(p => ({
    pattern: p,
    sources: getPatternSources(p.vector_ids, 6),
    cost: getPatternTokenCost(p),
    signal: getPatternSignalQuality(p),
    synthesis: getPatternSynthesis(p),
  }));

  // Pre-compute data for all leaders
  const leaderData = profiles.slice(0, 20).map(l => ({
    leader: l,
    contrib: getLeaderContribution(l),
    links: getLeaderLinks(l),
    accolades: deriveAccolades(l),
    sourcedContent: getLeaderSourcedContributions(l.id),
    highlight: getLeaderHighlight(l),
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* ── TOP NAV ── */}
      <nav className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-4">
          <Link href="/whitepaper" className="text-zinc-400 hover:text-zinc-200 transition-colors">Whitepaper</Link>
          <Link href="/audits" className="text-zinc-400 hover:text-zinc-200 transition-colors">Audits</Link>
          <Link href="/blog" className="text-zinc-400 hover:text-zinc-200 transition-colors">Blog</Link>
          <Link href="/docs" className="text-zinc-400 hover:text-zinc-200 transition-colors">API</Link>
          <a href="https://x.com/lazerhawk5000" className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono">@lazerhawk5000</a>
        </div>
      </nav>

      {/* ── HEADER: VERG + heatmap canvas ── */}
      <VergHeader days={calendar} stats={aggStats} />

      {/* ── Tagline + stats row ── */}
      <div className="flex items-center justify-between mb-6 -mt-1">
        <p className="text-sm text-zinc-300">
          Sourcing signal. Removing noise. For builders.
        </p>
        <div className="flex items-center gap-4 text-[11px] text-zinc-600 font-mono shrink-0">
          <span title="Token bake — raw source tokens compressed into structured intelligence (chars/4 measured every run; ~96% compression)">
            {aggStats.totalTokensBaked >= 1000 ? `${(aggStats.totalTokensBaked / 1000).toFixed(0)}K` : aggStats.totalTokensBaked} baked
          </span>
          <span title="Independent content items the protocol has absorbed (papers, repos, posts, episodes)">
            {aggStats.totalArticles} sources
          </span>
          <span title="Contributors ranked by originality, independence, centrality, and source depth — never followers">
            {aggStats.totalLeaders} leaders
          </span>
          <span title="Convergence patterns — insights where multiple independent voices arrived at the same conclusion, verified via PageRank + Louvain communities">
            {aggStats.totalPatterns} patterns
          </span>
          <span title="Days the autonomous pipeline produced new content">
            {aggStats.activeDays} active
          </span>
        </div>
      </div>

      {/* ── MASTER-DETAIL BODY ── */}
      <DashboardBody
        patternData={patternData}
        leaderData={leaderData}
        diff={diff}
        totalPatterns={patterns.length}
        totalLeaders={profiles.length}
        scorecard={getScorecard()}
        efficiency={getEfficiencyTrend()}
        sourceRankings={getSourceRankings()}
      />

      {/* ── RECENT AUDITS — hypercard thumbnails below the infographic ── */}
      {audits.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-300">Recent audits</h2>
            <Link href="/audits" className="text-xs text-zinc-500 hover:text-zinc-300">
              all {audits.length}+ →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]{height:6px} [&::-webkit-scrollbar-track]{background:#09090b} [&::-webkit-scrollbar-thumb]{background:#27272a;border-radius:3px}">
            {audits.map(a => (
              <Link
                key={a.audit_id}
                href={`/audits/${a.audit_id}`}
                className="shrink-0 w-72 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors group"
              >
                {a.hypercard_url && (
                  <Image
                    src={a.hypercard_url}
                    alt={`Audit ${a.audit_id.slice(0, 8)}`}
                    width={360}
                    height={240}
                    className="w-full h-auto opacity-85 group-hover:opacity-100 transition-opacity"
                    unoptimized
                  />
                )}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    {a.source_author && (
                      <span className="text-[10px] font-mono text-emerald-400">@{a.source_author}</span>
                    )}
                    <span className="text-[10px] text-zinc-600 ml-auto">{timeAgo(a.posted_at)}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{a.claim_text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── INLINE SUPPORT ── */}
      <TipInline />

      <footer className="text-[10px] text-zinc-700 text-center py-6 mt-4 border-t border-zinc-800">
        Verg · open methodology · <a href="https://x.com/lazerhawk5000" className="hover:text-zinc-500">@lazerhawk5000</a>
        {' · '}<Link href="/protocol" className="hover:text-zinc-500">Protocol</Link>
        {' · '}<Link href="/glossary" className="hover:text-zinc-500">Glossary</Link>
      </footer>
    </main>
  );
}
