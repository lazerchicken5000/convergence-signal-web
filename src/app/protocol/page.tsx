import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import path from 'path';
import Image from 'next/image';
import Link from 'next/link';
import { GlossaryDepthToggle, GlossaryText } from '@/components/depth-selector';
import { SignalMap } from '@/components/infographics/signal-map';
import { LeaderGraph } from '@/components/infographics/leader-graph';
import { EmergingTimeline } from '@/components/infographics/emerging-timeline';
import { CuratorSpace } from '@/components/infographics/curator-space';
import { ConvergenceDots } from '@/components/protocol/convergence-dots';
import { EchoVsConvergence } from '@/components/protocol/echo-vs-convergence';
import { PipelineFlow } from '@/components/protocol/pipeline-flow';
import { IndependenceGraph } from '@/components/protocol/independence-graph';
import { CuratorPaths } from '@/components/protocol/curator-paths';
import { Badge } from '@/components/ui/badge';
import {
  getConvergencePatterns,
  getRPGProfiles,
  getLatestDiff,
  getPatternSources,
  getPatternTokenCost,
  getPatternSignalQuality,
  getLeaderContribution,
  getLeaderLinks,
  getAudits,
} from '@/lib/data';
import { loadOutcomeLedger, computeDrift, summarize } from '@/lib/outcome-ledger';
import { ProtocolSectionViewedBeacon } from '@/components/analytics-beacons';

/**
 * Map of protocol section dom-id → human-readable label. Drives the
 * IntersectionObserver beacon — every section fires `protocol_section_viewed`
 * exactly once when it scrolls into view. Lets us see drop-off through
 * the long-form explanation without inferring from time-on-page.
 */
const PROTOCOL_SECTION_MAP: Record<string, string> = {
  hero: 'Hero',
  problem: '01 — Why',
  thesis: '02 — Thesis',
  pipeline: '03 — How',
  'token-bake': '04 — Measurement',
  independence: '05 — Differentiator',
  leaders: '06 — Recognition',
  frontier: '07 — Preservation',
  methodology: '08 — Honesty',
  'try-it': '09 — Now',
  whitepaper: 'Whitepaper',
  audits: 'Audits',
  'self-audit': 'Self-Audit',
};

export const metadata: Metadata = {
  title: "Protocol — Verg",
  description: "How Verg detects convergence: pipeline architecture, independence verification, dimensional diversity scoring, slurry test, counter-curator, self-audit methodology.",
  openGraph: {
    title: "Protocol — Verg",
    description: "How Verg detects convergence: pipeline architecture, independence verification, dimensional diversity scoring, self-audit methodology.",
    url: "https://verg.dev/protocol",
  },
  alternates: {
    canonical: "https://verg.dev/protocol",
  },
};

export const revalidate = 14400;

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is convergence intelligence?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Convergence intelligence detects when independent thinkers in different communities arrive at the same conclusion without coordinating. The signal is cross-community reinforcement, not volume or virality. Two people in different research disciplines, on different platforms, with no citation links between them, arriving at the same conclusion is a stronger signal than any individual's claim."
      }
    },
    {
      "@type": "Question",
      "name": "How does Verg detect convergence?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Verg uses a six-stage pipeline: (1) Ingest from 485+ curated sources via RSS, GitHub API, arXiv, Semantic Scholar, and podcast transcription; (2) Distill each piece into atomic claims (trend vectors) using local LLMs; (3) Cluster similar claims via semantic similarity; (4) Detect convergence where independent voices align on the same cluster; (5) Verify independence using PageRank and Louvain community detection; (6) Classify each pattern as Signal, Frontier, Noise, or Archived."
      }
    },
    {
      "@type": "Question",
      "name": "How does Verg verify independence?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Independence verification uses PageRank to rank contributor authority from the citation/mention graph and Louvain community detection to partition contributors into clusters. Contributors in different communities arriving at the same conclusion produce a high independence score. Contributors in the same community produce a low one. The system acknowledges a known gap: surface metrics catch direct citations and same-platform echo but not hidden common causes like shared catalysts or pretraining contamination."
      }
    },
    {
      "@type": "Question",
      "name": "What is the slurry test?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The slurry test embeds each pattern label locally via nomic-embed-text and compares it to a bank of 25 hand-written generic 'AI trends right now' phrases. If cosine similarity is 0.85 or higher, the label is indistinguishable from what any LLM would produce given an empty prompt. Those patterns get flagged as 'slurry' and de-ranked. It catches generic-sounding patterns that critics have rightly flagged."
      }
    },
    {
      "@type": "Question",
      "name": "What is the counter-curator?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The counter-curator is a second curation pass with a different taste. While the base curator asks 'what are sources converging on?', the counter-curator (Claude Haiku) asks 'is this convergence genuinely novel, or a rebrand of something older?' Each pattern is classified as novel, mixed, rehash, or unclear. Contested patterns where the curators disagree are surfaced for human review."
      }
    },
    {
      "@type": "Question",
      "name": "How does dimensional diversity scoring work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Leaders are scored on four axes, none of which are follower count: Originality (how often they first publish a vector that later appears in convergence), Independence (inverse of community-cluster amplification), Centrality (pattern-involvement weighted by CI score), and Source Depth (weighted by content format: arXiv 1.0, GitHub 0.85, podcasts 0.6, blogs 0.4, social media 0.15)."
      }
    },
    {
      "@type": "Question",
      "name": "What does convergence detection cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Verg reads about 287,000 tokens of source content per run and produces about 12,000 tokens of distilled, structured output -- roughly 96% compression. Each curated pattern contains four tiers of analysis: prose summary, temporal/independence/frame analysis, modal distribution and presupposition conflict detection, and per-source contributor profiles. Both input and output tokens are measured from disk every run, not estimated."
      }
    },
    {
      "@type": "Question",
      "name": "What is frontier classification?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Unlike most systems that delete what isn't trending, Verg classifies everything and keeps it. Patterns are labeled as Signal (high CI + high independence), Frontier (low CI but unique frame -- a watch list), Noise (low CI + low independence, explicit echo), or Archived (was signal, dissolved). Frontier classification preserves slow-burning paradigm shifts that conventional recommenders would prune as noise."
      }
    }
  ]
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// =====================================================================
// WHITEPAPER MARKDOWN HELPERS
// =====================================================================

function fmtMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-200 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono">$1</code>');
}

