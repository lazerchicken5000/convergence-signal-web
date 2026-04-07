import {
  getConvergencePatterns, getRPGProfiles, getLatestDiff,
  getPatternSources, getPatternTokenCost, getLeaderContribution,
  getPatternSignalQuality, getActivityCalendar, getAggregateStats,
  getLeaderLinks, getLeaderSourcedContributions, getLeaderHighlight,
  getPatternSynthesis, getScorecard, getEfficiencyTrend, getSourceRankings,
} from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { SourceLinks, PlatformLinks } from '@/components/source-links';
import { SignalBadges, TokenCostBadge, TokenCostHero } from '@/components/signal-badges';
import { ContributionTypeBadge, RPGCard, deriveAccolades, AccoladeBadges } from '@/components/rpg-card';
import { PatternFeedback } from '@/components/source-audit';
import { VergHeader } from '@/components/verg-header';
import { DashboardBody } from '@/components/dashboard-body';
import Link from 'next/link';

export const revalidate = 14400;

export default function DashboardPage() {
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();
  const calendar = getActivityCalendar();
  const aggStats = getAggregateStats();

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
      {/* ── HEADER: VERG + heatmap canvas ── */}
      <VergHeader days={calendar} stats={aggStats} />

      {/* ── HERO: protocol introduction ── */}
      <section className="mb-5 -mt-1 max-w-2xl">
        <h2 className="text-base sm:text-lg text-zinc-200 leading-snug font-medium">
          Convergence intelligence — meet mind to mind with the parts of the paradigm.
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed mt-1.5">
          Verg detects when independent minds arrive at the same conclusion without coordinating, verifies the independence through social-graph analysis, and surfaces the resulting signal to humans and AI agents. Below: today&apos;s convergence patterns and the contributors who shaped them — ranked by what they produce, not who follows them. Read the <Link href="/whitepaper" className="underline decoration-zinc-700 hover:decoration-zinc-400">whitepaper</Link> for the protocol.
        </p>
      </section>

      {/* ── Tagline left + stats right, same row ── */}
      <div className="flex items-center justify-between mb-6 -mt-2">
        <p className="text-sm text-muted-foreground">
          Sourcing signal. Removing noise. For builders. <span className="font-mono text-zinc-600">@lazerhawk5000</span>
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

      <footer className="text-xs text-muted-foreground text-center py-8 mt-4 border-t border-zinc-800">
        Verg · <span className="font-mono">trenddistill</span> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
        {' · '}<Link href="/glossary" className="underline">Glossary</Link>
        {' · '}<Link href="/whitepaper" className="underline">Whitepaper</Link>
        {' · '}<Link href="/blog" className="underline">Transmissions</Link>
        {' · '}<Link href="/docs" className="underline">API</Link>
        {' · '}<Link href="/tip" className="underline">Support</Link>
      </footer>
    </main>
  );
}
