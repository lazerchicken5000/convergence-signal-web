'use client';

import { useState, type ReactNode } from 'react';

interface AccordionItemProps {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ trigger, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden transition-colors hover:border-zinc-600">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 cursor-pointer"
      >
        <div className="flex-1 min-w-0">{trigger}</div>
        <span className={`text-zinc-500 shrink-0 transition-transform duration-200 mt-1 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-zinc-800/50">
          {children}
        </div>
      )}
    </div>
  );
}
