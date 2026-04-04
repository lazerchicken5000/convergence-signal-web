'use client';

import { useEffect, useRef, useMemo } from 'react';
import type { DayActivity, AggregateStats } from '@/lib/data';

interface HeatCell {
  col: number;
  row: number;
  x: number;
  y: number;
  intensity: number;
  fadeAlpha: number;
  count: number;
  date: string;
}

interface Connection {
  fromIdx: number;
  toLetterIdx: number;
  toY: number;          // y-offset on the letter (upper/mid/lower)
  lifespan: number;
  age: number;
  alpha: number;
  ghostX: number;
  ghostY: number;
  ghostAlpha: number;
  ghostPhase: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function heatBrightness(intensity: number): { r: number; g: number; b: number } {
  if (intensity <= 0) return { r: 39, g: 39, b: 42 };
  if (intensity < 0.15) return { r: 63, g: 63, b: 70 };
  if (intensity < 0.35) return { r: 113, g: 113, b: 122 };
  if (intensity < 0.65) return { r: 161, g: 161, b: 170 };
  return { r: 212, g: 212, b: 216 };
}

interface VergHeaderProps {
  days: DayActivity[];
  stats: AggregateStats;
}

export function VergHeader({ days, stats }: VergHeaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const heatGrid = useMemo(() => {
    const weeks: DayActivity[][] = [];
    let currentWeek: DayActivity[] = [];

    if (days.length > 0) {
      const firstDow = new Date(days[0].date).getDay();
      for (let i = 0; i < firstDow; i++) {
        currentWeek.push({ date: '', itemCount: 0, hasDiff: false });
      }
    }

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const maxCount = Math.max(1, ...days.map(d => d.itemCount));
    return { weeks, maxCount };
  }, [days]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = canvas.parentElement?.clientWidth || 900;
    const H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // ── VERG letters (left) ──
    const vergX = 8;
    const vergY = H / 2;
    const letterH = 54; // approximate height of 72px font
    ctx.font = '900 72px "Geist Mono", "SF Mono", "Fira Code", monospace';
    const vergLetters = ['V', 'E', 'R', 'G'];
    const letterPositions: Array<{ x: number; y: number; w: number }> = [];
    let lx = vergX;
    for (const letter of vergLetters) {
      const m = ctx.measureText(letter);
      letterPositions.push({ x: lx + m.width / 2, y: vergY, w: m.width });
      lx += m.width;
    }
    const vergRight = lx + 10;

    // ── Heatmap grid (right) ──
    const cellSize = 11;
    const cellGap = 3;
    const step = cellSize + cellGap;

    const { weeks, maxCount } = heatGrid;
    const cols = weeks.length;
    const rows = 7;

    const gridW = cols * step - cellGap;
    const gridH = rows * step - cellGap;
    const heatRight = W - 16;
    const heatLeft = heatRight - gridW;
    const heatTop = (H - gridH) / 2;

    // The gap zone where ghost nodes live
    const gapLeft = vergRight + 10;
    const gapRight = heatLeft - 10;
    const gapMid = (gapLeft + gapRight) / 2;

    // Build cells
    const heatCells: HeatCell[] = [];
    for (let c = 0; c < cols; c++) {
      const week = weeks[c];
      if (!week) continue;
      for (let r = 0; r < rows; r++) {
        const day = week[r];
        if (!day || !day.date) continue;

        const x = heatLeft + c * step;
        const y = heatTop + r * step;

        const distPct = (x - heatLeft) / Math.max(gridW, 1);
        const fadeAlpha = Math.min(1, distPct * 3);

        heatCells.push({
          col: c, row: r, x, y,
          intensity: day.itemCount / maxCount,
          fadeAlpha,
          count: day.itemCount,
          date: day.date,
        });
      }
    }

    const activeCells = heatCells.filter(c => c.intensity > 0);

    // ── Connections ──
    const MAX_CONN = 4;
    const connections: Connection[] = [];

    function spawnConnection() {
      if (activeCells.length === 0) return;
      const leftCells = activeCells.filter(c => c.fadeAlpha < 0.7);
      const pool = leftCells.length > 0 ? leftCells : activeCells;
      const fromIdx = activeCells.indexOf(pool[Math.floor(Math.random() * pool.length)]);
      const toLetterIdx = Math.floor(Math.random() * 4);

      const from = activeCells[fromIdx];
      const to = letterPositions[toLetterIdx];
      if (!from || !to) return;

      // Random y-offset on the letter: upper, middle, or lower
      const yOffset = (Math.random() - 0.5) * letterH * 0.8;
      const toY = to.y + yOffset;

      // Ghost node lives in the gap between VERG and heatmap
      const ghostX = gapLeft + Math.random() * (gapRight - gapLeft);
      const ghostY = H * 0.2 + Math.random() * H * 0.6;

      connections.push({
        fromIdx,
        toLetterIdx,
        toY,
        lifespan: 4 + Math.random() * 5,
        age: 0,
        alpha: 0,
        ghostX,
        ghostY,
        ghostAlpha: 0,
        ghostPhase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 2; i++) spawnConnection();

    // ── Mouse tracking ──
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    function onMouseLeave() {
      mouseRef.current = null;
    }
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      time += 0.016;

      // ── VERG ──
      ctx.font = '900 72px "Geist Mono", "SF Mono", "Fira Code", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(245, 245, 245, 0.95)';
      ctx.fillText('VERG', vergX, vergY);

      // ── Heatmap squares ──
      let hoveredCell: HeatCell | null = null;
      const mx = mouseRef.current?.x ?? -1;
      const my = mouseRef.current?.y ?? -1;

      for (const cell of heatCells) {
        const { r, g, b } = heatBrightness(cell.intensity);
        const baseAlpha = cell.intensity > 0 ? 0.5 + cell.intensity * 0.5 : 0.15;
        let alpha = baseAlpha * cell.fadeAlpha;

        // Check hover
        const isHovered = mx >= cell.x && mx <= cell.x + cellSize &&
                          my >= cell.y && my <= cell.y + cellSize;
        if (isHovered) {
          hoveredCell = cell;
          alpha = Math.min(1, alpha + 0.3);
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(cell.x, cell.y, cellSize, cellSize, 2);
        ctx.fill();

        // Hover ring
        if (isHovered) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cell.x - 1, cell.y - 1, cellSize + 2, cellSize + 2, 3);
          ctx.stroke();
        }
      }

      // ── Connections ──
      if (connections.length < MAX_CONN && Math.random() < 0.008) {
        spawnConnection();
      }

      for (let i = connections.length - 1; i >= 0; i--) {
        const conn = connections[i];
        conn.age += 0.016;
        const progress = conn.age / conn.lifespan;

        if (progress < 0.2) {
          conn.alpha = progress / 0.2;
        } else if (progress > 0.8) {
          conn.alpha = (1 - progress) / 0.2;
        } else {
          conn.alpha = 1;
        }

        // Ghost node pulses in middle portion
        const ghostVisible = progress > 0.25 && progress < 0.75;
        conn.ghostAlpha = ghostVisible
          ? Math.sin(((progress - 0.25) / 0.5) * Math.PI) * conn.alpha
          : 0;

        if (progress >= 1) {
          connections.splice(i, 1);
          spawnConnection();
          continue;
        }

        const from = activeCells[conn.fromIdx];
        const to = letterPositions[conn.toLetterIdx];
        if (!from || !to) continue;

        const fx = from.x + cellSize / 2;
        const fy = from.y + cellSize / 2;
        const tx = to.x;
        const ty = conn.toY;
        const gx = conn.ghostX;
        const gy = conn.ghostY;

        const lineAlpha = conn.alpha * 0.15;

        // Line: heatmap → ghost node
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(gx, gy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Line: ghost node → VERG letter
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Ghost node
        if (conn.ghostAlpha > 0.01) {
          const gr = 3 + Math.sin(time * 2 + conn.ghostPhase) * 1;
          ctx.beginPath();
          ctx.arc(gx, gy, gr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${conn.ghostAlpha * 0.6})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(gx, gy, gr + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${conn.ghostAlpha * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Glow on source cell
        ctx.beginPath();
        ctx.roundRect(from.x - 1, from.y - 1, cellSize + 2, cellSize + 2, 3);
        ctx.strokeStyle = `rgba(255, 255, 255, ${conn.alpha * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ── Hover tooltip ──
      if (hoveredCell) {
        const label = `${hoveredCell.date}  ·  ${hoveredCell.count} items`;
        ctx.font = '500 10px "Geist Mono", "SF Mono", monospace';
        const tm = ctx.measureText(label);
        const tw = tm.width + 12;
        const th = 20;
        let ttx = hoveredCell.x + cellSize / 2 - tw / 2;
        let tty = hoveredCell.y - th - 6;

        // Keep on screen
        if (ttx < 4) ttx = 4;
        if (ttx + tw > W - 4) ttx = W - 4 - tw;
        if (tty < 4) tty = hoveredCell.y + cellSize + 6;

        ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
        ctx.beginPath();
        ctx.roundRect(ttx, tty, tw, th, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(63, 63, 70, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.fillStyle = 'rgba(212, 212, 216, 0.9)';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, ttx + 6, tty + th / 2);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    function resize() {
      if (!canvas) return;
      W = canvas.parentElement?.clientWidth || 900;
      canvas.width = W * dpr;
      canvas.style.width = `${W}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [heatGrid]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 160 }}>
      <canvas ref={canvasRef} className="w-full cursor-crosshair" style={{ height: 160 }} />
    </div>
  );
}
