import { Separator } from '@/components/ui/separator';
import { GlossaryDepthToggle, GlossaryText } from '@/components/depth-selector';
import Link from 'next/link';

const TERMS = [
  {
    term: 'Convergence Pattern',
    simple: 'When different people independently come to the same conclusion without talking to each other.',
    nuanced: 'A detected cluster of independent assertions from multiple sources sharing the same underlying thesis, verified against citation graphs to filter amplification. Classified as Solution, Problem, or Metaphor convergence.',
  },
  {
    term: 'CI Score',
    simple: 'How strong the agreement is. Higher = more people agree independently.',
    nuanced: 'Convergence Index — composite of semantic similarity, independence score, and creator diversity. Weighted by stability duration and cross-platform verification. Range 0-1.',
  },
  {
    term: 'Independence Score',
    simple: 'Are these people actually thinking for themselves, or just copying each other?',
    nuanced: 'Measures whether sources arrived at conclusions independently or via amplification. Derived from citation graph analysis and temporal ordering. High (>0.7) = genuine convergence. Low (<0.5) = possible echo.',
  },
  {
    term: 'Token Bake',
    simple: 'How much reading we did to produce this insight. A 144K token bake means we processed 144,000 tokens worth of content so you get the condensed version.',
    nuanced: 'The total token count of raw source content (transcripts, papers, posts) processed during distillation. Expressed as inference cost — directly maps to API billing savings for agents consuming curated output vs. processing raw sources.',
  },
  {
    term: 'Thought Leader',
    simple: 'Someone who creates original ideas that other people end up agreeing with — not just someone who\'s popular.',
    nuanced: 'A tracked contributor whose content appears in convergence patterns. Profiled via contribution attributes (Originality, Independence, Centrality, Source Depth) rather than reach or follower metrics.',
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
    simple: 'Signal = real insight from people thinking independently. Noise = the same idea getting repeated until it seems bigger than it is.',
    nuanced: 'Multi-factor filtering: citation graph pruning removes amplification chains, temporal analysis identifies origination vs. echo, and cross-platform verification ensures the signal isn\'t confined to a single information silo.',
  },
  {
    term: 'Accolades',
    simple: 'Badges a leader earns based on what they\'ve actually done — like achievements in a game.',
    nuanced: 'Computed from signal data thresholds. Veteran: tenure >= 200 weeks. Cross-Platform: 3+ source types. High Originality: independence_contribution > 0.5. Published: arxiv presence. Active Builder: github + high content volume.',
  },
  {
    term: 'Convergence Type',
    simple: 'What kind of agreement: everyone found the same solution, or everyone hit the same problem, or everyone started thinking in the same way.',
    nuanced: 'Solution convergence = aligned approaches. Problem convergence = shared obstacles. Metaphor convergence = aligned cognitive frameworks. Classified during vector clustering based on assertion framing.',
  },
];

export default function GlossaryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">&larr; Back</Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Glossary</h1>
          <p className="text-sm text-muted-foreground mt-1">Key concepts behind Converge</p>
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
        <Link href="/" className="underline">Converge</Link> · <a href="https://x.com/lazerhawk5000" className="underline">@lazerhawk5000</a>
      </footer>
    </main>
  );
}
