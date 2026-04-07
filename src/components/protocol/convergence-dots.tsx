/**
 * Hero SVG: five satellite dots converging toward a central node.
 * Pure CSS animation — no JS, server component compatible.
 */
export function ConvergenceDots() {
  // Five satellite positions on a unit circle
  const satellites = [
    { x: 50, y: 18, delay: 0 },
    { x: 86, y: 42, delay: 0.6 },
    { x: 72, y: 86, delay: 1.2 },
    { x: 28, y: 86, delay: 1.8 },
    { x: 14, y: 42, delay: 2.4 },
  ];

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full max-w-md"
        style={{ height: 220 }}
        aria-hidden="true"
      >
        {/* Connection lines from satellites to center */}
        {satellites.map((s, i) => (
          <line
            key={`l-${i}`}
            x1={s.x}
            y1={s.y}
            x2="50"
            y2="50"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.4"
            strokeDasharray="0.6 1.2"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.05;0.35;0.05"
              dur="6s"
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}

        {/* Satellite nodes */}
        {satellites.map((s, i) => (
          <circle
            key={`c-${i}`}
            cx={s.x}
            cy={s.y}
            r="1.4"
            fill="rgba(228,228,231,0.7)"
          >
            <animate
              attributeName="r"
              values="1.2;1.8;1.2"
              dur="4s"
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Central convergence point with pulsing glow */}
        <circle cx="50" cy="50" r="6" fill="rgba(255,255,255,0.06)" />
        <circle cx="50" cy="50" r="3.2" fill="rgba(255,255,255,0.12)">
          <animate
            attributeName="r"
            values="3;3.8;3"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="50" cy="50" r="1.5" fill="rgba(255,255,255,0.95)" />
      </svg>
    </div>
  );
}
