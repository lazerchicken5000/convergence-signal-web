'use client';

import { useState } from 'react';

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('done');
        // PostHog client-side event
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ph = (globalThis as any).posthog;
          if (ph?.capture) ph.capture('email_signup', { email });
        } catch { /* posthog not loaded */ }
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400">
        <span>subscribed — weekly convergence briefings incoming.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 text-xs">
      <span className="text-zinc-500 shrink-0">Weekly signal —</span>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'sending'}
        className="w-44 py-1 px-2 rounded border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === 'sending' || !email}
        className="py-1 px-3 rounded bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors disabled:opacity-30 cursor-pointer text-xs"
      >
        {status === 'sending' ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && <span className="text-red-400">failed — try again</span>}
    </form>
  );
}
