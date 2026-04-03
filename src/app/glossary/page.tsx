import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const TERMS = [
  {
    term: 'Convergence Pattern',
    simple: 'When different people independently come to the same conclusion without talking to each other.',
    standard: 'A detected cluster of independent assertions from multiple sources that share the same underlying thesis or solution, without coordination between the sources.',
    expert: 'A statistically significant co-occurrence of semantically aligned vectors across independent content sources, identified via embedding similarity clustering with independence verification against citation graphs.',
  },
  {
    term: 'CI Score',
    simple: 'How strong the agreement is. Higher = more people agree independently.',
    standard: 'Convergence Index — measures both the strength of agreement between sources and their independence from each other. Ranges from 0 to 1.',
    expert: 'Composite metric: (semantic similarity * independence score * creator diversity). Weighted by stability duration and cross-platform verification. Independence is verified against citation/retweet graphs to filter amplification.',
  },
  {
    term: 'Independence Score',
    simple: 'Are these people actually thinking for themselves, or just copying each other?',
    standard: 'Measures whether the sources arrived at similar conclusions independently, or if the signal is amplified (one person said it and others repeated it).',
    expert: 'Derived from citation graph analysis and temporal ordering. Sources that cite, retweet, or demonstrably derive from a common origin are down-weighted. High independence (>0.7) indicates genuine convergence; low (<0.5) suggests amplification.',
  },
  {
    term: 'Token Savings',
    simple: 'We read thousands of pages so you don\'t have to. The savings number shows how much reading we did for you.',
    standard: 'The raw content that went into detecting a pattern (YouTube transcripts, papers, blog posts) requires millions of tokens to process. The curated pattern output is a fraction of that — the savings percentage shows how much processing is eliminated.',
    expert: 'Estimated as (1 - curated_tokens / raw_source_tokens) * 100. Raw tokens are computed from source body text (chars/4). Curated output includes pattern label, description, presuppositions, and resolution summaries. Directly maps to inference cost savings for AI agents consuming the API.',
  },
  {
    term: 'Thought Leader',
    simple: 'Someone who creates original ideas that other people end up agreeing with — not just someone who\'s popular.',
    standard: 'A tracked contributor whose content appears in convergence patterns. Ranked by contribution (originality, independence, centrality) rather than by follower count or reach.',
    expert: 'Profiled via RPG-style attributes derived from signal data: independence_contribution, convergence_centrality, cross_source_mentions, and content_volume. Contribution type (Researcher/Builder/Synthesizer/Analyst) derived from source type distribution.',
  },
  {
    term: 'Originality',
    simple: 'Does this person come up with new ideas, or do they mostly share other people\'s ideas?',
    standard: 'Measures how much a leader contributes unique signal vs. amplifying existing ideas. Based on their independence contribution score.',
    expert: 'Normalized independence_contribution signal (0-100). High values indicate the source generates novel vectors that appear in patterns independently of existing discussion.',
  },
  {
    term: 'Source Depth',
    simple: 'Papers and code are deeper than tweets. This measures how substantial someone\'s contributions are.',
    standard: 'Weighted score based on content type: research papers and code repositories score higher than blog posts or social media, reflecting the depth of contribution.',
    expert: 'Weighted average of source_types: arxiv=1.0, github=0.85, youtube=0.5, rss=0.4, web=0.3, x=0.15. Reflects the information density and verifiability of different content formats.',
  },
  {
    term: 'Convergence Type',
    simple: 'What kind of agreement is happening: everyone found the same solution, or everyone hit the same problem.',
    standard: 'Patterns are classified as Solution (convergence on an approach), Problem (convergence on a challenge), or Metaphor (convergence on a mental model).',
    expert: 'Classified during vector clustering based on the framing of the convergent assertions. Solution convergence indicates aligned approaches; Problem convergence indicates shared obstacles; Metaphor convergence indicates aligned cognitive frameworks.',
  },
  {
    term: 'Signal vs. Noise',
    simple: 'Signal = real insight from people thinking independently. Noise = the same idea getting repeated and amplified until it seems bigger than it is.',
    standard: 'Converge distinguishes genuine convergence (independent sources reaching the same conclusion) from amplified narratives (one source\'s idea repeated by many). Independence score and platform diversity are the primary filters.',
    expert: 'Multi-factor noise filtering: citation graph pruning removes amplification chains, temporal analysis identifies origination vs. echo, and cross-platform verification ensures the signal isn\'t confined to a single information silo.',
  },
  {
    term: 'Accolades',
    simple: 'Badges a leader earns based on what they\'ve actually done — like achievements in a game.',
    standard: 'Earned badges on leader profiles that highlight specific contributions: Veteran (years of tracking), Cross-Platform (appears on multiple sources), High Originality (generates novel ideas), Published (academic papers), Active Builder (ships code).',
    expert: 'Computed from RPG signal data thresholds. Veteran: tenure_weeks >= 200. Cross-Platform: unique source_types >= 3. High Originality: independence_contribution > 0.5. Published: arxiv in source_types. Active Builder: github + content_volume > 0.3.',
  },
];

export default function GlossaryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mb-6 block">&larr; Back</Link>

      <h1 className="text-2xl font-bold tracking-tight mb-2">Glossary</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Key concepts behind Converge. Each term is explained at three levels — use the depth selector in the header to switch.
      </p>

      <div className="space-y-6">
        {TERMS.map(t => (
          <div key={t.term} className="border-b border-zinc-800/50 pb-5">
            <h3 className="font-semibold text-base mb-2">{t.term}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mr-2">Simple</span>
                <span className="text-zinc-400">{t.simple}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mr-2">Standard</span>
                <span className="text-zinc-300">{t.standard}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mr-2">Expert</span>
                <span className="text-zinc-200">{t.expert}</span>
              </div>
            </div>
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
