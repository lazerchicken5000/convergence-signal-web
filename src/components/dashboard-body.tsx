'use client';

import { useState } from 'react';
import type { ConvergencePattern, RPGProfile, ConvergenceDiff, TokenCost, SignalQuality, LeaderContribution, LeaderHighlight, ContentItem, SynthesisChain, ScorecardData, EfficiencyTrendData, SourceRankingData } from '@/lib/data';
import { SignalBadges, TokenCostHero } from '@/components/signal-badges';
import { ContributionTypeBadge, RPGCard, AccoladeBadges, type Accolade } from '@/components/rpg-card';
import { SourceLinks, PlatformLinks } from '@/components/source-links';
import { PatternFeedback } from '@/components/source-audit';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { SignalMap } from '@/components/infographics/signal-map';
import { LeaderGraph } from '@/components/infographics/leader-graph';
import { EmergingTimeline } from '@/components/infographics/emerging-timeline';
import { SourceTreemap } from '@/components/infographics/source-treemap';

type Tab = 'signal' | 'leaders' | 'emerging';

interface PatternEntry {
  pattern: ConvergencePattern;
  sources: ContentItem[];
  cost: TokenCost;
  signal: SignalQuality;
  synthesis: SynthesisChain;
}

interface LeaderEntry {
  leader: RPGProfile;
  contrib: LeaderContribution;
  links: Array<{ platform: string; url: string; handle: string }>;
  accolades: Accolade[];
  sourcedContent: ContentItem[];
  highlight: LeaderHighlight;
}

interface DashboardBodyProps {
  patternData: PatternEntry[];
  leaderData: LeaderEntry[];
  diff: ConvergenceDiff | null;
  totalPatterns: number;
  totalLeaders: number;
  scorecard: ScorecardData | null;
  efficiency: EfficiencyTrendData | null;
  sourceRankings: SourceRankingData | null;
}

function ciColor(score: number) {
  if (score >= 0.7) return 'text-emerald-400';
  if (score >= 0.4) return 'text-amber-400';
  if (score >= 0.2) return 'text-orange-400';
  return 'text-zinc-500';
}

