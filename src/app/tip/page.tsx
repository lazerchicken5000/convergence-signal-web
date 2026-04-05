'use client';

import { useState } from 'react';
import Link from 'next/link';

const TIERS = [
  { label: '$5', amount: '5' },
  { label: '$10', amount: '10' },
  { label: '$25', amount: '25' },
];

export default function TipPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleTip(amount: string) {
    setLoading(amount);
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-zinc-800 rounded-lg p-8">
        <h1 className="text-xl font-bold tracking-tight text-center">
          Support Verg
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-2 mb-8">
          Help fund independent intelligence curation
        </p>

        <div className="flex gap-3 justify-center">
          {TIERS.map((tier) => (
            <button
              key={tier.amount}
              onClick={() => handleTip(tier.amount)}
              disabled={loading !== null}
              className="flex-1 py-3 px-4 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 font-medium text-sm hover:bg-zinc-800 hover:border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading === tier.amount ? (
                <span className="inline-block animate-pulse">...</span>
              ) : (
                tier.label
              )}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Redirecting to Stripe...
          </p>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
