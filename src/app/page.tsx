import { getConvergencePatterns, getRPGProfiles, getStats, getLatestDiff } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { TextSizeToggle } from '@/components/text-size-toggle';

// ISR: revalidate every 4 hours (matches trenddistill fast-ingest cycle)
export const revalidate = 14400;

function ciColor(score: number) {
  if (score >= 0.7) return 'text-emerald-400';
  if (score >= 0.4) return 'text-amber-400';
  if (score >= 0.2) return 'text-orange-400';
  return 'text-zinc-500';
}

function tierLabel(tier: string) {
  const labels: Record<string, string> = { top: 'TOP', established: 'MID', rising: 'LOW', emerging: 'LOW' };
  return labels[tier] ?? 'LOW';
}

function tierColor(tier: string) {
  const colors: Record<string, string> = {
    top: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    established: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rising: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerging: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
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

/** Get the primary media source with link for a leader */
function primarySource(leader: { handles: Record<string, string>; source_types: string[] }) {
  const priority = ['youtube', 'x', 'web', 'github', 'rss', 'arxiv'];
  for (const p of priority) {
    const handle = leader.handles[p];
    if (!handle) continue;
    const urls: Record<string, string> = {
      youtube: `https://youtube.com/channel/${handle}`,
      x: `https://x.com/${handle}`,
      web: handle.startsWith('http') ? handle : `https://${handle}`,
      github: `https://github.com/${handle}`,
    };
    return { platform: p, handle, url: urls[p] ?? '#' };
  }
  const firstType = leader.source_types.find(s => s !== 'citation');
  return firstType ? { platform: firstType, handle: '', url: '#' } : null;
}

const PLATFORM_EMOJI: Record<string, string> = {
  youtube: '▶',
  x: '𝕏',
  web: '🌐',
  github: '⌘',
  rss: '◉',
  arxiv: '📄',
};

export default function DashboardPage() {
  const stats = getStats();
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();

  // Group leaders by tier for the curated list
  const topLeaders = profiles.filter(l => l.tier === 'top');
  const midLeaders = profiles.filter(l => l.tier === 'established');
  const lowLeaders = profiles.filter(l => l.tier === 'rising' || l.tier === 'emerging');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Convergence Signal</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Tracking what independent minds are converging on
          </p>
          <p className="text-base text-muted-foreground mt-1">
            <span className="font-mono">@lazerhawk5000</span>
          </p>
        </div>
        <TextSizeToggle />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold font-mono">{stats.patternCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Convergence Patterns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold font-mono text-emerald-400">{stats.strongPatterns}</p>
            <p className="text-sm text-muted-foreground mt-1">Strong Signals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold font-mono">{stats.leaderCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Curated Leaders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold font-mono">{stats.platforms}</p>
            <p className="text-sm text-muted-foreground mt-1">Source Platforms</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="patterns" className="text-base">Patterns</TabsTrigger>
          <TabsTrigger value="leaders" className="text-base">Curated Leaders</TabsTrigger>
          <TabsTrigger value="changes" className="text-base">What Changed</TabsTrigger>
        </TabsList>

        {/* ── Patterns Tab ── */}
        <TabsContent value="patterns" className="space-y-3">
          {patterns.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-lg text-muted-foreground">No patterns yet. Run the pipeline first.</CardContent></Card>
          ) : patterns.map(p => (
            <Link href={`/pattern/${p.id}`} key={p.id} className="block">
              <Card className="hover:border-zinc-600 transition-colors">
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={
                          p.convergence_type === 'solution' ? 'border-emerald-500/30 text-emerald-400' :
                          p.convergence_type === 'problem' ? 'border-red-500/30 text-red-400' :
                          'border-purple-500/30 text-purple-400'
                        }>
                          {p.convergence_type}
                        </Badge>
                        {p.stability_weeks >= 4 && <Badge variant="outline" className="border-zinc-600 text-zinc-400">stable</Badge>}
                      </div>
                      <h3 className="font-medium text-base leading-snug">{p.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.creator_ids.length} sources · {p.vector_ids.length} vectors · {p.stability_weeks}w stable
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-mono font-bold ${ciColor(p.ci_score)}`}>
                        {p.ci_score.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">CI Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </TabsContent>

        {/* ── Curated Leaders Tab ── */}
        <TabsContent value="leaders" className="space-y-8">
          {profiles.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-lg text-muted-foreground">No leader profiles yet. Run the pipeline first.</CardContent></Card>
          ) : (
            <>
              {/* TOP tier */}
              {topLeaders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-emerald-400">Top Tier</h3>
                  <div className="space-y-2">
                    {topLeaders.map(l => <LeaderRow key={l.id} leader={l} />)}
                  </div>
                </div>
              )}

              {/* MID tier */}
              {midLeaders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Mid Tier</h3>
                  <div className="space-y-2">
                    {midLeaders.map(l => <LeaderRow key={l.id} leader={l} />)}
                  </div>
                </div>
              )}

              {/* LOW tier */}
              {lowLeaders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-400">Emerging</h3>
                  <div className="space-y-2">
                    {lowLeaders.slice(0, 20).map(l => <LeaderRow key={l.id} leader={l} />)}
                  </div>
                  {lowLeaders.length > 20 && (
                    <p className="text-sm text-muted-foreground mt-3">+{lowLeaders.length - 20} more emerging leaders</p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── What Changed Tab ── */}
        <TabsContent value="changes" className="space-y-6">
          {!diff ? (
            <Card><CardContent className="py-10 text-center text-lg text-muted-foreground">No diff data yet. Need at least 2 pipeline runs.</CardContent></Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{diff.date} vs {diff.previous_date} · {diff.summary}</p>

              {diff.new_patterns.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-emerald-400">Emerging Signal ({diff.new_patterns.length})</h3>
                  {diff.new_patterns.map(p => (
                    <Card key={p.lineage_id} className="mb-2">
                      <CardContent className="py-4 flex justify-between items-center">
                        <span className="text-base">{p.label}</span>
                        <span className="font-mono text-sm text-emerald-400">CI: {p.ci_score.toFixed(2)}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {diff.accelerating.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-amber-400">Accelerating ({diff.accelerating.length})</h3>
                  {diff.accelerating.map(p => (
                    <Card key={p.lineage_id} className="mb-2">
                      <CardContent className="py-4 flex justify-between items-center">
                        <span className="text-base">{p.label}</span>
                        <span className="font-mono text-sm">
                          {p.ci_before.toFixed(2)} → <span className="text-amber-400">{p.ci_after.toFixed(2)}</span>
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {diff.decaying && diff.decaying.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-orange-400">Decaying ({diff.decaying.length})</h3>
                  {diff.decaying.map(p => (
                    <Card key={p.lineage_id} className="mb-2">
                      <CardContent className="py-4 flex justify-between items-center">
                        <span className="text-base">{p.label}</span>
                        <span className="font-mono text-sm">
                          {p.ci_before.toFixed(2)} → <span className="text-orange-400">{p.ci_after.toFixed(2)}</span>
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {diff.died.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-500">Fading Signal ({diff.died.length})</h3>
                  {diff.died.map(p => (
                    <Card key={p.lineage_id} className="mb-2 border-zinc-800">
                      <CardContent className="py-4 flex justify-between items-center">
                        <span className="text-base text-muted-foreground">{p.label}</span>
                        <span className="font-mono text-sm text-zinc-600">tracked {p.age_days}d</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {diff.stable.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-400">Stable ({diff.stable.length})</h3>
                  {diff.stable.map(p => (
                    <Card key={p.lineage_id} className="mb-2">
                      <CardContent className="py-4 flex justify-between items-center">
                        <span className="text-base text-muted-foreground">{p.label}</span>
                        <span className="font-mono text-sm text-zinc-500">CI: {p.ci_score.toFixed(2)}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Separator className="my-10" />
      <footer className="text-sm text-muted-foreground text-center pb-8">
        Convergence Signal · <span className="font-mono">trenddistill</span> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}

/* ── Leader Row Component ── */
function LeaderRow({ leader }: { leader: ReturnType<typeof getRPGProfiles>[number] }) {
  const source = primarySource(leader);
  const emoji = source ? (PLATFORM_EMOJI[source.platform] ?? '·') : '';

  return (
    <Link href={`/leader/${leader.id}`} className="block">
      <Card className="hover:border-zinc-600 transition-colors">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Name + type badge */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-base truncate">{leader.name}</h3>
                  <Badge variant="secondary" className={`${typeColor(leader.leader_type)} text-xs shrink-0`}>
                    {leader.leader_type}
                  </Badge>
                  {leader.influence_trajectory === 'rising' && <span className="text-emerald-400 text-sm shrink-0">↑</span>}
                  {leader.influence_trajectory === 'declining' && <span className="text-red-400 text-sm shrink-0">↓</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {leader.content_type_tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs text-muted-foreground">{tag}</span>
                  ))}
                  <span className="text-xs text-muted-foreground">· {leader.convergence_patterns.length} patterns</span>
                </div>
              </div>
            </div>

            {/* Primary source link */}
            <div className="flex items-center gap-3 shrink-0">
              {source && source.url !== '#' && (
                <span className="text-sm text-muted-foreground font-mono flex items-center gap-1.5">
                  <span>{emoji}</span>
                  <span className="hidden sm:inline">{source.platform}</span>
                </span>
              )}
              <span className="font-mono text-base font-bold w-14 text-right">{leader.leader_score.toFixed(3)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
