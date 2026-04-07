import Link from 'next/link';
import { GlossaryDepthToggle, GlossaryText } from '@/components/depth-selector';
import { SignalMap } from '@/components/infographics/signal-map';
import { LeaderGraph } from '@/components/infographics/leader-graph';
import { EmergingTimeline } from '@/components/infographics/emerging-timeline';
import { ConvergenceDots } from '@/components/protocol/convergence-dots';
import { EchoVsConvergence } from '@/components/protocol/echo-vs-convergence';
import { PipelineFlow } from '@/components/protocol/pipeline-flow';
import { IndependenceGraph } from '@/components/protocol/independence-graph';
import { CuratorPaths } from '@/components/protocol/curator-paths';
import {
  getConvergencePatterns,
  getRPGProfiles,
  getLatestDiff,
  getPatternSources,
  getPatternTokenCost,
  getPatternSignalQuality,
  getLeaderContribution,
  getLeaderLinks,
} from '@/lib/data';

export const revalidate = 14400;

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
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
      "The volume of indexable text published daily — papers, repos, posts, transcripts — has decoupled from any individual's reading capacity. Filtering by keyword or recency surfaces the most-amplified content, not the highest-signal content.",
  },
  {
    simple:
      "The algorithms that decide what you see optimize for engagement, not for whether the idea is good.",
    nuanced:
      "Recommendation engines optimize for retention and click-through. The top of any feed is selected by signals that correlate with virality, not with epistemic quality. The selection process is opaque, the optimization target is engagement, and the result is that 'what's trending' has structurally weak correlation with 'what's true' or 'what matters.'",
  },
  {
    simple:
      "The biggest ideas are often the ones that don't seem important yet — they look like noise until they're not. Most systems prune the noise, which means they lose the future.",
    nuanced:
      "Paradigm shifts are, by definition, low-amplitude before they happen. Any system that prunes low-engagement content prunes the early origin signals of the next consensus. This is a structural blindness: 'noise' and 'frontier' look identical to a recommender that optimizes for what's already converged.",
  },
];

const THESIS: DepthPair[] = [
  {
    simple:
      "When several people who don't know each other arrive at the same conclusion, that's stronger evidence than any one of them shouting it. The protocol looks for those independent agreements.",
    nuanced:
      "Verg detects convergence patterns: clusters of independent assertions from sources in different communities that share the same underlying thesis. The signal isn't volume — it's the structural independence of the contributors. Two people in the same community agreeing means little. Two people in different research disciplines, on different platforms, with no citation links between them, arriving at the same conclusion is much harder to fake.",
  },
  {
    simple:
      "It's harder to fake than virality. You can buy followers; you can't buy genuine independent thinking from people who've never heard of each other.",
    nuanced:
      "Manufactured virality requires coordinated amplification within or across communities. Manufactured convergence would require coordinating researchers, builders, and writers across disconnected communities to all publish similar conclusions in similar timeframes — the cost rises faster than any plausible return on the manipulation.",
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
        'Each ingested item is distilled to a small set of trend vectors — atomic claims with provenance. Distillation runs locally on Ollama (qwen2.5:14b) with structured output enforcement. Items that fail the quality gate are classified as noise rather than dropped.',
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
        'Convergence patterns emerge when independent contributors align on the same vector cluster. CI score is computed from semantic alignment, contributor count, frame coherence, and stability over time.',
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
        'Patterns get classified as Signal (high CI + high independence), Frontier (low CI but unique frame, watch list), Noise (low CI + low independence — explicit echo), or Archived (was signal, dissolved). Predictions are generated against future state and graded later. Nothing is pruned — frontier classification preserves the slow-burning paradigm shifts.',
    },
  },
];

const TOKEN_BAKE: DepthPair[] = [
  {
    simple:
      "Verg reads about 287,000 tokens of source content per run and produces about 12,000 tokens of distilled, structured output. That's roughly 96% compression.",
    nuanced:
      "Token bake = sum of body_text characters from every contributing source / 4 ≈ raw input tokens. The curated artifact = JSON.stringify of every active pattern (excluding foreign-key indices) / 4 ≈ output tokens. Both are measured every run from disk; nothing is estimated. As of the most recent run: ~287K raw → ~12K curated → ~96% compression. Reproducible from data/research/token_efficiency.jsonl.",
  },
  {
    simple:
      "But the 12K isn't a small summary — each pattern is a structured intelligence object with four layers of analysis.",
    nuanced:
      "Each curated pattern contains: a tier-1 prose summary (the human-readable skim), tier-2 temporal/independence/frame analysis, tier-3 modal distribution and presupposition conflict detection, and tier-4 per-source profiles for every contributing creator. An agent ingests the full structured artifact; a human skims the tier-1 summary. The 'small summary' interpretation is one tier — the full artifact is the curated intelligence.",
  },
];

