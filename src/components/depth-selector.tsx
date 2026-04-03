'use client';

import { useState, useEffect, createContext, useContext } from 'react';

export type Depth = 'simple' | 'standard' | 'expert';

const DEPTHS: Array<{ key: Depth; label: string; title: string }> = [
  { key: 'simple', label: 'Simple', title: 'Plain language, no jargon' },
  { key: 'standard', label: 'Standard', title: 'Some technical context' },
  { key: 'expert', label: 'Expert', title: 'Full technical detail' },
];

const DepthContext = createContext<Depth>('standard');

export function useDepth() {
  return useContext(DepthContext);
}

export function DepthProvider({ children }: { children: React.ReactNode }) {
  const [depth, setDepth] = useState<Depth>('standard');

  useEffect(() => {
    const saved = localStorage.getItem('cs-depth') as Depth | null;
    if (saved && DEPTHS.some(d => d.key === saved)) setDepth(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('cs-depth', depth);
    document.documentElement.dataset.depth = depth;
  }, [depth]);

  return (
    <DepthContext.Provider value={depth}>
      <div className="contents" data-depth={depth}>
        {children}
      </div>
    </DepthContext.Provider>
  );
}

export function DepthSelector() {
  const [depth, setDepth] = useState<Depth>('standard');

  useEffect(() => {
    const saved = localStorage.getItem('cs-depth') as Depth | null;
    if (saved && DEPTHS.some(d => d.key === saved)) setDepth(saved);
  }, []);

  function select(d: Depth) {
    setDepth(d);
    localStorage.setItem('cs-depth', d);
    document.documentElement.dataset.depth = d;
  }

  return (
    <div className="flex items-center gap-1 border border-zinc-700 rounded-md p-0.5">
      {DEPTHS.map(d => (
        <button
          key={d.key}
          onClick={() => select(d.key)}
          title={d.title}
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            d.key === depth
              ? 'bg-zinc-700 text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Show different content based on depth level.
 * Usage: <DepthText simple="..." standard="..." expert="..." />
 */
export function DepthText({ simple, standard, expert }: { simple: string; standard: string; expert: string }) {
  const [depth, setDepth] = useState<Depth>('standard');

  useEffect(() => {
    const saved = localStorage.getItem('cs-depth') as Depth | null;
    if (saved && DEPTHS.some(d => d.key === saved)) setDepth(saved);

    const observer = new MutationObserver(() => {
      const d = document.documentElement.dataset.depth as Depth;
      if (d) setDepth(d);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-depth'] });
    return () => observer.disconnect();
  }, []);

  const text = depth === 'simple' ? simple : depth === 'expert' ? expert : standard;
  return <>{text}</>;
}
