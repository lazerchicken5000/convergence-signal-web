import {
  getConvergencePatterns, getRPGProfiles, getStats, getLatestDiff,
  getPatternSources, getPatternTokenCost, getLeaderContribution,
  getPatternSignalQuality, getActivityCalendar, getAggregateStats,
  getLeaderLinks, getLeaderSourcedContributions, getLeaderHighlight,
} from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AccordionItem } from '@/components/ui/accordion';
import { SourceLinks, PlatformLinks } from '@/components/source-links';
import { SignalBadges, TokenCostBadge } from '@/components/signal-badges';
import { ContributionTypeBadge, RPGCard, deriveAccolades, AccoladeBadges } from '@/components/rpg-card';
import { TextSizeSelector } from '@/components/depth-selector';
import { PatternFeedback } from '@/components/source-audit';
import { ColumnTabs } from '@/components/column-tabs';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import Link from 'next/link';

export const revalidate = 14400;

function ciColor(score: number) {
  if (score >= 0.7) return 'text-emerald-400';
  if (score >= 0.4) return 'text-amber-400';
  if (score >= 0.2) return 'text-orange-400';
  return 'text-zinc-500';
}

export default function DashboardPage() {
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();
  const calendar = getActivityCalendar();
  const aggStats = getAggregateStats();

  const topPatterns = patterns.slice(0, 10);
  const topLeaders = profiles.slice(0, 10);

  const patternSources = new Map(topPatterns.map(p => [p.id, getPatternSources(p.vector_ids, 4)]));
  const patternCosts = new Map(topPatterns.map(p => [p.id, getPatternTokenCost(p)]));
  const patternSignals = new Map(topPatterns.map(p => [p.id, getPatternSignalQuality(p)]));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verg</h1>
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

      {/* Activity Heatmap */}
      <div className="mb-8">
        <ActivityHeatmap days={calendar} stats={aggStats} />
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
                            {p.convergence_type === 'solution' ? 'solution' : p.convergence_type === 'problem' ? 'problem' : 'metaphor'}
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

          /* ── LEADERS (accordion, inline) ── */
          leaders: (
            <div className="space-y-1.5">
              {topLeaders.map((l, rank) => {
                const contrib = getLeaderContribution(l);
                const links = getLeaderLinks(l);
                const accolades = deriveAccolades(l);
                const sourcedContent = getLeaderSourcedContributions(l.id);
                const highlight = getLeaderHighlight(l);
                const themes = l.recurring_themes.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
                return (
                  <AccordionItem
                    key={l.id}
                    trigger={
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-600 w-5 text-right shrink-0">{rank + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{l.name}</span>
                            <ContributionTypeBadge type={contrib.contributionType} />
                            {l.influence_trajectory === 'rising' && <span className="text-emerald-400 text-xs">&#x2191;</span>}
                          </div>
                          {highlight.bio && (
                            <p className="text-[10px] text-zinc-500 mt-0.5">{highlight.bio}</p>
                          )}
                          {highlight.topContribution && (
                            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                              <span className="text-zinc-600">Notable:</span> {highlight.topContribution.title}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-sm font-bold shrink-0">{l.leader_score.toFixed(3)}</span>
                      </div>
                    }
                  >
                    <div className="space-y-4 pt-3">
                      {/* Contribution highlight */}
                      {highlight.topContribution && (
                        <a
                          href={highlight.topContribution.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block py-2.5 px-3 rounded-lg border border-zinc-700 bg-zinc-800/30 hover:border-zinc-500 transition-colors"
                        >
                          <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1">Top Contribution</p>
                          <p className="text-sm text-zinc-200">{highlight.topContribution.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{highlight.topContribution.source}</p>
                        </a>
                      )}

                      {/* Accolades */}
                      {accolades.length > 0 && <AccoladeBadges accolades={accolades} />}

                      {/* RPG Stats */}
                      <RPGCard contribution={contrib} />

                      {/* Platform links */}
                      {links.length > 0 && <PlatformLinks links={links} />}

                      {/* Sourced contributions */}
                      {sourcedContent.length > 0 && (
                        <SourceLinks sources={sourcedContent} />
                      )}

                      {/* Themes */}
                      {themes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {themes.map(t => (
                            <span key={t.topic} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {t.topic}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link href={`/leader/${l.id}`} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                        Full profile &rarr;
                      </Link>
                    </div>
                  </AccordionItem>
                );
              })}
              {profiles.length > 10 && (
                <p className="text-xs text-zinc-500 text-center pt-3">
                  +{profiles.length - 10} more leaders
                </p>
              )}
            </div>
          ),

          /* ── EMERGING (accordion) ── */
          emerging: !diff ? (
            <p className="text-sm text-muted-foreground py-10 text-center border border-zinc-800 rounded-lg">
              Waiting for second pipeline run to show changes.
            </p>
          ) : (
            <div className="space-y-1.5">
              {/* New Signal */}
              {diff.new_patterns.map(p => (
                <AccordionItem
                  key={p.lineage_id}
                  trigger={
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">new</span>
                          <span className="font-mono text-xs text-emerald-400">{p.ci_score.toFixed(2)}</span>
                        </div>
                        <h3 className="text-sm text-zinc-300 leading-snug">{p.label}</h3>
                      </div>
                    </div>
                  }
                >
                  <div className="pt-2 space-y-2">
                    <p className="text-xs text-zinc-500">{p.creator_count} independent sources detected this pattern.</p>
                    <PatternFeedback patternId={p.lineage_id} />
                  </div>
                </AccordionItem>
              ))}

              {/* Accelerating */}
              {diff.accelerating.map(p => (
                <AccordionItem
                  key={p.lineage_id}
                  trigger={
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/5">accelerating</span>
                          <span className="font-mono text-xs text-zinc-500">
                            {p.ci_before.toFixed(2)} &rarr; <span className="text-amber-400">{p.ci_after.toFixed(2)}</span>
                          </span>
                        </div>
                        <h3 className="text-sm text-zinc-300 leading-snug">{p.label}</h3>
                      </div>
                    </div>
                  }
                >
                  <div className="pt-2 space-y-2">
                    <p className="text-xs text-zinc-500">
                      CI moved from {p.ci_before.toFixed(3)} to {p.ci_after.toFixed(3)} (+{p.delta.toFixed(3)}).
                    </p>
                    <PatternFeedback patternId={p.lineage_id} />
                  </div>
                </AccordionItem>
              ))}

              {/* Fading */}
              {diff.decaying?.map(p => (
                <AccordionItem
                  key={p.lineage_id}
                  trigger={
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-600 text-zinc-500">fading</span>
                          <span className="font-mono text-xs text-zinc-600">
                            {p.ci_before.toFixed(2)} &rarr; {p.ci_after.toFixed(2)}
                          </span>
                        </div>
                        <h3 className="text-sm text-zinc-500 leading-snug">{p.label}</h3>
                      </div>
                    </div>
                  }
                >
                  <div className="pt-2">
                    <p className="text-xs text-zinc-600">Signal weakening. Fewer independent sources contributing.</p>
                  </div>
                </AccordionItem>
              ))}

              {/* Died / Noise */}
              {diff.died?.map(p => (
                <AccordionItem
                  key={p.lineage_id}
                  trigger={
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-600">noise</span>
                      <h3 className="text-sm text-zinc-600 leading-snug">{p.label}</h3>
                    </div>
                  }
                >
                  <div className="pt-2">
                    <p className="text-xs text-zinc-600">Tracked {p.age_days} days. Signal did not sustain — likely amplified noise, not genuine verg.</p>
                  </div>
                </AccordionItem>
              ))}

              {(!diff.new_patterns.length && !diff.accelerating.length && !diff.decaying?.length && !diff.died?.length) && (
                <p className="text-xs text-zinc-500 text-center py-6">No significant changes in the latest pipeline run.</p>
              )}

              <p className="text-[10px] text-zinc-600 text-center pt-2">
                {diff.date} vs {diff.previous_date}
              </p>
            </div>
          ),
        }}
      </ColumnTabs>

      <Separator className="my-8" />
      <footer className="text-xs text-muted-foreground text-center pb-8">
        Verg · <span className="font-mono">trenddistill</span> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
