'use client';

import { useState } from 'react';
import type { ConvergencePattern, RPGProfile, ConvergenceDiff, TokenCost, SignalQuality, LeaderContribution, LeaderHighlight, ContentItem } from '@/lib/data';
import { SignalBadges, TokenCostHero } from '@/components/signal-badges';
import { ContributionTypeBadge, RPGCard, AccoladeBadges, type Accolade } from '@/components/rpg-card';
import { SourceLinks, PlatformLinks } from '@/components/source-links';
import { PatternFeedback } from '@/components/source-audit';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { SignalMap } from '@/components/infographics/signal-map';
import { LeaderGraph } from '@/components/infographics/leader-graph';
import { EmergingTimeline } from '@/components/infographics/emerging-timeline';

type Tab = 'signal' | 'leaders' | 'emerging';

interface PatternEntry {
  pattern: ConvergencePattern;
  sources: ContentItem[];
  cost: TokenCost;
  signal: SignalQuality;
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
}

function ciColor(score: number) {
  if (score >= 0.7) return 'text-emerald-400';
  if (score >= 0.4) return 'text-amber-400';
  if (score >= 0.2) return 'text-orange-400';
  return 'text-zinc-500';
}

export function DashboardBody({ patternData, leaderData, diff, totalPatterns, totalLeaders }: DashboardBodyProps) {
  const [tab, setTab] = useState<Tab>('signal');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleTab(t: Tab) {
    setTab(t);
    setSelectedId(null);
  }

  function handleSelect(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  // Find selected data
  const selectedPattern = tab === 'signal'
    ? patternData.find(p => p.pattern.id === selectedId) ?? null
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
                selectedId === p.pattern.id
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
      <div className="flex-1 min-w-0 overflow-y-auto max-h-[600px]">
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
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className={
                    selectedPattern.pattern.convergence_type === 'solution' ? 'border-emerald-500/30 text-emerald-400' :
                    selectedPattern.pattern.convergence_type === 'problem' ? 'border-red-500/30 text-red-400' :
                    'border-purple-500/30 text-purple-400'
                  }>
                    {selectedPattern.pattern.convergence_type}
                  </Badge>
                  <span className={`font-mono text-sm font-bold ${ciColor(selectedPattern.pattern.ci_score)}`}>
                    CI {selectedPattern.pattern.ci_score.toFixed(3)}
                  </span>
                </div>
                <h2 className="text-sm font-medium text-zinc-200 leading-snug mb-1">{selectedPattern.pattern.label}</h2>
                {selectedPattern.pattern.resolution_data?.tier1_summary && (
                  <p className="text-xs text-zinc-500 leading-relaxed">{selectedPattern.pattern.resolution_data.tier1_summary}</p>
                )}
              </div>

              <SourceLinks sources={selectedPattern.sources} patternId={selectedPattern.pattern.id} />

              <div className="flex items-center justify-between">
                <PatternFeedback patternId={selectedPattern.pattern.id} />
                <Link href={`/pattern/${selectedPattern.pattern.id}`} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                  Full analysis &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Leader infographic + detail */}
        {tab === 'leaders' && selectedLeader && (
          <div>
            {/* Infographic */}
            <div className="border-b border-zinc-800">
              <LeaderGraph
                leader={selectedLeader.leader}
                contrib={selectedLeader.contrib}
                links={selectedLeader.links}
              />
            </div>

            {/* Detail below */}
            <div className="p-5 space-y-4">
              {/* Top Contribution */}
              {selectedLeader.highlight.topContribution && (
                <a
                  href={selectedLeader.highlight.topContribution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-800/30 hover:border-zinc-500 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1">Top Contribution</p>
                  <p className="text-sm text-zinc-200">{selectedLeader.highlight.topContribution.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{selectedLeader.highlight.topContribution.source}</p>
                </a>
              )}

              {selectedLeader.accolades.length > 0 && <AccoladeBadges accolades={selectedLeader.accolades} />}
              {selectedLeader.links.length > 0 && <PlatformLinks links={selectedLeader.links} />}

              {/* Themes */}
              {selectedLeader.leader.recurring_themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLeader.leader.recurring_themes.sort((a, b) => b.frequency - a.frequency).slice(0, 5).map(t => (
                    <span key={t.topic} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {t.topic}
                    </span>
                  ))}
                </div>
              )}

              <Link href={`/leader/${selectedLeader.leader.id}`} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                Full profile &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Emerging infographic — always show when on emerging tab with diff data */}
        {tab === 'emerging' && diff && (
          <div>
            <div className="border-b border-zinc-800">
              <EmergingTimeline diff={diff} selectedId={selectedId} />
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

        {/* Empty state */}
        {!selectedId && (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <p className="text-zinc-600 text-sm mb-1">Select a {tab === 'signal' ? 'pattern' : tab === 'leaders' ? 'leader' : 'signal'}</p>
              <p className="text-zinc-700 text-xs">Details will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