function renderWhitepaperMarkdown(): string {
  const raw = readFileSync(path.join(process.cwd(), 'public/whitepaper.md'), 'utf-8');
  const lines = raw.split('\n');
  const html: string[] = [];
  let inCode = false;
  let inList = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-zinc-400 my-4"><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    if (inList && !line.startsWith('- ') && line.trim() !== '') {
      html.push('</ul>');
      inList = false;
    }

    if (line.trim() === '---') {
      html.push('<hr class="border-zinc-800 my-8" />');
      continue;
    }

    if (line.startsWith('# ')) {
      html.push(`<h1 class="text-2xl font-bold text-zinc-100 mt-10 mb-4">${fmtMd(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      html.push(`<h2 class="text-xl font-bold text-zinc-200 mt-10 mb-3">${fmtMd(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      html.push(`<h3 class="text-base font-semibold text-zinc-300 mt-6 mb-2">${fmtMd(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul class="space-y-1.5 my-3 ml-4">');
        inList = true;
      }
      html.push(`<li class="text-sm text-zinc-400 leading-relaxed list-disc">${fmtMd(line.slice(2))}</li>`);
      continue;
    }

    if (line.trim() === '') {
      html.push('<div class="h-2"></div>');
      continue;
    }

    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      html.push(`<p class="text-xs text-zinc-600 italic">${fmtMd(line)}</p>`);
      continue;
    }

    html.push(`<p class="text-sm text-zinc-400 leading-relaxed my-2">${fmtMd(line)}</p>`);
  }

  if (inList) html.push('</ul>');
  return html.join('\n');
}

// =====================================================================
// AUDITS HELPERS
// =====================================================================

function fmtDate(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toISOString().slice(0, 10);
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return fmtDate(iso);
}

// =====================================================================
// SECTION CONTENT
// All prose lives here as simple/nuanced pairs. The GlossaryText helper
// (already used by /glossary) reads the global depth toggle and renders
// the matching version. The toggle is sticky in the top-right of the page.
// =====================================================================

interface DepthPair {
  simple: string;
  nuanced: string;
}

interface PipelineStage {
  num: string;
  name: string;
  prose: DepthPair;
}

const PROBLEM: DepthPair[] = [
  {
    simple:
      "There's too much being produced for any one person to read. The content firehose is bigger every month, and most of it is noise.",
    nuanced:
      "The volume of indexable text published daily \u2014 papers, repos, posts, transcripts \u2014 has decoupled from any individual's reading capacity. Filtering by keyword or recency surfaces the most-amplified content, not the highest-signal content.",
  },
  {
    simple:
      "The algorithms that decide what you see optimize for engagement, not for whether the idea is good.",
    nuanced:
      "Recommendation engines optimize for retention and click-through. The top of any feed is selected by signals that correlate with virality, not with epistemic quality. The selection process is opaque, the optimization target is engagement, and the result is that 'what's trending' has structurally weak correlation with 'what's true' or 'what matters.'",
  },
  {
    simple:
      "The biggest ideas are often the ones that don't seem important yet \u2014 they look like noise until they're not. Most systems prune the noise, which means they lose the future.",
    nuanced:
      "Paradigm shifts are, by definition, low-amplitude before they happen. Any system that prunes low-engagement content prunes the early origin signals of the next consensus. This is a structural blindness: 'noise' and 'frontier' look identical to a recommender that optimizes for what's already converged.",
  },
];

const THESIS: DepthPair[] = [
  {
    simple:
      "When several people who don't know each other arrive at the same conclusion, that's stronger evidence than any one of them shouting it. The protocol looks for those independent agreements.",
    nuanced:
      "Verg detects convergence patterns: clusters of assertions from unaffiliated sources in different communities that share the same underlying thesis. The signal isn't volume \u2014 it's cross-community reinforcement. Two people in the same community agreeing means little. Two people in different research disciplines, on different platforms, with no citation links between them, arriving at the same conclusion is a stronger signal \u2014 though unaffiliated does not guarantee fully independent. Shared platforms, benchmark releases, and news cycles can produce convergence that looks independent to surface metrics.",
  },
  {
    simple:
      "It's harder to fake than virality. You can buy followers; you can't buy genuine independent thinking from people who've never heard of each other.",
    nuanced:
      "Manufactured virality requires coordinated amplification within or across communities. Manufactured convergence would require coordinating researchers, builders, and writers across disconnected communities to all publish similar conclusions in similar timeframes \u2014 the cost rises faster than any plausible return on the manipulation.",
  },
];

const PIPELINE_STAGES: PipelineStage[] = [
  {
    num: '1',
    name: 'Ingest',
    prose: {
      simple: 'Pull content from a curated list of sources: papers, repos, podcasts, blogs.',
      nuanced:
        'Read from 485+ tracked sources via RSS, the GitHub API, arXiv, Semantic Scholar, podcast feeds with audio transcription, and direct site scraping. The source list is human-curated; the protocol explicitly does not crawl the open web.',
    },
  },
  {
    num: '2',
    name: 'Distill',
    prose: {
      simple: 'Compress each piece of content into its essential claims.',
      nuanced:
        'Each ingested item is distilled to a small set of trend vectors \u2014 atomic claims with provenance. Distillation runs locally on Ollama (qwen2.5:14b) with structured output enforcement. Items that fail the quality gate are classified as noise rather than dropped.',
    },
  },
  {
    num: '3',
    name: 'Cluster',
    prose: {
      simple: 'Group similar claims together, even when worded differently.',
      nuanced:
        'Trend vectors are merged via semantic similarity into stable cluster representations. Duplicate claims across sources collapse into one canonical vector while preserving every contributor link.',
    },
  },
  {
    num: '4',
    name: 'Detect',
    prose: {
      simple: 'Find the clusters where multiple independent voices are converging.',
      nuanced:
        'Convergence patterns emerge when contributors across different communities align on the same vector cluster without direct citation links. CI score is computed from semantic alignment, contributor count, cross-community presence, and stability over time.',
    },
  },
  {
    num: '5',
    name: 'Verify',
    prose: {
      simple: 'Use the social graph to confirm the contributors are actually independent of each other.',
      nuanced:
        'PageRank ranks contributor authority; Louvain community detection groups contributors into clusters. Contributors in different communities arriving at the same conclusion produce a high independence score. Contributors in the same community produce a low one.',
    },
  },
  {
    num: '6',
    name: 'Classify',
    prose: {
      simple: 'Sort each pattern into signal, frontier, or noise. Keep all three.',
      nuanced:
        'Patterns get classified as Signal (high CI + high independence), Frontier (low CI but unique frame, watch list), Noise (low CI + low independence \u2014 explicit echo), or Archived (was signal, dissolved). Predictions are generated against future state and graded later. Nothing is pruned \u2014 frontier classification preserves the slow-burning paradigm shifts.',
    },
  },
];

const TOKEN_BAKE: DepthPair[] = [
  {
    simple:
      "Verg reads about 287,000 tokens of source content per run and produces about 12,000 tokens of distilled, structured output. That's roughly 96% compression.",
    nuanced:
      "Token bake = sum of body_text characters from every contributing source / 4 \u2248 raw input tokens. The curated artifact = JSON.stringify of every active pattern (excluding foreign-key indices) / 4 \u2248 output tokens. Both are measured every run from disk; nothing is estimated. As of the most recent run: ~287K raw \u2192 ~12K curated \u2192 ~96% compression. Reproducible from data/research/token_efficiency.jsonl.",
  },
  {
    simple:
      "But the 12K isn't a small summary \u2014 each pattern is a structured intelligence object with four layers of analysis.",
    nuanced:
      "Each curated pattern contains: a tier-1 prose summary (the human-readable skim), tier-2 temporal/independence/frame analysis, tier-3 modal distribution and presupposition conflict detection, and tier-4 per-source profiles for every contributing creator. An agent ingests the full structured artifact; a human skims the tier-1 summary. The 'small summary' interpretation is one tier \u2014 the full artifact is the curated intelligence.",
  },
];

const INDEPENDENCE: DepthPair[] = [
  {
    simple:
      "The principle is borrowed from intelligence tradecraft: when sources with opposing interests and no reason to coordinate arrive at the same conclusion, that conclusion carries more weight than any single source's claim.",
    nuanced:
      "Corroborative overlap \u2014 the foundation of intelligence analysis \u2014 says: never trust a single source. Instead, look for the overlap where sources with conflicting goals agree. Because they have no incentive to collude, their agreement is structurally harder to fake than any individual report. Verg applies this principle to information curation: convergence patterns form only where independent sources align without coordination.",
  },
  {
    simple:
      "Anyone can build a recommender that finds popular ideas. What's hard is verifying that the people behind an idea aren't all in the same room.",
    nuanced:
      "Independence verification distinguishes genuine convergence from coordinated echo. PageRank computes contributor authority weight from the citation/mention graph. Louvain community detection partitions the contributor graph into modular clusters. Two contributors in the same Louvain community are likely sharing context. Two contributors in different communities arriving at the same vector cluster, with low betweenness between them, are independent \u2014 that's the strongest signal.",
  },
  {
    simple:
      "The most valuable contributors are the bridge nodes: the ones whose ideas show up independently in another community's work.",
    nuanced:
      "Bridge nodes \u2014 high betweenness centrality, presence across multiple Louvain communities \u2014 are the structural origin points of cross-community convergence. They're rarely the loudest in any single community; they're the ones whose work propagates without amplification.",
  },
  {
    simple:
      "Known gap: the current independence score catches surface-level dependence (direct citations, same-platform echo) but not hidden common causes \u2014 shared catalysts, shared discourse networks, or shared pretraining contamination.",
    nuanced:
      "Surface metrics (cross-platform presence, citation overlap) are necessary but not sufficient for true epistemic independence. Multiple sources may appear independent but all respond to the same upstream event, or share training data that correlates their outputs. Deeper provenance tracking and common-cause modeling are future work \u2014 acknowledged openly because the independence claim is the center of the methodology.",
  },
];

interface RpgAxis {
  axis: string;
  prose: DepthPair;
}

const RPG_AXES: RpgAxis[] = [
  {
    axis: 'Originality',
    prose: {
      simple: 'Are they generating new ideas or repeating others?',
      nuanced:
        'Normalized independence_contribution score: how often this contributor is the first in the citation graph to publish a vector that later appears in convergence patterns.',
    },
  },
  {
    axis: 'Independence',
    prose: {
      simple: 'Do they think for themselves, or are they part of an echo chamber?',
      nuanced:
        'Inverse of community-cluster amplification. Contributors who consistently publish vectors that show up across multiple Louvain communities score high; contributors whose vectors only resonate within their own community score low.',
    },
  },
  {
    axis: 'Centrality',
    prose: {
      simple: 'How often do their ideas show up in the convergence patterns the system detects?',
      nuanced:
        'Pattern-involvement weight: total convergence patterns the contributor\u2019s vectors participate in, weighted by pattern CI score. Not raw activity \u2014 only contributions that are part of detected convergence.',
    },
  },
  {
    axis: 'Source depth',
    prose: {
      simple: 'Papers and code count for more than tweets and hot takes.',
      nuanced:
        'Weighted score by content format: arXiv \u2248 1.0, GitHub \u2248 0.85, podcasts/long-form \u2248 0.6, blog posts \u2248 0.4, social media \u2248 0.15. Reflects the information density and verifiability of each source type.',
    },
  },
];

const FRONTIER: DepthPair[] = [
  {
    simple:
      "Most systems delete what isn't trending. Verg keeps everything and labels it. Today's noise might be tomorrow's signal.",
    nuanced:
      "The protocol explicitly does not prune low-CI signals. Every detected pattern gets classified as Signal, Frontier, Noise, or Archived. Frontier patterns \u2014 low CI but unique frame, single or few contributors, high originality \u2014 are watch-list entries. They're the structural origin signals of future paradigm shifts. Pruning them is the mistake every recommender system makes.",
  },
  {
    simple:
      "When you delete unsuccessful content too early, you lose the future. The breakthrough idea three years from now is being said today by someone with twelve followers.",
    nuanced:
      "Paradigm shifts are low-amplitude before they happen. The first person to articulate a contrarian thesis usually has minimal reach. By the time any conventional recommender notices the pattern is converging, the origin signal has been pruned by noise filters that reward early engagement. Frontier classification breaks this loop: low engagement is not noise.",
  },
];

const METHODOLOGY: DepthPair[] = [
  {
    simple:
      "The pipeline code is open. The scoring formulas are public. Every claim links to its sources.",
    nuanced:
      "What's open: the ingest pipeline, the distillation prompts, the convergence detection algorithm, the leader scoring formulas, the prediction methodology, the token bake measurement, and every source URL behind every pattern. The system doesn't claim accuracy \u2014 it measures, publishes, and lets you audit.",
  },
  {
    simple:
      "What stays a human decision: which sources to ingest. Like a DJ picking records \u2014 the turntables are commodity, but the selection is the product.",
    nuanced:
      "Source selection is the only step that's not algorithmic. The protocol does not crawl the open web; it processes a human-curated source list. This is intentional: curation IS the value. But it's also the bottleneck \u2014 see below.",
  },
];

const LIMITATION: DepthPair[] = [
  {
    simple:
      "Right now there's exactly one curator. That's a problem the protocol is honest about.",
    nuanced:
      "A single curator's source selection biases everything downstream \u2014 convergence detection only sees what the curator chose to track. The prediction scorecard reflects this, and methodology is currently in iteration. Single-curator credibility caps somewhere below 'open audit, validated predictive engine' until the curation layer itself can be verified.",
  },
];

const COUNCIL_PATH: DepthPair = {
  simple:
    "One direction: bring in more curators. When 3+ different people independently choose to track the same source, that's a meta-signal \u2014 convergence at the curation layer.",
  nuanced:
    "Council curation: multiple curators each maintain their own source list. Convergence-across-curators (\u22653 independent curators including the same source or surfacing the same pattern) becomes a meta-signal that's harder to fake than individual curation. Same convergence-detection logic Verg already runs on content, applied one layer up. Recruiting cost and governance are real, but the signal quality jump is dramatic.",
};

const AUTORESEARCH_PATH: DepthPair = {
  simple:
    "Other direction: let an algorithm find the curator's blind spots and suggest sources they're missing.",
  nuanced:
    "Autoresearch algorithm: analyze the historical curator selections, identify clusters / gaps / biases, surface domains underrepresented relative to where convergence is happening elsewhere. Could grade the curator's own predictions to find systematic biases. Same score \u2192 attack \u2192 verify loop the convergence detection uses, applied to the curator's own choices.",
};

const MITIGATION_CLOSING: DepthPair = {
  simple:
    "Both paths are on the table. Neither is built yet. The honest answer is the protocol is still bootstrapping its own credibility.",
  nuanced:
    "Both mitigation paths are complementary. Council mode validates the curation layer through cross-curator convergence. Autoresearch surfaces the curator's blind spots from the inside. Long-term: both. Short-term: pick one to start. This page documents the limitation rather than papering over it because 'open methodology' is incompatible with hiding known weaknesses.",
};

// =====================================================================
// SECTION COMPONENTS
// Small wrappers for visual consistency. All server-rendered.
// =====================================================================

function Section({ id, eyebrow, title, subtitle, children }: {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-12 sm:py-16 border-b border-zinc-800/60">
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono mb-2">{eyebrow}</p>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm text-zinc-500 mt-2 italic">{subtitle}</p>
      )}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Prose({ pair }: { pair: DepthPair }) {
  return (
    <p className="text-base text-zinc-300 leading-relaxed">
      <GlossaryText simple={pair.simple} nuanced={pair.nuanced} />
    </p>
  );
}

// =====================================================================
// SELF-AUDIT HELPERS (from /self-audit)
// =====================================================================

function StatTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: 'red' | 'amber' | 'emerald';
}) {
  const color = accent === 'red' ? 'text-red-400'
    : accent === 'amber' ? 'text-amber-400'
    : accent === 'emerald' ? 'text-emerald-400'
    : 'text-zinc-200';
  return (
    <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
      <p className={`text-2xl font-light font-mono ${color} mb-1`}>{value}</p>
      <p className="text-[10px] text-zinc-600 leading-tight">{detail}</p>
    </div>
  );
}

function DistributionBar({
  segments,
  total,
}: {
  segments: Array<{ label: string; count: number; color: string }>;
  total: number;
}) {
  if (total === 0) return <p className="text-xs text-zinc-500">No data.</p>;
  return (
    <div>
      <div className="flex h-6 rounded overflow-hidden border border-zinc-800">
        {segments.map((seg, i) => {
          const pct = (seg.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-[10px] font-mono text-black/80"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${seg.count} (${pct.toFixed(1)}%)`}
            >
              {pct >= 6 ? seg.count : ''}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-2 text-[11px] font-mono">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: seg.color }} />
            <span className="text-zinc-400">{seg.label}</span>
            <span className="text-zinc-600">{seg.count}</span>
            <span className="text-zinc-700">({((seg.count / total) * 100).toFixed(1)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// PAGE
// =====================================================================

export default function ProtocolPage() {
  // Live data -- pulled directly from the synced data/ directory
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();

  // Section 5: top pattern for the SignalMap + aggregate token bake numbers
  const topPattern = patterns[0] ?? null;
  const topPatternSources = topPattern ? getPatternSources(topPattern.vector_ids, 999) : [];
  const topPatternCost = topPattern ? getPatternTokenCost(topPattern) : null;
  const topPatternSignal = topPattern ? getPatternSignalQuality(topPattern) : null;

  // Aggregate token bake measurements across ALL active patterns -- live
  let aggRaw = 0;
  let aggCurated = 0;
  let aggSummary = 0;
  for (const p of patterns) {
    const cost = getPatternTokenCost(p);
    aggRaw += cost.rawTokens;
    aggCurated += cost.curatedTokens;
    aggSummary += cost.summaryTokens;
  }
  const aggCompression = aggRaw > 0 ? (1 - aggCurated / aggRaw) * 100 : 0;

  // Section 7: top leader for the LeaderGraph
  const topLeader = profiles[0] ?? null;
  const topLeaderContrib = topLeader ? getLeaderContribution(topLeader) : null;
  const topLeaderLinks = topLeader ? getLeaderLinks(topLeader) : [];

  // Whitepaper HTML
  const whitepaperHtml = renderWhitepaperMarkdown();

  // Audits data
  const audits = getAudits();

  // Self-audit data
  const total = patterns.length;

  const slurryDist = {
    sharp: patterns.filter(p => p.slurry_class === 'sharp' || !p.slurry_class).length,
    marginal: patterns.filter(p => p.slurry_class === 'marginal').length,
    slurry: patterns.filter(p => p.slurry_class === 'slurry').length,
  };

  const counterDist = {
    novel: patterns.filter(p => p.counter_verdict === 'novel').length,
    mixed: patterns.filter(p => p.counter_verdict === 'mixed').length,
    rehash: patterns.filter(p => p.counter_verdict === 'rehash').length,
    unclear: patterns.filter(p => p.counter_verdict === 'unclear' || !p.counter_verdict).length,
  };

  const agreementDist = {
    aligned_signal: patterns.filter(p => p.curator_agreement === 'aligned_signal').length,
    aligned_noise: patterns.filter(p => p.curator_agreement === 'aligned_noise').length,
    contested: patterns.filter(p => p.curator_agreement === 'contested').length,
    neutral: patterns.filter(p => p.curator_agreement === 'neutral').length,
  };

  const contested = patterns.filter(p => p.curator_agreement === 'contested')
    .sort((a, b) => b.ci_score - a.ci_score);

  const rehashes = patterns.filter(p => p.counter_verdict === 'rehash' && p.counter_rehash_of)
    .sort((a, b) => (a.counter_novelty ?? 1) - (b.counter_novelty ?? 1))
    .slice(0, 10);

  const patternsWithNovelty = patterns.filter(p => typeof p.counter_novelty === 'number');
  const meanNovelty = patternsWithNovelty.length > 0
    ? patternsWithNovelty.reduce((s, p) => s + (p.counter_novelty ?? 0), 0) / patternsWithNovelty.length
    : null;

  const ledger = loadOutcomeLedger();
  const drifts = ledger ? computeDrift(ledger) : [];
  const outcomeStats = summarize(drifts);
  const hasOutcomeData = outcomeStats.span_days > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative">
      <ProtocolSectionViewedBeacon sections={PROTOCOL_SECTION_MAP} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
      {/* Sticky section nav */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/60">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 shrink-0">&larr; Dashboard</Link>
          <nav className="flex items-center gap-4 text-xs overflow-x-auto">
            <a href="#whitepaper" className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">Whitepaper</a>
            <a href="#audits" className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">Audits</a>
            <a href="#self-audit" className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">Self-Audit</a>
          </nav>
          <div className="shrink-0">
            <GlossaryDepthToggle />
          </div>
        </div>
      </div>

      <article>
      {/* ── HERO ── */}
      <section id="hero" className="pb-12 border-b border-zinc-800/60 mt-6">
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono mb-3">
          The Verg Protocol
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 leading-[1.1] tracking-tight">
          Convergence intelligence,<br />explained in motion.
        </h1>
        <p className="text-lg text-zinc-300 italic mt-6 leading-snug">
          &ldquo;Verg is an attempt to meet mind to mind with the parts of the paradigm.&rdquo;
        </p>
        <p className="text-sm text-zinc-500 mt-5 leading-relaxed max-w-2xl">
          Everything in one place: how the protocol works, the full whitepaper, audit feed, and self-audit measurements.
          Use the sticky nav above to jump between sections, or scroll through. Switch the depth toggle between <em>simple</em> (plain language) and <em>nuanced</em> (technical detail) at any time.
        </p>
        <div className="mt-8">
          <ConvergenceDots />
        </div>
      </section>

      {/* ── 2. THE PROBLEM ── */}
      <Section id="problem" eyebrow="01 \u2014 Why" title="Why do we need convergence intelligence?" subtitle="Three things broke at once.">
        {PROBLEM.map((p, i) => <Prose key={i} pair={p} />)}
      </Section>

      {/* ── 3. CONVERGENCE AS SIGNAL ── */}
      <Section id="thesis" eyebrow="02 \u2014 Thesis" title="What is convergence as signal?" subtitle="Cross-community convergence, not virality.">
        {THESIS.map((p, i) => <Prose key={i} pair={p} />)}
        <EchoVsConvergence />
      </Section>

      {/* ── 4. THE PIPELINE ── */}
      <Section id="pipeline" eyebrow="03 \u2014 How" title="How does the pipeline work?" subtitle="Six stages. Every step measurable.">
        <PipelineFlow />
        <div className="space-y-6">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.num} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center font-mono text-sm text-zinc-400">
                {stage.num}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-base font-semibold text-zinc-200 mb-1">{stage.name}</h3>
                <Prose pair={stage.prose} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5. TOKEN BAKE ── */}
      <Section id="token-bake" eyebrow="04 \u2014 Measurement" title="What does convergence detection cost?" subtitle="What 287K \u2192 12K actually means.">
        {TOKEN_BAKE.map((p, i) => <Prose key={i} pair={p} />)}

        {/* Live aggregate stat strip -- measured from disk every render */}
        {patterns.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 not-prose">
            <div className="border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-mono font-bold text-zinc-300">{formatTokens(aggRaw)}</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wide mt-1">raw tokens</p>
              <p className="text-[10px] text-zinc-700 mt-0.5">source body text</p>
            </div>
            <div className="border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-mono font-bold text-emerald-400">{formatTokens(aggCurated)}</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wide mt-1">curated</p>
              <p className="text-[10px] text-zinc-700 mt-0.5">structured artifact</p>
            </div>
            <div className="border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-mono font-bold text-zinc-300">{formatTokens(aggSummary)}</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wide mt-1">prose tier</p>
              <p className="text-[10px] text-zinc-700 mt-0.5">human skim</p>
            </div>
            <div className="border border-emerald-500/20 rounded-lg p-4 text-center bg-emerald-500/[0.03]">
              <p className="text-2xl font-mono font-bold text-emerald-400">{aggCompression.toFixed(1)}%</p>
              <p className="text-[10px] text-emerald-500/70 uppercase tracking-wide mt-1">compression</p>
              <p className="text-[10px] text-zinc-700 mt-0.5">measured, not estimated</p>
            </div>
          </div>
        )}

        {/* Live SignalMap -- top pattern */}
        {topPattern && topPatternCost && topPatternSignal && (
          <div className="border border-zinc-800 rounded-lg overflow-hidden mt-4 not-prose">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono">Top live pattern</p>
              <p className="text-xs text-zinc-400 font-mono">CI {topPattern.ci_score.toFixed(3)}</p>
            </div>
            <SignalMap
              pattern={topPattern}
              sources={topPatternSources}
              cost={topPatternCost}
              signal={topPatternSignal}
            />
            <div className="px-4 py-2 border-t border-zinc-800 text-[11px] text-zinc-500">
              <span className="text-zinc-300 font-medium">{topPattern.label}</span>
              <span className="text-zinc-600"> · {topPattern.creator_ids.length} contributors · {topPattern.vector_ids.length} vectors</span>
            </div>
          </div>
        )}
      </Section>

      {/* ── 6. INDEPENDENCE VERIFICATION ── */}
      <Section id="independence" eyebrow="05 \u2014 Differentiator" title="How is independence verified?" subtitle="The dotted line is the signal.">
        {INDEPENDENCE.map((p, i) => <Prose key={i} pair={p} />)}
        <IndependenceGraph />
      </Section>

      {/* ── 7. LEADER SCORING ── */}
      <Section id="leaders" eyebrow="06 \u2014 Recognition" title="How are leaders scored?" subtitle="Four axes. None of them are followers.">
        <Prose pair={{
          simple: "Most platforms rank people by follower count or engagement. Verg ranks contributors by what they actually produce \u2014 and how independently.",
          nuanced: "The leader scoring system uses a four-axis contribution profile with explicit anti-virality bias. Follower count is excluded from every calculation. Engagement rate is excluded. The score is a function of what the contributor produces, where it lands, and whether other independent contributors converge on the same conclusions.",
        }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          {RPG_AXES.map((axis) => (
            <div key={axis.axis} className="border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-zinc-200 mb-1.5 font-mono uppercase tracking-wide">{axis.axis}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                <GlossaryText simple={axis.prose.simple} nuanced={axis.prose.nuanced} />
              </p>
            </div>
          ))}
        </div>

        {/* Live LeaderGraph -- top leader */}
        {topLeader && topLeaderContrib && (
          <div className="border border-zinc-800 rounded-lg overflow-hidden mt-4 not-prose">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono">Top live leader</p>
              <p className="text-xs text-zinc-400 font-mono">{topLeader.leader_score.toFixed(3)}</p>
            </div>
            <LeaderGraph
              leader={topLeader}
              contrib={topLeaderContrib}
              links={topLeaderLinks}
            />
          </div>
        )}
      </Section>

      {/* ── 8. FRONTIER CLASSIFICATION ── */}
      <Section id="frontier" eyebrow="07 \u2014 Preservation" title="What is frontier classification?" subtitle="Classify, don't prune.">
        {FRONTIER.map((p, i) => <Prose key={i} pair={p} />)}

        {/* Live EmergingTimeline -- current diff */}
        {diff && (
          <div className="border border-zinc-800 rounded-lg overflow-hidden mt-4 not-prose">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono">Latest pipeline diff</p>
              <p className="text-xs text-zinc-500 font-mono">{diff.date}</p>
            </div>
            <EmergingTimeline diff={diff} selectedId={null} height={360} />
            <div className="px-4 py-2 border-t border-zinc-800 text-[11px] text-zinc-500">
              <span className="text-emerald-400">{diff.new_patterns.length} new</span>
              <span className="text-zinc-600"> · </span>
              <span className="text-amber-400">{diff.accelerating.length} accelerating</span>
              <span className="text-zinc-600"> · </span>
              <span className="text-zinc-500">{diff.died?.length ?? 0} faded to noise</span>
            </div>
          </div>
        )}
      </Section>

      {/* ── 9. OPEN METHODOLOGY + CURATOR LIMITATION ── */}
      <Section id="methodology" eyebrow="08 \u2014 Honesty" title="Where does the credibility come from?" subtitle="Open methodology \u2014 and where it ends, today.">
        <div>
          <h3 className="text-base font-semibold text-zinc-200 mb-2">What&apos;s open</h3>
          {METHODOLOGY.map((p, i) => <Prose key={i} pair={p} />)}
        </div>

        <div className="border-t border-zinc-800/60 pt-6 mt-6">
          <h3 className="text-base font-semibold text-zinc-200 mb-2">The limitation: a single curator</h3>
          {LIMITATION.map((p, i) => <Prose key={i} pair={p} />)}
        </div>

        <div className="border-t border-zinc-800/60 pt-6 mt-6">
          <h3 className="text-base font-semibold text-zinc-200 mb-3">Two mitigation paths under consideration</h3>
          <CuratorPaths />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-[11px] uppercase tracking-widest text-emerald-500/70 font-mono mb-2">Path A \u2014 Council</p>
              <h4 className="text-sm font-semibold text-zinc-200 mb-2">More curators</h4>
              <Prose pair={COUNCIL_PATH} />
            </div>
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-[11px] uppercase tracking-widest text-amber-500/70 font-mono mb-2">Path B \u2014 Autoresearch</p>
              <h4 className="text-sm font-semibold text-zinc-200 mb-2">Find the curator&apos;s blind spots</h4>
              <Prose pair={AUTORESEARCH_PATH} />
            </div>
          </div>
          <div className="mt-5">
            <Prose pair={MITIGATION_CLOSING} />
          </div>
        </div>
      </Section>

      {/* ── 10. TRY IT ── */}
      <Section id="try-it" eyebrow="09 \u2014 Now" title="How can I try Verg?" subtitle="Agents and humans. No auth required.">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Verg is queryable today. Curl the API, install the MCP server, browse the live dashboard.
        </p>

        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/40 font-mono text-xs text-zinc-400 overflow-x-auto">
          <div className="text-zinc-600 mb-1"># Get current convergence patterns</div>
          <div>curl https://verg.dev/api/patterns?limit=5</div>
          <div className="text-zinc-600 mt-3 mb-1"># Get top thought leaders</div>
          <div>curl https://verg.dev/api/leaders?limit=10</div>
          <div className="text-zinc-600 mt-3 mb-1"># OpenAPI 3.0 spec -- agent-native</div>
          <div>curl https://verg.dev/api/openapi.json</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Link href="/" className="border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <p className="text-zinc-200 font-medium">Dashboard</p>
            <p className="text-xs text-zinc-500 mt-0.5">Live patterns + leaders</p>
          </Link>
          <Link href="/glossary" className="border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <p className="text-zinc-200 font-medium">Glossary</p>
            <p className="text-xs text-zinc-500 mt-0.5">Term definitions</p>
          </Link>
          <Link href="/docs" className="border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <p className="text-zinc-200 font-medium">API docs</p>
            <p className="text-xs text-zinc-500 mt-0.5">Endpoints + examples</p>
          </Link>
          <Link href="/llms.txt" className="border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <p className="text-zinc-200 font-medium">llms.txt</p>
            <p className="text-xs text-zinc-500 mt-0.5">Agent discovery file</p>
          </Link>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* CONSOLIDATED SECTIONS: Whitepaper, Audits, Self-Audit            */}
      {/* ================================================================ */}

      {/* ── WHITEPAPER ── */}
      <section id="whitepaper" className="py-12 sm:py-16 border-b border-zinc-800/60 scroll-mt-16">
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono mb-2">Reference</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 leading-tight">What does the whitepaper say?</h2>
        <p className="text-sm text-zinc-500 mt-2 italic">The full reference text.</p>
        <div className="mt-8">
          <article
            className="prose-invert"
            dangerouslySetInnerHTML={{ __html: whitepaperHtml }}
          />
        </div>
      </section>

      {/* ── AUDITS ── */}
      <section id="audits" className="py-12 sm:py-16 border-b border-zinc-800/60 scroll-mt-16">
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono mb-2">Public Record</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 leading-tight">What audits have been published?</h2>
        <p className="text-sm text-zinc-500 mt-2 italic max-w-2xl">
          Public record of every signal/noise audit shipped by Verg.
          Each card links to the full detail page with the hypercard, probe measurements, and lifecycle events.
        </p>
        <p className="text-xs font-mono text-zinc-600 mt-3">{audits.length} shipped</p>

        <div className="mt-8">
          {audits.length === 0 ? (
            <p className="text-sm text-zinc-500">No audits shipped yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audits.map(a => (
                <Link
                  key={a.audit_id}
                  href={`/audits/${a.audit_id}`}
                  className="group block border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors"
                >
                  {a.hypercard_url && (
                    <div className="relative bg-zinc-950">
                      <Image
                        src={a.hypercard_url}
                        alt={`Audit hypercard for ${a.source_author ?? a.audit_id.slice(0, 8)}`}
                        width={720}
                        height={480}
                        className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {a.source_author && (
                        <span className="text-xs font-mono text-emerald-400">
                          @{a.source_author}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 ml-auto">
                        {timeAgo(a.posted_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium line-clamp-2 mb-3 text-zinc-200">
                      {a.claim_text}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      {a.cited_snapshots.length > 0 && (
                        <span>
                          {a.cited_snapshots.length} source{a.cited_snapshots.length === 1 ? '' : 's'} probed
                        </span>
                      )}
                      {a.source_platform && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-zinc-500 border-zinc-700">
                          {a.source_platform}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SELF-AUDIT ── */}
      <section id="self-audit" className="py-12 sm:py-16 border-b border-zinc-800/60 scroll-mt-16 text-zinc-300">
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-mono mb-2">Falsifiability</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 leading-tight">How does Verg audit itself?</h2>
        <p className="text-sm text-zinc-500 mt-2 italic">Verg measures itself against its own falsifiability gates.</p>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl mt-4">
          Curation is Verg&apos;s biggest weakness. Every pattern is chosen by one person&apos;s taste. That&apos;s a single point of failure critics have rightly flagged.
          This section doesn&apos;t solve it. It surfaces it &mdash; honestly, with the same instruments we&apos;d use on anyone else&apos;s claims.
        </p>

        {/* Headline numbers */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Patterns analyzed"
            value={total.toString()}
            detail="latest convergence.json"
          />
          <StatTile
            label="Mean novelty (counter)"
            value={meanNovelty !== null ? meanNovelty.toFixed(2) : 'n/a'}
            detail="Haiku skeptic verdict \u00b7 0=rehash \u00b7 1=novel"
            accent={meanNovelty !== null && meanNovelty < 0.4 ? 'red' : meanNovelty !== null && meanNovelty < 0.6 ? 'amber' : 'emerald'}
          />
          <StatTile
            label="Contested"
            value={agreementDist.contested.toString()}
            detail="base curator & skeptic disagree"
            accent={agreementDist.contested > 0 ? 'amber' : undefined}
          />
        </div>

        {/* Slurry distribution */}
        <div className="mt-12">
          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">1 &middot; Slurry test</h3>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Each pattern label is embedded (locally, via nomic-embed-text) and compared to a bank of 25 hand-written generic &ldquo;AI trends right now&rdquo; phrases.
            Cosine similarity &ge;0.85 &rarr; the label is indistinguishable from what any LLM would produce given an empty prompt. Those patterns get flagged and de-ranked.
          </p>
          <DistributionBar
            segments={[
              { label: 'sharp', count: slurryDist.sharp, color: 'rgb(52, 211, 153)' },
              { label: 'marginal', count: slurryDist.marginal, color: 'rgb(245, 158, 11)' },
              { label: 'slurry', count: slurryDist.slurry, color: 'rgb(239, 68, 68)' },
            ]}
            total={total}
          />
        </div>

        {/* Counter-curator */}
        <div className="mt-12">
          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">2 &middot; Counter-curator</h3>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            A second curation pass with a <em>different taste</em>. Where the base curator asks &ldquo;what are sources converging on?&rdquo;,
            the counter-curator (Claude Haiku) asks: <em>&ldquo;is this convergence genuinely novel, or a rebrand of something older?&rdquo;</em>
          </p>
          <DistributionBar
            segments={[
              { label: 'novel', count: counterDist.novel, color: 'rgb(52, 211, 153)' },
              { label: 'mixed', count: counterDist.mixed, color: 'rgb(245, 158, 11)' },
              { label: 'rehash', count: counterDist.rehash, color: 'rgb(239, 68, 68)' },
              { label: 'unclear', count: counterDist.unclear, color: 'rgb(113, 113, 122)' },
            ]}
            total={total}
          />
        </div>

        {/* Curator-space scatter */}
        <div className="mt-12">
          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">3 &middot; Curator-space map</h3>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Every pattern plotted in <em>base-curator &times; counter-curator</em> space. X = CI score. Y = novelty rating. Click a point to see the pattern.
          </p>
          <div className="border border-zinc-800 rounded bg-zinc-950/50 p-2">
            <CuratorSpace
              points={patterns.map(p => ({
                id: p.id,
                label: p.label,
                ci: p.ci_score,
                novelty: p.counter_novelty ?? 0.5,
                slurry: p.slurry_class ?? null,
                agreement: p.curator_agreement ?? null,
                verdict: p.counter_verdict ?? null,
              }))}
              height={420}
            />
          </div>
        </div>

        {/* Agreement */}
        <div className="mt-12">
          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">4 &middot; Curator agreement</h3>
          <DistributionBar
            segments={[
              { label: 'aligned+', count: agreementDist.aligned_signal, color: 'rgb(52, 211, 153)' },
              { label: 'aligned\u2212', count: agreementDist.aligned_noise, color: 'rgb(161, 161, 170)' },
              { label: 'contested', count: agreementDist.contested, color: 'rgb(245, 158, 11)' },
              { label: 'neutral', count: agreementDist.neutral, color: 'rgb(113, 113, 122)' },
            ]}
            total={total}
          />
          <ul className="text-xs text-zinc-500 mt-4 space-y-1.5 leading-relaxed">
            <li><span className="inline-block w-16 text-emerald-400 font-mono">aligned+</span> both curators agree this is signal</li>
            <li><span className="inline-block w-16 text-zinc-400 font-mono">aligned\u2212</span> both curators agree this is noise</li>
            <li><span className="inline-block w-16 text-amber-400 font-mono">contested</span> the curators disagree &mdash; worth a human look</li>
            <li><span className="inline-block w-16 text-zinc-500 font-mono">neutral</span> neither strongly signal nor noise</li>
          </ul>
        </div>

        {/* Contested patterns */}
        {contested.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">5 &middot; Contested patterns</h3>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              {contested.length} patterns where the base curator and the skeptic disagree.
            </p>
            <div className="space-y-2">
              {contested.map(p => (
                <Link
                  key={p.id}
                  href={`/pattern/${p.id}`}
                  className="block p-3 border border-amber-500/20 bg-amber-500/5 rounded hover:bg-amber-500/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-[10px] font-mono text-amber-400 mt-0.5">
                      ci {p.ci_score.toFixed(2)} &middot; nov {(p.counter_novelty ?? 0).toFixed(2)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 leading-snug">{p.label}</p>
                      {p.counter_note && (
                        <p className="text-xs text-zinc-500 mt-1 italic">&ldquo;{p.counter_note}&rdquo;</p>
                      )}
                      {p.counter_rehash_of && (
                        <p className="text-[11px] text-amber-400/60 mt-1 font-mono">&darr; echoes: {p.counter_rehash_of}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Named antecedents */}
        {rehashes.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">6 &middot; Named antecedents</h3>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              For patterns the skeptic flags as rehash, it names the older idea they echo.
            </p>
            <div className="space-y-1.5">
              {rehashes.map(p => (
                <div key={p.id} className="p-2.5 border border-zinc-800 rounded text-xs">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-zinc-600 font-mono">{(p.counter_novelty ?? 0).toFixed(2)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 leading-snug mb-0.5">{p.label}</p>
                      <p className="text-red-400/60 font-mono text-[10px]">&darr; {p.counter_rehash_of}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outcome ledger */}
        <div className="mt-12">
          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">7 &middot; Outcome ledger</h3>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Every pipeline run snapshots each pattern&apos;s state. Over time this produces an empirical record &mdash; not a curator&apos;s opinion about what&apos;s signal, but what actually happened to each pattern.
          </p>
          {hasOutcomeData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                <div className="p-3 border border-zinc-800 rounded bg-zinc-950">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">tracked</p>
                  <p className="text-xl font-mono text-zinc-200">{outcomeStats.total_patterns_tracked}</p>
                </div>
                <div className="p-3 border border-emerald-500/20 rounded bg-emerald-500/5">
                  <p className="text-[10px] font-mono text-emerald-400/70 uppercase mb-1">growing</p>
                  <p className="text-xl font-mono text-emerald-400">{outcomeStats.status_counts.growing}</p>
                </div>
                <div className="p-3 border border-zinc-700 rounded bg-zinc-900">
                  <p className="text-[10px] font-mono text-zinc-400/70 uppercase mb-1">stable</p>
                  <p className="text-xl font-mono text-zinc-300">{outcomeStats.status_counts.stable}</p>
                </div>
                <div className="p-3 border border-amber-500/20 rounded bg-amber-500/5">
                  <p className="text-[10px] font-mono text-amber-400/70 uppercase mb-1">decaying</p>
                  <p className="text-xl font-mono text-amber-400">{outcomeStats.status_counts.decaying}</p>
                </div>
                <div className="p-3 border border-red-500/20 rounded bg-red-500/5">
                  <p className="text-[10px] font-mono text-red-400/70 uppercase mb-1">died</p>
                  <p className="text-xl font-mono text-red-400">{outcomeStats.status_counts.died}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Survival rate: <span className="text-zinc-300">{(outcomeStats.survival_rate * 100).toFixed(1)}%</span> &middot; Growth rate: <span className="text-emerald-400">{(outcomeStats.growth_rate * 100).toFixed(1)}%</span> &middot; Spanning {outcomeStats.span_days} day{outcomeStats.span_days === 1 ? '' : 's'}.
              </p>
            </>
          ) : (
            <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
              <p className="text-sm text-zinc-300 mb-2">
                Day zero: {outcomeStats.total_patterns_tracked} patterns captured in the ledger on {outcomeStats.latest_snapshot ?? '\u2014'}.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Drift statistics need at least two snapshots to compute. Check back in 24 hours for the first drift row.
              </p>
            </div>
          )}
        </div>

        {/* What this means */}
        <div className="mt-12 p-5 border border-zinc-800 rounded bg-zinc-950">
          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3">8 &middot; What this tells us</h3>
          <ul className="text-sm text-zinc-300 space-y-3 leading-relaxed">
            <li>
              <strong className="text-zinc-200">The current pattern set carries heavy substrate from prior decades.</strong> Mean novelty is {meanNovelty?.toFixed(2) ?? '\u2014'} out of 1.0.
            </li>
            <li>
              <strong className="text-zinc-200">The slurry test catches exactly what critics pointed to.</strong> The patterns called out as generic-sounding really are.
            </li>
            <li>
              <strong className="text-zinc-200">Contested patterns are the ones worth a human&apos;s attention.</strong> When the two curators disagree, neither automated score is trustworthy on its own.
            </li>
            <li>
              <strong className="text-zinc-200">This section updates automatically.</strong> Every pipeline run recomputes slurry, counter-curator, and agreement.
            </li>
          </ul>
        </div>
      </section>

      </article>
      <footer className="text-xs text-zinc-600 text-center py-10">
        Verg &middot; <Link href="/" className="underline">verg.dev</Link> &middot; This page evolves with the system it describes.
      </footer>
    </main>
  );
}
