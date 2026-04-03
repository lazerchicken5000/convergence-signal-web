import type { LeaderContribution } from '@/lib/data';

const ATTR_COLORS: Record<string, string> = {
  originality: 'bg-purple-500',
  independence: 'bg-emerald-500',
  centrality: 'bg-amber-500',
  sourceDepth: 'bg-blue-500',
};

const ATTR_LABELS: Record<string, string> = {
  originality: 'Originality',
  independence: 'Independence',
  centrality: 'Centrality',
  sourceDepth: 'Source Depth',
};

interface RPGCardProps {
  contribution: LeaderContribution;
  compact?: boolean;
}

export function RPGCard({ contribution, compact = false }: RPGCardProps) {
  const attrs = [
    { key: 'originality', value: contribution.originality },
    { key: 'independence', value: contribution.independence },
    { key: 'centrality', value: contribution.centrality },
    { key: 'sourceDepth', value: contribution.sourceDepth },
  ];

  if (compact) {
    return (
      <div className="flex gap-3">
        {attrs.map(a => (
          <div key={a.key} className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${ATTR_COLORS[a.key]}`}
                style={{ width: `${Math.max(3, a.value)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{a.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {attrs.map(a => (
        <div key={a.key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400">{ATTR_LABELS[a.key]}</span>
            <span className="font-mono text-zinc-300">{a.value}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${ATTR_COLORS[a.key]} transition-all`}
              style={{ width: `${Math.max(2, a.value)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  Researcher: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Builder: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Synthesizer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Analyst: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Challenger: 'bg-red-500/10 text-red-400 border-red-500/20',
  Contributor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function ContributionTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${TYPE_COLORS[type] ?? TYPE_COLORS.Contributor}`}>
      {type}
    </span>
  );
}
