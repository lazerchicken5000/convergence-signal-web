'use client';

import { useMemo } from 'react';
import type { SourceRankingData } from '@/lib/data';

interface SourceTreemapProps {
  rankings: SourceRankingData;
  onCreatorClick?: (creator: string) => void;
}

interface TreeNode {
  label: string;
  value: number;
  grade: string;
  source: string;
  creator: string;
  conversionRate: number;
  tokensPerPattern: number;
  children?: TreeNode[];
}

interface TreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  node: TreeNode;
  depth: number;
}

const GRADE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.3)', text: '#34d399' },
  B: { bg: 'rgba(96, 165, 250, 0.12)', border: 'rgba(96, 165, 250, 0.3)', text: '#60a5fa' },
  C: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' },
  D: { bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)', text: '#fb923c' },
  F: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', text: '#b91c1c' },
};

const SOURCE_LABELS: Record<string, string> = {
  github: 'GitHub',
  arxiv: 'arXiv',
  semantic_scholar: 'Scholar',
  rss: 'RSS',
  youtube: 'YouTube',
  web: 'Web',
  x: 'X',
};

// Squarified treemap layout algorithm
function squarify(nodes: TreeNode[], x: number, y: number, w: number, h: number): TreeRect[] {
  if (nodes.length === 0 || w <= 0 || h <= 0) return [];

  const total = nodes.reduce((s, n) => s + n.value, 0);
  if (total <= 0) return [];

  const rects: TreeRect[] = [];
  const sorted = [...nodes].sort((a, b) => b.value - a.value);

  let cx = x, cy = y, cw = w, ch = h;
  let remaining = [...sorted];

  while (remaining.length > 0) {
    const isWide = cw >= ch;
    const side = isWide ? ch : cw;
    const remTotal = remaining.reduce((s, n) => s + n.value, 0);

    // Find the best row
    let row: TreeNode[] = [];
    let rowArea = 0;
    let bestRatio = Infinity;

    for (const node of remaining) {
      const testRow = [...row, node];
      const testArea = rowArea + node.value;
      const rowLength = (testArea / remTotal) * (isWide ? cw : ch);

      // Worst aspect ratio in this row
      let worstRatio = 0;
      for (const r of testRow) {
        const nodeArea = (r.value / remTotal) * cw * ch;
        const nodeW = rowLength;
        const nodeH = nodeArea / Math.max(nodeW, 0.001);
        const ratio = Math.max(nodeW / Math.max(nodeH, 0.001), nodeH / Math.max(nodeW, 0.001));
        worstRatio = Math.max(worstRatio, ratio);
      }

      if (worstRatio <= bestRatio || row.length === 0) {
        bestRatio = worstRatio;
        row = testRow;
        rowArea = testArea;
      } else {
        break;
      }
    }

    // Layout the row
    const rowFraction = rowArea / remTotal;
    const rowLength = isWide
      ? cw * rowFraction
      : ch * rowFraction;

    let offset = 0;
    for (const node of row) {
      const nodeFraction = node.value / rowArea;
      const nodeLength = side * nodeFraction;

      if (isWide) {
        rects.push({
          x: cx,
          y: cy + offset,
          w: rowLength,
          h: nodeLength,
          node,
          depth: 0,
        });
      } else {
        rects.push({
          x: cx + offset,
          y: cy,
          w: nodeLength,
          h: rowLength,
          node,
          depth: 0,
        });
      }
      offset += nodeLength;
    }

    // Shrink remaining area
    if (isWide) {
      cx += rowLength;
      cw -= rowLength;
    } else {
      cy += rowLength;
      ch -= rowLength;
    }

    remaining = remaining.filter(n => !row.includes(n));
  }

  return rects;
}

