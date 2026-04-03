import {
  getConvergencePatterns, getRPGProfiles, getStats, getLatestDiff,
  getPatternSources, getLeaderLinks, getPatternTokenCost, getLeaderContribution,
  getPatternSignalQuality,
} from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AccordionItem } from '@/components/ui/accordion';
import { SourceLinks, PlatformLinks } from '@/components/source-links';
import { SignalBadges, TokenCostBadge } from '@/components/signal-badges';
import { ContributionTypeBadge } from '@/components/rpg-card';
import { DepthSelector } from '@/components/depth-selector';
import { PatternFeedback } from '@/components/source-audit';
import Link from 'next/link';

// ISR: revalidate every 4 hours (matches trenddistill fast-ingest cycle)
export const revalidate = 14400;

function ciColor(score: number) {
  if (score >= 0.7) return 'text-emerald-400';
  if (score >= 0.4) return 'text-amber-400';
  if (score >= 0.2) return 'text-orange-400';
  return 'text-zinc-500';
}

function tierColor(tier: string) {
  const colors: Record<string, string> = {
    top: 'text-emerald-400',
    established: 'text-blue-400',
    rising: 'text-amber-400',
    emerging: 'text-zinc-500',
  };
  return colors[tier] ?? colors.emerging;
}

function typeColor(type: string) {
  const colors: Record<string, string> = {
    architect: 'bg-blue-500/10 text-blue-400',
    philosopher: 'bg-purple-500/10 text-purple-400',
    amplifier: 'bg-amber-500/10 text-amber-400',
    contrarian: 'bg-red-500/10 text-red-400',
    bridge: 'bg-emerald-500/10 text-emerald-400',
  };
  return colors[type] ?? 'bg-zinc-500/10 text-zinc-400';
}

const PLATFORM_EMOJI: Record<string, string> = {
  youtube: '▶', x: '𝕏', web: '🌐', github: '⌘', rss: '◉', arxiv: '📄',
};

