'use client';

import { useState } from 'react';

type Quality = 'good' | 'bad' | 'broken_link' | 'outdated';

interface SourceAuditProps {
  sourceId: string;
  sourceUrl: string;
  patternId?: string;
}

async function submitFeedback(data: Record<string, unknown>) {
  // Fire to PostHog for analytics
  try {
    const posthog = (await import('posthog-js')).default;
    posthog.capture('feedback_submitted', data);
  } catch { /* posthog not loaded */ }

  // Also hit the API endpoint (logged in Vercel function logs)
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch { /* non-critical */ }
}

export function SourceAuditButtons({ sourceId, sourceUrl, patternId }: SourceAuditProps) {
  const [voted, setVoted] = useState<Quality | null>(null);

  function vote(quality: Quality) {
    if (voted) return;
    setVoted(quality);
    submitFeedback({
      type: 'source_quality',
      source_id: sourceId,
      source_url: sourceUrl,
      pattern_id: patternId,
      quality,
      page: typeof window !== 'undefined' ? window.location.pathname : null,
    });
  }

  if (voted) {
    const labels: Record<Quality, string> = {
      good: 'Marked good',
      bad: 'Flagged',
      broken_link: 'Broken link reported',
      outdated: 'Marked outdated',
    };
    return (
      <span className="text-[9px] text-zinc-600 italic">{labels[voted]}</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => vote('good')} title="Good source" className="p-0.5 text-zinc-600 hover:text-emerald-400 transition-colors cursor-pointer">
        <span className="text-[10px]">+</span>
      </button>
      <button onClick={() => vote('broken_link')} title="Broken link" className="p-0.5 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer">
        <span className="text-[10px]">!</span>
      </button>
      <button onClick={() => vote('bad')} title="Bad / irrelevant source" className="p-0.5 text-zinc-600 hover:text-amber-400 transition-colors cursor-pointer">
        <span className="text-[10px]">-</span>
      </button>
    </span>
  );
}

/**
 * Pattern-level feedback: was this pattern useful?
 */
export function PatternFeedback({ patternId }: { patternId: string }) {
  const [voted, setVoted] = useState<boolean | null>(null);

  function vote(useful: boolean) {
    if (voted !== null) return;
    setVoted(useful);
    submitFeedback({
      type: 'pattern_useful',
      pattern_id: patternId,
      useful,
      page: typeof window !== 'undefined' ? window.location.pathname : null,
    });
  }

  if (voted !== null) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50">
        <span className="text-xs text-zinc-400">{voted ? 'Marked useful — thanks' : 'Noted — we\'ll improve this'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-4 rounded-lg border border-zinc-700 bg-zinc-800/30">
      <span className="text-xs text-zinc-300 font-medium">Was this useful?</span>
      <button
        onClick={() => vote(true)}
        className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors cursor-pointer font-medium"
      >
        Yes
      </button>
      <button
        onClick={() => vote(false)}
        className="text-xs px-3 py-1.5 rounded-md border border-zinc-600 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-pointer font-medium"
      >
        Not really
      </button>
    </div>
  );
}
