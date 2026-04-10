import Image from 'next/image';
import Link from 'next/link';
import { getAudits } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

// Task #34 — public audit gallery.
//
// Card-based layout with hypercard thumbnails. Each card shows the
// hypercard image (scaled), claim text, author, posted date, and a
// "sources probed" count when available. The hypercard visual design
// is scheduled for a redesign — this layout is built to accept
// whatever the new optics produce without structural changes.

export const revalidate = 14400;

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toISOString().slice(0, 10);
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return fmtDate(iso);
}

export default async function AuditsGalleryPage() {
  const audits = getAudits();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">
        &larr; Back
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight mb-2">Audit Feed</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Public record of every signal/noise audit shipped by Verg.
          Each card links to the full detail page with the hypercard,
          probe measurements, and lifecycle events.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs font-mono text-muted-foreground">
            {audits.length} shipped
          </span>
          <span className="text-xs text-muted-foreground">
            ·
          </span>
          <Link
            href="/protocol"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            methodology
          </Link>
        </div>
      </div>

      {audits.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audits shipped yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {audits.map(a => (
            <Link
              key={a.audit_id}
              href={`/audits/${a.audit_id}`}
              className="group block border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors"
            >
              {/* Hypercard thumbnail */}
              {a.hypercard_url && (
                <div className="relative bg-zinc-950">
                  <Image
                    src={a.hypercard_url}
                    alt={`Audit hypercard for ${a.source_author ?? a.audit_id.slice(0, 8)}`}
                    width={720}
                    height={480}
                    className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity"
                    unoptimized
                  />
                </div>
              )}

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {a.source_author && (
                    <span className="text-xs font-mono text-emerald-400">
                      @{a.source_author}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {timeAgo(a.posted_at)}
                  </span>
                </div>

                <p className="text-sm font-medium line-clamp-2 mb-3 text-foreground/90">
                  {a.claim_text}
                </p>

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {a.cited_snapshots.length > 0 && (
                    <span>
                      {a.cited_snapshots.length} source{a.cited_snapshots.length === 1 ? '' : 's'} probed
                    </span>
                  )}
                  {a.source_platform && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground border-zinc-700">
                      {a.source_platform}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-zinc-800 text-[10px] text-muted-foreground space-y-1">
        <p>
          {audits.length} audit{audits.length === 1 ? '' : 's'} shipped.
          Each audit measures signal/noise against Verg&apos;s open rubric — see{' '}
          <Link href="/protocol" className="hover:underline">the protocol</Link>.
        </p>
      </div>
    </main>
  );
}
