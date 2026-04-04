'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  text: string;
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  color: string;
}

const COLORS = [
  'rgba(52, 211, 153, A)',  // emerald
  'rgba(96, 165, 250, A)',  // blue
  'rgba(167, 139, 250, A)', // purple
  'rgba(251, 191, 36, A)',  // amber
  'rgba(244, 114, 182, A)', // pink
  'rgba(148, 163, 184, A)', // slate
];

export function VergTitle({ keywords }: { keywords: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    // Hi-DPI
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement?.clientWidth || 800;
    const H = 120;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Build glyph mask for "VERG"
    const glyphCanvas = document.createElement('canvas');
    glyphCanvas.width = W * dpr;
    glyphCanvas.height = H * dpr;
    const gctx = glyphCanvas.getContext('2d')!;
    gctx.scale(dpr, dpr);
    gctx.font = '900 90px "GeistMono", "SF Mono", "Fira Code", monospace';
    gctx.textBaseline = 'middle';
    gctx.fillStyle = '#fff';
    const metrics = gctx.measureText('VERG');
    const tx = (W - metrics.width) / 2;
    gctx.fillText('VERG', tx, H / 2);
    const glyphData = gctx.getImageData(0, 0, W * dpr, H * dpr).data;

    function isInGlyph(px: number, py: number): boolean {
      const sx = Math.floor(px * dpr);
      const sy = Math.floor(py * dpr);
      if (sx < 0 || sy < 0 || sx >= W * dpr || sy >= H * dpr) return false;
      const idx = (sy * W * dpr + sx) * 4;
      return glyphData[idx + 3]! > 40;
    }

    // Create particles from keywords
    const particles: Particle[] = [];
    const allKeywords = keywords.length > 0 ? keywords : ['signal', 'pattern', 'leader', 'truth', 'noise', 'verg'];
    for (let i = 0; i < 60; i++) {
      const text = allKeywords[i % allKeywords.length]!;
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * Math.max(W / 3, 150);
      particles.push({
        text,
        x: W / 2 + Math.cos(angle) * radius,
        y: H / 2 + Math.sin(angle) * radius,
        angle,
        radius,
        speed: 0.002 + Math.random() * 0.004,
        size: 8 + Math.random() * 4,
        alpha: 0.15 + Math.random() * 0.4,
        color: COLORS[i % COLORS.length]!,
      });
    }

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      time += 0.016;

      // Draw VERG as dim base
      ctx.font = '900 90px "GeistMono", "SF Mono", "Fira Code", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(39, 39, 42, 0.6)';
      ctx.fillText('VERG', tx, H / 2);

      // Update and draw particles
      for (const p of particles) {
        p.angle += p.speed;

        // Orbit around center
        const orbitX = W / 2 + Math.cos(p.angle) * p.radius;
        const orbitY = H / 2 + Math.sin(p.angle * 0.7) * (H / 3);

        // Drift toward orbit position
        p.x += (orbitX - p.x) * 0.02;
        p.y += (orbitY - p.y) * 0.02;

        // Check if inside glyph — if so, brighten
        const inGlyph = isInGlyph(p.x, p.y);
        const targetAlpha = inGlyph ? 0.7 + Math.sin(time * 2 + p.angle) * 0.2 : 0.08 + Math.sin(time + p.angle) * 0.06;
        p.alpha += (targetAlpha - p.alpha) * 0.05;

        const colorStr = p.color.replace('A', String(p.alpha));
        ctx.font = `${inGlyph ? 600 : 300} ${p.size}px "GeistMono", "SF Mono", monospace`;
        ctx.fillStyle = colorStr;
        ctx.fillText(p.text, p.x, p.y);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameRef.current);
  }, [keywords]);

  return (
    <div className="relative w-full" style={{ height: 120 }}>
      <canvas ref={canvasRef} className="w-full" style={{ height: 120 }} />
    </div>
  );
}
