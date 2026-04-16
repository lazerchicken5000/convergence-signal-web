'use client';

import { useEffect, useRef, useState } from 'react';

interface CuratorPoint {
  id: string;
  label: string;
  ci: number;           // base curator
  novelty: number;      // counter curator (may be undefined — default to 0.5)
  slurry: 'sharp' | 'marginal' | 'slurry' | null;
  agreement: 'aligned_signal' | 'aligned_noise' | 'contested' | 'neutral' | null;
  verdict: 'novel' | 'rehash' | 'mixed' | 'unclear' | null;
}

interface CuratorSpaceProps {
  points: CuratorPoint[];
  height?: number;
}

/**
 * Scatter-plot of all patterns in base-curator × counter-curator space.
 *
 *   X axis: base CI score (0 → 1)
 *   Y axis: counter novelty rating (0 → 1)
 *
 * Four natural quadrants:
 *   top-right   (hi CI, hi novelty): aligned signal — both curators agree
 *   top-left    (lo CI, hi novelty): skeptic-only signal — worth a look
 *   bottom-right(hi CI, lo novelty): CONTESTED — base loves, skeptic calls rehash
 *   bottom-left (lo CI, lo novelty): aligned noise
 *
 * Clicking a point opens the pattern detail page.
 */
export function CuratorSpace({ points, height = 420 }: CuratorSpaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<Array<{ id: string; label: string; x: number; y: number; r: number }>>([]);
  const [hover, setHover] = useState<{ label: string; note: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const ml = 54, mr = 20, mt = 28, mb = 40;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Quadrant backgrounds — subtle
    const qx = ml + pw / 2;
    const qy = mt + ph / 2;
    // top-right: aligned_signal (emerald)
    ctx.fillStyle = 'rgba(52, 211, 153, 0.04)';
    ctx.fillRect(qx, mt, pw / 2, ph / 2);
    // bottom-right: contested-risk (amber)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
    ctx.fillRect(qx, qy, pw / 2, ph / 2);
    // top-left: skeptic-only (blue)
    ctx.fillStyle = 'rgba(96, 165, 250, 0.04)';
    ctx.fillRect(ml, mt, pw / 2, ph / 2);
    // bottom-left: aligned_noise (gray)
    ctx.fillStyle = 'rgba(113, 113, 122, 0.04)';
    ctx.fillRect(ml, qy, pw / 2, ph / 2);

    // Quadrant labels
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.fillText('aligned signal', ml + pw - 4, mt + 4);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.fillText('contested', ml + pw - 4, qy + 4);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(96, 165, 250, 0.35)';
    ctx.fillText('skeptic-only', ml + 4, mt + 4);
    ctx.fillStyle = 'rgba(113, 113, 122, 0.35)';
    ctx.fillText('aligned noise', ml + 4, qy + 4);

    // Grid + axis ticks
    ctx.strokeStyle = 'rgba(39, 39, 42, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.font = '9px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(113, 113, 122, 0.6)';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let v = 0; v <= 1.0001; v += 0.25) {
      const y = mt + ph * (1 - v);
      ctx.beginPath();
      ctx.moveTo(ml, y);
      ctx.lineTo(ml + pw, y);
      ctx.stroke();
      ctx.fillText(v.toFixed(2), ml - 6, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= 1.0001; v += 0.25) {
      const x = ml + pw * v;
      ctx.beginPath();
      ctx.moveTo(x, mt);
      ctx.lineTo(x, mt + ph);
      ctx.stroke();
      ctx.fillText(v.toFixed(2), x, mt + ph + 6);
    }

    // Midline accents (divides the quadrants)
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ml, qy); ctx.lineTo(ml + pw, qy);
    ctx.moveTo(qx, mt); ctx.lineTo(qx, mt + ph);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(161, 161, 170, 0.7)';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('base curator · CI score →', ml + pw / 2, H - 4);
    // y-axis label rotated
    ctx.save();
    ctx.translate(12, mt + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('counter curator · novelty →', 0, 0);
    ctx.restore();

    // Plot points
    hitRef.current = [];
    for (const p of points) {
      const x = ml + pw * Math.max(0, Math.min(1, p.ci));
      const y = mt + ph * (1 - Math.max(0, Math.min(1, p.novelty)));

      // Color by agreement
      let color = 'rgba(161, 161, 170, 0.55)'; // neutral default
      if (p.agreement === 'aligned_signal') color = 'rgba(52, 211, 153, 0.8)';
      else if (p.agreement === 'aligned_noise') color = 'rgba(113, 113, 122, 0.55)';
      else if (p.agreement === 'contested') color = 'rgba(245, 158, 11, 0.85)';
      else if (p.agreement === 'neutral') color = 'rgba(148, 163, 184, 0.6)';

      // Slurry override — red ring
      const radius = p.slurry === 'slurry' ? 5 : 4.5;

      // Halo for contested
      if (p.agreement === 'contested') {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (p.slurry === 'slurry') {
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      hitRef.current.push({ id: p.id, label: p.label, x, y, r: radius + 4 });
    }
  }, [points, height]);

  // Hover handling — identify closest point and show tooltip
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let hit: { id: string; label: string; x: number; y: number; r: number } | null = null;
    for (const node of hitRef.current) {
      const dx = mx - node.x;
      const dy = my - node.y;
      if (dx * dx + dy * dy <= node.r * node.r) { hit = node; break; }
    }
    if (hit) {
      const point = points.find(pp => pp.id === hit!.id);
      canvas.style.cursor = 'pointer';
      setHover({
        label: hit.label,
        note: point
          ? `ci ${point.ci.toFixed(2)} · novelty ${point.novelty.toFixed(2)} · ${point.verdict ?? '—'}${point.slurry === 'slurry' ? ' · SLURRY' : ''}`
          : '',
        x: hit.x,
        y: hit.y,
      });
    } else {
      canvas.style.cursor = 'default';
      setHover(null);
    }
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const node of hitRef.current) {
      const dx = mx - node.x;
      const dy = my - node.y;
      if (dx * dx + dy * dy <= node.r * node.r) {
        window.location.href = `/pattern/${node.id}`;
        return;
      }
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        onClick={handleClick}
      />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 max-w-[260px]"
          style={{
            left: Math.min(hover.x + 10, 600),
            top: hover.y + 10,
          }}
        >
          <div className="font-mono text-[10px] text-zinc-500 mb-0.5">{hover.note}</div>
          <div className="leading-snug">{hover.label}</div>
        </div>
      )}
    </div>
  );
}
