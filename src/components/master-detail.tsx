'use client';

import { useState } from 'react';

type Tab = 'signal' | 'leaders' | 'emerging';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'signal', label: 'Signal' },
  { key: 'leaders', label: 'Leaders' },
  { key: 'emerging', label: 'Emerging' },
];

interface MasterDetailProps {
  /** Render the ranked rows for each tab. Receives selectedId and onSelect callback. */
  renderRows: (tab: Tab, selectedId: string | null, onSelect: (id: string) => void) => React.ReactNode;
  /** Render the infographic panel for the selected item. */
  renderDetail: (tab: Tab, selectedId: string | null) => React.ReactNode;
}

export function MasterDetail({ renderRows, renderDetail }: MasterDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('signal');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSelectedId(null);
  }

  function handleSelect(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  return (
    <div className="flex gap-0 min-h-[500px]">
      {/* ── LEFT COLUMN: tabs + ranked rows ── */}
      <div className="w-[340px] shrink-0 border-r border-zinc-800">
        {/* Tab buttons */}
        <div className="flex border-b border-zinc-800">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                t.key === activeTab
                  ? 'text-white border-b-2 border-white -mb-px'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Ranked rows */}
        <div className="overflow-y-auto max-h-[600px] scrollbar-thin">
          {renderRows(activeTab, selectedId, handleSelect)}
        </div>
      </div>

      {/* ── RIGHT PANEL: infographic area ── */}
      <div className="flex-1 min-w-0 pl-6">
        {renderDetail(activeTab, selectedId)}
      </div>
    </div>
  );
}

/** A single compact row in the left column */
export function RankedRow({
  id,
  rank,
  label,
  score,
  badge,
  sublabel,
  isSelected,
  onSelect,
}: {
  id: string;
  rank: number;
  label: string;
  score: string;
  badge?: React.ReactNode;
  sublabel?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors group ${
        isSelected
          ? 'bg-zinc-800/60 border-l-2 border-l-white'
          : 'hover:bg-zinc-800/30 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-zinc-600 w-4 text-right shrink-0">{rank}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {badge}
            <span className="text-xs text-zinc-300 truncate">{label}</span>
          </div>
          {sublabel && (
            <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{sublabel}</p>
          )}
        </div>
        <span className="font-mono text-[11px] text-zinc-500 shrink-0">{score}</span>
      </div>
    </button>
  );
}
