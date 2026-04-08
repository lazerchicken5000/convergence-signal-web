'use client';

import { useState, useEffect } from 'react';

// --- Text Size Toggle (S / M / L) ---

const SIZES = [
  { label: 'S', fontSize: '14px' },
  { label: 'M', fontSize: '16px' },
  { label: 'L', fontSize: '18px' },
];

function readSavedTextSize(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const saved = localStorage.getItem('cs-text-size');
    if (saved) {
      const i = SIZES.findIndex(s => s.label === saved);
      if (i >= 0) return i;
    }
  } catch { /* localStorage may be blocked */ }
  return 1;
}

export function TextSizeSelector() {
  // Lazy initial state — reads localStorage once during the first render.
  // This avoids the React Compiler warning about calling setState inside
  // useEffect (which would cause a cascading re-render).
  const [idx, setIdx] = useState<number>(readSavedTextSize);

  // Effect synchronizes the external system (DOM + localStorage) with
  // the React state — this is the canonical pattern the React Compiler
  // rule allows: state → external, never external → state in the body.
  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[idx].fontSize;
    try {
      localStorage.setItem('cs-text-size', SIZES[idx].label);
    } catch { /* localStorage blocked, silent */ }
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

function readSavedGlossaryDepth(): GlossaryDepth {
  if (typeof window === 'undefined') return 'nuanced';
  try {
    const saved = localStorage.getItem('cs-glossary-depth') as GlossaryDepth | null;
    if (saved === 'simple' || saved === 'nuanced') return saved;
  } catch { /* localStorage may be blocked */ }
  return 'nuanced';
}

export function GlossaryDepthToggle() {
  // Lazy initial state read — same pattern as TextSizeSelector.
  const [depth, setDepth] = useState<GlossaryDepth>(readSavedGlossaryDepth);

  // DOM + localStorage sync effect. The mutation of dataset can't live
  // in the click handler (the React Compiler immutability rule rejects
  // direct mutation of values defined outside the component) — but it's
  // legitimate inside an effect that responds to state changes.
  useEffect(() => {
    document.documentElement.dataset.glossaryDepth = depth;
    try {
      localStorage.setItem('cs-glossary-depth', depth);
    } catch { /* silent */ }
  }, [depth]);

  function select(d: GlossaryDepth) {
    setDepth(d);
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
  // Lazy initial state — same pattern as the toggle.
  const [depth, setDepth] = useState<GlossaryDepth>(readSavedGlossaryDepth);

  useEffect(() => {
    // The MutationObserver callback fires asynchronously when the
    // data-glossary-depth attribute changes on <html>, so calling
    // setDepth from inside it doesn't trip the cascading-render rule.
    const observer = new MutationObserver(() => {
      const d = document.documentElement.dataset.glossaryDepth as GlossaryDepth | undefined;
      if (d === 'simple' || d === 'nuanced') setDepth(d);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-glossary-depth'] });
    return () => observer.disconnect();
  }, []);

  return <>{depth === 'simple' ? simple : nuanced}</>;
}