export function SourceTreemap({ rankings }: SourceTreemapProps) {
  const { groups, totalItems, gradeCount } = useMemo(() => {
    // Group rankings by source type
    const typeGroups = new Map<string, typeof rankings.rankings>();
    for (const r of rankings.rankings) {
      const key = r.source === 'semantic_scholar' ? 'arxiv' : r.source;
      if (!typeGroups.has(key)) typeGroups.set(key, []);
      typeGroups.get(key)!.push(r);
    }

    // Build tree nodes per type
    const groups: TreeNode[] = [];
    for (const [type, items] of typeGroups) {
      const children: TreeNode[] = items
        .filter(r => r.itemCount > 0)
        .sort((a, b) => b.itemCount - a.itemCount)
        .map(r => ({
          label: r.creator,
          value: r.itemCount,
          grade: r.grade,
          source: r.source,
          creator: r.creator,
          conversionRate: r.conversionRate,
          tokensPerPattern: r.tokensPerPattern,
        }));

      if (children.length === 0) continue;

      groups.push({
        label: SOURCE_LABELS[type] ?? type,
        value: children.reduce((s, c) => s + c.value, 0),
        grade: '',
        source: type,
        creator: '',
        conversionRate: 0,
        tokensPerPattern: 0,
        children,
      });
    }

    // Sort: github first, then arxiv, youtube, rss
    const ORDER: Record<string, number> = { github: 0, arxiv: 1, youtube: 2, web: 3, rss: 4 };
    groups.sort((a, b) => (ORDER[a.source] ?? 5) - (ORDER[b.source] ?? 5));

    const totalItems = rankings.totalItems;
    const gradeCount: Record<string, number> = {};
    for (const r of rankings.rankings) {
      gradeCount[r.grade] = (gradeCount[r.grade] || 0) + 1;
    }

    return { groups, totalItems, gradeCount };
  }, [rankings]);

  // Layout treemap — use children (individual creators)
  const allCreators = groups.flatMap(g => g.children ?? []);
  const rects = squarify(allCreators, 0, 0, 100, 100);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">Source Intelligence</h3>
          <p className="text-xs text-zinc-600">{rankings.totalSources} sources · {totalItems} items · {(rankings.avgConversionRate * 100).toFixed(0)}% avg conversion</p>
        </div>
        <div className="flex gap-1.5">
          {['A', 'B', 'C', 'F'].map(g => gradeCount[g] ? (
            <span key={g} className="text-[10px] px-1.5 py-0.5 rounded border" style={{
              backgroundColor: GRADE_COLORS[g]?.bg,
              borderColor: GRADE_COLORS[g]?.border,
              color: GRADE_COLORS[g]?.text,
            }}>
              {gradeCount[g]}{g}
            </span>
          ) : null)}
        </div>
      </div>

      {/* Treemap */}
      <div className="relative w-full border border-zinc-800 rounded-lg overflow-hidden" style={{ paddingBottom: '60%' }}>
        <div className="absolute inset-0">
          {rects.map((rect, i) => {
            const colors = GRADE_COLORS[rect.node.grade] ?? GRADE_COLORS.F;
            const minSize = Math.min(rect.w, rect.h);
            const showLabel = minSize > 8;
            const showStats = minSize > 14;

            return (
              <div
                key={i}
                className="absolute border transition-all hover:brightness-125 hover:z-10 cursor-default group"
                style={{
                  left: `${rect.x}%`,
                  top: `${rect.y}%`,
                  width: `${rect.w}%`,
                  height: `${rect.h}%`,
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
                title={`${rect.node.creator}\n${rect.node.source} · ${rect.node.value} items · Grade ${rect.node.grade}\n${(rect.node.conversionRate * 100).toFixed(0)}% conversion`}
              >
                <div className="p-1 overflow-hidden h-full flex flex-col justify-between">
                  {showLabel && (
                    <p className="text-[10px] text-zinc-400 truncate leading-tight font-medium">
                      {rect.node.creator.length > 25 ? rect.node.creator.slice(0, 22) + '...' : rect.node.creator}
                    </p>
                  )}
                  {showStats && (
                    <div className="flex items-end justify-between mt-auto">
                      <span className="text-[9px] font-mono" style={{ color: colors.text }}>{rect.node.grade}</span>
                      <span className="text-[9px] text-zinc-600 font-mono">{rect.node.value}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {(rankings.recommendations.expand.length > 0 || rankings.recommendations.prune.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {rankings.recommendations.expand.length > 0 && (
            <div className="border border-zinc-800 rounded-lg p-3">
              <p className="text-xs text-emerald-500 font-semibold mb-1">Expand</p>
              {rankings.recommendations.expand.slice(0, 4).map((s, i) => (
                <p key={i} className="text-xs text-zinc-500 truncate">{s}</p>
              ))}
            </div>
          )}
          {rankings.recommendations.prune.length > 0 && (
            <div className="border border-zinc-800 rounded-lg p-3">
              <p className="text-xs text-red-500 font-semibold mb-1">Prune</p>
              {rankings.recommendations.prune.slice(0, 4).map((s, i) => (
                <p key={i} className="text-xs text-zinc-500 truncate">{s}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scorecard summary if available */}
      <div className="text-[10px] text-zinc-700 text-center">
        Source quality treemap · box size = items ingested · color = signal grade
      </div>
    </div>
  );
}