const INDEPENDENCE: DepthPair[] = [
  {
    simple:
      "Anyone can build a recommender that finds 'popular ideas.' What's hard is verifying that the people promoting an idea aren't all in the same room.",
    nuanced:
      "Independence verification distinguishes genuine convergence from coordinated echo. Without it, a single community amplifying a take looks identical to ten independent researchers arriving at the same conclusion in their own work. The math is the part nobody else does.",
  },
  {
    simple:
      "Verg uses two graph algorithms: PageRank tells you who has authority; Louvain tells you who's in the same community.",
    nuanced:
      "PageRank computes contributor authority weight from the citation/mention graph. Louvain community detection partitions the contributor graph into modular clusters. Two contributors in the same Louvain community are likely sharing context. Two contributors in different communities arriving at the same vector cluster, with low betweenness between them, are independent — that's the strongest signal.",
  },
  {
    simple:
      "The most valuable contributors are the bridge nodes: the ones whose ideas show up on their own in another community's discussion, weeks after they first published.",
    nuanced:
      "The protocol weights bridge contributors most heavily. Bridge nodes — high betweenness centrality, presence across multiple Louvain communities — are the structural origin points of cross-community convergence. They're rarely the loudest in any single community; they're the ones whose work propagates without amplification.",
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
        'Weighted score by content format: arXiv ≈ 1.0, GitHub ≈ 0.85, podcasts/long-form ≈ 0.6, blog posts ≈ 0.4, social media ≈ 0.15. Reflects the information density and verifiability of each source type.',
    },
  },
];

const FRONTIER: DepthPair[] = [
  {
    simple:
      "Most systems delete what isn't trending. Verg keeps everything and labels it. Today's noise might be tomorrow's signal.",
    nuanced:
      "The protocol explicitly does not prune low-CI signals. Every detected pattern gets classified as Signal, Frontier, Noise, or Archived. Frontier patterns — low CI but unique frame, single or few contributors, high originality — are watch-list entries. They're the structural origin signals of future paradigm shifts. Pruning them is the mistake every recommender system makes.",
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
      "What's open: the ingest pipeline, the distillation prompts, the convergence detection algorithm, the leader scoring formulas, the prediction methodology, the token bake measurement, and every source URL behind every pattern. The system doesn't claim accuracy — it measures, publishes, and lets you audit.",
  },
  {
    simple:
      "What stays a human decision: which sources to ingest. Like a DJ picking records — the turntables are commodity, but the selection is the product.",
    nuanced:
      "Source selection is the only step that's not algorithmic. The protocol does not crawl the open web; it processes a human-curated source list. This is intentional: curation IS the value. But it's also the bottleneck — see below.",
  },
];

const LIMITATION: DepthPair[] = [
  {
    simple:
      "Right now there's exactly one curator. That's a problem the protocol is honest about.",
    nuanced:
      "A single curator's source selection biases everything downstream — convergence detection only sees what the curator chose to track. The prediction scorecard reflects this, and methodology is currently in iteration. Single-curator credibility caps somewhere below 'open audit, validated predictive engine' until the curation layer itself can be verified.",
  },
];

const COUNCIL_PATH: DepthPair = {
  simple:
    "One direction: bring in more curators. When 3+ different people independently choose to track the same source, that's a meta-signal — convergence at the curation layer.",
  nuanced:
    "Council curation: multiple curators each maintain their own source list. Convergence-across-curators (≥3 independent curators including the same source or surfacing the same pattern) becomes a meta-signal that's harder to fake than individual curation. Same convergence-detection logic Verg already runs on content, applied one layer up. Recruiting cost and governance are real, but the signal quality jump is dramatic.",
};

