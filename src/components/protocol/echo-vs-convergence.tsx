/**
 * Section 3 SVG: side-by-side comparison of "echo" vs "convergence".
 * Echo: one community amplifies a single node.
 * Convergence: two separate communities arrive at the same conclusion
 *              independently, with no inter-community edges.
 */
export function EchoVsConvergence() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose">
      {/* ECHO */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <p className="text-[11px] uppercase tracking-widest text-red-500/70 font-mono mb-3">Echo — same room</p>
        <svg viewBox="0 0 200 140" className="w-full" style={{ height: 160 }} aria-hidden="true">
          {/* Community boundary blob */}
          <ellipse cx="100" cy="70" rx="78" ry="55" fill="rgba(239,68,68,0.04)" stroke="rgba(239,68,68,0.18)" strokeWidth="0.7" strokeDasharray="2 2" />
          {/* Center node — the "amplified" claim */}
          <circle cx="100" cy="70" r="6" fill="rgba(248,113,113,0.6)" />
          {/* Surrounding nodes amplifying it */}
          {[
            { x: 60, y: 40 }, { x: 140, y: 40 }, { x: 50, y: 95 },
            { x: 150, y: 95 }, { x: 100, y: 30 }, { x: 100, y: 110 },
          ].map((n, i) => (
            <g key={i}>
              <line x1={n.x} y1={n.y} x2="100" y2="70" stroke="rgba(248,113,113,0.35)" strokeWidth="0.8" />
              <circle cx={n.x} cy={n.y} r="3" fill="rgba(248,113,113,0.5)" />
            </g>
          ))}
          {/* "amplification" arrows */}
        </svg>
        <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
          Same community, mutual citations, growing volume. <span className="text-zinc-600">High virality. Low information value.</span>
        </p>
      </div>

      {/* CONVERGENCE */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <p className="text-[11px] uppercase tracking-widest text-emerald-500/70 font-mono mb-3">Convergence — different rooms</p>
        <svg viewBox="0 0 200 140" className="w-full" style={{ height: 160 }} aria-hidden="true">
          {/* Two separated community blobs */}
          <ellipse cx="50" cy="55" rx="40" ry="30" fill="rgba(96,165,250,0.04)" stroke="rgba(96,165,250,0.2)" strokeWidth="0.7" strokeDasharray="2 2" />
          <ellipse cx="150" cy="85" rx="40" ry="30" fill="rgba(168,85,247,0.04)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.7" strokeDasharray="2 2" />

          {/* Community A nodes */}
          {[{ x: 25, y: 45 }, { x: 50, y: 30 }, { x: 70, y: 50 }, { x: 35, y: 70 }].map((n, i) => (
            <circle key={`a-${i}`} cx={n.x} cy={n.y} r="2.5" fill="rgba(96,165,250,0.5)" />
          ))}
          {/* Highlighted node A */}
          <circle cx="58" cy="65" r="4" fill="rgba(96,165,250,0.95)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />

          {/* Community B nodes */}
          {[{ x: 130, y: 75 }, { x: 155, y: 70 }, { x: 175, y: 95 }, { x: 165, y: 105 }].map((n, i) => (
            <circle key={`b-${i}`} cx={n.x} cy={n.y} r="2.5" fill="rgba(168,85,247,0.5)" />
          ))}
          {/* Highlighted node B */}
          <circle cx="142" cy="78" r="4" fill="rgba(168,85,247,0.95)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />

          {/* Dotted line connecting the two highlighted independent nodes */}
          <line x1="58" y1="65" x2="142" y2="78" stroke="rgba(52,211,153,0.7)" strokeWidth="0.9" strokeDasharray="2 1.5" />

          {/* Center marker — the shared conclusion */}
          <circle cx="100" cy="71.5" r="2.2" fill="rgba(52,211,153,1)" />
        </svg>
        <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
          Different communities, no shared citations, same conclusion. <span className="text-emerald-500/80">The dotted line is the signal.</span>
        </p>
      </div>
    </div>
  );
}
