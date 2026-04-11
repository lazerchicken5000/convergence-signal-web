import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAudit, getAudits, type AuditCitedSnapshot } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Phase 7g — per-audit permalink page.
//
// Reads the audit from data/audit-web-ledger.json (produced by
// lazerforge-engine's scripts/export-audits-to-web.ts). The hypercard
// PNG is the hero — it's the canonical shareable measurement artifact
// and matches what was posted to X. Everything below the hero expands
// the fields that don't fit on the card: the full draft text, the
// event trail, and the probe table for any cited snapshots.

export const revalidate = 14400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getAudits().map(a => ({ id: a.audit_id }));
}

function fmtPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toISOString().slice(0, 10);
}

function ProbeRow({ snapshot }: { snapshot: AuditCitedSnapshot }) {
  const p = snapshot.probe;
  return (
    <tr className="border-t border-zinc-800">
      <td className="py-2 pr-3 max-w-[280px]">
        <a
          href={snapshot.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:underline block truncate"
          title={snapshot.url}
        >
          {snapshot.title ?? snapshot.url}
        </a>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {snapshot.domain} · {snapshot.content_class}
        </div>
      </td>
      <td className="py-2 px-2 text-center font-mono text-xs">{fmtPct(p?.signal_aggregate ?? null)}</td>
      <td className="py-2 px-2 text-center font-mono text-xs">{fmtPct(p?.falsifiability ?? null)}</td>
      <td className="py-2 px-2 text-center font-mono text-xs">{fmtPct(p?.primary_source_density ?? null)}</td>
      <td className="py-2 px-2 text-center font-mono text-xs">{fmtPct(p?.depth_score ?? null)}</td>
      <td className="py-2 px-2 text-center font-mono text-xs">{fmtPct(p?.specificity ?? null)}</td>
    </tr>
  );
}

interface PatternMatch {
  patternId: string;
  patternLabel: string;
  patternDescription?: string;
  ciScore?: number;
}

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const audit = getAudit(id);
  if (!audit) notFound();

  const evidence = audit.evidence as { matches?: PatternMatch[] } | null;
  const patternMatches = evidence?.matches ?? [];

  const authorX =
    audit.source_author && audit.source_platform === 'x'
      ? `https://x.com/${audit.source_author}`
      : null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/audits" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">
        &larr; All audits
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
            {audit.current_status}
          </Badge>
          {audit.source_platform && (
            <Badge variant="outline" className="text-muted-foreground">
              {audit.source_platform}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            posted {fmtDate(audit.posted_at)}
          </span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight mb-2">
          {audit.claim_text}
        </h1>
        {audit.source_author && (
          <p className="text-xs text-muted-foreground">
            claim by{' '}
            {authorX ? (
              <a href={authorX} target="_blank" rel="noopener noreferrer" className="hover:underline">
                @{audit.source_author}
              </a>
            ) : (
              <span>@{audit.source_author}</span>
            )}
            {audit.source_url && (
              <>
                {' · '}
                <a
                  href={audit.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  source
                </a>
              </>
            )}
          </p>
        )}
      </div>

      {/* Hypercard hero */}
      {audit.hypercard_url && (
        <div className="mb-6 rounded-lg overflow-hidden border border-zinc-800">
          <Image
            src={audit.hypercard_url}
            alt={`Verg audit hypercard for ${audit.audit_id}`}
            width={1440}
            height={960}
            className="w-full h-auto"
            priority
            unoptimized
          />
        </div>
      )}

      {/* Matched convergence patterns */}
      {patternMatches.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Matched patterns ({patternMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patternMatches.map(m => (
                <Link
                  key={m.patternId}
                  href={`/pattern/${m.patternId}`}
                  className="block text-xs hover:bg-zinc-800/50 rounded p-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {typeof m.ciScore === 'number' ? m.ciScore.toFixed(2) : '—'}
                    </span>
                    <span className="text-zinc-300">{m.patternLabel}</span>
                  </div>
                  {m.patternDescription && m.patternDescription !== m.patternLabel && (
                    <p className="text-[10px] text-zinc-600 line-clamp-2 ml-10">{m.patternDescription}</p>
                  )}
                </Link>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Patterns are converging topics detected by Verg from independent sources.
              A match means this claim touches the same space.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Draft reply text */}
      {audit.draft_text && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reply posted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap font-mono">{audit.draft_text}</p>
            {audit.remote_post_url && (
              <a
                href={audit.remote_post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground mt-3 inline-block"
              >
                view on X &rarr;
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cited snapshots + probe data */}
      {audit.cited_snapshots.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Source links probed ({audit.cited_snapshots.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground text-[10px] uppercase">
                  <th className="py-2 pr-3">source</th>
                  <th className="py-2 px-2 text-center">signal</th>
                  <th className="py-2 px-2 text-center">testable</th>
                  <th className="py-2 px-2 text-center">primary</th>
                  <th className="py-2 px-2 text-center">depth</th>
                  <th className="py-2 px-2 text-center">specificity</th>
                </tr>
              </thead>
              <tbody>
                {audit.cited_snapshots.map(s => (
                  <ProbeRow key={s.snapshot_id} snapshot={s} />
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground mt-3">
              Probe axes measured against the exact body slice each source fetcher captured. Percentages are mapped from the probe&rsquo;s [0, 1] axis scores.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Event timeline */}
      {audit.events.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5">
              {audit.events.map((e, i) => (
                <li key={i} className="flex items-start gap-3 text-xs">
                  <span className="text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                    {e.created_at.slice(0, 16).replace('T', ' ')}
                  </span>
                  <span className="text-foreground/90">{e.event_type}</span>
                  {e.error_message && (
                    <span className="text-red-400/80 text-[10px]">{e.error_message}</span>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      <div className="text-[10px] text-muted-foreground space-y-1">
        <p>audit_id: <span className="font-mono">{audit.audit_id}</span></p>
        <p>
          This is a public audit record produced by Verg&rsquo;s signal/noise probe. See{' '}
          <Link href="/protocol" className="hover:underline">the protocol page</Link>{' '}
          for methodology, and <Link href="/audits" className="hover:underline">all audits</Link>{' '}
          for the feed.
        </p>
      </div>
    </main>
  );
}
