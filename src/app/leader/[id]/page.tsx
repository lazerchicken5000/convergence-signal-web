import { getRPGProfile, getRPGProfiles, getLeaderLinks, getLeaderContribution, getLeaderSourcedContributions } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlatformLinks, SourceLinks } from '@/components/source-links';
import { RPGCard, ContributionTypeBadge, EntityTypeBadge, deriveAccolades, AccoladeBadges } from '@/components/rpg-card';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 14400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const profiles = getRPGProfiles();
  return profiles.map(p => ({ id: p.id }));
}

export default async function LeaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leader = getRPGProfile(id);
  if (!leader) notFound();

  const contrib = getLeaderContribution(leader);
  const links = getLeaderLinks(leader);
  const sourcedContent = getLeaderSourcedContributions(leader.id);
  const accolades = deriveAccolades(leader);
  const themes = leader.recurring_themes.sort((a, b) => b.frequency - a.frequency).slice(0, 6);

  const tierColors: Record<string, string> = {
    top: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    established: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rising: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerging: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  const trajIcon = leader.influence_trajectory === 'rising' ? '↑'
    : leader.influence_trajectory === 'declining' ? '↓' : '→';
  const trajColor = leader.influence_trajectory === 'rising' ? 'text-emerald-400'
    : leader.influence_trajectory === 'declining' ? 'text-red-400' : 'text-zinc-400';

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">&larr; Back</Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={tierColors[leader.tier] ?? tierColors.emerging}>{leader.tier}</Badge>
          <ContributionTypeBadge type={contrib.contributionType} />
          <EntityTypeBadge entityType={leader.entity_type} />
          <span className={`text-sm ${trajColor}`}>{trajIcon} {leader.influence_trajectory}</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">{leader.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {leader.domains.join(', ')} · tracked {leader.tenure_weeks}w
        </p>
      </div>

      {/* Accolades */}
      {accolades.length > 0 && (
        <div className="mb-4">
          <AccoladeBadges accolades={accolades} />
        </div>
      )}

      {/* Contribution Profile (RPG Card) */}
      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Contribution Profile</CardTitle></CardHeader>
        <CardContent>
          <RPGCard contribution={contrib} />
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-zinc-800 rounded-lg py-3 text-center">
          <p className="text-xl font-mono font-bold">{leader.leader_score.toFixed(3)}</p>
          <p className="text-[10px] text-muted-foreground">Leader Score</p>
        </div>
        <div className="border border-zinc-800 rounded-lg py-3 text-center">
          <p className="text-xl font-mono font-bold">{leader.convergence_patterns.length}</p>
          <p className="text-[10px] text-muted-foreground">Active Patterns</p>
        </div>
        <div className="border border-zinc-800 rounded-lg py-3 text-center">
          <p className="text-xl font-mono font-bold">{leader.polysource_score.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Polysource</p>
        </div>
      </div>

      {/* Platform Links */}
      {links.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Links</CardTitle></CardHeader>
          <CardContent>
            <PlatformLinks links={links} />
          </CardContent>
        </Card>
      )}

      {/* Sourced Contributions */}
      {sourcedContent.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sourced Contributions</CardTitle></CardHeader>
          <CardContent>
            <SourceLinks sources={sourcedContent} />
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
                  {t.topic} <span className="text-muted-foreground ml-1">&times;{t.frequency}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content tags */}
      {leader.content_type_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {leader.content_type_tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{tag}</span>
          ))}
        </div>
      )}

      <Separator className="my-8" />
      <footer className="text-xs text-muted-foreground text-center pb-8">
        <Link href="/" className="underline">Verg</Link> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
