'use client';

import { useEffect, useRef } from 'react';
import type { ConvergenceDiff } from '@/lib/data';

interface EmergingTimelineProps {
  diff: ConvergenceDiff;
  selectedId: string | null;
  height?: number;
}

interface TimelineItem {
  id: string;
  label: string;
  type: 'new' | 'accelerating' | 'fading' | 'noise';
  ci: number;
  ciPrev?: number;
  delta?: number;
  ageDays?: number;
  creatorCount?: number;
}

export function EmergingTimeline({ diff, selectedId, height = 480 }: EmergingTimelineProps) {
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

    // Build timeline items
    const items: TimelineItem[] = [];

    for (const p of diff.new_patterns) {
      items.push({ id: p.lineage_id, label: p.label, type: 'new', ci: p.ci_score, creatorCount: p.creator_count });
    }
    for (const p of diff.accelerating) {
      items.push({ id: p.lineage_id, label: p.label, type: 'accelerating', ci: p.ci_after, ciPrev: p.ci_before, delta: p.delta });
    }
    for (const p of diff.decaying || []) {
      items.push({ id: p.lineage_id, label: p.label, type: 'fading', ci: p.ci_after, ciPrev: p.ci_before, delta: p.delta });
    }
    for (const p of diff.died || []) {
      items.push({ id: p.lineage_id, label: p.label, type: 'noise', ci: p.last_ci, ageDays: p.age_days });
    }

    const TYPE_COLORS: Record<string, [number, number, number]> = {
      new: [52, 211, 153],
      accelerating: [251, 191, 36],
      fading: [113, 113, 122],
      noise: [63, 63, 70],
    };

    let frame = 0;
    const EASE = 50;

    function easeOut(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw() {
      frame++;
      const t = Math.min(1, frame / EASE);
      const et = easeOut(t);

      ctx.clearRect(0, 0, W, H);

      if (items.length === 0) {
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(113, 113, 122, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Waiting for second pipeline run', W / 2, H / 2);
        return;
      }

      // === SIGNAL STRENGTH AXIS ===
      const marginLeft = 60;
      const marginRight = 40;
      const marginTop = 50;
      const marginBottom = 60;
      const plotW = W - marginLeft - marginRight;
      const plotH = H - marginTop - marginBottom;

      // Y-axis: CI score (0 → 1)
      const maxCI = Math.max(0.5, ...items.map(i => i.ci));

      // CI axis labels
      ctx.font = '9px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let v = 0; v <= 1; v += 0.2) {
        if (v > maxCI + 0.1) break;
        const y = marginTop + plotH * (1 - v / maxCI);
        ctx.fillStyle = `rgba(63, 63, 70, ${0.4 * et})`;
        ctx.fillText(v.toFixed(1), marginLeft - 8, y);

        // Grid line
        ctx.beginPath();
        ctx.moveTo(marginLeft, y);
        ctx.lineTo(marginLeft + plotW, y);
        ctx.strokeStyle = `rgba(39, 39, 42, ${0.3 * et})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // === SIGNAL/NOISE ZONES ===
      // Signal zone (top, green tint)
      const signalY = marginTop;
      const signalH = plotH * 0.4;
      const signalGrad = ctx.createLinearGradient(0, signalY, 0, signalY + signalH);
      signalGrad.addColorStop(0, `rgba(52, 211, 153, ${0.04 * et})`);
      signalGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = signalGrad;
      ctx.fillRect(marginLeft, signalY, plotW, signalH);

      // Noise zone (bottom, red tint)
      const noiseY = marginTop + plotH * 0.7;
      const noiseH = plotH * 0.3 + marginBottom;
      const noiseGrad = ctx.createLinearGradient(0, noiseY, 0, noiseY + noiseH);
      noiseGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      noiseGrad.addColorStop(1, `rgba(239, 68, 68, ${0.04 * et})`);
      ctx.fillStyle = noiseGrad;
      ctx.fillRect(marginLeft, noiseY, plotW, noiseH);

      // Zone labels
      if (et > 0.5) {
        const zAlpha = (et - 0.5) * 2;
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = `rgba(52, 211, 153, ${0.25 * zAlpha})`;
        ctx.fillText('SIGNAL', marginLeft + plotW, marginTop + 14);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.25 * zAlpha})`;
        ctx.fillText('NOISE', marginLeft + plotW, marginTop + plotH - 4);
      }

      // === TYPE COLUMNS ===
      const types: Array<'new' | 'accelerating' | 'fading' | 'noise'> = ['new', 'accelerating', 'fading', 'noise'];
      const typeLabels = ['New', 'Accelerating', 'Fading', 'Noise'];
      const colWidth = plotW / types.length;

      // Column headers
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i < types.length; i++) {
        const colX = marginLeft + colWidth * i + colWidth / 2;
        const [r, g, b] = TYPE_COLORS[types[i]];
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 * et})`;
        ctx.fillText(typeLabels[i], colX, marginTop - 16);

        // Column count
        const count = items.filter(item => item.type === types[i]).length;
        ctx.font = '8px ui-monospace, monospace';
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 * et})`;
        ctx.fillText(`${count}`, colX, marginTop - 4);
        ctx.font = '10px ui-monospace, monospace';

        // Column separator
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(marginLeft + colWidth * i, marginTop);
          ctx.lineTo(marginLeft + colWidth * i, marginTop + plotH);
          ctx.strokeStyle = `rgba(39, 39, 42, ${0.2 * et})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // === PLOT ITEMS ===
      for (let typeIdx = 0; typeIdx < types.length; typeIdx++) {
        const typeItems = items.filter(i => i.type === types[typeIdx]);
        const colCx = marginLeft + colWidth * typeIdx + colWidth / 2;
        const [r, g, b] = TYPE_COLORS[types[typeIdx]];

        for (let i = 0; i < typeItems.length; i++) {
          const item = typeItems[i];
          const y = marginTop + plotH * (1 - item.ci / maxCI) * et;
          const x = colCx + (i - (typeItems.length - 1) / 2) * 20;
          const isSelected = item.id === selectedId;
          const nodeSize = isSelected ? 8 : 5;

          // Delta arrow for accelerating/fading
          if (item.ciPrev !== undefined && item.delta !== undefined && et > 0.6) {
            const prevY = marginTop + plotH * (1 - item.ciPrev / maxCI);
            ctx.beginPath();
            ctx.moveTo(x, prevY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.3 * et})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow head
            const arrowDir = item.delta > 0 ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 3, y + arrowDir * 6);
            ctx.lineTo(x + 3, y + arrowDir * 6);
            ctx.closePath();
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.4 * et})`;
            ctx.fill();
          }

          // Node glow for selected
          if (isSelected) {
            const glow = ctx.createRadialGradient(x, y, 0, x, y, 24);
            glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.2 * et})`);
            glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, 24, 0, Math.PI * 2);
            ctx.fill();
          }

          // Node
          ctx.beginPath();
          ctx.arc(x, y, nodeSize * et, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(isSelected ? 0.9 : 0.6) * et})`;
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * et})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // CI label
          ctx.font = '8px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 * et})`;
          ctx.fillText(item.ci.toFixed(2), x, y - nodeSize - 4);

          // Label for selected
          if (isSelected && et > 0.5) {
            const lAlpha = (et - 0.5) * 2;
            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillStyle = `rgba(228, 228, 231, ${0.7 * lAlpha})`;
            ctx.textAlign = 'center';

            // Wrap label
            const maxLabelW = colWidth - 10;
            const words = item.label.split(' ');
            let line = '';
            let ly = y + nodeSize + 16;

            for (const word of words) {
              const test = line + (line ? ' ' : '') + word;
              if (ctx.measureText(test).width > maxLabelW && line) {
                ctx.fillText(line, x, ly);
                line = word;
                ly += 13;
                if (ly > marginTop + plotH - 10) break;
              } else {
                line = test;
              }
            }
            if (line) ctx.fillText(line, x, ly);

            // Extra info
            ly += 16;
            ctx.font = '8px ui-monospace, monospace';
            ctx.fillStyle = `rgba(161, 161, 170, ${0.4 * lAlpha})`;
            if (item.creatorCount) ctx.fillText(`${item.creatorCount} sources`, x, ly);
            if (item.delta) ctx.fillText(`delta: ${item.delta > 0 ? '+' : ''}${item.delta.toFixed(3)}`, x, ly);
            if (item.ageDays) ctx.fillText(`${item.ageDays}d tracked`, x, ly);
          }
        }
      }

      // === TITLE ===
      if (et > 0.3) {
        const tAlpha = (et - 0.3) / 0.7;
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = `rgba(113, 113, 122, ${0.4 * tAlpha})`;
        ctx.fillText(`${diff.date} vs ${diff.previous_date}`, marginLeft, H - 12);

        ctx.textAlign = 'right';
        ctx.fillText(
          `${diff.new_patterns.length} new · ${diff.accelerating.length} accel · ${diff.died?.length ?? 0} noise`,
          W - marginRight, H - 12
        );
      }

      if (frame < EASE + 60) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [diff, selectedId]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
