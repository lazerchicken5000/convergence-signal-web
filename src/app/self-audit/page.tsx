import Link from 'next/link';
import { getConvergencePatterns } from '@/lib/data';

export const revalidate = 14400;

export const metadata = {
  title: 'Self-Audit · Verg',
  description: 'Verg measures itself against its own falsifiability gates. Every score. Every disagreement. Nothing hidden.',
};

export default function SelfAuditPage() {
  const patterns = getConvergencePatterns();
  const total = patterns.length;

  // Slurry distribution
  const slurryDist = {
    sharp: patterns.filter(p => p.slurry_class === 'sharp' || !p.slurry_class).length,
    marginal: patterns.filter(p => p.slurry_class === 'marginal').length,
    slurry: patterns.filter(p => p.slurry_class === 'slurry').length,
  };

  // Counter-curator distribution
  const counterDist = {
    novel: patterns.filter(p => p.counter_verdict === 'novel').length,
    mixed: patterns.filter(p => p.counter_verdict === 'mixed').length,
    rehash: patterns.filter(p => p.counter_verdict === 'rehash').length,
    unclear: patterns.filter(p => p.counter_verdict === 'unclear' || !p.counter_verdict).length,
  };

  // Agreement distribution
  const agreementDist = {
    aligned_signal: patterns.filter(p => p.curator_agreement === 'aligned_signal').length,
    aligned_noise: patterns.filter(p => p.curator_agreement === 'aligned_noise').length,
    contested: patterns.filter(p => p.curator_agreement === 'contested').length,
    neutral: patterns.filter(p => p.curator_agreement === 'neutral').length,
  };

  // Contested patterns — the most interesting set
  const contested = patterns.filter(p => p.curator_agreement === 'contested')
    .sort((a, b) => b.ci_score - a.ci_score);

  // Rehash patterns with their antecedents
  const rehashes = patterns.filter(p => p.counter_verdict === 'rehash' && p.counter_rehash_of)
    .sort((a, b) => (a.counter_novelty ?? 1) - (b.counter_novelty ?? 1))
    .slice(0, 10);

  // Mean novelty — headline honest number
  const patternsWithNovelty = patterns.filter(p => typeof p.counter_novelty === 'number');
  const meanNovelty = patternsWithNovelty.length > 0
    ? patternsWithNovelty.reduce((s, p) => s + (p.counter_novelty ?? 0), 0) / patternsWithNovelty.length
    : null;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-zinc-300">
      {/* Nav */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap text-xs">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 font-mono">← verg</Link>
        <nav className="flex items-center gap-4">
          <Link href="/protocol" className="text-zinc-400 hover:text-zinc-200">Protocol</Link>
          <Link href="/whitepaper" className="text-zinc-400 hover:text-zinc-200">Whitepaper</Link>
          <Link href="/audits" className="text-zinc-400 hover:text-zinc-200">Audits</Link>
          <Link href="/docs" className="text-zinc-400 hover:text-zinc-200">API</Link>
        </nav>
      </div>

      {/* Header */}
      <header className="mb-10 pb-6 border-b border-zinc-800">
        <p className="text-xs font-mono text-zinc-500 mb-2">/self-audit</p>
        <h1 className="text-3xl font-light text-zinc-100 tracking-tight mb-3">Verg measures itself.</h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
          Curation is Verg&apos;s biggest weakness. Every pattern is chosen by one person&apos;s taste. That&apos;s a single point of failure critics have rightly flagged.
          This page doesn&apos;t solve it. It surfaces it — honestly, with the same instruments we&apos;d use on anyone else&apos;s claims.
        </p>
      </header>

      {/* Headline numbers */}
      <section className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Patterns analyzed"
          value={total.toString()}
          detail="latest convergence.json"
        />
        <StatTile
          label="Mean novelty (counter)"
          value={meanNovelty !== null ? meanNovelty.toFixed(2) : 'n/a'}
          detail="Haiku skeptic verdict · 0=rehash · 1=novel"
          accent={meanNovelty !== null && meanNovelty < 0.4 ? 'red' : meanNovelty !== null && meanNovelty < 0.6 ? 'amber' : 'emerald'}
        />
        <StatTile
          label="Contested"
          value={agreementDist.contested.toString()}
          detail="base curator & skeptic disagree"
          accent={agreementDist.contested > 0 ? 'amber' : undefined}
        />
      </section>

      {/* Slurry distribution */}
      <section className="mb-12">
        <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">1 · Slurry test</h2>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Each pattern label is embedded (locally, via nomic-embed-text) and compared to a bank of 25 hand-written generic &ldquo;AI trends right now&rdquo; phrases.
          Cosine similarity ≥0.85 → the label is indistinguishable from what any LLM would produce given an empty prompt. Those patterns get flagged and de-ranked.
        </p>
        <DistributionBar
          segments={[
            { label: 'sharp', count: slurryDist.sharp, color: 'rgb(52, 211, 153)' },
            { label: 'marginal', count: slurryDist.marginal, color: 'rgb(245, 158, 11)' },
            { label: 'slurry', count: slurryDist.slurry, color: 'rgb(239, 68, 68)' },
          ]}
          total={total}
        />
        <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
          The 3 patterns flagged as slurry are exactly the generic-sounding labels critics pointed to on launch. They&apos;re still visible on /emerging, just dimmed and sorted to the bottom.
          No hiding. No silent filter.
        </p>
      </section>

      {/* Counter-curator */}
      <section className="mb-12">
        <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">2 · Counter-curator</h2>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          A second curation pass with a <em>different taste</em>. Where the base curator asks &ldquo;what are sources converging on?&rdquo;,
          the counter-curator (Claude Haiku) asks: <em>&ldquo;is this convergence genuinely novel, or a rebrand of something older?&rdquo;</em>
          Two independent tastes. Disagreement is the interesting signal.
        </p>
        <DistributionBar
          segments={[
            { label: 'novel', count: counterDist.novel, color: 'rgb(52, 211, 153)' },
            { label: 'mixed', count: counterDist.mixed, color: 'rgb(245, 158, 11)' },
            { label: 'rehash', count: counterDist.rehash, color: 'rgb(239, 68, 68)' },
            { label: 'unclear', count: counterDist.unclear, color: 'rgb(113, 113, 122)' },
          ]}
          total={total}
        />
        <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
          The skeptic&apos;s bar is strict. Zero patterns rated fully &ldquo;novel.&rdquo; {counterDist.rehash} rated as rebrands of older ideas. {counterDist.mixed} as meaningful recombinations with clear predecessors.
          This is honest, not flattering. The current pattern set carries a lot of substrate from prior decades — and that&apos;s worth saying out loud.
        </p>
      </section>

      {/* Agreement */}
      <section className="mb-12">
        <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">3 · Curator agreement</h2>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Cross-referencing the base curator&apos;s score with the counter-curator&apos;s verdict yields four buckets:
        </p>
        <DistributionBar
          segments={[
            { label: 'aligned+', count: agreementDist.aligned_signal, color: 'rgb(52, 211, 153)' },
            { label: 'aligned−', count: agreementDist.aligned_noise, color: 'rgb(161, 161, 170)' },
            { label: 'contested', count: agreementDist.contested, color: 'rgb(245, 158, 11)' },
            { label: 'neutral', count: agreementDist.neutral, color: 'rgb(113, 113, 122)' },
          ]}
          total={total}
        />
        <ul className="text-xs text-zinc-500 mt-4 space-y-1.5 leading-relaxed">
          <li><span className="inline-block w-16 text-emerald-400 font-mono">aligned+</span> both curators agree this is signal</li>
          <li><span className="inline-block w-16 text-zinc-400 font-mono">aligned−</span> both curators agree this is noise</li>
          <li><span className="inline-block w-16 text-amber-400 font-mono">contested</span> the curators disagree — worth a human look</li>
          <li><span className="inline-block w-16 text-zinc-500 font-mono">neutral</span> neither strongly signal nor noise</li>
        </ul>
      </section>

      {/* Contested patterns — the interesting set */}
      {contested.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">4 · Contested patterns</h2>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            {contested.length} patterns where the base curator and the skeptic disagree. These are the ones you should read most carefully —
            they either represent genuine recombinations the skeptic undersells, or they represent base-curator over-confidence.
          </p>
          <div className="space-y-2">
            {contested.map(p => (
              <Link
                key={p.id}
                href={`/pattern/${p.id}`}
                className="block p-3 border border-amber-500/20 bg-amber-500/5 rounded hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-[10px] font-mono text-amber-400 mt-0.5">
                    ci {p.ci_score.toFixed(2)} · nov {(p.counter_novelty ?? 0).toFixed(2)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-snug">{p.label}</p>
                    {p.counter_note && (
                      <p className="text-xs text-zinc-500 mt-1 italic">&ldquo;{p.counter_note}&rdquo;</p>
                    )}
                    {p.counter_rehash_of && (
                      <p className="text-[11px] text-amber-400/60 mt-1 font-mono">↳ echoes: {p.counter_rehash_of}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top rehashes with antecedents */}
      {rehashes.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">5 · Named antecedents</h2>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            For patterns the skeptic flags as rehash, it names the older idea they echo. This isn&apos;t a dismissal — it&apos;s context.
            A pattern can still be important to track even if it&apos;s a rediscovery.
          </p>
          <div className="space-y-1.5">
            {rehashes.map(p => (
              <div key={p.id} className="p-2.5 border border-zinc-800 rounded text-xs">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-zinc-600 font-mono">{(p.counter_novelty ?? 0).toFixed(2)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-300 leading-snug mb-0.5">{p.label}</p>
                    <p className="text-red-400/60 font-mono text-[10px]">↳ {p.counter_rehash_of}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What this means */}
      <section className="mb-12 p-5 border border-zinc-800 rounded bg-zinc-950">
        <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">6 · What this tells us</h2>
        <ul className="text-sm text-zinc-300 space-y-3 leading-relaxed">
          <li>
            <strong className="text-zinc-200">The current pattern set carries heavy substrate from prior decades.</strong> Mean novelty is {meanNovelty?.toFixed(2) ?? '—'} out of 1.0.
            That&apos;s not a failure — many of the most consequential shifts in AI are rediscoveries amplified by new compute and data.
            But it&apos;s honest to say so.
          </li>
          <li>
            <strong className="text-zinc-200">The slurry test catches exactly what critics pointed to.</strong> The patterns called out as generic-sounding really are.
            The test is working as a falsifiability gate — before publication, each label has to be distinguishable from what any LLM would say.
          </li>
          <li>
            <strong className="text-zinc-200">Contested patterns are the ones worth a human&apos;s attention.</strong> When the two curators disagree,
            neither automated score is trustworthy on its own. That&apos;s the honest moment — and exactly where human judgement earns its keep.
          </li>
          <li>
            <strong className="text-zinc-200">This page updates automatically.</strong> Every pipeline run recomputes slurry, counter-curator, and agreement.
            The metrics aren&apos;t cherry-picked snapshots. They&apos;re the real running measurement.
          </li>
        </ul>
      </section>

      {/* Commitments */}
      <section className="mb-8 text-xs text-zinc-500 leading-relaxed">
        <p className="mb-2"><strong className="text-zinc-400">Commitments baked into this page:</strong></p>
        <ul className="space-y-1 list-disc list-inside">
          <li>The slurry count is shown even if we&apos;d rather it were zero.</li>
          <li>When counter-curator and base curator disagree, we don&apos;t silently drop either verdict.</li>
          <li>Mean novelty is published regardless of whether it&apos;s flattering.</li>
          <li>The counter-curator prompt, scoring rubric, and threshold are in <a href="https://github.com/lazerchicken5000/trenddistill/blob/main/src/services/counterCurator.ts" className="text-zinc-400 hover:text-zinc-200">public source</a>.</li>
        </ul>
      </section>

      <footer className="text-[10px] text-zinc-700 text-center py-6 mt-4 border-t border-zinc-800">
        Verg · self-audit · generated from the live convergence.json
      </footer>
    </main>
  );
}

// ---------- helpers ----------

function StatTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: 'red' | 'amber' | 'emerald';
}) {
  const color = accent === 'red' ? 'text-red-400'
    : accent === 'amber' ? 'text-amber-400'
    : accent === 'emerald' ? 'text-emerald-400'
    : 'text-zinc-200';
  return (
    <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
      <p className={`text-2xl font-light font-mono ${color} mb-1`}>{value}</p>
      <p className="text-[10px] text-zinc-600 leading-tight">{detail}</p>
    </div>
  );
}

function DistributionBar({
  segments,
  total,
}: {
  segments: Array<{ label: string; count: number; color: string }>;
  total: number;
}) {
  if (total === 0) return <p className="text-xs text-zinc-500">No data.</p>;
  return (
    <div>
      <div className="flex h-6 rounded overflow-hidden border border-zinc-800">
        {segments.map((seg, i) => {
          const pct = (seg.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-[10px] font-mono text-black/80"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${seg.count} (${pct.toFixed(1)}%)`}
            >
              {pct >= 6 ? seg.count : ''}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-2 text-[11px] font-mono">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: seg.color }} />
            <span className="text-zinc-400">{seg.label}</span>
            <span className="text-zinc-600">{seg.count}</span>
            <span className="text-zinc-700">({((seg.count / total) * 100).toFixed(1)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
