import Link from 'next/link';

export const revalidate = 86400;

export default function DocsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 mb-8 block">&larr; Back to dashboard</Link>

      <div className="mb-10">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Verg API</h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Public, agent-native access to curated convergence intelligence.
          No authentication required. Rate-limited to 60 requests/minute per IP.
        </p>
      </div>

      {/* Quick start */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Quick Start</h2>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/40 font-mono text-xs text-zinc-400 overflow-x-auto">
          <div className="text-zinc-600 mb-1"># Get current convergence patterns</div>
          <div>curl https://verg.dev/api/patterns?limit=5</div>
          <div className="text-zinc-600 mt-3 mb-1"># Get top thought leaders</div>
          <div>curl https://verg.dev/api/leaders?limit=10</div>
          <div className="text-zinc-600 mt-3 mb-1"># OpenAPI 3.0 spec (machine-readable)</div>
          <div>curl https://verg.dev/api/openapi.json</div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Endpoints</h2>

        {/* /api/patterns */}
        <div className="border border-zinc-800 rounded-lg p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-mono">GET</span>
            <code className="text-sm text-zinc-200 font-mono">/api/patterns</code>
          </div>
          <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
            Returns current convergence patterns with full provenance. Each pattern includes the CI score,
            independence verification, token bake cost, and links back to raw sources.
          </p>
          <div className="text-xs text-zinc-600 mb-1">Query parameters:</div>
          <ul className="text-xs text-zinc-500 space-y-1 ml-4 list-disc mb-3">
            <li><code className="font-mono text-zinc-400">limit</code> — max patterns (default 10)</li>
            <li><code className="font-mono text-zinc-400">min_ci</code> — minimum CI score filter (0-1)</li>
          </ul>
          <div className="text-xs text-zinc-600 mb-1">Response shape:</div>
          <pre className="text-xs text-zinc-500 font-mono bg-zinc-900/60 p-3 rounded overflow-x-auto">
{`{
  "meta": { "total_patterns": 12, "generated_at": "..." },
  "patterns": [
    {
      "id": "cp_e40f7a3c",
      "label": "AI agents need human supervision",
      "ci_score": 0.26,
      "independence_score": 0.68,
      "token_cost": { "raw_tokens": 144000, "savings_percent": 99.8 },
      "signal_quality": { "independence": "high", "platforms": [...] },
      "sources": [...]
    }
  ]
}`}
          </pre>
        </div>

        {/* /api/leaders */}
        <div className="border border-zinc-800 rounded-lg p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-mono">GET</span>
            <code className="text-sm text-zinc-200 font-mono">/api/leaders</code>
          </div>
          <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
            Thought leaders ranked by contribution score — not follower count.
            Each leader has originality, independence, centrality, and source depth metrics.
          </p>
          <div className="text-xs text-zinc-600 mb-1">Query parameters:</div>
          <ul className="text-xs text-zinc-500 space-y-1 ml-4 list-disc">
            <li><code className="font-mono text-zinc-400">limit</code> — max leaders (default 10)</li>
            <li><code className="font-mono text-zinc-400">type</code> — filter: architect, philosopher, amplifier, contrarian, bridge</li>
            <li><code className="font-mono text-zinc-400">min_score</code> — minimum leader score</li>
          </ul>
        </div>

        {/* /api/openapi.json */}
        <div className="border border-zinc-800 rounded-lg p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-mono">GET</span>
            <code className="text-sm text-zinc-200 font-mono">/api/openapi.json</code>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Full OpenAPI 3.0 specification. Machine-readable — drop it into Claude Code, Cursor,
            or any agent framework that supports OpenAPI tool discovery.
          </p>
        </div>

        {/* /api/feedback */}
        <div className="border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/5 font-mono">POST</span>
            <code className="text-sm text-zinc-200 font-mono">/api/feedback</code>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Submit feedback on a pattern or source. Agents and humans can both provide feedback
            to improve source quality scoring and pattern validation over time.
          </p>
        </div>
      </section>

      {/* Key concepts */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Key Concepts</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">CI Score (Convergence Intelligence)</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Strength of convergence (0-1). Measures how many independent sources align and how closely
              their framing matches. 0.7+ is strong convergence.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">Independence Score</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Verified through social graph analysis (PageRank, Louvain communities).
              0.7+ = genuinely independent sources. Below 0.5 suggests potential echo chamber.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">Token Bake</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The processing cost of each insight. Raw source tokens in → curated structured artifact tokens out.
              Both numbers are <em>measured</em> from disk every run (chars/4 of the actual content), not estimated.
              Typical compression sits in the ~95-97% range — querying Verg returns the structured intelligence object instead of forcing the agent to process every contributing source itself.
              See <Link href="/protocol#token-bake" className="underline text-zinc-400 hover:text-zinc-200">/protocol#token-bake</Link> for the live measured numbers.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">Leader Contribution</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Scored on 4 dimensions: originality (novel ideas), independence (not echoing), centrality (pattern involvement),
              source depth (deep work vs shallow takes). NOT based on follower count.
            </p>
          </div>
        </div>
      </section>

      {/* Agent integration */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Agent Integration</h2>

        <h3 className="text-sm font-semibold text-zinc-300 mb-2">MCP Server</h3>
        <p className="text-sm text-zinc-500 mb-3 leading-relaxed">
          For Claude Code, Cursor, Windsurf, and other MCP-compatible tools, Verg offers a native MCP server
          with 5 tools: <code className="font-mono text-zinc-400">verg_patterns</code>, <code className="font-mono text-zinc-400">verg_leaders</code>, <code className="font-mono text-zinc-400">verg_emerging</code>, <code className="font-mono text-zinc-400">verg_search</code>, <code className="font-mono text-zinc-400">verg_predictions</code>.
        </p>

        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Discovery</h3>
        <ul className="text-sm text-zinc-500 space-y-1 ml-4 list-disc">
          <li><Link href="/llms.txt" className="underline text-zinc-400 hover:text-zinc-200">llms.txt</Link> — human-readable agent guide</li>
          <li><Link href="/api/openapi.json" className="underline text-zinc-400 hover:text-zinc-200">openapi.json</Link> — machine-readable tool spec</li>
          <li><Link href="/whitepaper" className="underline text-zinc-400 hover:text-zinc-200">whitepaper</Link> — protocol design</li>
        </ul>
      </section>

      <footer className="text-xs text-zinc-600 text-center py-8 mt-10 border-t border-zinc-800">
        <Link href="/" className="underline">verg.dev</Link> · <Link href="/whitepaper" className="underline">Whitepaper</Link> · <Link href="/blog" className="underline">Transmissions</Link>
      </footer>
    </main>
  );
}
