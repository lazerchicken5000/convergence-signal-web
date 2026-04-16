---
title: The slurry gate
date: 2026-04-16
slug: the-slurry-gate
---

A critic got it right.

Looking at Verg's emerging patterns, @ItsKondrat pointed out that some of the top labels — things like *"there is a growing demand for robust and reliable AI solutions"* — read like the output of any generic LLM asked to summarize AI trends. Soft phrasing. Abstract framing. Could have been written any year in the last decade. The worry: if Verg's pattern labels are indistinguishable from generic trend slurry, the "signal" claim starts to leak.

That's a falsifiable complaint. So here's the gate.

## How the slurry test works

Every pattern label gets embedded locally via `nomic-embed-text`. The embedding is compared to a hand-written bank of 25 archetypally-generic phrases — the kind of thing you'd get if you asked a random LLM to list AI trends right now with no prompt specificity. Each pattern's score is its maximum cosine similarity against that bank.

Thresholds:

- **sharp** (&lt; 0.75): the label sits meaningfully away from the generic cluster
- **marginal** (0.75 – 0.85): close enough to be worth flagging, not close enough to drop
- **slurry** (≥ 0.85): the label is functionally indistinguishable from what an LLM would produce given no specific prompt

On the current 55-pattern set: **41 sharp · 11 marginal · 3 slurry**. The 3 flagged are exactly the ones the critic pointed to. The test works as a falsifiability gate — before publication, each pattern label has to clear the bar of being distinguishable from generic summary output. The ones that don't aren't hidden, but they get dimmed and sorted to the bottom. Transparent signaling over silent filter.

## How the counter-curator works

A second pass with a different taste. Where the base curator asks *"what are independent sources converging on?"*, the counter-curator (Claude Haiku) asks *"is this convergence genuinely novel, or a rebrand of something older?"*

On the same 55 patterns: **0 novel · 26 mixed · 29 rehash**.

That's a strong result. Zero patterns rated as fully novel by the skeptic. The current pattern set echoes a lot of prior-decade substrate. That's not a failure — many of the most consequential AI shifts are rediscoveries amplified by new compute and data. But saying it out loud matters. The honest read is: Verg is surfacing high-order recombinations, not inventions.

The interesting set is the **contested** patterns — 11 cases where the base curator says signal but the skeptic calls rehash. Those are exactly the ones worth a human reading closely, because neither automated score is trustworthy when they disagree.

## Outcome ledger starts today

There's a third gate: don't trust any taste — wait and see what actually happens. Every pipeline run now snapshots each pattern's state (CI, source count, slurry class, novelty rating). In 30 days we'll have empirical drift data: which patterns grew, which decayed, which died. Day zero is **2026-04-16**.

## Where to see this

New page at [/self-audit](/self-audit). Slurry distribution, counter-curator verdicts, curator-space scatter plot, contested patterns listed with named antecedents, outcome ledger status. All recomputed from the live data on every build.

The measurement is public. The rubric is [in source](https://github.com/lazerchicken5000/trenddistill/blob/main/src/services/slurryTest.ts). Any claim this page makes about itself can be audited against the same pipeline that produces it.

Curation is still the weakness. Nothing here solves that. What it does: surface it, measure it, and publish the measurement even when the numbers aren't flattering.
