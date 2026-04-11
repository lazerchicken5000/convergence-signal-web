import { Separator } from '@/components/ui/separator';
import { GlossaryDepthToggle, GlossaryText } from '@/components/depth-selector';
import Link from 'next/link';

const TERMS = [
  {
    term: 'Verg Pattern',
    simple: 'When people in different communities arrive at the same conclusion without citing each other.',
    nuanced: 'A detected cluster of assertions from unaffiliated sources sharing the same underlying thesis, filtered against citation graphs to discount amplification. Cross-community convergence is a stronger signal than virality, but unaffiliated does not guarantee fully causally independent. Classified as Solution, Problem, or Metaphor.',
  },
  {
    term: 'CI Score',
    simple: 'How strong the agreement is. Higher = more people agree independently.',
    nuanced: 'Verg Index — composite of semantic similarity, independence score, and creator diversity. Weighted by stability duration and cross-platform verification. Range 0-1.',
  },
  {
    term: 'Independence Score',
    simple: 'Are these sources in different communities, or just echoing each other?',
    nuanced: 'Measures cross-community presence and discounts direct citation/affiliation overlap. High (>0.7) = strong cross-community convergence. Low (<0.5) = potential echo chamber. Note: this catches surface-level dependence but not hidden common causes (shared catalysts, overlapping news cycles, pretraining contamination).',
  },
  {
    term: 'Token Bake',
    simple: 'How much reading we did to produce each insight. The protocol measures it every run from the actual source content on disk (no estimates) — typical runs compress hundreds of thousands of raw tokens into a structured artifact in the ~95-97% compression range.',
    nuanced: 'Measured token cost: sum of contributing source body_text length divided by ~4 (chars per token) for the raw side, JSON.stringify of every active pattern (excluding foreign-key indices) divided by ~4 for the curated side. Both numbers are computed from disk on every pipeline run and persisted to data/research/token_efficiency.jsonl. Reproducible, auditable, and never hardcoded.',
  },
  {
    term: 'Thought Leader',
    simple: 'Someone who creates original ideas that other people end up agreeing with — not just someone who\'s popular.',
    nuanced: 'A tracked contributor whose content appears in verg patterns. Profiled via contribution attributes (Originality, Independence, Centrality, Source Depth) rather than reach or follower metrics.',
  },
  {
    term: 'Originality',
    simple: 'Does this person come up with new ideas, or do they mostly share other people\'s ideas?',
    nuanced: 'Normalized independence_contribution signal (0-100). Measures how much a source generates novel vectors that appear in patterns independently of existing discussion threads.',
  },
  {
    term: 'Source Depth',
    simple: 'Papers and code are deeper than tweets. This measures how substantial someone\'s contributions are.',
    nuanced: 'Weighted score by content format: research papers (arxiv=1.0) and repositories (github=0.85) score higher than blog posts (rss=0.4) or social media (x=0.15), reflecting information density and verifiability.',
  },
  {
    term: 'Signal vs. Noise',
    simple: 'Signal = cross-community convergence from unaffiliated sources. Noise = the same idea getting amplified within a single community until it seems bigger than it is.',
    nuanced: 'Multi-factor filtering: citation graph pruning removes amplification chains, temporal analysis identifies origination vs. echo, and cross-platform verification ensures the signal isn\'t confined to a single information silo.',
  },
  {
    term: 'Accolades',
    simple: 'Badges a leader earns based on what they\'ve actually done — like achievements in a game.',
    nuanced: 'Computed from signal data thresholds. Veteran: tenure >= 200 weeks. Cross-Platform: 3+ source types. High Originality: independence_contribution > 0.5. Published: arxiv presence. Active Builder: github + high content volume.',
  },
  {
    term: 'Verg Type',
    simple: 'What kind of agreement: everyone found the same solution, or everyone hit the same problem, or everyone started thinking in the same way.',
    nuanced: 'Solution verg = aligned approaches. Problem verg = shared obstacles. Metaphor verg = aligned cognitive frameworks. Classified during vector clustering based on assertion framing.',
  },
];

export default function GlossaryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">&larr; Back</Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Glossary</h1>
          <p className="text-sm text-muted-foreground mt-1">Key concepts behind Verg</p>
        </div>
        <GlossaryDepthToggle />
      </div>

      <div className="space-y-6">
        {TERMS.map(t => (
          <div key={t.term} className="border-b border-zinc-800/50 pb-5">
            <h3 className="font-semibold text-base mb-2">{t.term}</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              <GlossaryText simple={t.simple} nuanced={t.nuanced} />
            </p>
          </div>
        ))}
      </div>

      <Separator className="my-8" />
      <footer className="text-xs text-muted-foreground text-center pb-8">
        <Link href="/" className="underline">Verg</Link> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
