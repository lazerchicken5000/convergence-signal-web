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

// --- Accolades ---

export interface Accolade {
  label: string;
  color: string; // tailwind border + text
}

export function deriveAccolades(leader: {
  tenure_weeks: number;
  source_types: string[];
  convergence_patterns: string[];
  influence_trajectory: string;
  signals: Record<string, number>;
}): Accolade[] {
  const accolades: Accolade[] = [];

  if (leader.tenure_weeks >= 200)
    accolades.push({ label: 'Veteran', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' });
  if (leader.tenure_weeks >= 52 && leader.tenure_weeks < 200)
    accolades.push({ label: 'Established', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' });

  if (leader.source_types.filter(s => s !== 'citation').length >= 3)
    accolades.push({ label: 'Cross-Platform', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5' });

  if (leader.convergence_patterns.length >= 3)
    accolades.push({ label: 'Pattern Hub', color: 'border-purple-500/30 text-purple-400 bg-purple-500/5' });

  if (leader.influence_trajectory === 'rising')
    accolades.push({ label: 'Rising', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' });

  if ((leader.signals.independence_contribution || 0) > 0.5)
    accolades.push({ label: 'High Originality', color: 'border-pink-500/30 text-pink-400 bg-pink-500/5' });

  if (leader.source_types.includes('arxiv'))
    accolades.push({ label: 'Published', color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' });

  if (leader.source_types.includes('github') && (leader.signals.content_volume || 0) > 0.3)
    accolades.push({ label: 'Active Builder', color: 'border-green-500/30 text-green-400 bg-green-500/5' });

  return accolades;
}

export function AccoladeBadges({ accolades }: { accolades: Accolade[] }) {
  if (accolades.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {accolades.map(a => (
        <span key={a.label} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${a.color}`}>
          {a.label}
        </span>
      ))}
    </div>
  );
}

// --- Contribution Type ---

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
