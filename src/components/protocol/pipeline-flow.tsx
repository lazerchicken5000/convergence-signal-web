/**
 * Section 4 SVG: horizontal flow diagram of the 6 pipeline stages.
 * Compact, responsive: stacks vertically on small screens via CSS grid
 * (the SVG handles the desktop layout; the visual is only meaningful
 * once you can see the whole row, so on mobile we just show the
 * numbered stage labels above the SVG anyway).
 */
export function PipelineFlow() {
  const stages = [
    { num: '1', label: 'Ingest',   desc: '485+ sources' },
    { num: '2', label: 'Distill',  desc: 'local LLM' },
    { num: '3', label: 'Cluster',  desc: 'merge similar' },
    { num: '4', label: 'Detect',   desc: 'find convergence' },
    { num: '5', label: 'Verify',   desc: 'PageRank + Louvain' },
    { num: '6', label: 'Classify', desc: 'signal/frontier/noise' },
  ];

  // Layout constants
  const W = 720;
  const H = 120;
  const colW = W / stages.length;

  return (
    <div className="border border-zinc-800 rounded-lg p-5 not-prose overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[640px]"
        style={{ height: 140 }}
        aria-hidden="true"
      >
        {/* Connecting line through all stages */}
        <line x1="40" y1={H / 2} x2={W - 40} y2={H / 2} stroke="rgba(113,113,122,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />

        {stages.map((stage, i) => {
          const cx = colW * i + colW / 2;
          const cy = H / 2;
          return (
            <g key={stage.num}>
              {/* Stage circle */}
              <circle cx={cx} cy={cy} r="22" fill="rgba(24,24,27,1)" stroke="rgba(212,212,216,0.4)" strokeWidth="0.8" />
              {/* Stage number */}
              <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontFamily="ui-monospace, monospace" fill="rgba(228,228,231,0.85)" fontWeight="500">
                {stage.num}
              </text>
              {/* Label above */}
              <text x={cx} y={cy - 32} textAnchor="middle" fontSize="11" fontFamily="ui-sans-serif, system-ui" fill="rgba(228,228,231,0.85)" fontWeight="600">
                {stage.label}
              </text>
              {/* Sub-description below */}
              <text x={cx} y={cy + 38} textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(113,113,122,0.85)">
                {stage.desc}
              </text>
              {/* Arrow to next stage */}
              {i < stages.length - 1 && (
                <g>
                  <line x1={cx + 22} y1={cy} x2={cx + colW - 22} y2={cy} stroke="rgba(161,161,170,0.5)" strokeWidth="0.9" />
                  <polygon
                    points={`${cx + colW - 22},${cy} ${cx + colW - 26},${cy - 2.5} ${cx + colW - 26},${cy + 2.5}`}
                    fill="rgba(161,161,170,0.7)"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-zinc-600 text-center mt-2">
        Every stage is measurable. Run logs persist as <code className="text-zinc-500">data/ledger/run_history.jsonl</code>.
      </p>
    </div>
  );
}
