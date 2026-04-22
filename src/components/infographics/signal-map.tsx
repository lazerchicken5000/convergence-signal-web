'use client';

import { useEffect, useRef } from 'react';
import type { ConvergencePattern, TokenCost, SignalQuality, ContentItem } from '@/lib/data';

interface SignalMapProps {
  pattern: ConvergencePattern;
  sources: ContentItem[];
  cost: TokenCost;
  signal: SignalQuality;
}

const PLATFORM_COLORS: Record<string, string> = {
  arxiv: '#a78bfa',
  semantic_scholar: '#818cf8',
  github: '#34d399',
  youtube: '#f87171',
  rss: '#fb923c',
  web: '#60a5fa',
  x: '#38bdf8',
  twitter: '#38bdf8',
};

const PLATFORM_POSITIONS: Record<string, { angle: number }> = {
  arxiv: { angle: -Math.PI * 0.75 },          // top-left
  semantic_scholar: { angle: -Math.PI * 0.6 },
  github: { angle: -Math.PI * 0.25 },         // top-right
  youtube: { angle: Math.PI * 0.75 },          // bottom-left
  rss: { angle: Math.PI * 0.25 },             // bottom-right
  web: { angle: Math.PI * 0.5 },              // bottom
  x: { angle: -Math.PI * 0.5 },              // top
  twitter: { angle: -Math.PI * 0.4 },
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function SignalMap({ pattern, sources, cost, signal }: SignalMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return;
    const ctx = ctxOrNull;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const cx = W / 2;
    const cy = H / 2;

    // Derive node data from sources
    const platformGroups = new Map<string, ContentItem[]>();
    for (const s of sources) {
      const p = s.source || 'web';
      if (!platformGroups.has(p)) platformGroups.set(p, []);
      platformGroups.get(p)!.push(s);
    }

    // Independence affects orbit radius — high independence = spread out
    const baseRadius = Math.min(W, H) * 0.3;
    const independenceSpread = pattern.independence_score;
    const orbitRadius = baseRadius * (0.6 + independenceSpread * 0.5);

    // Source nodes with positions
    interface SourceNode {
      x: number; y: number;
      targetX: number; targetY: number;
      platform: string;
      name: string;
      color: string;
      size: number;
    }

    const nodes: SourceNode[] = [];
    let idx = 0;
    const total = sources.length || 1;

    // Padding to prevent text from being clipped at canvas edges.
    // Node labels (center-aligned, ~9px font, up to 20 chars) and the
    // 12px vertical offset below each node both need room.
    const PAD_X = 60;
    const PAD_Y = 24;

    for (const [platform, items] of platformGroups) {
      const baseAngle = PLATFORM_POSITIONS[platform]?.angle ?? (idx / platformGroups.size) * Math.PI * 2;
      const color = PLATFORM_COLORS[platform] ?? '#71717a';

      for (let i = 0; i < items.length; i++) {
        const spread = (i - (items.length - 1) / 2) * 0.15;
        const angle = baseAngle + spread;
        // Low independence = cluster tighter, high = spread wide
        const r = orbitRadius + (Math.random() - 0.5) * 30 * independenceSpread;
        const rawX = cx + Math.cos(angle) * r;
        const rawY = cy + Math.sin(angle) * r;
        nodes.push({
          x: cx, y: cy, // start at center for animation
          targetX: Math.max(PAD_X, Math.min(W - PAD_X, rawX)),
          targetY: Math.max(PAD_Y, Math.min(H - PAD_Y, rawY)),
          platform,
          name: items[i].creator.name,
          color,
          size: 4 + Math.min(6, items.length),
        });
        idx++;
      }
    }

    // Token bake ring data
    const tokenRingRadius = orbitRadius + 40;
    const savedRatio = cost.savings / 100;

    // Animation
    let frame = 0;
    const EASE_FRAMES = 60;

    function easeOut(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw() {
      frame++;
      const t = Math.min(1, frame / EASE_FRAMES);
      const et = easeOut(t);

      ctx.clearRect(0, 0, W, H);

      // === TOKEN BAKE OUTER RING ===
      if (t > 0.3) {
        const ringT = Math.min(1, (t - 0.3) / 0.7);
        const ringAlpha = ringT * 0.15;

        // Raw tokens arc (full circle, dim)
        ctx.beginPath();
        ctx.arc(cx, cy, tokenRingRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${ringAlpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Curated tokens arc (partial, bright)
        ctx.beginPath();
        ctx.arc(cx, cy, tokenRingRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - savedRatio) * ringT);
        ctx.strokeStyle = `rgba(52, 211, 153, ${ringAlpha * 3})`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Token bake label
        if (ringT > 0.5) {
          ctx.font = '10px ui-monospace, monospace';
          ctx.fillStyle = `rgba(52, 211, 153, ${(ringT - 0.5) * 2 * 0.6})`;
          ctx.textAlign = 'center';
          ctx.fillText(`${formatTokens(cost.rawTokens)} → ${formatTokens(cost.curatedTokens)}`, cx, Math.max(12, cy - tokenRingRadius - 10));
          ctx.fillStyle = `rgba(52, 211, 153, ${(ringT - 0.5) * 2 * 0.4})`;
          ctx.fillText(`${cost.savings}% saved`, cx, Math.max(26, cy - tokenRingRadius + 6));
        }
      }

      // === CONNECTION LINES (source → center) ===
      for (const node of nodes) {
        const nx = node.x + (node.targetX - node.x) * et;
        const ny = node.y + (node.targetY - node.y) * et;

        // Line: thicker = more sources from this platform
        const lineAlpha = 0.08 + (pattern.ci_score * 0.12) * et;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = node.color.replace(')', `, ${lineAlpha})`).replace('rgb', 'rgba');
        // Convert hex to rgba for line
        const r = parseInt(node.color.slice(1, 3), 16);
        const g = parseInt(node.color.slice(3, 5), 16);
        const b = parseInt(node.color.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // === SOURCE NODES ===
      for (const node of nodes) {
        const nx = node.x + (node.targetX - node.x) * et;
        const ny = node.y + (node.targetY - node.y) * et;

        // Glow
        const r = parseInt(node.color.slice(1, 3), 16);
        const g = parseInt(node.color.slice(3, 5), 16);
        const b = parseInt(node.color.slice(5, 7), 16);

        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.size * 3);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.2 * et})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, node.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node
        ctx.beginPath();
        ctx.arc(nx, ny, node.size * et, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.8 * et})`;
        ctx.fill();

        // Label (only for larger nodes or few sources)
        if (et > 0.8 && sources.length <= 8) {
          ctx.font = '9px -apple-system, sans-serif';
          ctx.fillStyle = `rgba(161, 161, 170, ${(et - 0.8) * 5 * 0.6})`;
          ctx.textAlign = 'center';
          ctx.fillText(node.name.slice(0, 20), nx, ny + node.size + 12);
        }
      }

      // === CENTER NODE (the insight) ===
      const centerSize = 18 + pattern.ci_score * 12;
      const pulse = 1 + Math.sin(frame * 0.03) * 0.05;

      // Center glow
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerSize * 3 * pulse);
      centerGrad.addColorStop(0, `rgba(255, 255, 255, ${0.12 * et})`);
      centerGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.04 * et})`);
      centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, centerSize * 3 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Center ring
      ctx.beginPath();
      ctx.arc(cx, cy, centerSize * et * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * et})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center fill
      ctx.beginPath();
      ctx.arc(cx, cy, centerSize * 0.6 * et, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * et})`;
      ctx.fill();

      // CI score in center
      if (et > 0.5) {
        ctx.font = 'bold 14px ui-monospace, monospace';
        ctx.fillStyle = `rgba(255, 255, 255, ${(et - 0.5) * 2 * 0.8})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pattern.ci_score.toFixed(2), cx, cy);
      }

      // === PLATFORM LEGEND ===
      if (et > 0.9) {
        const legendAlpha = (et - 0.9) * 10;
        const platforms = [...platformGroups.keys()];
        const legendX = 12;
        let legendY = H - 12 - platforms.length * 16;

        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        for (const p of platforms) {
          const c = PLATFORM_COLORS[p] ?? '#71717a';
          const r = parseInt(c.slice(1, 3), 16);
          const g = parseInt(c.slice(3, 5), 16);
          const b = parseInt(c.slice(5, 7), 16);

          ctx.beginPath();
          ctx.arc(legendX + 5, legendY, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.8 * legendAlpha})`;
          ctx.fill();

          ctx.fillStyle = `rgba(161, 161, 170, ${0.5 * legendAlpha})`;
          ctx.fillText(`${p} (${platformGroups.get(p)!.length})`, legendX + 14, legendY);
          legendY += 16;
        }
      }

      // === INDEPENDENCE INDICATOR ===
      if (et > 0.7) {
        const indAlpha = (et - 0.7) * 3.3;
        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = signal.independence === 'high'
          ? `rgba(52, 211, 153, ${0.6 * indAlpha})`
          : signal.independence === 'low'
            ? `rgba(251, 191, 36, ${0.6 * indAlpha})`
            : `rgba(161, 161, 170, ${0.4 * indAlpha})`;
        ctx.fillText(
          signal.independence === 'high' ? 'INDEPENDENT SIGNAL' :
          signal.independence === 'low' ? 'POSSIBLE ECHO' : 'MODERATE INDEPENDENCE',
          W - 12, 20
        );

        ctx.fillStyle = `rgba(113, 113, 122, ${0.3 * indAlpha})`;
        ctx.fillText(`${signal.platforms.length} platforms · ${sources.length} sources`, W - 12, 34);
      }

      if (frame < EASE_FRAMES + 120) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [pattern, sources, cost, signal]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '480px' }}
    />
  );
}
