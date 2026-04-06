# VERG: A Protocol for Convergence Intelligence

*Draft v0.1 — April 2026*
*This document evolves with the system it describes.*

---

## 1. Introduction

The internet produces more information than any human or institution can process. Trending algorithms surface what's popular. Social metrics surface what's amplified. Neither surfaces what's *true*.

The bottleneck is not access — it's intelligence. The ability to process raw data, verify independence, and derive insight. Most of what appears as consensus is actually echo: one person says something, others repeat it, and the amplification is mistaken for agreement.

Verg is a protocol for detecting genuine convergence — when independent minds arrive at the same conclusion without coordinating — and making that intelligence accessible to humans and AI agents.

## 2. The Convergence Thesis

**When multiple independent actors begin converging on similar ideas, conceptual frames, or problem definitions without coordination, that convergence points at something real emerging in the structure of the present.**

Three types of convergence carry different implications:

- **Problem convergence**: independent parties identify the same unsolved problem
- **Metaphor convergence**: the same mental model applied independently across domains
- **Solution convergence**: the same approach proposed by unconnected builders

The strength of convergence is measured not by volume (how many people say it) but by independence (how unconnected are the people saying it). Five independent researchers arriving at the same conclusion from different datasets is a stronger signal than five thousand people retweeting the same thread.

## 3. Protocol Design

### 3.1 Ingest

Multi-source, multi-format ingestion from the open internet:

- Academic papers (arXiv, Semantic Scholar)
- Open source repositories (GitHub trending, topic searches)
- Long-form content (YouTube talks, podcasts, RSS feeds)
- Snowball discovery: when the system identifies a new contributor, it automatically begins ingesting their public output

The source selection is curated — this is where human judgment enters the protocol. The pipeline is mechanical; the value is what you feed it.

### 3.2 Distill — The Token Bake

Every piece of curated intelligence has a processing cost. Verg tracks this as the **token bake**: the number of raw tokens processed to produce each curated insight.

```
168,000 raw tokens → 315 vectors → 10 convergence patterns
99.8% compression ratio
```

The token bake serves three purposes:

1. **Transparency**: every claim links back to the raw sources that produced it
2. **Efficiency metric**: is the system getting better at extracting insight per token?
3. **Value proposition**: an agent querying Verg gets curated intelligence that would cost 100x to derive from scratch

### 3.3 Detect — Convergence Scoring

Each convergence pattern is scored on two axes:

- **CI Score** (Convergence Intelligence): strength of the convergence, based on how many independent vectors align and how closely their framing matches
- **Independence Score**: verified through social graph analysis — are the contributors genuinely independent, or are they echoing from the same community?

### 3.4 Classify — Signal, Frontier, Noise

The protocol does not prune low-scoring signals. It classifies them:

- **Signal**: high CI, high independence — genuine convergence, act on this
- **Frontier**: low CI, single source — a paradigm-shifting idea that hasn't converged yet. Could be noise. Could be early. Watch it.
- **Noise**: low CI, low independence — amplified echo, hot takes, clickbait
- **Archived**: was signal, isn't anymore — the convergence dissolved or was absorbed into consensus

**Pruning destroys signal. Classifying preserves it.** A source producing zero patterns today might be the origin of a paradigm shift in three months. The protocol watches for the moment other independent sources begin aligning with what one person said months ago.

### 3.5 Validate — Prediction Scorecard

The system generates predictions and grades itself:

- Weekly predictions: which vectors will cross consensus thresholds
- Monthly predictions: which concepts will enter mainstream discourse
- Running accuracy score: currently 80% on graded predictions

The scorecard is published. Anyone can verify the track record. If the system's predictions fail, the accuracy drops visibly. Trust is earned through transparent self-assessment, not claims.

## 4. Independence Verification

Independence is the hardest thing to verify and the most important.

The protocol uses social graph analysis to distinguish genuine convergence from coordinated echo:

- **PageRank**: who gets cited by important contributors (authority weight)
- **Betweenness centrality**: who bridges different communities (bridge score)
- **Louvain community detection**: which contributors belong to the same cluster

Two contributors in the same Louvain community who agree on something are potentially echoing each other. Two contributors in *different* communities who independently arrive at the same conclusion — that's signal.

## 5. Token Bake Economics

Every piece of human knowledge has a token cost — a measure of how much raw information was processed to produce it.

