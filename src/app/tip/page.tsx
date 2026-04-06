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
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-zinc-800 rounded-lg p-8">
        <h1 className="text-xl font-bold tracking-tight text-center">
          Support Verg
        </h1>
        <p className="text-sm text-zinc-400 text-center mt-3 mb-2 leading-relaxed">
          If you like Verg and what we're building, consider sending a tip.
        </p>
        <p className="text-xs text-zinc-600 text-center mb-8">
          API costs can stack up — every bit helps keep the pipeline running.
        </p>

        {/* Preset amounts */}
        <div className="flex gap-3 justify-center mb-4">
          {['5', '10', '25'].map((amt) => (
            <button
              key={amt}
              onClick={() => handleTip(amt)}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 font-medium text-sm hover:bg-zinc-800 hover:border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ${amt}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              min="1"
              max="999"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              disabled={loading}
              className="w-full py-2.5 pl-7 pr-3 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => handleTip(customAmount)}
            disabled={loading || !customAmount || parseFloat(customAmount) < 1}
            className="py-2.5 px-5 rounded-md border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Tip
          </button>
        </div>

        {loading && (
          <p className="text-xs text-zinc-500 text-center mt-4 animate-pulse">
            Redirecting to Stripe...
          </p>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
