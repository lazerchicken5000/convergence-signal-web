import {
  getConvergencePatterns, getRPGProfiles, getStats, getLatestDiff,
  getPatternSources, getPatternTokenCost, getLeaderContribution,
  getPatternSignalQuality, getActivityCalendar, getAggregateStats,
  getLeaderLinks, getLeaderSourcedContributions, getLeaderHighlight,
  getScorecard, getEfficiencyTrend, getCandidateReport, getSourceRankings,
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
import { VergTitle } from '@/components/verg-title';
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

  // Research data
  const scorecard = getScorecard();
  const efficiencyTrend = getEfficiencyTrend();
  const candidateReport = getCandidateReport();
  const sourceRankings = getSourceRankings();

  const topPatterns = patterns.slice(0, 10);
  const topLeaders = profiles.slice(0, 10);

  const patternSources = new Map(topPatterns.map(p => [p.id, getPatternSources(p.vector_ids, 4)]));
  const patternCosts = new Map(topPatterns.map(p => [p.id, getPatternTokenCost(p)]));
  const patternSignals = new Map(topPatterns.map(p => [p.id, getPatternSignalQuality(p)]));

  // Extract keywords from patterns for the animated title
  const titleKeywords = [...new Set(
    patterns.flatMap(p =>
      p.label.split(/\s+/).filter(w => w.length > 4).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    ).filter(w => w.length > 4)
  )].slice(0, 30);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Animated Title */}
      <VergTitle keywords={titleKeywords} />
      <div className="flex items-center justify-between mb-6 -mt-2">
        <p className="text-sm text-muted-foreground">
          Sourcing signal. Removing noise. For builders. <span className="font-mono text-zinc-600">@lazerhawk5000</span>
        </p>
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

                      {/* Sourced contributions (exclude top contribution to avoid dupe) */}
                      {sourcedContent.length > (highlight.topContribution ? 1 : 0) && (
                        <SourceLinks sources={
                          highlight.topContribution
                            ? sourcedContent.filter(s => s.source_url !== highlight.topContribution!.url)
                            : sourcedContent
                        } />
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

          /* ── RESEARCH ── */
          research: (
            <div className="space-y-6">
              {/* Prediction Scorecard */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Prediction Scorecard</h3>
                {scorecard && scorecard.total_graded > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className={`text-2xl font-mono font-bold ${scorecard.accuracy >= 0.6 ? 'text-emerald-400' : scorecard.accuracy >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                          {(scorecard.accuracy * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">Accuracy</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-2xl font-mono font-bold text-zinc-300">{scorecard.total_graded}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Graded</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-2xl font-mono font-bold text-zinc-300">{scorecard.total_too_early}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Pending</div>
                      </div>
                    </div>
                    {/* Grade breakdown */}
                    <div className="flex gap-2 text-[10px]">
                      {scorecard.total_correct > 0 && <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{scorecard.total_correct} correct</span>}
                      {scorecard.total_partially_correct > 0 && <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{scorecard.total_partially_correct} partial</span>}
                      {scorecard.total_incorrect > 0 && <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">{scorecard.total_incorrect} incorrect</span>}
                      {scorecard.total_expired > 0 && <span className="px-2 py-1 rounded bg-zinc-500/10 text-zinc-500 border border-zinc-700">{scorecard.total_expired} expired</span>}
                    </div>
                    {/* Recent graded predictions */}
                    {scorecard.graded.filter(g => g.grade !== 'too_early').slice(0, 5).map(g => (
                      <div key={g.prediction_id} className="border border-zinc-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            g.grade === 'correct' ? 'border-emerald-500/30 text-emerald-400' :
                            g.grade === 'partially_correct' ? 'border-amber-500/30 text-amber-400' :
                            g.grade === 'incorrect' ? 'border-red-500/30 text-red-400' :
                            'border-zinc-700 text-zinc-500'
                          }`}>{g.grade.replace('_', ' ')}</span>
                          <span className="text-[10px] text-zinc-600">{g.signal_type}</span>
                          <span className="text-[10px] text-zinc-700">{g.confidence}</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{g.prediction_text.slice(0, 150)}{g.prediction_text.length > 150 ? '...' : ''}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">{g.grade_reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center border border-zinc-800 rounded-lg">
                    Predictions need 7+ days before grading. First scorecard coming soon.
                  </p>
                )}
              </section>

              <Separator />

              {/* Token Bake Efficiency */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Token Bake Efficiency</h3>
                {efficiencyTrend && efficiencyTrend.total_runs_analyzed > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-zinc-300">
                          {efficiencyTrend.current_tokens_per_pattern > 1000
                            ? `${(efficiencyTrend.current_tokens_per_pattern / 1000).toFixed(0)}K`
                            : efficiencyTrend.current_tokens_per_pattern}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">Tokens / Pattern</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className={`text-lg font-mono font-bold ${
                          efficiencyTrend.trend_direction === 'improving' ? 'text-emerald-400' :
                          efficiencyTrend.trend_direction === 'declining' ? 'text-red-400' : 'text-zinc-400'
                        }`}>
                          {efficiencyTrend.trend_direction === 'improving' ? '\u2193' : efficiencyTrend.trend_direction === 'declining' ? '\u2191' : '\u2192'}
                          {' '}{Math.abs(efficiencyTrend.trend_pct_change_7d)}%
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">7d Trend</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-zinc-300">{efficiencyTrend.total_runs_analyzed}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Runs Tracked</div>
                      </div>
                    </div>
                    {/* Efficiency chart (simple bar visualization) */}
                    {efficiencyTrend.history.length > 1 && (
                      <div className="border border-zinc-800 rounded-lg p-3">
                        <p className="text-[10px] text-zinc-600 mb-2">Tokens per pattern over time (lower = better)</p>
                        <div className="flex items-end gap-0.5 h-16">
                          {efficiencyTrend.history.map((h, i) => {
                            const max = Math.max(...efficiencyTrend.history.map(x => x.tokens_per_pattern));
                            const pct = max > 0 ? (h.tokens_per_pattern / max) * 100 : 0;
                            return (
                              <div
                                key={i}
                                className="flex-1 bg-zinc-700 rounded-t-sm hover:bg-zinc-600 transition-colors"
                                style={{ height: `${Math.max(4, pct)}%` }}
                                title={`${h.date.slice(0, 10)}: ${h.tokens_per_pattern} tok/pattern`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Top sources */}
                    {efficiencyTrend.most_efficient_sources.length > 0 && (
                      <div>
                        <p className="text-[10px] text-zinc-600 mb-1.5">Most efficient sources</p>
                        <div className="space-y-1">
                          {efficiencyTrend.most_efficient_sources.slice(0, 3).map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-zinc-800/50">
                              <span className="text-zinc-400">{s.creator}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-zinc-500">{s.tokens_per_pattern > 1000 ? `${(s.tokens_per_pattern / 1000).toFixed(0)}K` : s.tokens_per_pattern} tok</span>
                                <span className={`text-[10px] px-1 rounded ${s.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400' : s.grade === 'B' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-700 text-zinc-400'}`}>{s.grade}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center border border-zinc-800 rounded-lg">
                    Efficiency tracking starts after the first pipeline run with research stages.
                  </p>
                )}
              </section>

              <Separator />

              {/* Source Quality */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Source Quality</h3>
                {sourceRankings && sourceRankings.rankings.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-zinc-300">{sourceRankings.totalSources}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Sources</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-zinc-300">{(sourceRankings.avgConversionRate * 100).toFixed(1)}%</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Avg Conversion</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-zinc-300">{sourceRankings.totalItems}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Items Processed</div>
                      </div>
                    </div>
                    {/* Grade distribution */}
                    <div className="flex gap-2 text-[10px]">
                      {['A', 'B', 'C', 'D', 'F'].map(grade => {
                        const count = sourceRankings.rankings.filter(r => r.grade === grade).length;
                        if (count === 0) return null;
                        return (
                          <span key={grade} className={`px-2 py-1 rounded border ${
                            grade === 'A' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                            grade === 'B' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' :
                            grade === 'C' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                            grade === 'D' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' :
                            'border-red-500/20 text-red-400 bg-red-500/5'
                          }`}>{count} {grade}-grade</span>
                        );
                      })}
                    </div>
                    {/* Top + Bottom sources */}
                    <div className="space-y-1">
                      {sourceRankings.rankings.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-zinc-800/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] w-4 text-center px-1 rounded ${
                              r.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400' :
                              r.grade === 'B' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-zinc-700 text-zinc-400'
                            }`}>{r.grade}</span>
                            <span className="text-zinc-400 truncate">{r.creator}</span>
                          </div>
                          <span className="font-mono text-zinc-600 shrink-0">{(r.conversionRate * 100).toFixed(0)}% conv</span>
                        </div>
                      ))}
                    </div>
                    {/* Recommendations */}
                    {(sourceRankings.recommendations.expand.length > 0 || sourceRankings.recommendations.prune.length > 0) && (
                      <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        {sourceRankings.recommendations.expand.length > 0 && (
                          <div>
                            <p className="text-[10px] text-emerald-500 font-semibold mb-0.5">Expand (high signal)</p>
                            <p className="text-[10px] text-zinc-500">{sourceRankings.recommendations.expand.slice(0, 3).join(', ')}</p>
                          </div>
                        )}
                        {sourceRankings.recommendations.prune.length > 0 && (
                          <div>
                            <p className="text-[10px] text-red-500 font-semibold mb-0.5">Prune (low signal)</p>
                            <p className="text-[10px] text-zinc-500">{sourceRankings.recommendations.prune.slice(0, 3).join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center border border-zinc-800 rounded-lg">
                    Source rankings appear after the first pipeline run with source ranker enabled.
                  </p>
                )}
              </section>

              <Separator />

              {/* Leader Candidates (Verg 30) */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Verg 30 Candidates</h3>
                {candidateReport && candidateReport.candidates.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-zinc-300">{candidateReport.total_leaders_analyzed}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Analyzed</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-emerald-400">{candidateReport.new_entrants.length}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">New Entrants</div>
                      </div>
                      <div className="border border-zinc-700 rounded-lg p-3 text-center">
                        <div className="text-lg font-mono font-bold text-red-400">{candidateReport.dropped_out.length}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">Dropped Out</div>
                      </div>
                    </div>
                    {/* Movement alerts */}
                    {candidateReport.new_entrants.length > 0 && (
                      <div className="space-y-1">
                        {candidateReport.new_entrants.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-emerald-500/5 border border-emerald-500/10">
                            <span className="text-emerald-400">NEW</span>
                            <span className="text-zinc-400">{e.name}</span>
                            <span className="text-zinc-600 ml-auto">#{e.rank}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Top 10 candidates */}
                    <div className="space-y-1">
                      {candidateReport.candidates.slice(0, 10).map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-zinc-800/50">
                          <span className="text-zinc-600 font-mono w-5 text-right shrink-0">{c.rank}</span>
                          <span className="text-zinc-400 truncate flex-1">{c.name}</span>
                          {c.rank_change > 0 && <span className="text-emerald-500 text-[10px]">{'\u2191'}{c.rank_change}</span>}
                          {c.rank_change < 0 && <span className="text-red-500 text-[10px]">{'\u2193'}{Math.abs(c.rank_change)}</span>}
                          <span className={`text-[10px] px-1 rounded ${
                            c.tier === 'top' ? 'bg-amber-500/10 text-amber-400' :
                            c.tier === 'established' ? 'bg-blue-500/10 text-blue-400' :
                            c.tier === 'rising' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-zinc-700 text-zinc-500'
                          }`}>{c.tier}</span>
                          <span className="font-mono text-zinc-600 shrink-0">{c.score.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center border border-zinc-800 rounded-lg">
                    Leader candidate report will appear after the next pipeline run.
                  </p>
                )}
              </section>
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