export default function DashboardPage() {
  const stats = getStats();
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();

  // Pre-resolve source links, token costs, and signal quality for each pattern
  const patternSources = new Map(
    patterns.map(p => [p.id, getPatternSources(p.vector_ids, 6)])
  );
  const patternCosts = new Map(
    patterns.map(p => [p.id, getPatternTokenCost(p)])
  );
  const patternSignals = new Map(
    patterns.map(p => [p.id, getPatternSignalQuality(p)])
  );

  const topLeaders = profiles.filter(l => l.tier === 'top');
  const midLeaders = profiles.filter(l => l.tier === 'established');
  const lowLeaders = profiles.filter(l => l.tier === 'rising' || l.tier === 'emerging');

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Converge</h1>
          <p className="text-base text-muted-foreground mt-1">
            Sourcing signal. Removing noise. For builders.
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">@lazerhawk5000</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DepthSelector />
          <Link href="/glossary" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 border border-zinc-700 rounded-md">
            Glossary
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-10 text-center">
        {[
          { n: stats.patternCount, label: 'Patterns' },
          { n: stats.strongPatterns + stats.emergingPatterns, label: 'Active Signals', color: 'text-amber-400' },
          { n: stats.leaderCount, label: 'Leaders' },
          { n: stats.platforms, label: 'Sources' },
        ].map(s => (
          <div key={s.label} className="border border-zinc-800 rounded-lg py-3">
            <p className={`text-2xl font-bold font-mono ${s.color ?? ''}`}>{s.n}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Patterns ── */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Convergence Patterns</h2>
        {patterns.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No patterns yet. Run the pipeline.</p>
        ) : (
          <div className="space-y-2">
            {patterns.map(p => {
              const sources = patternSources.get(p.id) || [];
              const cost = patternCosts.get(p.id)!;
              const signal = patternSignals.get(p.id)!;
              return (
                <AccordionItem
                  key={p.id}
                  trigger={
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className={
                            p.convergence_type === 'solution' ? 'border-emerald-500/30 text-emerald-400' :
                            p.convergence_type === 'problem' ? 'border-red-500/30 text-red-400' :
                            'border-purple-500/30 text-purple-400'
                          }>
                            {p.convergence_type}
                          </Badge>
                          <SignalBadges quality={signal} />
                        </div>
                        <h3 className="font-medium text-base leading-snug">{p.label}</h3>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-muted-foreground">
                            {p.creator_ids.length} sources · {p.vector_ids.length} vectors · {p.stability_weeks}w
                          </p>
                          <TokenCostBadge cost={cost} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-mono font-bold ${ciColor(p.ci_score)}`}>
                          {p.ci_score.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">CI</p>
                      </div>
                    </div>
                  }
                >
                  {/* Expanded content */}
                  <div className="space-y-4 pt-2">
                    {/* Presuppositions */}
                    {p.presupposition_set.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold mb-1">Shared Assumptions</p>
                        <ul className="space-y-1">
                          {p.presupposition_set.slice(0, 3).map((pre, i) => (
                            <li key={i} className="text-sm text-zinc-400 pl-3 border-l border-zinc-700">
                              {pre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Conflicts */}
                    {p.presupposition_conflicts?.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold mb-1">Tensions</p>
                        {p.presupposition_conflicts.slice(0, 2).map((c, i) => (
                          <div key={i} className="text-sm text-zinc-400 flex items-start gap-2 mb-1">
                            <span className="text-red-400/60 shrink-0">⟷</span>
                            <span>{c.assumption_a} <span className="text-zinc-600">vs</span> {c.assumption_b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Source links */}
                    <SourceLinks sources={sources} patternId={p.id} />

                    {/* Feedback + detail link */}
                    <div className="flex items-center justify-between">
                      <PatternFeedback patternId={p.id} />
                      <Link href={`/pattern/${p.id}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        Full analysis &rarr;
                      </Link>
                    </div>
                  </div>
                </AccordionItem>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Leaders ── */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Curated Leaders</h2>
        {profiles.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No leader profiles yet. Run the pipeline.</p>
        ) : (
          <div className="space-y-6">
            {[
              { label: 'Top Tier', leaders: topLeaders, color: 'text-emerald-400' },
              { label: 'Established', leaders: midLeaders, color: 'text-blue-400' },
              { label: 'Emerging', leaders: lowLeaders.slice(0, 15), color: 'text-zinc-400' },
            ].filter(g => g.leaders.length > 0).map(group => (
              <div key={group.label}>
                <h3 className={`text-sm font-semibold mb-2 ${group.color}`}>{group.label}</h3>
                <div className="space-y-1.5">
                  {group.leaders.map(l => {
                    const links = getLeaderLinks(l);
                    const contrib = getLeaderContribution(l);
                    return (
                      <AccordionItem
                        key={l.id}
                        trigger={
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-medium text-sm truncate">{l.name}</span>
                              <ContributionTypeBadge type={contrib.contributionType} />
                              {l.influence_trajectory === 'rising' && <span className="text-emerald-400 text-xs">↑</span>}
                            </div>
                            <span className="font-mono text-sm font-bold shrink-0">{l.leader_score.toFixed(3)}</span>
                          </div>
                        }
                      >
                        <div className="space-y-3 pt-2">
                          {/* Platform links */}
                          <PlatformLinks links={links} />

                          {/* Themes */}
                          {l.recurring_themes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {l.recurring_themes.slice(0, 5).map(t => (
                                <span key={t.topic} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                  {t.topic}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Patterns */}
                          {l.convergence_patterns.length > 0 && (
                            <p className="text-xs text-zinc-500">
                              In {l.convergence_patterns.length} convergence pattern{l.convergence_patterns.length !== 1 ? 's' : ''}
                            </p>
                          )}

                          <Link href={`/leader/${l.id}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                            Full profile →
                          </Link>
                        </div>
                      </AccordionItem>
                    );
                  })}
                </div>
                {group.label === 'Emerging' && lowLeaders.length > 15 && (
                  <p className="text-xs text-muted-foreground mt-2">+{lowLeaders.length - 15} more</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── What Changed ── */}
      {diff && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">What Changed</h2>
          <p className="text-xs text-muted-foreground mb-3">{diff.date} vs {diff.previous_date}</p>

          {diff.new_patterns.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">New Signal</h3>
              {diff.new_patterns.map(p => (
                <div key={p.lineage_id} className="flex justify-between items-center py-2 border-b border-zinc-800/50 text-sm">
                  <span>{p.label}</span>
                  <span className="font-mono text-emerald-400">{p.ci_score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {diff.accelerating.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-amber-400 mb-2">Accelerating</h3>
              {diff.accelerating.map(p => (
                <div key={p.lineage_id} className="flex justify-between items-center py-2 border-b border-zinc-800/50 text-sm">
                  <span>{p.label}</span>
                  <span className="font-mono text-xs">
                    {p.ci_before.toFixed(2)} → <span className="text-amber-400">{p.ci_after.toFixed(2)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {diff.died?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 mb-2">Faded</h3>
              {diff.died.map(p => (
                <div key={p.lineage_id} className="flex justify-between items-center py-2 border-b border-zinc-800/50 text-sm text-zinc-600">
                  <span>{p.label}</span>
                  <span className="font-mono text-xs">{p.age_days}d</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <Separator className="my-8" />
      <footer className="text-xs text-muted-foreground text-center pb-8">
        Convergence Signal · <span className="font-mono">trenddistill</span> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