The token bake is both a metric and an economic primitive:

- **Cost per insight**: how many raw tokens does it take to produce one convergence pattern?
- **Efficiency trending**: is the system improving over time? (Better sources → fewer tokens wasted on noise)
- **Source ROI**: which feeds produce the most insight per token? (Academic papers may produce 1 pattern per 5K tokens. Low-quality RSS may produce 1 pattern per 50K tokens.)

The long-term direction: token bake as a publishable intelligence metric. "Verg processed X tokens to produce Y insights at Z% efficiency this month."

## 6. Contributor Recognition

Verg identifies thought leaders through contribution, not clout.

### Scoring Dimensions

- **Originality**: does this person generate ideas that appear in convergence patterns independently?
- **Independence**: are they producing signal from their own work, or echoing others?
- **Centrality**: how central are they to the convergence patterns the system detects?
- **Source depth**: do they contribute through deep work (papers, repos) or shallow takes (tweets, hot takes)?

### The Curated 30

The top 30 contributors are not "influencers." They are the people whose work consistently appears in high-independence convergence patterns. They earned the ranking through data, not through follower count.

Others can follow these contributors — not to amplify them, but to receive signal from people with a verified track record of genuine contribution.

## 7. Frontier Classification

The most valuable signal is often the loneliest.

A paradigm-shifting idea starts with one person. There's no convergence yet because nobody else has independently arrived at the same conclusion. By traditional metrics, this looks like noise — low engagement, no consensus, no trend.

The frontier classification watches for:

- Single-source ideas with high originality scores
- Ideas that don't match any existing convergence pattern
- Contributors with a track record of early signal generation

When other independent sources begin aligning with a frontier idea — when convergence starts forming around what was once a lone signal — the system flags the transition from frontier to emerging signal.

This is the moment of maximum value: the idea is real enough to have independent verification, but early enough to be ahead of consensus.

## 8. Self-Improving Properties

The protocol improves itself through three feedback loops:

### Loop 1: Daily Pipeline (observe)
Ingest → distill → detect patterns → score sources → rank leaders.
Record what worked, what didn't, what's stale.

### Loop 2: Weekly Research (learn)
Grade predictions against reality. Rank source quality. Track efficiency trends.
Identify which signal types are most accurate.

### Loop 3: Auto-Tuning (adapt)
Calibrate confidence weights from accuracy data.
Shift ingest budget toward efficient content types.
Promote high-signal sources, demote noise generators.
Every adjustment is logged with its evidence and is reversible.

The system gets smarter by running. Not because a human tells it to change — because it measures its own performance and adjusts.

## 9. Agent Accessibility

Verg is designed to be queried by AI agents, not just browsed by humans.

- **MCP Server**: five tools (patterns, leaders, emerging, search, predict) that any AI agent can call as native tools
- **llms.txt**: standard discoverability file for AI crawlers
- **Public API**: `/api/patterns` with rate limiting
- **Token bake in every response**: agents know how much processing was saved

The long-term architecture: agents pay for curated intelligence via x402 micropayments. An agent querying Verg gets 10 curated patterns instead of processing 168K raw tokens — a 99.8% savings. The protocol makes this exchange explicit and priced.

## 10. Open Methodology

The protocol's credibility comes from transparency:

- **Source provenance**: every pattern traces back through vectors to specific papers, repos, and talks with URLs
- **Scoring methodology**: CI score formula, independence weights, leader scoring dimensions — all inspectable
- **Prediction scorecard**: running accuracy, published, anyone can verify
- **Self-grading**: the system doesn't claim accuracy — it measures and publishes it

What is open: pipeline code, scoring algorithms, independence methodology, prediction track record.

What stays curated: source selection, domain intuition, the judgment of what to track. This is where human taste enters — like a DJ whose turntables are commodity but whose selection is the product.

## 11. Conclusion

Intelligence curation is becoming infrastructure. The question is not whether AI will process information at scale — it already does. The question is whether that processing will optimize for engagement (what's popular) or for truth (what's independently verified).

Verg bets on convergence as the closest thing to truth the internet can produce. Not consensus — convergence. Not popularity — independence. Not reach — contribution.

The thesis is either validated or honestly revised. The scorecard is public. The methodology is open. The track record speaks.

---

*Verg — sourcing signal, removing noise, for builders.*

*@lazerhawk5000*
