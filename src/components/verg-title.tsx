'use client';

import { useEffect, useRef } from 'react';

interface NodeParticle {
  text: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
}

export function VergTitle({ keywords }: { keywords: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement?.clientWidth || 900;
    const H = 140;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Layout: VERG on left (0 to ~40%), node graph on right (~45% to 100%)
    const titleX = 0;
    const graphCenterX = W * 0.68;
    const graphCenterY = H / 2;
    const graphRadius = Math.min(W * 0.28, H * 0.42);

    // Create orbiting keyword nodes
    const allKw = keywords.length > 0 ? keywords : ['signal', 'pattern', 'leader', 'truth', 'noise', 'verg'];
    const nodes: NodeParticle[] = [];
    const nodeCount = Math.min(allKw.length, 24);

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const r = graphRadius * (0.5 + Math.random() * 0.5);
      nodes.push({
        text: allKw[i % allKw.length]!,
        x: graphCenterX + Math.cos(angle) * r,
        y: graphCenterY + Math.sin(angle) * r,
        targetX: 0,
        targetY: 0,
        angle,
        radius: r,
        speed: 0.003 + Math.random() * 0.006,
        size: 9 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.4,
      });
    }

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      time += 0.016;

      // ── VERG title (left, bold) ──
      ctx.font = '900 72px "GeistMono", "SF Mono", "Fira Code", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(245, 245, 245, 0.95)';
      ctx.fillText('VERG', titleX + 8, H / 2);

      // ── Center node (hub) ──
      const pulseR = 4 + Math.sin(time * 1.5) * 1.5;
      ctx.beginPath();
      ctx.arc(graphCenterX, graphCenterY, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(graphCenterX, graphCenterY, pulseR + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Update and draw nodes ──
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        n.angle += n.speed;

        // Elliptical orbit
        const orbitX = graphCenterX + Math.cos(n.angle) * n.radius;
        const orbitY = graphCenterY + Math.sin(n.angle * 0.75) * n.radius * 0.6;

        // Smooth follow
        n.x += (orbitX - n.x) * 0.03;
        n.y += (orbitY - n.y) * 0.03;

        // Pulse alpha
        const dist = Math.hypot(n.x - graphCenterX, n.y - graphCenterY);
        const closeness = 1 - Math.min(dist / (graphRadius * 1.2), 1);
        n.alpha = 0.15 + closeness * 0.55 + Math.sin(time * 2 + n.angle) * 0.1;

        // ── Connection line to center ──
        const lineAlpha = closeness * 0.25 + 0.03;
        ctx.beginPath();
        ctx.moveTo(graphCenterX, graphCenterY);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // ── Node-to-node connections (nearby) ──
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j]!;
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < graphRadius * 0.7) {
            const connAlpha = (1 - d / (graphRadius * 0.7)) * 0.12;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${connAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // ── Node dot ──
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${n.alpha})`;
        ctx.fill();

        // ── Keyword text ──
        ctx.font = `${n.alpha > 0.4 ? 500 : 300} ${n.size}px "GeistMono", "SF Mono", monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${n.alpha * 0.85})`;
        ctx.fillText(n.text, n.x + 5, n.y + 3);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    // Resize handler
    function resize() {
      if (!canvas) return;
      const newW = canvas.parentElement?.clientWidth || 900;
      canvas.width = newW * dpr;
      canvas.style.width = `${newW}px`;
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [keywords]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 140 }}>
      <canvas ref={canvasRef} className="w-full" style={{ height: 140 }} />
    </div>
  );
}
