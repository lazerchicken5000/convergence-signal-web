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
  const saved = cost.rawTokens - cost.curatedTokens;
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-[10px] text-zinc-500 font-mono">
        {formatTokens(cost.rawTokens)} token bake
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
        saves you {formatTokens(saved)}
      </span>
    </div>
  );
}

export function TokenCostHero({ cost }: { cost: TokenCost }) {
  // Visual ratio: how much of the bar is "saved"
  const savedPct = cost.savings;
  const usedPct = 100 - savedPct;

  return (
    <div className="border border-emerald-500/20 rounded-lg p-5 bg-emerald-500/[0.03] space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-emerald-400/80 font-semibold">Intelligence Savings</p>
        <span className="text-2xl font-mono font-black text-emerald-400">{savedPct}%</span>
      </div>

      {/* Visual bar */}
      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500/30 rounded-full"
          style={{ width: '100%' }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
          style={{ width: `${usedPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-mono font-bold text-zinc-400">{formatTokens(cost.rawTokens)}</p>
          <p className="text-[10px] text-zinc-600">token bake</p>
        </div>
        <div>
          <p className="text-lg font-mono font-bold text-emerald-400">{formatTokens(cost.curatedTokens)}</p>
          <p className="text-[10px] text-zinc-600">you consume</p>
        </div>
        <div>
          <p className="text-lg font-mono font-bold text-zinc-300">{formatTokens(cost.rawTokens - cost.curatedTokens)}</p>
          <p className="text-[10px] text-zinc-600">saved for you</p>
        </div>
      </div>

      <p className="text-[10px] text-zinc-500 text-center">
        {formatTokens(cost.rawTokens)} tokens were baked across {cost.sourceCount} sources and {cost.vectorCount} vectors to produce this {formatTokens(cost.curatedTokens)}-token insight.
        You skip {savedPct}% of the noise.
      </p>
    </div>
  );
}

export function TokenCostDetail({ cost }: { cost: TokenCost }) {
  return <TokenCostHero cost={cost} />;
}
