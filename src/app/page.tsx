import {
  getConvergencePatterns, getRPGProfiles, getLatestDiff,
  getPatternSources, getPatternTokenCost, getLeaderContribution,
  getPatternSignalQuality, getActivityCalendar, getAggregateStats,
  getLeaderLinks, getLeaderSourcedContributions, getLeaderHighlight,
  getPatternSynthesis, getScorecard, getEfficiencyTrend, getSourceRankings,
  getAuditsByPattern, buildLineageLabelMap,
} from '@/lib/data';
import { deriveAccolades } from '@/components/rpg-card';
import { VergHeader } from '@/components/verg-header';
import { DashboardBody } from '@/components/dashboard-body';
import { TipInline } from '@/components/tip-inline';
import Link from 'next/link';

export const revalidate = 14400;

export default function DashboardPage() {
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();
  const calendar = getActivityCalendar();
  const aggStats = getAggregateStats();
  const auditsByPattern = getAuditsByPattern();
  const lineageLabelMap = Object.fromEntries(buildLineageLabelMap());
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
      {/* ── TOP BAR: support left, nav right ── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <TipInline />
        <nav className="flex items-center gap-4 text-xs">
          <Link href="/whitepaper" className="text-zinc-400 hover:text-zinc-200 transition-colors">Whitepaper</Link>
          <Link href="/audits" className="text-zinc-400 hover:text-zinc-200 transition-colors">Audits</Link>
          <Link href="/blog" className="text-zinc-400 hover:text-zinc-200 transition-colors">Blog</Link>
          <Link href="/docs" className="text-zinc-400 hover:text-zinc-200 transition-colors">API</Link>
          <a href="https://x.com/lazerhawk5000" className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono">@lazerhawk5000</a>
        </nav>
      </div>

      {/* ── HEADER: VERG + heatmap canvas ── */}
      <VergHeader days={calendar} stats={aggStats} />

      {/* ── Tagline + stats row ── */}
      <div className="flex items-center justify-between mb-6 -mt-1">
        <p className="text-sm text-zinc-300">
          Transparency protocol for information. Nutrition labels for claims. Cross-community convergence maps.
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
          <span title="Convergence patterns — cross-community convergence where unaffiliated sources arrive at the same observation, filtered via PageRank + Louvain communities">
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
        auditsByPattern={auditsByPattern}
        lineageLabelMap={lineageLabelMap}
      />


      <footer className="text-[10px] text-zinc-700 text-center py-6 mt-4 border-t border-zinc-800">
        Verg · open methodology · <a href="https://x.com/lazerhawk5000" className="hover:text-zinc-500">@lazerhawk5000</a>
        {' · '}<Link href="/protocol" className="hover:text-zinc-500">Protocol</Link>
        {' · '}<Link href="/glossary" className="hover:text-zinc-500">Glossary</Link>
      </footer>
    </main>
  );
}