const AUTORESEARCH_PATH: DepthPair = {
  simple:
    "Other direction: let an algorithm find the curator's blind spots and suggest sources they're missing.",
  nuanced:
    "Autoresearch algorithm: analyze the historical curator selections, identify clusters / gaps / biases, surface domains underrepresented relative to where convergence is happening elsewhere. Could grade the curator's own predictions to find systematic biases. Same score → attack → verify loop the convergence detection uses, applied to the curator's own choices.",
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
// PAGE
// =====================================================================

export default function ProtocolPage() {
  // Live data — pulled directly from the synced data/ directory
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const diff = getLatestDiff();

  // Section 5: top pattern for the SignalMap + aggregate token bake numbers
  const topPattern = patterns[0] ?? null;
  const topPatternSources = topPattern ? getPatternSources(topPattern.vector_ids, 999) : [];
  const topPatternCost = topPattern ? getPatternTokenCost(topPattern) : null;
  const topPatternSignal = topPattern ? getPatternSignalQuality(topPattern) : null;

  // Aggregate token bake measurements across ALL active patterns — live
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

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative">
      {/* Sticky depth toggle */}
      <div className="sticky top-4 z-20 flex justify-end mb-2 -mt-2">
        <div className="bg-zinc-950/85 backdrop-blur-sm border border-zinc-800 rounded-lg p-1.5 shadow-lg">
          <GlossaryDepthToggle />
        </div>
      </div>

      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 mb-8 block">&larr; Back to dashboard</Link>

      {/* ── HERO ── */}
      <section id="hero" className="pb-12 border-b border-zinc-800/60">
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
          This page is the visual companion to the <Link href="/whitepaper" className="underline decoration-zinc-700 hover:decoration-zinc-400">whitepaper</Link>.
          Below: how the protocol works, what its metrics actually measure, and why curating signal from the noise of the agent-native internet matters now. Switch the depth toggle in the top-right between <em>simple</em> (plain language) and <em>nuanced</em> (technical detail) at any time.
        </p>
        <div className="mt-8">
          <ConvergenceDots />
        </div>
      </section>

      {/* ── 2. THE PROBLEM ── */}
      <Section id="problem" eyebrow="01 — Why" title="The Problem" subtitle="Three things broke at once.">
        {PROBLEM.map((p, i) => <Prose key={i} pair={p} />)}
      </Section>

      {/* ── 3. CONVERGENCE AS SIGNAL ── */}
      <Section id="thesis" eyebrow="02 — Thesis" title="Convergence as Signal" subtitle="Independent minds, same conclusion.">
        {THESIS.map((p, i) => <Prose key={i} pair={p} />)}
        <EchoVsConvergence />
      </Section>

      {/* ── 4. THE PIPELINE ── */}
      <Section id="pipeline" eyebrow="03 — How" title="The Pipeline" subtitle="Six stages. Every step measurable.">
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
      <Section id="token-bake" eyebrow="04 — Measurement" title="Token Bake" subtitle="What 287K → 12K actually means.">
        {TOKEN_BAKE.map((p, i) => <Prose key={i} pair={p} />)}

        {/* Live aggregate stat strip — measured from disk every render */}
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

        {/* Live SignalMap — top pattern */}
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
      <Section id="independence" eyebrow="05 — Differentiator" title="Independence Verification" subtitle="The dotted line is the signal.">
        {INDEPENDENCE.map((p, i) => <Prose key={i} pair={p} />)}
        <IndependenceGraph />
      </Section>

      {/* ── 7. LEADER SCORING ── */}
      <Section id="leaders" eyebrow="06 — Recognition" title="Leader Scoring" subtitle="Four axes. None of them are followers.">
        <Prose pair={{
          simple: "Most platforms rank people by follower count or engagement. Verg ranks contributors by what they actually produce — and how independently.",
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

        {/* Live LeaderGraph — top leader */}
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
      <Section id="frontier" eyebrow="07 — Preservation" title="Frontier Classification" subtitle="Classify, don't prune.">
        {FRONTIER.map((p, i) => <Prose key={i} pair={p} />)}

        {/* Live EmergingTimeline — current diff */}
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
      <Section id="methodology" eyebrow="08 — Honesty" title="Open Methodology" subtitle="Where the credibility comes from — and where it ends, today.">
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
              <p className="text-[11px] uppercase tracking-widest text-emerald-500/70 font-mono mb-2">Path A — Council</p>
              <h4 className="text-sm font-semibold text-zinc-200 mb-2">More curators</h4>
              <Prose pair={COUNCIL_PATH} />
            </div>
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-[11px] uppercase tracking-widest text-amber-500/70 font-mono mb-2">Path B — Autoresearch</p>
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
      <Section id="try-it" eyebrow="09 — Now" title="Try It" subtitle="Agents and humans. No auth required.">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Verg is queryable today. Curl the API, install the MCP server, browse the live dashboard.
        </p>

        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/40 font-mono text-xs text-zinc-400 overflow-x-auto">
          <div className="text-zinc-600 mb-1"># Get current convergence patterns</div>
          <div>curl https://verg.dev/api/patterns?limit=5</div>
          <div className="text-zinc-600 mt-3 mb-1"># Get top thought leaders</div>
          <div>curl https://verg.dev/api/leaders?limit=10</div>
          <div className="text-zinc-600 mt-3 mb-1"># OpenAPI 3.0 spec — agent-native</div>
          <div>curl https://verg.dev/api/openapi.json</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Link href="/" className="border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <p className="text-zinc-200 font-medium">Dashboard</p>
            <p className="text-xs text-zinc-500 mt-0.5">Live patterns + leaders</p>
          </Link>
          <Link href="/whitepaper" className="border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <p className="text-zinc-200 font-medium">Whitepaper</p>
            <p className="text-xs text-zinc-500 mt-0.5">The full reference text</p>
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
          <Link href="/blog" className="border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
            <p className="text-zinc-200 font-medium">Transmissions</p>
            <p className="text-xs text-zinc-500 mt-0.5">Raw thinking from the frontier</p>
          </Link>
        </div>

        <div className="text-center pt-4">
          <Link href="/tip" className="inline-block text-xs text-zinc-500 hover:text-zinc-300 underline">
            If this resonates, support the protocol &rarr;
          </Link>
        </div>
      </Section>

      <footer className="text-xs text-zinc-600 text-center py-10">
        Verg · <Link href="/" className="underline">verg.dev</Link> · This page evolves with the system it describes.
      </footer>
    </main>
  );
}
