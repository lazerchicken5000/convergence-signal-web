'use client';

import { useEffect, useRef } from 'react';
import type { RPGProfile, LeaderContribution } from '@/lib/data';

interface LeaderGraphProps {
  leader: RPGProfile;
  contrib: LeaderContribution;
  links: Array<{ platform: string; url: string; handle: string }>;
}

const ATTR_COLORS: Record<string, [number, number, number]> = {
  originality: [168, 85, 247],  // purple
  independence: [52, 211, 153], // emerald
  centrality: [251, 191, 36],   // amber
  sourceDepth: [96, 165, 250],  // blue
};

const PLATFORM_ICONS: Record<string, string> = {
  arxiv: 'arX',
  github: 'GH',
  youtube: 'YT',
  x: 'X',
  twitter: 'X',
  rss: 'RSS',
  web: 'W',
};

export function LeaderGraph({ leader, contrib, links }: LeaderGraphProps) {
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
    const cy = H * 0.42;

    const pagerank = leader.signals.social_pagerank ?? 0;
    const betweenness = leader.signals.social_betweenness ?? 0;
    const communityId = leader.signals.community_id ?? -1;

    // Central node size based on leader score
    const baseSize = 24 + leader.leader_score * 30;

    let frame = 0;
    const EASE = 70;

    function easeOut(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw() {
      frame++;
      const t = Math.min(1, frame / EASE);
      const et = easeOut(t);

      ctx.clearRect(0, 0, W, H);

      // === RADAR CHART (bottom half) ===
      const radarCx = cx;
      const radarCy = H * 0.72;
      const radarR = Math.min(W, H) * 0.18;
      const attrs = [
        { label: 'Originality', value: contrib.originality / 100, color: ATTR_COLORS.originality },
        { label: 'Independence', value: contrib.independence / 100, color: ATTR_COLORS.independence },
        { label: 'Centrality', value: contrib.centrality / 100, color: ATTR_COLORS.centrality },
        { label: 'Source Depth', value: contrib.sourceDepth / 100, color: ATTR_COLORS.sourceDepth },
      ];

      if (et > 0.3) {
        const radarT = Math.min(1, (et - 0.3) / 0.7);

        // Grid rings
        for (let ring = 0.25; ring <= 1; ring += 0.25) {
          ctx.beginPath();
          for (let i = 0; i <= attrs.length; i++) {
            const angle = (i / attrs.length) * Math.PI * 2 - Math.PI / 2;
            const x = radarCx + Math.cos(angle) * radarR * ring;
            const y = radarCy + Math.sin(angle) * radarR * ring;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = `rgba(63, 63, 70, ${0.3 * radarT})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Axis lines
        for (let i = 0; i < attrs.length; i++) {
          const angle = (i / attrs.length) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(radarCx, radarCy);
          ctx.lineTo(radarCx + Math.cos(angle) * radarR, radarCy + Math.sin(angle) * radarR);
          ctx.strokeStyle = `rgba(63, 63, 70, ${0.2 * radarT})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Data polygon
        ctx.beginPath();
        for (let i = 0; i <= attrs.length; i++) {
          const idx = i % attrs.length;
          const angle = (idx / attrs.length) * Math.PI * 2 - Math.PI / 2;
          const r = radarR * attrs[idx].value * radarT;
          const x = radarCx + Math.cos(angle) * r;
          const y = radarCy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.06 * radarT})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * radarT})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Data points + labels
        for (let i = 0; i < attrs.length; i++) {
          const angle = (i / attrs.length) * Math.PI * 2 - Math.PI / 2;
          const r = radarR * attrs[i].value * radarT;
          const x = radarCx + Math.cos(angle) * r;
          const y = radarCy + Math.sin(angle) * r;
          const [cr, cg, cb] = attrs[i].color;

          // Point
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.9 * radarT})`;
          ctx.fill();

          // Label
          const lx = radarCx + Math.cos(angle) * (radarR + 18);
          const ly = radarCy + Math.sin(angle) * (radarR + 18);
          ctx.font = '9px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.6 * radarT})`;
          ctx.fillText(`${attrs[i].label} ${Math.round(attrs[i].value * 100)}`, lx, ly);
        }
      }

      // === CENTRAL NODE ===
      const pulse = 1 + Math.sin(frame * 0.025) * 0.03;
      const nodeSize = baseSize * et * pulse;

      // PageRank glow (bigger = higher PageRank)
      const prGlow = nodeSize * (1.5 + pagerank * 3);
      const prGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, prGlow);
      prGrad.addColorStop(0, `rgba(255, 255, 255, ${0.08 * et})`);
      prGrad.addColorStop(0.4, `rgba(255, 255, 255, ${0.03 * et})`);
      prGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = prGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, prGlow, 0, Math.PI * 2);
      ctx.fill();

      // Betweenness ring (bridge indicator)
      if (betweenness > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, nodeSize + 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${betweenness * 0.8 * et})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Main node
      ctx.beginPath();
      ctx.arc(cx, cy, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * et})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * et})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Leader type icon in center
      if (et > 0.5) {
        const iconAlpha = (et - 0.5) * 2;
        ctx.font = 'bold 11px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * iconAlpha})`;
        ctx.fillText(leader.leader_type.toUpperCase(), cx, cy - 4);

        ctx.font = '9px ui-monospace, monospace';
        ctx.fillStyle = `rgba(161, 161, 170, ${0.5 * iconAlpha})`;
        ctx.fillText(leader.leader_score.toFixed(3), cx, cy + 10);
      }

      // === PLATFORM SATELLITES ===
      const platforms = leader.source_types.filter(s => s !== 'citation');
      const satRadius = nodeSize + 32;

      for (let i = 0; i < platforms.length; i++) {
        const angle = (i / platforms.length) * Math.PI * 2 - Math.PI / 2;
        const sx = cx + Math.cos(angle) * satRadius * et;
        const sy = cy + Math.sin(angle) * satRadius * et;

        // Connection line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(113, 113, 122, ${0.15 * et})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Satellite
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(24, 24, 27, ${0.8 * et})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(113, 113, 122, ${0.3 * et})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 8px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(161, 161, 170, ${0.6 * et})`;
        ctx.fillText(PLATFORM_ICONS[platforms[i]] ?? platforms[i].slice(0, 2).toUpperCase(), sx, sy);
      }

      // === COMMUNITY BADGE ===
      if (et > 0.6 && communityId >= 0) {
        const cAlpha = (et - 0.6) * 2.5;
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = `rgba(251, 191, 36, ${0.5 * cAlpha})`;
        ctx.fillText(`Community C${communityId}`, 12, 20);
      }

      // === GRAPH METRICS (top-right) ===
      if (et > 0.7) {
        const mAlpha = (et - 0.7) * 3.3;
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'right';

        const metrics = [
          { label: 'PageRank', value: pagerank.toFixed(3), color: '255,255,255' },
          { label: 'Betweenness', value: betweenness.toFixed(3), color: '251,191,36' },
          { label: 'Trajectory', value: leader.influence_trajectory, color: leader.influence_trajectory === 'rising' ? '52,211,153' : '161,161,170' },
        ];

        let my = 20;
        for (const m of metrics) {
          ctx.fillStyle = `rgba(113, 113, 122, ${0.4 * mAlpha})`;
          ctx.fillText(m.label, W - 50, my);
          ctx.fillStyle = `rgba(${m.color}, ${0.6 * mAlpha})`;
          ctx.fillText(m.value, W - 12, my);
          my += 14;
        }
      }

      // === NAME ===
      if (et > 0.4) {
        const nameAlpha = (et - 0.4) * 1.67;
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(228, 228, 231, ${0.8 * nameAlpha})`;
        ctx.fillText(leader.name, cx, cy - nodeSize - 16);

        ctx.font = '10px ui-monospace, monospace';
        ctx.fillStyle = `rgba(113, 113, 122, ${0.5 * nameAlpha})`;
        ctx.fillText(contrib.contributionType, cx, cy - nodeSize - 4);
      }

      if (frame < EASE + 120) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [leader, contrib, links]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '480px' }}
    />
  );
}
