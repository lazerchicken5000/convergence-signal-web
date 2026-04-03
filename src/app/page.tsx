import {
  getConvergencePatterns, getRPGProfiles, getStats, getLatestDiff,
  getPatternSources, getPatternTokenCost, getLeaderContribution,
  getPatternSignalQuality,
} from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AccordionItem } from '@/components/ui/accordion';
import { SourceLinks } from '@/components/source-links';
import { SignalBadges, TokenCostBadge } from '@/components/signal-badges';
import { ContributionTypeBadge } from '@/components/rpg-card';
import { TextSizeSelector } from '@/components/depth-selector';
import { PatternFeedback } from '@/components/source-audit';
import { ColumnTabs } from '@/components/column-tabs';
import Link from 'next/link';

export const revalidate = 14400;

function ciColor(score: number) {
  if (score >= 0.7) return 'text-emerald-400';
  if (score >= 0.4) return 'text-amber-400';
  if (score >= 0.2) return 'text-orange-400';
  return 'text-zinc-500';
}

export default function DashboardPage() {
  const stats = getStats();
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();

  const topPatterns = patterns.slice(0, 10);
  const topLeaders = profiles.slice(0, 10);

  const patternSources = new Map(topPatterns.map(p => [p.id, getPatternSources(p.vector_ids, 4)]));
  const patternCosts = new Map(topPatterns.map(p => [p.id, getPatternTokenCost(p)]));
  const patternSignals = new Map(topPatterns.map(p => [p.id, getPatternSignalQuality(p)]));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Converge</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sourcing signal. Removing noise. For builders.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TextSizeSelector />
          <Link href="/glossary" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 border border-zinc-700 rounded-md">
            Glossary
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-8 text-center">
        {[
          { n: stats.patternCount, label: 'Patterns' },
          { n: stats.emergingPatterns, label: 'Emerging', color: 'text-amber-400' },
          { n: stats.leaderCount, label: 'Leaders' },
          { n: stats.platforms, label: 'Sources' },
        ].map(s => (
          <div key={s.label} className="border border-zinc-800 rounded-lg py-2.5">
            <p className={`text-xl font-bold font-mono ${s.color ?? ''}`}>{s.n}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* === TAB SWITCHER === */}
      <ColumnTabs>
        {{
          /* ── SIGNAL ── */
          signal: (
            <div className="space-y-1.5">
              {topPatterns.map(p => {
                const sources = patternSources.get(p.id) || [];
                const cost = patternCosts.get(p.id)!;
                const signal = patternSignals.get(p.id)!;
                return (
                  <AccordionItem
                    key={p.id}
                    trigger={
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge variant="outline" className={
                            p.convergence_type === 'solution' ? 'border-emerald-500/30 text-emerald-400' :
                            p.convergence_type === 'problem' ? 'border-red-500/30 text-red-400' :
                            'border-purple-500/30 text-purple-400'
                          }>
                            {p.convergence_type}
                          </Badge>
                          <span className={`text-sm font-mono font-bold ${ciColor(p.ci_score)}`}>
                            {p.ci_score.toFixed(2)}
                          </span>
                          <TokenCostBadge cost={cost} />
                        </div>
                        <h3 className="text-sm font-medium leading-snug">{p.label}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-zinc-500">{p.creator_ids.length} sources</span>
                          <SignalBadges quality={signal} />
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-3 pt-2">
                      {p.presupposition_set.length > 0 && (
                        <ul className="space-y-1">
                          {p.presupposition_set.slice(0, 2).map((pre, i) => (
                            <li key={i} className="text-xs text-zinc-400 pl-2 border-l border-zinc-700">{pre}</li>
                          ))}
                        </ul>
                      )}
                      <SourceLinks sources={sources} patternId={p.id} />
                      <div className="flex items-center justify-between">
                        <PatternFeedback patternId={p.id} />
                        <Link href={`/pattern/${p.id}`} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                          Full analysis &rarr;
                        </Link>
                      </div>
                    </div>
                  </AccordionItem>
                );
              })}
              {patterns.length > 10 && (
                <p className="text-xs text-zinc-500 text-center pt-3">+{patterns.length - 10} more patterns</p>
              )}
            </div>
          ),

          /* ── LEADERS ── */
          leaders: (
            <div className="space-y-1">
              {topLeaders.map((l, rank) => {
                const contrib = getLeaderContribution(l);
                return (
                  <Link key={l.id} href={`/leader/${l.id}`} className="block">
                    <div className="flex items-center gap-3 py-3 px-4 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
                      <span className="text-sm font-mono text-zinc-600 w-6 text-right shrink-0">{rank + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{l.name}</span>
                          <ContributionTypeBadge type={contrib.contributionType} />
                          {l.influence_trajectory === 'rising' && <span className="text-emerald-400 text-xs">&#x2191;</span>}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {l.convergence_patterns.length} pattern{l.convergence_patterns.length !== 1 ? 's' : ''} · {l.tenure_weeks}w · {l.source_types.filter(s => s !== 'citation').join(', ')}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold shrink-0">{l.leader_score.toFixed(3)}</span>
                    </div>
                  </Link>
                );
              })}
              {profiles.length > 10 && (
                <p className="text-xs text-zinc-500 text-center pt-3">
                  <Link href="/leaders" className="hover:text-zinc-300 transition-colors">
                    View all {profiles.length} leaders &rarr;
                  </Link>
                </p>
              )}
            </div>
          ),

          /* ── EMERGING ── */
          emerging: !diff ? (
            <p className="text-sm text-muted-foreground py-10 text-center border border-zinc-800 rounded-lg">
              Waiting for second pipeline run to show changes.
            </p>
          ) : (
            <div className="space-y-6">
              {diff.new_patterns.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wide">New Signal</h3>
                  {diff.new_patterns.slice(0, 10).map(p => (
                    <div key={p.lineage_id} className="py-2.5 px-4 border-b border-zinc-800/50 flex justify-between items-start gap-3">
                      <span className="text-sm text-zinc-300 leading-snug">{p.label}</span>
                      <span className="font-mono text-xs text-emerald-400 shrink-0">{p.ci_score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {diff.accelerating.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">Accelerating</h3>
                  {diff.accelerating.slice(0, 10).map(p => (
                    <div key={p.lineage_id} className="py-2.5 px-4 border-b border-zinc-800/50 flex justify-between items-start gap-3">
                      <span className="text-sm text-zinc-300 leading-snug">{p.label}</span>
                      <span className="font-mono text-xs text-zinc-500 shrink-0">
                        {p.ci_before.toFixed(2)} &rarr; <span className="text-amber-400">{p.ci_after.toFixed(2)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {diff.decaying && diff.decaying.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Fading</h3>
                  {diff.decaying.slice(0, 5).map(p => (
                    <div key={p.lineage_id} className="py-2 px-4 border-b border-zinc-800/50 flex justify-between items-start gap-3">
                      <span className="text-sm text-zinc-500 leading-snug">{p.label}</span>
                      <span className="font-mono text-[10px] text-zinc-600 shrink-0">
                        {p.ci_before.toFixed(2)} &rarr; {p.ci_after.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {diff.died && diff.died.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-600 mb-2 uppercase tracking-wide">Noise / Died</h3>
                  {diff.died.slice(0, 5).map(p => (
                    <div key={p.lineage_id} className="py-2 px-4 border-b border-zinc-800/50 text-sm text-zinc-600">
                      {p.label}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-zinc-600 text-center">
                {diff.date} vs {diff.previous_date}
              </p>
            </div>
          ),
        }}
      </ColumnTabs>

      <Separator className="my-8" />
      <footer className="text-xs text-muted-foreground text-center pb-8">
        Converge · <span className="font-mono">trenddistill</span> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
