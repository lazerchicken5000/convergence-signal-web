/**
 * Section 6 SVG: two clearly separated communities with two highlighted
 * cross-community contributors connected by a dotted line. Visualizes
 * the "independence verification" thesis — the dotted line is the signal.
 */
export function IndependenceGraph() {
  // Community A (left) — six nodes
  const commA = [
    { x: 60, y: 50 }, { x: 90, y: 30 }, { x: 110, y: 65 },
    { x: 75, y: 90 }, { x: 35, y: 70 }, { x: 95, y: 105 },
  ];
  // Community B (right) — six nodes
  const commB = [
    { x: 240, y: 50 }, { x: 270, y: 30 }, { x: 290, y: 65 },
    { x: 255, y: 90 }, { x: 215, y: 70 }, { x: 275, y: 105 },
  ];
  // Bridge nodes — one in each community, the convergence pair
  const bridgeA = { x: 130, y: 75 };
  const bridgeB = { x: 220, y: 75 };

  // Internal edges within community A
  const edgesA: Array<[number, number]> = [
    [0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [0, 4], [3, 5],
  ];
  const edgesB: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 4], [3, 5], [4, 5],
  ];

  return (
    <div className="border border-zinc-800 rounded-lg p-5 not-prose">
      <svg viewBox="0 0 350 160" className="w-full" style={{ height: 240 }} aria-hidden="true">
        {/* Community A boundary */}
        <ellipse cx="80" cy="70" rx="68" ry="55" fill="rgba(96,165,250,0.04)" stroke="rgba(96,165,250,0.22)" strokeWidth="0.7" strokeDasharray="2 2" />
        <text x="80" y="142" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(96,165,250,0.6)">Community A</text>

        {/* Community B boundary */}
        <ellipse cx="270" cy="70" rx="68" ry="55" fill="rgba(168,85,247,0.04)" stroke="rgba(168,85,247,0.22)" strokeWidth="0.7" strokeDasharray="2 2" />
        <text x="270" y="142" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(168,85,247,0.6)">Community B</text>

        {/* Internal edges A */}
        {edgesA.map(([a, b], i) => (
          <line key={`ea-${i}`} x1={commA[a].x} y1={commA[a].y} x2={commA[b].x} y2={commA[b].y} stroke="rgba(96,165,250,0.35)" strokeWidth="0.6" />
        ))}
        {/* Internal edges B */}
        {edgesB.map(([a, b], i) => (
          <line key={`eb-${i}`} x1={commB[a].x} y1={commB[a].y} x2={commB[b].x} y2={commB[b].y} stroke="rgba(168,85,247,0.35)" strokeWidth="0.6" />
        ))}

        {/* Community A nodes */}
        {commA.map((n, i) => (
          <circle key={`na-${i}`} cx={n.x} cy={n.y} r="2.6" fill="rgba(96,165,250,0.6)" />
        ))}
        {/* Community B nodes */}
        {commB.map((n, i) => (
          <circle key={`nb-${i}`} cx={n.x} cy={n.y} r="2.6" fill="rgba(168,85,247,0.6)" />
        ))}

        {/* Bridge nodes — highlighted */}
        <circle cx={bridgeA.x} cy={bridgeA.y} r="4.5" fill="rgba(96,165,250,1)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
        <circle cx={bridgeB.x} cy={bridgeB.y} r="4.5" fill="rgba(168,85,247,1)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />

        {/* THE dotted line — the convergence signal */}
        <line x1={bridgeA.x} y1={bridgeA.y} x2={bridgeB.x} y2={bridgeB.y} stroke="rgba(52,211,153,0.85)" strokeWidth="1.2" strokeDasharray="3 2" />

        {/* Center conclusion marker */}
        <circle cx="175" cy="75" r="2.2" fill="rgba(52,211,153,1)" />

        {/* Annotation */}
        <text x="175" y="35" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(52,211,153,0.75)">
          shared conclusion
        </text>
        <text x="175" y="46" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="rgba(52,211,153,0.55)">
          arrived at independently
        </text>
      </svg>
      <p className="text-[10px] text-zinc-600 text-center mt-2">
        The dotted green line is the signal. Two contributors in different Louvain communities, each weighted by PageRank, both arriving at the same vector cluster.
      </p>
    </div>
  );
}
