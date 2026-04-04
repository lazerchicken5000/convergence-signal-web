'use client';

import { useState } from 'react';

type Tab = 'signal' | 'leaders' | 'emerging' | 'research';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'signal', label: 'Signal' },
  { key: 'leaders', label: 'Leaders' },
  { key: 'emerging', label: 'Emerging' },
  { key: 'research', label: 'Research' },
];

export function ColumnTabs({ children }: { children: Record<Tab, React.ReactNode> }) {
  const [active, setActive] = useState<Tab>('signal');

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 border border-zinc-700 rounded-lg p-1 w-fit mx-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
              t.key === active
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="max-w-3xl mx-auto">
        {children[active]}
      </div>
    </div>
  );
}
