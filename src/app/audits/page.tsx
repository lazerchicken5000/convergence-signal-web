import Link from 'next/link';
import { getAudits } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

// Phase 7g — minimal audit index.
//
// This is the unadorned list of shipped audits. The richer gallery
// experience (task #34) builds on top of this — thumbnails, filters,
// per-author SNR badges. For now: a scannable list of permalinks so
// the /audits/[id] pages are reachable.

export const revalidate = 14400;

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toISOString().slice(0, 10);
}

export default async function AuditsIndexPage() {
  const audits = getAudits();

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">
        &larr; Back
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight mb-2">Audits</h1>
        <p className="text-sm text-muted-foreground">
          Shipped Verg signal/noise audits. Each entry is a public record: the
          hypercard image, the draft reply, source links probed against the
          rubric, and the lifecycle events.
        </p>
      </div>

      {audits.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audits shipped yet.</p>
      ) : (
        <ul className="space-y-3">
          {audits.map(a => (
            <li key={a.audit_id}>
              <Link
                href={`/audits/${a.audit_id}`}
                className="block border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px]">
                    {a.current_status}
                  </Badge>
                  {a.source_author && (
                    <span className="text-[10px] text-muted-foreground">
                      @{a.source_author}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {fmtDate(a.posted_at)}
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-2">{a.claim_text}</p>
                {a.cited_snapshots.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {a.cited_snapshots.length} source
                    {a.cited_snapshots.length === 1 ? '' : 's'} probed
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-muted-foreground mt-8">
        {audits.length} audit{audits.length === 1 ? '' : 's'} total.
      </p>
    </main>
  );
}
