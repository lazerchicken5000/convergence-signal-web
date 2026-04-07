/**
 * Section 9 SVG: side-by-side diagram showing the current "single curator"
 * state vs the proposed "council curation" state. Visualizes how multiple
 * independent curators add a meta-validation layer that's the same shape
 * as Verg's existing convergence detection — just one level up.
 */
export function CuratorPaths() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 not-prose">
      {/* TODAY — single curator */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono mb-3">Today — single curator</p>
        <svg viewBox="0 0 280 160" className="w-full" style={{ height: 200 }} aria-hidden="true">
          {/* Curator node */}
          <circle cx="40" cy="80" r="14" fill="rgba(228,228,231,0.12)" stroke="rgba(228,228,231,0.55)" strokeWidth="0.8" />
          <text x="40" y="84" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(228,228,231,0.85)">curator</text>

          {/* Arrow to source list */}
          <line x1="56" y1="80" x2="92" y2="80" stroke="rgba(161,161,170,0.6)" strokeWidth="0.9" />
          <polygon points="92,80 88,77.5 88,82.5" fill="rgba(161,161,170,0.7)" />

          {/* Source list box */}
          <rect x="95" y="55" width="80" height="50" rx="3" fill="rgba(24,24,27,0.7)" stroke="rgba(113,113,122,0.55)" strokeWidth="0.6" />
          <text x="135" y="73" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(228,228,231,0.75)">source list</text>
          <text x="135" y="86" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(113,113,122,0.85)">485+ items</text>
          <text x="135" y="98" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(113,113,122,0.85)">one perspective</text>

          {/* Arrow to patterns */}
          <line x1="178" y1="80" x2="212" y2="80" stroke="rgba(161,161,170,0.6)" strokeWidth="0.9" />
          <polygon points="212,80 208,77.5 208,82.5" fill="rgba(161,161,170,0.7)" />

          {/* Patterns box */}
          <rect x="215" y="55" width="55" height="50" rx="3" fill="rgba(52,211,153,0.06)" stroke="rgba(52,211,153,0.4)" strokeWidth="0.6" />
          <text x="242.5" y="73" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(52,211,153,0.85)">patterns</text>
          <text x="242.5" y="92" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(113,113,122,0.85)">single bias</text>
        </svg>
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Everything downstream inherits the curator&apos;s blind spots. The prediction scorecard reflects this — accuracy is bounded by source-selection bias, not just by convergence-detection quality.
        </p>
      </div>

      {/* COUNCIL — multiple curators */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <p className="text-[11px] uppercase tracking-widest text-emerald-500/70 font-mono mb-3">Council — multiple curators</p>
        <svg viewBox="0 0 280 160" className="w-full" style={{ height: 200 }} aria-hidden="true">
          {/* Three curator nodes (top, mid, bottom) */}
          {[
            { y: 30, color: 'rgba(96,165,250,0.6)' },
            { y: 80, color: 'rgba(168,85,247,0.6)' },
            { y: 130, color: 'rgba(251,191,36,0.6)' },
          ].map((c, i) => (
            <g key={i}>
              <circle cx="30" cy={c.y} r="10" fill="rgba(24,24,27,1)" stroke={c.color} strokeWidth="1" />
              <text x="30" y={c.y + 3} textAnchor="middle" fontSize="7" fontFamily="ui-monospace, monospace" fill={c.color}>C{i + 1}</text>

              {/* Arrow to their own source list */}
              <line x1="42" y1={c.y} x2="68" y2={c.y} stroke={c.color} strokeWidth="0.7" />
              <polygon points={`68,${c.y} 64,${c.y - 2} 64,${c.y + 2}`} fill={c.color} />

              {/* Their source list */}
              <rect x="71" y={c.y - 8} width="60" height="16" rx="2" fill="rgba(24,24,27,0.7)" stroke={c.color} strokeWidth="0.5" />
              <text x="101" y={c.y + 3} textAnchor="middle" fontSize="7" fontFamily="ui-monospace, monospace" fill={c.color}>list {i + 1}</text>

              {/* Arrow to convergence layer */}
              <line x1="134" y1={c.y} x2="170" y2="80" stroke={c.color} strokeWidth="0.6" strokeDasharray="2 2" />
            </g>
          ))}

          {/* Cross-curator convergence layer */}
          <rect x="170" y="55" width="58" height="50" rx="3" fill="rgba(52,211,153,0.06)" stroke="rgba(52,211,153,0.4)" strokeWidth="0.7" strokeDasharray="2 2" />
          <text x="199" y="72" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(52,211,153,0.9)">cross-curator</text>
          <text x="199" y="84" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="rgba(52,211,153,0.9)">convergence</text>
          <text x="199" y="98" textAnchor="middle" fontSize="7" fontFamily="ui-monospace, monospace" fill="rgba(113,113,122,0.85)">≥3 of 3</text>

          {/* Arrow to validated patterns */}
          <line x1="231" y1="80" x2="252" y2="80" stroke="rgba(52,211,153,0.7)" strokeWidth="0.9" />
          <polygon points="252,80 248,77.5 248,82.5" fill="rgba(52,211,153,0.85)" />

          {/* Validated patterns */}
          <circle cx="262" cy="80" r="9" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.7)" strokeWidth="0.8" />
          <text x="262" y="83" textAnchor="middle" fontSize="7" fontFamily="ui-monospace, monospace" fill="rgba(52,211,153,1)">✓</text>
        </svg>
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          When 3+ independent curators include the same source or surface the same pattern, that&apos;s a meta-signal. Same convergence-detection logic Verg already uses for content, applied one layer up.
        </p>
      </div>
    </div>
  );
}
