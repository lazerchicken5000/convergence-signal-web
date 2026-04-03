import { getConvergencePattern, getConvergencePatterns, getPatternSources, getPatternTokenCost, getPatternSignalQuality } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SourceLinks } from '@/components/source-links';
import { SignalBadges, TokenCostDetail } from '@/components/signal-badges';
import { PatternFeedback } from '@/components/source-audit';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 14400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const patterns = getConvergencePatterns();
  return patterns.map(p => ({ id: p.id }));
}

export default async function PatternPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pattern = getConvergencePattern(id);
  if (!pattern) notFound();

  const cost = getPatternTokenCost(pattern);
  const signal = getPatternSignalQuality(pattern);
  const sources = getPatternSources(pattern.vector_ids, 10);

  const ciColor = pattern.ci_score >= 0.7 ? 'text-emerald-400'
    : pattern.ci_score >= 0.4 ? 'text-amber-400'
    : pattern.ci_score >= 0.2 ? 'text-orange-400' : 'text-zinc-500';

  const typeColor = pattern.convergence_type === 'solution' ? 'border-emerald-500/30 text-emerald-400'
    : pattern.convergence_type === 'problem' ? 'border-red-500/30 text-red-400'
    : 'border-purple-500/30 text-purple-400';

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">&larr; Back</Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className={typeColor}>{pattern.convergence_type}</Badge>
          <SignalBadges quality={signal} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{pattern.label}</h1>
        {pattern.description && <p className="text-sm text-muted-foreground mt-2">{pattern.description}</p>}
      </div>

      {/* Metrics + Token Cost side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-zinc-800 rounded-lg py-3 text-center">
            <p className={`text-xl font-mono font-bold ${ciColor}`}>{pattern.ci_score.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">CI Score</p>
          </div>
          <div className="border border-zinc-800 rounded-lg py-3 text-center">
            <p className="text-xl font-mono font-bold">{pattern.creator_ids.length}</p>
            <p className="text-[10px] text-muted-foreground">Sources</p>
          </div>
          <div className="border border-zinc-800 rounded-lg py-3 text-center">
            <p className="text-xl font-mono font-bold">{pattern.independence_score.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Independence</p>
          </div>
        </div>
        <TokenCostDetail cost={cost} />
      </div>

      {pattern.resolution_data?.tier1_summary && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Signal Summary</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{pattern.resolution_data.tier1_summary}</p></CardContent>
        </Card>
      )}

      {pattern.presupposition_set.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Shared Assumptions</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {pattern.presupposition_set.map((p, i) => (
                <li key={i} className="text-sm text-zinc-400 pl-3 border-l border-zinc-700">{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {pattern.presupposition_conflicts.length > 0 && (
        <Card className="mb-4 border-amber-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-400">Tensions</CardTitle></CardHeader>
          <CardContent>
            {pattern.presupposition_conflicts.map((c, i) => (
              <div key={i} className="text-sm mb-2 flex items-start gap-2">
                <span className="text-red-400/60 shrink-0">&harr;</span>
                <span className="text-zinc-400">
                  {c.assumption_a} <span className="text-zinc-600">vs</span> {c.assumption_b}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sources with links */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sources ({sources.length} linked, {pattern.creator_ids.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <SourceLinks sources={sources} patternId={pattern.id} />
          {pattern.creator_ids.length > sources.length && (
            <p className="text-[10px] text-zinc-600 mt-3">
              +{pattern.creator_ids.length - sources.length} additional contributing sources
            </p>
          )}
        </CardContent>
      </Card>

      <div className="my-4">
        <PatternFeedback patternId={pattern.id} />
      </div>

      {pattern.frame_alignment && (
        <p className="text-xs text-zinc-500 mb-4">Frame: {pattern.frame_alignment}</p>
      )}

      <div className="text-xs text-muted-foreground">
        First detected: {pattern.first_detected?.slice(0, 10) ?? 'unknown'} · Last updated: {pattern.last_updated?.slice(0, 10) ?? 'unknown'} · {pattern.stability_weeks}w stable
      </div>

      <Separator className="my-8" />
      <footer className="text-xs text-muted-foreground text-center pb-8">
        <Link href="/" className="underline">Converge</Link> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
