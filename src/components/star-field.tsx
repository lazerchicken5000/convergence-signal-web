'use client';

import { useEffect, useRef } from 'react';

/**
 * Floating markdown-file nodes drifting across the background like stars.
 * Each "star" is a tiny rendered .md file icon with a filename.
 */

const MD_FILES = [
  'README.md', 'SIGNAL.md', 'LEADERS.md', 'PATTERN.md', 'INDEX.md',
  'EMERGING.md', 'NOISE.md', 'TRUTH.md', 'SOURCE.md', 'VERG.md',
  'AUDIT.md', 'TOKEN.md', 'DEPTH.md', 'ORIGIN.md', 'CONVERGE.md',
  'INTEL.md', 'GLOSSARY.md', 'PROFILE.md', 'BAKE.md', 'VECTOR.md',
];

interface Star {
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Initialize stars
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (starsRef.current.length === 0) {
      for (let i = 0; i < 25; i++) {
        starsRef.current.push({
          text: MD_FILES[i % MD_FILES.length]!,
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.1,
          size: 8 + Math.random() * 3,
          alpha: 0.03 + Math.random() * 0.06,
        });
      }
    }

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const s of starsRef.current) {
        // Drift
        s.x += s.vx;
        s.y += s.vy;

        // Wrap around
        if (s.x < -100) s.x = w + 50;
        if (s.x > w + 100) s.x = -50;
        if (s.y < -50) s.y = h + 30;
        if (s.y > h + 50) s.y = -30;

        // Draw file icon
        const iconW = 12;
        const iconH = 14;
        ctx.strokeStyle = `rgba(161, 161, 170, ${s.alpha * 0.8})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + iconW - 3, s.y);
        ctx.lineTo(s.x + iconW, s.y + 3);
        ctx.lineTo(s.x + iconW, s.y + iconH);
        ctx.lineTo(s.x, s.y + iconH);
        ctx.closePath();
        ctx.stroke();

        // Dog-ear
        ctx.beginPath();
        ctx.moveTo(s.x + iconW - 3, s.y);
        ctx.lineTo(s.x + iconW - 3, s.y + 3);
        ctx.lineTo(s.x + iconW, s.y + 3);
        ctx.stroke();

        // Filename
        ctx.font = `300 ${s.size}px "GeistMono", "SF Mono", monospace`;
        ctx.fillStyle = `rgba(161, 161, 170, ${s.alpha})`;
        ctx.fillText(s.text, s.x + iconW + 4, s.y + iconH - 3);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
