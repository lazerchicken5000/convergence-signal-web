'use client';

import { useState, useEffect } from 'react';

const SIZES = [
  { label: 'S', class: 'text-size-sm', fontSize: '14px' },
  { label: 'M', class: 'text-size-md', fontSize: '16px' },
  { label: 'L', class: 'text-size-lg', fontSize: '18px' },
];

export function TextSizeToggle() {
  const [sizeIndex, setSizeIndex] = useState(1); // default M

  useEffect(() => {
    const saved = localStorage.getItem('cs-text-size');
    if (saved) {
      const idx = SIZES.findIndex(s => s.label === saved);
      if (idx >= 0) setSizeIndex(idx);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[sizeIndex].fontSize;
    localStorage.setItem('cs-text-size', SIZES[sizeIndex].label);
  }, [sizeIndex]);

  return (
    <div className="flex items-center gap-1 border border-zinc-700 rounded-md p-0.5">
      {SIZES.map((size, i) => (
        <button
          key={size.label}
          onClick={() => setSizeIndex(i)}
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            i === sizeIndex
              ? 'bg-zinc-700 text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label={`Text size ${size.label}`}
        >
          {size.label}
        </button>
      ))}
    </div>
  );
}
