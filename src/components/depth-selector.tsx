'use client';

import { useState, useEffect } from 'react';

// --- Text Size Toggle (S / M / L) ---

const SIZES = [
  { label: 'S', fontSize: '14px' },
  { label: 'M', fontSize: '16px' },
  { label: 'L', fontSize: '18px' },
];

export function TextSizeSelector() {
  const [idx, setIdx] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('cs-text-size');
    if (saved) {
      const i = SIZES.findIndex(s => s.label === saved);
      if (i >= 0) setIdx(i);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[idx].fontSize;
    localStorage.setItem('cs-text-size', SIZES[idx].label);
  }, [idx]);

  return (
    <div className="flex items-center gap-1 border border-zinc-700 rounded-md p-0.5">
      {SIZES.map((s, i) => (
        <button
          key={s.label}
          onClick={() => setIdx(i)}
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            i === idx ? 'bg-zinc-700 text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// --- Glossary Depth Toggle (Simple / Nuanced) ---

export type GlossaryDepth = 'simple' | 'nuanced';

export function GlossaryDepthToggle() {
  const [depth, setDepth] = useState<GlossaryDepth>('nuanced');

  useEffect(() => {
    const saved = localStorage.getItem('cs-glossary-depth') as GlossaryDepth | null;
    if (saved === 'simple' || saved === 'nuanced') setDepth(saved);
  }, []);

  function select(d: GlossaryDepth) {
    setDepth(d);
    localStorage.setItem('cs-glossary-depth', d);
    document.documentElement.dataset.glossaryDepth = d;
  }

  return (
    <div className="flex items-center gap-1 border border-zinc-700 rounded-md p-0.5">
      {(['simple', 'nuanced'] as const).map(d => (
        <button
          key={d}
          onClick={() => select(d)}
          className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
            d === depth ? 'bg-zinc-700 text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

/**
 * Show simple or nuanced text based on glossary depth toggle.
 * Listens to the data attribute on <html> for live switching.
 */
export function GlossaryText({ simple, nuanced }: { simple: string; nuanced: string }) {
  const [depth, setDepth] = useState<GlossaryDepth>('nuanced');

  useEffect(() => {
    const saved = localStorage.getItem('cs-glossary-depth') as GlossaryDepth | null;
    if (saved) setDepth(saved);

    const observer = new MutationObserver(() => {
      const d = document.documentElement.dataset.glossaryDepth as GlossaryDepth;
      if (d) setDepth(d);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-glossary-depth'] });
    return () => observer.disconnect();
  }, []);

  return <>{depth === 'simple' ? simple : nuanced}</>;
}
