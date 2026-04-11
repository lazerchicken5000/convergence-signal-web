'use client';

import { useState } from 'react';

export function TipInline() {
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  async function handleTip(amount: string) {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 1 || num > 999) return;

    setLoading(true);
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: String(Math.round(num)) }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 py-5 border-t border-zinc-800/50">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-zinc-500">
          Support the pipeline — API costs stack up.
        </p>
        <div className="flex items-center gap-2">
          {['1', '5'].map((amt) => (
            <button
              key={amt}
              onClick={() => handleTip(amt)}
              disabled={loading}
              className="py-1.5 px-4 rounded border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs hover:bg-zinc-800 hover:border-zinc-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              ${amt}
            </button>
          ))}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">$</span>
            <input
              type="number"
              min="1"
              max="999"
              placeholder="other"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTip(customAmount)}
              disabled={loading}
              className="w-20 py-1.5 pl-5 pr-2 rounded border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => handleTip(customAmount)}
            disabled={loading || !customAmount || parseFloat(customAmount) < 1}
            className="py-1.5 px-3 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors disabled:opacity-30 cursor-pointer"
          >
            Pay
          </button>
          {loading && <span className="text-[10px] text-zinc-600 animate-pulse">redirecting…</span>}
        </div>
      </div>
    </div>
  );
}
