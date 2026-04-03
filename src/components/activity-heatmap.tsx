'use client';

import { useState } from 'react';
import type { DayActivity, AggregateStats } from '@/lib/data';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function heatColor(count: number): string {
  if (count === 0) return 'bg-zinc-800/50';
  if (count <= 5) return 'bg-emerald-900/60';
  if (count <= 20) return 'bg-emerald-700/60';
  if (count <= 50) return 'bg-emerald-500/60';
  return 'bg-emerald-400/80';
}

interface HeatmapProps {
  days: DayActivity[];
  stats: AggregateStats;
  onDaySelect?: (date: string | null) => void;
}

export function ActivityHeatmap({ days, stats, onDaySelect }: HeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  function selectDay(day: DayActivity) {
    const date = day.itemCount > 0 ? day.date : null;
    const newDate = date === selectedDate ? null : date;
    setSelectedDate(newDate);
    onDaySelect?.(newDate);
  }

  // Group by week for grid layout (7 rows = days of week)
  const weeks: DayActivity[][] = [];
  let currentWeek: DayActivity[] = [];

  // Pad first week
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

  return (
    <div className="space-y-3">
      {/* Subtle stats row */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono flex-wrap">
        <span>{formatTokens(stats.totalTokensBaked)} tokens baked</span>
        <span>{stats.totalArticles} sources</span>
        <span>{stats.totalLeaders} leaders</span>
        <span>{stats.totalPatterns} patterns</span>
        <span>{stats.activeDays} active days</span>
      </div>

      {/* Heatmap grid */}
      <div className="relative">
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <button
                  key={`${wi}-${di}`}
                  onClick={() => day.date && selectDay(day)}
                  onMouseEnter={() => day.date ? setHoveredDay(day) : null}
                  onMouseLeave={() => setHoveredDay(null)}
                  disabled={!day.date}
                  className={`w-[11px] h-[11px] rounded-[2px] transition-all ${
                    day.date === selectedDate
                      ? 'ring-1 ring-emerald-400 ring-offset-1 ring-offset-zinc-900'
                      : ''
                  } ${day.date ? `${heatColor(day.itemCount)} hover:ring-1 hover:ring-zinc-500 cursor-pointer` : 'bg-transparent'}`}
                  title={day.date ? `${day.date}: ${day.itemCount} items` : ''}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Hover tooltip */}
        {hoveredDay && hoveredDay.date && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 font-mono whitespace-nowrap pointer-events-none z-10">
            {hoveredDay.date} · {hoveredDay.itemCount} items{hoveredDay.hasDiff ? ' · diff' : ''}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[9px] text-zinc-600">
        <span>Less</span>
        <span className="w-[9px] h-[9px] rounded-[2px] bg-zinc-800/50" />
        <span className="w-[9px] h-[9px] rounded-[2px] bg-emerald-900/60" />
        <span className="w-[9px] h-[9px] rounded-[2px] bg-emerald-700/60" />
        <span className="w-[9px] h-[9px] rounded-[2px] bg-emerald-500/60" />
        <span className="w-[9px] h-[9px] rounded-[2px] bg-emerald-400/80" />
        <span>More</span>
      </div>
    </div>
  );
}