export function DashboardBody({ patternData, leaderData, diff, totalPatterns, totalLeaders, scorecard, efficiency, sourceRankings }: DashboardBodyProps) {
  const [tab, setTab] = useState<Tab>('signal');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);

  function handleTab(t: Tab) {
    setTab(t);
    setSelectedId(null);
  }

  function handleSelect(id: string) {
    setSelectedId(prev => prev === id ? null : id);
    setShowSynthesis(false);
  }

  // On the signal tab, default to the top pattern (index 0) when nothing
  // has been explicitly selected. This makes the SignalMap infographic
  // visible immediately on page load instead of an empty "select a pattern"
  // state. Tab switches reset selectedId, so this default re-applies when
  // the user comes back to the signal tab.
  const effectiveSelectedId = tab === 'signal' && selectedId === null
    ? patternData[0]?.pattern.id ?? null
    : selectedId;

  // Find selected data
  const selectedPattern = tab === 'signal'
    ? patternData.find(p => p.pattern.id === effectiveSelectedId) ?? null
    : null;
  const selectedLeader = tab === 'leaders'
    ? leaderData.find(l => l.leader.id === selectedId) ?? null
    : null;

  return (
    <div className="flex gap-0 min-h-[520px] border border-zinc-800 rounded-lg overflow-hidden">
      {/* ── LEFT: tabs + rows ── */}
      <div className="w-[360px] shrink-0 border-r border-zinc-800 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {(['signal', 'leaders', 'emerging'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${
                t === tab
                  ? 'text-white border-b-2 border-white -mb-px'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1">
          {tab === 'signal' && patternData.map((p, i) => (
            <button
              key={p.pattern.id}
              onClick={() => handleSelect(p.pattern.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors ${
                effectiveSelectedId === p.pattern.id
                  ? 'bg-zinc-800/60 border-l-2 border-l-white'
                  : 'hover:bg-zinc-800/30 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-zinc-600 w-5 text-right shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      p.pattern.convergence_type === 'solution' ? 'border-emerald-500/30 text-emerald-400' :
                      p.pattern.convergence_type === 'problem' ? 'border-red-500/30 text-red-400' :
                      'border-purple-500/30 text-purple-400'
                    }`}>
                      {p.pattern.convergence_type}
                    </Badge>
                    <span className={`text-xs font-mono font-bold ${ciColor(p.pattern.ci_score)}`}>
                      {p.pattern.ci_score.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 truncate leading-snug">{p.pattern.label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{p.pattern.creator_ids.length} sources</p>
                </div>
              </div>
            </button>
          ))}

          {tab === 'leaders' && leaderData.map((l, i) => (
            <button
              key={l.leader.id}
              onClick={() => handleSelect(l.leader.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors ${
                selectedId === l.leader.id
                  ? 'bg-zinc-800/60 border-l-2 border-l-white'
                  : 'hover:bg-zinc-800/30 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-zinc-600 w-5 text-right shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-300 truncate">{l.leader.name}</span>
                    <ContributionTypeBadge type={l.contrib.contributionType} />
                    {l.leader.influence_trajectory === 'rising' && <span className="text-emerald-400 text-xs">&#x2191;</span>}
                  </div>
                  {l.highlight.bio && (
                    <p className="text-xs text-zinc-600 mt-0.5 truncate">{l.highlight.bio}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-zinc-500 shrink-0">{l.leader.leader_score.toFixed(3)}</span>
              </div>
            </button>
          ))}

          {tab === 'emerging' && (
            <>
              {diff?.new_patterns.map(p => (
                <button
                  key={p.lineage_id}
                  onClick={() => handleSelect(p.lineage_id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors ${
                    selectedId === p.lineage_id
                      ? 'bg-zinc-800/60 border-l-2 border-l-white'
                      : 'hover:bg-zinc-800/30 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs px-1.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">new</span>
                    <p className="text-sm text-zinc-300 truncate flex-1">{p.label}</p>
                    <span className="font-mono text-xs text-emerald-400 shrink-0">{p.ci_score.toFixed(2)}</span>
                  </div>
                </button>
              ))}
              {diff?.accelerating.map(p => (
                <button
                  key={p.lineage_id}
                  onClick={() => handleSelect(p.lineage_id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors ${
                    selectedId === p.lineage_id
                      ? 'bg-zinc-800/60 border-l-2 border-l-white'
                      : 'hover:bg-zinc-800/30 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs px-1.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/5">accel</span>
                    <p className="text-sm text-zinc-300 truncate flex-1">{p.label}</p>
                    <span className="font-mono text-xs text-zinc-500 shrink-0">{p.ci_before.toFixed(2)} → <span className="text-amber-400">{p.ci_after.toFixed(2)}</span></span>
                  </div>
                </button>
              ))}
              {diff?.died?.map(p => (
                <button
                  key={p.lineage_id}
                  onClick={() => handleSelect(p.lineage_id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors ${
                    selectedId === p.lineage_id
                      ? 'bg-zinc-800/60 border-l-2 border-l-white'
                      : 'hover:bg-zinc-800/30 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs px-1.5 rounded border border-zinc-700 text-zinc-600">noise</span>
                    <p className="text-sm text-zinc-500 truncate flex-1">{p.label}</p>
                  </div>
                </button>
              ))}
              {!diff && (
                <p className="text-xs text-zinc-600 text-center py-8">Waiting for second pipeline run.</p>
              )}
            </>
          )}

          {/* Row count */}
          <div className="text-[10px] text-zinc-700 text-center py-2">
            {tab === 'signal' && totalPatterns > patternData.length && `+${totalPatterns - patternData.length} more`}
            {tab === 'leaders' && totalLeaders > leaderData.length && `+${totalLeaders - leaderData.length} more`}
          </div>
        </div>
      </div>

      {/* ── RIGHT: infographic panel ── */}
      <div className="flex-1 min-w-0">
        {/* Signal infographic + detail */}
        {tab === 'signal' && selectedPattern && (
          <div>
            {/* Infographic */}
            <div className="border-b border-zinc-800">
              <SignalMap
                pattern={selectedPattern.pattern}
                sources={selectedPattern.sources}
                cost={selectedPattern.cost}
                signal={selectedPattern.signal}
              />
            </div>

            {/* Detail below */}
            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={
                    selectedPattern.pattern.convergence_type === 'solution' ? 'border-emerald-500/30 text-emerald-400' :
                    selectedPattern.pattern.convergence_type === 'problem' ? 'border-red-500/30 text-red-400' :
                    'border-purple-500/30 text-purple-400'
                  }>
                    {selectedPattern.pattern.convergence_type}
                  </Badge>
                  <span className={`font-mono text-base font-bold ${ciColor(selectedPattern.pattern.ci_score)}`}>
                    CI {selectedPattern.pattern.ci_score.toFixed(3)}
                  </span>
                </div>
                <h2 className="text-base font-medium text-zinc-200 leading-snug mb-1.5">{selectedPattern.pattern.label}</h2>
                {selectedPattern.pattern.resolution_data?.tier1_summary && (
                  <p className="text-sm text-zinc-500 leading-relaxed">{selectedPattern.pattern.resolution_data.tier1_summary}</p>
                )}
              </div>

              <SourceLinks sources={selectedPattern.sources} patternId={selectedPattern.pattern.id} />

              {/* Synthesis expansion */}
              {selectedPattern.synthesis.total_sources > 0 && (() => {
                // Flatten all sources across vectors, dedup, sort by content type
                const SOURCE_ORDER: Record<string, number> = { github: 0, arxiv: 1, semantic_scholar: 2, youtube: 3, web: 4, rss: 5 };
                const SOURCE_LABELS: Record<string, string> = { github: 'GitHub', arxiv: 'Papers', semantic_scholar: 'Papers', youtube: 'Video', web: 'Web', rss: 'RSS', x: 'X', twitter: 'X' };

                // Collect all sources with their vector context
                const allSources: Array<ContentItem & { vectorText: string }> = [];
                const seen = new Set<string>();
                for (const v of selectedPattern.synthesis.vectors) {
                  for (const s of v.sources) {
                    if (seen.has(s.id)) continue;
                    seen.add(s.id);
                    allSources.push({ ...s, vectorText: v.vector_text });
                  }
                }

                // Sort: github first, papers, youtube, web, rss last. Within type, newest first.
                allSources.sort((a, b) => {
                  const typeA = SOURCE_ORDER[a.source] ?? 4;
                  const typeB = SOURCE_ORDER[b.source] ?? 4;
                  if (typeA !== typeB) return typeA - typeB;
                  // Newest first within type
                  const dateA = a.published_at || a.ingested_at || '';
                  const dateB = b.published_at || b.ingested_at || '';
                  return dateB.localeCompare(dateA);
                });

                // Group by source type
                const groups = new Map<string, typeof allSources>();
                for (const s of allSources) {
                  const key = s.source === 'semantic_scholar' ? 'arxiv' : s.source;
                  if (!groups.has(key)) groups.set(key, []);
                  groups.get(key)!.push(s);
                }

                // Date formatting
                function formatAge(dateStr?: string): { label: string; stale: boolean } {
                  if (!dateStr) return { label: '', stale: false };
                  const d = new Date(dateStr);
                  const now = new Date();
                  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                  if (days < 1) return { label: 'today', stale: false };
                  if (days < 7) return { label: `${days}d ago`, stale: false };
                  if (days < 30) return { label: `${Math.floor(days / 7)}w ago`, stale: false };
                  if (days < 90) return { label: `${Math.floor(days / 30)}mo ago`, stale: false };
                  if (days < 365) return { label: `${Math.floor(days / 30)}mo ago`, stale: true };
                  return { label: `${Math.floor(days / 365)}y ago`, stale: true };
                }

                return (
                  <div>
                    <button
                      onClick={() => setShowSynthesis(!showSynthesis)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
                    >
                      <span className={`transition-transform ${showSynthesis ? 'rotate-90' : ''}`}>&#x25B6;</span>
                      Show synthesis ({allSources.length} atomic signals → {selectedPattern.synthesis.total_vectors} vectors → 1 pattern)
                    </button>

                    {showSynthesis && (
                      <div className="mt-3 space-y-4">
                        {[...groups.entries()].map(([type, sources]) => (
                          <div key={type}>
                            <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wide mb-1.5">
                              {SOURCE_LABELS[type] ?? type} <span className="text-zinc-700 font-normal">({sources.length})</span>
                            </p>
                            <div className="space-y-1 border-l-2 border-zinc-800 pl-3">
                              {sources.map(s => {
                                const age = formatAge(s.published_at || s.ingested_at);
                                return (
                                  <a
                                    key={s.id}
                                    href={s.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors group py-0.5"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      s.source === 'arxiv' || s.source === 'semantic_scholar' ? 'bg-violet-400' :
                                      s.source === 'github' ? 'bg-emerald-400' :
                                      s.source === 'youtube' ? 'bg-red-400' :
                                      s.source === 'rss' ? 'bg-orange-400' :
                                      'bg-zinc-500'
                                    }`} />
                                    <span className="truncate group-hover:underline flex-1">{s.title}</span>
                                    <span className="text-zinc-700 shrink-0 text-[10px]">{s.creator.name}</span>
                                    {age.label && (
                                      <span className={`font-mono text-[10px] shrink-0 ${age.stale ? 'text-amber-500' : 'text-zinc-700'}`}>
                                        {age.label}
                                      </span>
                                    )}
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <p className="text-[10px] text-zinc-700 pt-1">
                          {allSources.length} sources distilled through {selectedPattern.synthesis.total_vectors} vectors into this convergence pattern
                          {allSources.some(s => formatAge(s.published_at || s.ingested_at).stale) && (
                            <span className="text-amber-600 ml-1">· some sources are 3+ months old</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-between">
                <PatternFeedback patternId={selectedPattern.pattern.id} />
                <Link href={`/pattern/${selectedPattern.pattern.id}`} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                  Full analysis &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Leader infographic + full profile */}
        {tab === 'leaders' && selectedLeader && (() => {
          const l = selectedLeader.leader;
          const trajIcon = l.influence_trajectory === 'rising' ? '\u2191' : l.influence_trajectory === 'declining' ? '\u2193' : '\u2192';
          const trajColor = l.influence_trajectory === 'rising' ? 'text-emerald-400' : l.influence_trajectory === 'declining' ? 'text-red-400' : 'text-zinc-400';
          const tierColors: Record<string, string> = {
            top: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
            established: 'border-blue-500/20 text-blue-400 bg-blue-500/5',
            rising: 'border-amber-500/20 text-amber-400 bg-amber-500/5',
            emerging: 'border-zinc-700 text-zinc-400 bg-zinc-800/50',
          };
          const themes = l.recurring_themes.sort((a, b) => b.frequency - a.frequency).slice(0, 6);
          const filteredSources = selectedLeader.highlight.topContribution
            ? selectedLeader.sourcedContent.filter(s => s.source_url !== selectedLeader.highlight.topContribution!.url)
            : selectedLeader.sourcedContent;

          return (
            <div className="p-5 space-y-5">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded border ${tierColors[l.tier] ?? tierColors.emerging}`}>{l.tier}</span>
                    <ContributionTypeBadge type={selectedLeader.contrib.contributionType} />
                    <span className={`text-sm ${trajColor}`}>{trajIcon} {l.influence_trajectory}</span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-200">{l.name}</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {l.domains.filter(d => d !== 'unknown').join(', ')}{l.tenure_weeks > 0 ? ` · tracked ${l.tenure_weeks}w` : ''}
                  </p>
                  {selectedLeader.highlight.bio && (
                    <p className="text-sm text-zinc-500 mt-1">{selectedLeader.highlight.bio}</p>
                  )}
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-zinc-800 rounded-lg py-3 text-center">
                    <p className="text-xl font-mono font-bold">{l.leader_score.toFixed(3)}</p>
                    <p className="text-xs text-zinc-600">Leader Score</p>
                  </div>
                  <div className="border border-zinc-800 rounded-lg py-3 text-center">
                    <p className="text-xl font-mono font-bold">{l.convergence_patterns.length}</p>
                    <p className="text-xs text-zinc-600">Active Patterns</p>
                  </div>
                  <div className="border border-zinc-800 rounded-lg py-3 text-center">
                    <p className="text-xl font-mono font-bold">{l.polysource_score.toFixed(2)}</p>
                    <p className="text-xs text-zinc-600">Polysource</p>
                  </div>
                </div>

                {/* Accolades */}
                {selectedLeader.accolades.length > 0 && <AccoladeBadges accolades={selectedLeader.accolades} />}

                {/* RPG Card */}
                <RPGCard contribution={selectedLeader.contrib} />

                {/* Top Contribution */}
                {selectedLeader.highlight.topContribution && (
                  <a
                    href={selectedLeader.highlight.topContribution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-3 px-4 rounded-lg border border-zinc-700 bg-zinc-800/30 hover:border-zinc-500 transition-colors"
                  >
                    <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold mb-1">Top Contribution</p>
                    <p className="text-sm text-zinc-200">{selectedLeader.highlight.topContribution.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{selectedLeader.highlight.topContribution.source}</p>
                  </a>
                )}

                {/* Platform links */}
                {selectedLeader.links.length > 0 && <PlatformLinks links={selectedLeader.links} />}

                {/* Sourced contributions */}
                {filteredSources.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wide mb-2">Sourced Contributions</p>
                    <SourceLinks sources={filteredSources} />
                  </div>
                )}

                {/* Themes */}
                {themes.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wide mb-2">Recurring Themes</p>
                    <div className="flex flex-wrap gap-2">
                      {themes.map(t => (
                        <span key={t.topic} className="text-xs px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 font-mono">
                          {t.topic} <span className="text-zinc-600">&times;{t.frequency}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content tags */}
                {l.content_type_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {l.content_type_tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
          );
        })()}

        {/* Emerging infographic — always show when on emerging tab with diff data */}
        {tab === 'emerging' && diff && (
          <div>
            <div className="border-b border-zinc-800">
              <EmergingTimeline diff={diff} selectedId={selectedId} height={320} />
            </div>

            {/* Detail below for selected item */}
            {selectedId && (
              <div className="p-5 space-y-3">
                {(() => {
                  const newP = diff.new_patterns.find(p => p.lineage_id === selectedId);
                  if (newP) return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">new signal</span>
                        <span className="font-mono text-sm text-emerald-400">{newP.ci_score.toFixed(3)}</span>
                      </div>
                      <h2 className="text-sm font-medium text-zinc-200 leading-snug">{newP.label}</h2>
                      <p className="text-xs text-zinc-500">{newP.creator_count} independent sources detected this pattern.</p>
                      <PatternFeedback patternId={newP.lineage_id} />
                    </>
                  );
                  const accel = diff.accelerating.find(p => p.lineage_id === selectedId);
                  if (accel) return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/5">accelerating</span>
                        <span className="font-mono text-sm text-zinc-500">{accel.ci_before.toFixed(3)} → <span className="text-amber-400">{accel.ci_after.toFixed(3)}</span></span>
                      </div>
                      <h2 className="text-sm font-medium text-zinc-200 leading-snug">{accel.label}</h2>
                      <p className="text-xs text-zinc-500">CI +{accel.delta.toFixed(3)}. Signal strengthening.</p>
                      <PatternFeedback patternId={accel.lineage_id} />
                    </>
                  );
                  const dead = diff.died?.find(p => p.lineage_id === selectedId);
                  if (dead) return (
                    <>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500">noise</span>
                      <h2 className="text-sm font-medium text-zinc-400 leading-snug">{dead.label}</h2>
                      <p className="text-xs text-zinc-600">Tracked {dead.age_days}d. Signal did not sustain.</p>
                    </>
                  );
                  return null;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Signal empty state — only when no pattern is available at all
            (e.g. patternData is empty). With the default-select behaviour
            above, the top pattern is always selected when patterns exist. */}
        {!selectedPattern && tab === 'signal' && (
          <div className="p-5 space-y-6">
            {/* Scorecard strip */}
            {scorecard && scorecard.total_graded > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Prediction Accuracy</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-zinc-800 rounded-lg p-3 text-center">
                    <p className={`text-2xl font-mono font-bold ${scorecard.accuracy >= 0.6 ? 'text-emerald-400' : scorecard.accuracy >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                      {(scorecard.accuracy * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">Accuracy</p>
                  </div>
                  <div className="border border-zinc-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-mono font-bold text-zinc-300">{scorecard.total_correct}</p>
                    <p className="text-xs text-zinc-600 mt-1">Correct</p>
                  </div>
                  <div className="border border-zinc-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-mono font-bold text-zinc-300">{scorecard.total_graded}</p>
                    <p className="text-xs text-zinc-600 mt-1">Graded</p>
                  </div>
                </div>
              </div>
            )}

            {/* Efficiency strip */}
            {efficiency && efficiency.total_runs_analyzed > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Token Bake Efficiency</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-zinc-800 rounded-lg p-3 text-center">
                    <p className="text-xl font-mono font-bold text-zinc-300">
                      {efficiency.current_tokens_per_pattern > 1000 ? `${(efficiency.current_tokens_per_pattern / 1000).toFixed(0)}K` : efficiency.current_tokens_per_pattern}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">Tokens/Pattern</p>
                  </div>
                  <div className="border border-zinc-800 rounded-lg p-3 text-center">
                    <p className={`text-xl font-mono font-bold ${efficiency.trend_direction === 'improving' ? 'text-emerald-400' : efficiency.trend_direction === 'declining' ? 'text-red-400' : 'text-zinc-400'}`}>
                      {efficiency.trend_direction === 'improving' ? '\u2193' : efficiency.trend_direction === 'declining' ? '\u2191' : '\u2192'} {Math.abs(efficiency.trend_pct_change_7d)}%
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">7d Trend</p>
                  </div>
                  <div className="border border-zinc-800 rounded-lg p-3 text-center">
                    <p className="text-xl font-mono font-bold text-zinc-300">{efficiency.total_runs_analyzed}</p>
                    <p className="text-xs text-zinc-600 mt-1">Runs</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-4">
              <p className="text-zinc-600 text-sm">Select a pattern to explore</p>
            </div>
          </div>
        )}

        {/* Leaders empty state — show source treemap */}
        {!selectedId && tab === 'leaders' && (
          <div className="p-5 space-y-6">
            {sourceRankings && sourceRankings.rankings.length > 0 ? (
              <SourceTreemap rankings={sourceRankings} />
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-600 text-sm">Source quality data populates after the first pipeline run</p>
              </div>
            )}

            <div className="text-center pt-4">
              <p className="text-zinc-600 text-sm">Select a leader to explore</p>
            </div>
          </div>
        )}

        {/* Emerging default — scorecard + efficiency when no item selected */}
        {tab === 'emerging' && !selectedId && (
          <div className="p-5 space-y-6">
            {/* Scorecard + efficiency in compact row */}
            {(scorecard || efficiency) && (
              <div className="grid grid-cols-2 gap-3">
                {scorecard && scorecard.total_graded > 0 && (
                  <div className="border border-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-600 mb-1">Prediction Accuracy</p>
                    <p className={`text-2xl font-mono font-bold ${scorecard.accuracy >= 0.6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {(scorecard.accuracy * 100).toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-zinc-700">{scorecard.total_correct} correct / {scorecard.total_graded} graded</p>
                  </div>
                )}
                {efficiency && efficiency.total_runs_analyzed > 0 && (
                  <div className="border border-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-600 mb-1">Token Efficiency</p>
                    <p className="text-2xl font-mono font-bold text-zinc-300">
                      {efficiency.current_tokens_per_pattern > 1000 ? `${(efficiency.current_tokens_per_pattern / 1000).toFixed(0)}K` : efficiency.current_tokens_per_pattern}
                    </p>
                    <p className="text-[10px] text-zinc-700">tokens per pattern · {efficiency.total_runs_analyzed} runs</p>
                  </div>
                )}
              </div>
            )}

            {!diff && !scorecard && !efficiency && (
              <div className="text-center py-8">
                <p className="text-zinc-600 text-sm">Research data populates after the first pipeline run</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
