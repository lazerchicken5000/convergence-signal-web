'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TipPage() {
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
        window.location.replace(data.url);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-lg font-bold tracking-tight mb-2">Support Verg</h1>
        <p className="text-xs text-zinc-500 mb-6">
          API costs stack up — every bit helps keep the pipeline running.
        </p>

        <div className="flex items-center gap-2 justify-center">
          {['1', '5'].map((amt) => (
            <button
              key={amt}
              onClick={() => handleTip(amt)}
              disabled={loading}
              className="py-2 px-5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 font-medium text-sm hover:bg-zinc-800 hover:border-zinc-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              ${amt}
            </button>
          ))}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              min="1"
              max="999"
              placeholder="other"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTip(customAmount)}
              disabled={loading}
              className="w-24 py-2 pl-6 pr-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => handleTip(customAmount)}
            disabled={loading || !customAmount || parseFloat(customAmount) < 1}
            className="py-2 px-4 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-30 cursor-pointer"
          >
            Pay
          </button>
        </div>

        {loading && (
          <p className="text-xs text-zinc-500 mt-3 animate-pulse">
            Redirecting to Stripe...
          </p>
        )}

        <Link
          href="/"
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors mt-6 inline-block"
        >
          &larr; back
        </Link>
      </div>
    </main>
  );
}
