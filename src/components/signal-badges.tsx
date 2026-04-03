import type { SignalQuality, TokenCost } from '@/lib/data';

export function SignalBadges({ quality }: { quality: SignalQuality }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {quality.independence === 'high' && (
        <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
          Independent Signal
        </span>
      )}
      {quality.independence === 'low' && (
        <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/5">
          Possible Echo
        </span>
      )}
      {quality.platformDiversity >= 3 && (
        <span className="text-[10px] px-2 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/5">
          Cross-platform
        </span>
      )}
      {quality.platformDiversity === 1 && (
        <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-600 text-zinc-500">
          Single-source
        </span>
      )}
      {quality.narrativeDirection === 'accelerating' && (
        <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
          Accelerating
        </span>
      )}
      {quality.narrativeDirection === 'fading' && (
        <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-600 text-zinc-500">
          Fading
        </span>
      )}
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function TokenCostBadge({ cost }: { cost: TokenCost }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
      <span>{formatTokens(cost.rawTokens)} raw</span>
      <span className="text-zinc-700">&rarr;</span>
      <span className="text-zinc-300">{formatTokens(cost.curatedTokens)} curated</span>
      <span className="text-emerald-400">({cost.savings}% saved)</span>
    </span>
  );
}

export function TokenCostDetail({ cost }: { cost: TokenCost }) {
  return (
    <div className="border border-zinc-800 rounded-lg p-4 space-y-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Intelligence Cost</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-lg font-mono font-bold text-zinc-300">{formatTokens(cost.rawTokens)}</p>
          <p className="text-[10px] text-zinc-500">tokens in raw sources</p>
        </div>
        <div>
          <p className="text-lg font-mono font-bold text-emerald-400">{formatTokens(cost.curatedTokens)}</p>
          <p className="text-[10px] text-zinc-500">tokens curated</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${100 - cost.savings}%` }}
          />
        </div>
        <span className="text-xs font-mono text-emerald-400">{cost.savings}% saved</span>
      </div>
      <p className="text-[10px] text-zinc-600">
        Distilled from {cost.sourceCount} sources across {cost.vectorCount} vectors
      </p>
    </div>
  );
}
