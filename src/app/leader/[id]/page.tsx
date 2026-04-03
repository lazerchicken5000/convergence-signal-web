import { getRPGProfile, getRPGProfiles, getLeaderLinks } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlatformLinks } from '@/components/source-links';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 14400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const profiles = getRPGProfiles();
  return profiles.map(p => ({ id: p.id }));
}

const SIGNAL_LABELS: Record<string, string> = {
  content_volume: 'Content Volume',
  vector_participation: 'Vector Participation',
  cross_source_mentions: 'Cross-Source Mentions',
  convergence_centrality: 'Convergence Centrality',
  independence_contribution: 'Independence',
  debate_participation: 'Debate Participation',
};

function barColor(value: number) {
  if (value > 0.5) return 'bg-emerald-500';
  if (value > 0.2) return 'bg-amber-500';
  return 'bg-zinc-600';
}

export default async function LeaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leader = getRPGProfile(id);
  if (!leader) notFound();

  const tierColors: Record<string, string> = {
    top: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    established: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rising: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerging: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  const trajColor = leader.influence_trajectory === 'rising' ? 'text-emerald-400'
    : leader.influence_trajectory === 'declining' ? 'text-red-400' : 'text-zinc-400';
  const trajIcon = leader.influence_trajectory === 'rising' ? '↑'
    : leader.influence_trajectory === 'declining' ? '↓' : '→';

  const platforms = leader.source_types.filter(s => s !== 'citation');
  const themes = leader.recurring_themes.sort((a, b) => b.frequency - a.frequency).slice(0, 6);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">← Back to dashboard</Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={tierColors[leader.tier] ?? tierColors.emerging}>{leader.tier}</Badge>
          <Badge variant="secondary">{leader.leader_type}</Badge>
          <span className={`text-sm ${trajColor}`}>{trajIcon} {leader.influence_trajectory}</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">{leader.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {leader.entity_type} · {leader.domains.join(', ')} · tracked {leader.tenure_weeks}w
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-mono font-bold">{leader.leader_score.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground">Leader Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-mono font-bold">{leader.polysource_score.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Polysource Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-mono font-bold">{leader.convergence_patterns.length}</p>
            <p className="text-xs text-muted-foreground">Active Patterns</p>
          </CardContent>
        </Card>
      </div>

      {/* RPG Stat Bars */}
      <Card className="mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Signal Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(leader.signals).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{SIGNAL_LABELS[key] ?? key}</span>
                <span className="font-mono">{(value * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor(value)}`}
                  style={{ width: `${Math.max(2, value * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Platforms */}
      <Card className="mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Platform Presence</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {platforms.map(p => {
              const pe = leader.platform_engagement[p];
              return (
                <Badge key={p} variant="outline" className="text-xs">
                  {p}
                  {pe?.content_count ? ` · ${pe.content_count} items` : ''}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content type tags */}
      {leader.content_type_tags.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Content Focus</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {leader.content_type_tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recurring Themes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes.map(t => (
                <Badge key={t.topic} variant="outline" className="text-xs font-mono">
                  {t.topic} <span className="text-muted-foreground ml-1">×{t.frequency}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Links */}
      {Object.keys(leader.handles).length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Links</CardTitle></CardHeader>
          <CardContent>
            <PlatformLinks links={getLeaderLinks(leader)} />
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />
      <footer className="text-xs text-muted-foreground text-center pb-8">
        <Link href="/" className="underline">Convergence Signal</Link> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
