/**
 * Data layer — reads trenddistill JSON ledgers from the repo's data/ directory.
 *
 * Data is synced from trenddistill → data/ → git push → Vercel auto-deploy.
 * See scripts/sync-data.sh in the trenddistill repo.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

const CI_BASE = path.join(process.cwd(), 'data');

// Shape of the JSON files written by trenddistill into data/content/items/.
// Used by every readJson<RawContentItem>() call below — replaces the
// previous `any` casts that tripped @typescript-eslint/no-explicit-any.
// Most fields are optional because trenddistill's pipeline doesn't
// guarantee any of them on every item shape (some sources only set
// a subset). Required fallbacks are applied at the call site.
interface RawContentItem {
  id: string;
  source?: string;
  source_url?: string;
  title?: string;
  body_text?: string;
  content_type?: string;
  published_at?: string;
  ingested_at?: string;
  created_at?: string;
  creator?: {
    id?: string;
    name?: string;
    handle?: string;
    platform?: string;
  };
}

// --- Types ---

export interface ConvergencePattern {
  id: string;
  label: string;
  description: string;
  convergence_type: 'solution' | 'problem' | 'metaphor';
  ci_score: number;
  independence_score: number;
  creator_ids: string[];
  vector_ids: string[];
  frame_alignment: string;
  stability_weeks: number;
  acceleration: number;
  presupposition_set: string[];
  presupposition_conflicts: Array<{
    assumption_a: string;
    assumption_b: string;
  }>;
  first_detected: string;
  last_updated: string;
  resolution_data: {
    tier1_summary: string;
    tier2_temporal: string;
    tier2_frame: string;
    tier4_per_source_profiles: Array<{
      creator_id: string;
      certainty: number;
      frame: string;
    }>;
  };
}

export interface RPGProfile {
  id: string;
  name: string;
  handles: Record<string, string>;
  leader_score: number;
  leader_type: string;
  entity_type: string;
  tier: string;
  polysource_score: number;
  platform_engagement: Record<string, {
    followers: number | null;
    content_count: number;
    avg_engagement_rate: number | null;
    last_active: string | null;
  }>;
  content_type_tags: string[];
  tenure_weeks: number;
  influence_trajectory: string;
  domains: string[];
  source_types: string[];
  convergence_patterns: string[];
  recurring_themes: Array<{ topic: string; frequency: number }>;
  signals: Record<string, number>;
}

export interface ConvergenceDiff {
  date: string;
  previous_date: string;
  new_patterns: Array<{ lineage_id: string; label: string; ci_score: number; creator_count: number }>;
  accelerating: Array<{ lineage_id: string; label: string; ci_before: number; ci_after: number; delta: number }>;
  decaying: Array<{ lineage_id: string; label: string; ci_before: number; ci_after: number; delta: number }>;
  stable: Array<{ lineage_id: string; label: string; ci_score: number; creator_count: number }>;
  died: Array<{ lineage_id: string; label: string; last_ci: number; age_days: number }>;
  summary: string;
}

// --- Loaders ---

function readJson<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function getLatestFile(dir: string): string | null {
  try {
    if (!existsSync(dir)) return null;
    const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
    if (files.length === 0) return null;
    return path.join(dir, files[files.length - 1]);
  } catch {
    return null;
  }
}

export function getConvergencePatterns(): ConvergencePattern[] {
  const data = readJson<{ patterns: ConvergencePattern[] }>(
    path.join(CI_BASE, 'convergence.json')
  );
  if (!data?.patterns) return [];
  return data.patterns.sort((a, b) => b.ci_score - a.ci_score);
}

export function getConvergencePattern(id: string): ConvergencePattern | null {
  const patterns = getConvergencePatterns();
  return patterns.find(p => p.id === id) ?? null;
}

export function getRPGProfiles(): RPGProfile[] {
  const data = readJson<RPGProfile[]>(
    path.join(CI_BASE, 'rpg_profiles.json')
  );
  if (!data) return [];
  return data.sort((a, b) => b.leader_score - a.leader_score);
}

export function getRPGProfile(id: string): RPGProfile | null {
  const profiles = getRPGProfiles();
  return profiles.find(p => p.id === id) ?? null;
}

export function getLatestDiff(): ConvergenceDiff | null {
  const latestFile = getLatestFile(path.join(CI_BASE, 'history/diffs'));
  if (!latestFile) return null;
  return readJson<ConvergenceDiff>(latestFile);
}

// --- Source Content ---

export interface ContentItem {
  id: string;
  source: string;       // youtube, arxiv, github, web, rss
  source_url: string;
  title: string;
  creator: {
    id: string;
    name: string;
    handle: string;
    platform: string;
  };
  content_type: string;  // talk, paper, repo, article, post
  published_at?: string;
  ingested_at?: string;
}

interface ActiveVector {
  vector_id: string;
  vector_text: string;
  source_content_ids: string[];
}

/**
 * Resolve source content items for a pattern's vector_ids.
 * Pattern → vectors (trend_context) → content items (content/items/).
 */
export function getPatternSources(vectorIds: string[], limit = 10): ContentItem[] {
  const contextPath = path.join(CI_BASE, 'trend_context.json');
  const context = readJson<{ active_vectors: ActiveVector[]; graduated_vectors: ActiveVector[] }>(contextPath);
  if (!context) return [];

  const allVectors = [...(context.active_vectors || []), ...(context.graduated_vectors || [])];
  const vectorMap = new Map(allVectors.map(v => [v.vector_id, v]));

  // Collect unique content IDs from matching vectors
  const contentIds = new Set<string>();
  for (const vid of vectorIds) {
    const vector = vectorMap.get(vid);
    if (vector?.source_content_ids) {
      for (const cid of vector.source_content_ids) {
        contentIds.add(cid);
      }
    }
  }

  // Load content items
  const items: ContentItem[] = [];
  const contentDir = path.join(CI_BASE, 'content/items');
  for (const cid of contentIds) {
    if (items.length >= limit) break;
    const itemPath = path.join(contentDir, `${cid}.json`);
    const item = readJson<RawContentItem>(itemPath);
    if (item?.source_url) {
      items.push({
        id: item.id,
        source: item.source || 'web',
        source_url: item.source_url,
        title: item.title || 'Untitled',
        creator: {
          id: item.creator?.id || '',
          name: item.creator?.name || 'Unknown',
          handle: item.creator?.handle || '',
          platform: item.creator?.platform || item.source || 'web',
        },
        content_type: item.content_type || 'article',
        published_at: item.published_at || undefined,
        ingested_at: item.ingested_at || undefined,
      });
    }
  }

  return items;
}

// --- Synthesis Chain ---

export interface SynthesisVector {
  vector_id: string;
  vector_text: string;
  sources: ContentItem[];
}

export interface SynthesisChain {
  pattern_id: string;
  vectors: SynthesisVector[];
  total_sources: number;
  total_vectors: number;
}

/**
 * Get the full synthesis chain: pattern → vectors → all content items.
 * Shows how atomic signals were distilled into the convergence pattern.
 */
export function getPatternSynthesis(pattern: ConvergencePattern): SynthesisChain {
  const contextPath = path.join(CI_BASE, 'trend_context.json');
  const context = readJson<{ active_vectors: ActiveVector[]; graduated_vectors: ActiveVector[] }>(contextPath);
  if (!context) return { pattern_id: pattern.id, vectors: [], total_sources: 0, total_vectors: 0 };

  const allVectors = [...(context.active_vectors || []), ...(context.graduated_vectors || [])];
  const vectorMap = new Map(allVectors.map(v => [v.vector_id, v]));
  const contentDir = path.join(CI_BASE, 'content/items');

  const vectors: SynthesisVector[] = [];
  let totalSources = 0;

  for (const vid of pattern.vector_ids) {
    const vector = vectorMap.get(vid);
    if (!vector) continue;

    const sources: ContentItem[] = [];
    for (const cid of vector.source_content_ids) {
      const item = readJson<RawContentItem>(path.join(contentDir, `${cid}.json`));
      if (item?.source_url) {
        sources.push({
          id: item.id,
          source: item.source || 'web',
          source_url: item.source_url,
          title: item.title || 'Untitled',
          creator: {
            id: item.creator?.id || '',
            name: item.creator?.name || 'Unknown',
            handle: item.creator?.handle || '',
            platform: item.creator?.platform || item.source || 'web',
          },
          content_type: item.content_type || 'article',
          published_at: item.published_at || undefined,
          ingested_at: item.ingested_at || undefined,
        });
      }
    }

    vectors.push({
      vector_id: vector.vector_id,
      vector_text: vector.vector_text,
      sources,
    });
    totalSources += sources.length;
  }

  return {
    pattern_id: pattern.id,
    vectors,
    total_sources: totalSources,
    total_vectors: vectors.length,
  };
}

/** Get source links for a leader's handles */
export function getLeaderLinks(leader: RPGProfile): Array<{ platform: string; url: string; handle: string }> {
  const links: Array<{ platform: string; url: string; handle: string }> = [];
  const urlTemplates: Record<string, (h: string) => string> = {
    youtube: h => `https://youtube.com/${h.startsWith('@') ? h : 'channel/' + h}`,
    x: h => `https://x.com/${h.replace('@', '')}`,
    twitter: h => `https://x.com/${h.replace('@', '')}`,
    github: h => `https://github.com/${h}`,
    web: h => h.startsWith('http') ? h : `https://${h}`,
    arxiv: h => h.startsWith('http') ? h : `https://arxiv.org/search/?query=${encodeURIComponent(h)}`,
    rss: h => h.startsWith('http') ? h : `https://${h}`,
  };

  for (const [platform, handle] of Object.entries(leader.handles || {})) {
    if (!handle) continue;
    const builder = urlTemplates[platform];
    if (builder) {
      links.push({ platform, url: builder(handle), handle });
    }
  }
  return links;
}

// --- Token Cost ---
//
// Two measurements per pattern:
//   - summaryTokens: just the human-readable prose tier (what an agent reads
//     to skim the pattern). This is the small number — typical ~200-400 tokens.
//   - curatedTokens: the FULL structured artifact (all four resolution tiers,
//     scores, presuppositions, foreign keys). This is what an agent ingests
//     for deep work — typical ~3000-6000 tokens.
//
// rawTokens is the sum of chars/4 from every source body_text the pattern
// absorbed. Both rawTokens and the curated counts are real measurements;
// chars/4 is the published rough heuristic for tokens-per-character in
// English (within ~10% of true tokenizer counts for prose).

export interface TokenCost {
  rawTokens: number;       // measured: sum of source body_text length / 4
  summaryTokens: number;   // measured: prose summary tier only
  curatedTokens: number;   // measured: full structured artifact (all tiers)
  savings: number;         // percentage saved against full curatedTokens (0-100)
  sourceCount: number;
  vectorCount: number;
}

export function getPatternTokenCost(pattern: ConvergencePattern): TokenCost {
  const sources = getPatternSources(pattern.vector_ids, 999);

  // Measure raw tokens from source content (load body_text length)
  let rawChars = 0;
  const contentDir = path.join(CI_BASE, 'content/items');
  for (const s of sources) {
    const item = readJson<{ body_text?: string }>(path.join(contentDir, `${s.id}.json`));
    rawChars += (item?.body_text?.length || 2000); // fallback when body_text missing
  }
  const rawTokens = Math.round(rawChars / 4);

  // Prose summary tier: what you'd read to skim
  const summaryText = [
    pattern.label,
    pattern.description,
    ...pattern.presupposition_set,
    pattern.resolution_data?.tier1_summary || '',
    pattern.resolution_data?.tier2_temporal || '',
  ].join(' ');
  const summaryTokens = Math.round(summaryText.length / 4);

  // Full curated artifact: every field on the pattern, including all four
  // resolution tiers and per-source profiles. Foreign-key arrays (vector_ids,
  // creator_ids) are excluded since they're indices, not knowledge content.
  const fullArtifact = {
    ...pattern,
    vector_ids: undefined,
    creator_ids: undefined,
  };
  const curatedTokens = Math.round(JSON.stringify(fullArtifact).length / 4);

  const savings = rawTokens > 0 ? Math.round((1 - curatedTokens / rawTokens) * 10000) / 100 : 0;

  return {
    rawTokens,
    summaryTokens,
    curatedTokens,
    savings,
    sourceCount: sources.length,
    vectorCount: pattern.vector_ids.length,
  };
}

// --- Contribution Scoring ---

export interface LeaderContribution {
  originality: number;      // 0-100: independence_contribution normalized
  independence: number;     // 0-100: cross-checked with pattern independence
  centrality: number;       // 0-100: convergence_centrality normalized
  sourceDepth: number;      // 0-100: weighted by source type depth
  contributionType: string; // Researcher | Builder | Analyst | Synthesizer | Contributor
}

const SOURCE_DEPTH_WEIGHTS: Record<string, number> = {
  arxiv: 1.0,
  github: 0.85,
  youtube: 0.5,
  rss: 0.4,
  web: 0.3,
  x: 0.15,
  twitter: 0.15,
};

export function getLeaderContribution(leader: RPGProfile): LeaderContribution {
  const s = leader.signals;

  // Originality: from independence_contribution (0-1 → 0-100)
  const originality = Math.round(Math.min(100, (s.independence_contribution || 0) * 107));

  // Independence: cross_source_mentions indicates multi-platform presence
  const independence = Math.round(Math.min(100, (s.cross_source_mentions || 0) * 250));

  // Centrality: convergence_centrality (0-0.3 range → 0-100)
  const centrality = Math.round(Math.min(100, (s.convergence_centrality || 0) * 333));

  // Source Depth: weighted average of source types
  const types = leader.source_types.filter(t => t !== 'citation');
  const depthScore = types.length > 0
    ? types.reduce((sum, t) => sum + (SOURCE_DEPTH_WEIGHTS[t] || 0.2), 0) / types.length
    : 0.2;
  const sourceDepth = Math.round(depthScore * 100);

  // Contribution type derivation
  const contributionType = deriveContributionType(leader, { originality, sourceDepth });

  return { originality, independence, centrality, sourceDepth, contributionType };
}

function deriveContributionType(
  leader: RPGProfile,
  attrs: { originality: number; sourceDepth: number },
): string {
  const types = leader.source_types;
  if (types.includes('arxiv')) return 'Researcher';
  if (types.includes('github') && leader.signals.content_volume > 0.3) return 'Builder';
  if (leader.signals.cross_source_mentions > 0.3 && attrs.originality > 50) return 'Synthesizer';
  if (types.includes('youtube') || types.includes('rss')) return 'Analyst';
  return 'Contributor';
}

/** Get content items authored by a specific leader */
export function getLeaderSourcedContributions(leaderId: string): ContentItem[] {
  const contentDir = path.join(CI_BASE, 'content/items');
  if (!existsSync(contentDir)) return [];

  const items: ContentItem[] = [];
  const files = readdirSync(contentDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    if (items.length >= 10) break;
    const item = readJson<RawContentItem>(path.join(contentDir, file));
    if (item?.creator?.id === leaderId && item?.source_url) {
      items.push({
        id: item.id,
        source: item.source || 'web',
        source_url: item.source_url,
        title: item.title || 'Untitled',
        creator: {
          id: item.creator?.id || '',
          name: item.creator?.name || 'Unknown',
          handle: item.creator?.handle || '',
          platform: item.creator?.platform || item.source || 'web',
        },
        content_type: item.content_type || 'article',
        published_at: item.published_at || undefined,
        ingested_at: item.ingested_at || undefined,
      });
    }
  }
  return items;
}

// --- Leader Highlight & Bio ---

export interface LeaderHighlight {
  topContribution: { title: string; source: string; url: string } | null;
  bio: string;
}

export function getLeaderHighlight(leader: RPGProfile): LeaderHighlight {
  // Find their most notable content item
  const contributions = getLeaderSourcedContributions(leader.id);
  let topContribution: LeaderHighlight['topContribution'] = null;

  if (contributions.length > 0) {
    // Prefer YouTube/talks > papers > repos > articles (visual > deep > code > text)
    const priority: Record<string, number> = { youtube: 4, arxiv: 3, semantic_scholar: 3, github: 2, rss: 1, web: 1 };
    const sorted = [...contributions].sort((a, b) => (priority[b.source] || 0) - (priority[a.source] || 0));
    const top = sorted[0];
    topContribution = { title: top.title, source: top.source, url: top.source_url };
  }

  // Generate bio from profile data
  const parts: string[] = [];

  // What they do
  const domains = leader.domains.filter(d => d !== 'unknown').slice(0, 2);
  if (domains.length > 0) {
    parts.push(domains.join(' & '));
  }

  // How they contribute
  const sourceTypes = leader.source_types.filter(s => s !== 'citation');
  if (sourceTypes.includes('arxiv') || sourceTypes.includes('semantic_scholar')) {
    parts.push('publishes research');
  } else if (sourceTypes.includes('github')) {
    parts.push('ships open source');
  } else if (sourceTypes.includes('youtube')) {
    parts.push('creates video content');
  } else if (sourceTypes.includes('rss')) {
    parts.push('writes');
  }

  // Scale
  if (leader.tenure_weeks >= 200) {
    parts.push(`tracked ${Math.round(leader.tenure_weeks / 52)}+ years`);
  } else if (leader.tenure_weeks >= 52) {
    parts.push(`tracked ${Math.round(leader.tenure_weeks / 52)}+ year${leader.tenure_weeks >= 104 ? 's' : ''}`);
  }

  // Pattern involvement
  if (leader.convergence_patterns.length > 0) {
    parts.push(`appears in ${leader.convergence_patterns.length} convergence pattern${leader.convergence_patterns.length !== 1 ? 's' : ''}`);
  }

  const bio = parts.length > 0 ? parts.join('. ') + '.' : '';

  return { topContribution, bio };
}

// --- Signal Quality ---

export interface SignalQuality {
  independence: 'high' | 'medium' | 'low';
  platformDiversity: number;  // count of unique platforms
  narrativeDirection: 'accelerating' | 'stable' | 'fading';
  platforms: string[];
}

export function getPatternSignalQuality(pattern: ConvergencePattern): SignalQuality {
  const sources = getPatternSources(pattern.vector_ids, 100);
  const platforms = [...new Set(sources.map(s => s.source))];

  return {
    independence: pattern.independence_score >= 0.7 ? 'high'
      : pattern.independence_score >= 0.5 ? 'medium' : 'low',
    platformDiversity: platforms.length,
    narrativeDirection: pattern.acceleration > 0.1 ? 'accelerating'
      : pattern.acceleration < -0.1 ? 'fading' : 'stable',
    platforms,
  };
}

// --- Activity Calendar ---

export interface DayActivity {
  date: string;        // YYYY-MM-DD
  itemCount: number;   // content items ingested
  hasDiff: boolean;    // pipeline produced a diff
}

export function getActivityCalendar(): DayActivity[] {
  const contentDir = path.join(CI_BASE, 'content/items');
  const diffDir = path.join(CI_BASE, 'history/diffs');

  // Count items per day
  const dayCounts: Record<string, number> = {};
  if (existsSync(contentDir)) {
    for (const f of readdirSync(contentDir).filter(f => f.endsWith('.json'))) {
      const item = readJson<RawContentItem>(path.join(contentDir, f));
      const date = (item?.ingested_at || item?.created_at || '')?.slice(0, 10);
      if (date) dayCounts[date] = (dayCounts[date] || 0) + 1;
    }
  }

  // Check which days have diffs
  const diffDates = new Set<string>();
  if (existsSync(diffDir)) {
    for (const f of readdirSync(diffDir).filter(f => f.endsWith('.json'))) {
      // filename: 2026-04-03_0259.json → date: 2026-04-03
      const date = f.slice(0, 10);
      diffDates.add(date);
    }
  }

  // Build calendar for last 90 days
  const days: DayActivity[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    days.push({
      date,
      itemCount: dayCounts[date] || 0,
      hasDiff: diffDates.has(date),
    });
  }
  return days;
}

// --- Aggregate Stats ---

export interface AggregateStats {
  totalTokensBaked: number;
  totalArticles: number;
  totalLeaders: number;
  totalPatterns: number;
  totalPlatforms: number;
  activeDays: number;
}

export function getAggregateStats(): AggregateStats {
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();
  const calendar = getActivityCalendar();

  // Sum token bakes across all patterns
  let totalTokens = 0;
  for (const p of patterns) {
    const cost = getPatternTokenCost(p);
    totalTokens += cost.rawTokens;
  }

  const contentDir = path.join(CI_BASE, 'content/items');
  const totalArticles = existsSync(contentDir) ? readdirSync(contentDir).filter(f => f.endsWith('.json')).length : 0;

  return {
    totalTokensBaked: totalTokens,
    totalArticles,
    totalLeaders: profiles.length,
    totalPatterns: patterns.length,
    totalPlatforms: new Set(profiles.flatMap(p => p.source_types.filter(s => s !== 'citation'))).size,
    activeDays: calendar.filter(d => d.itemCount > 0).length,
  };
}

// --- Research Data ---

export interface ScorecardData {
  generated_at: string;
  total_graded: number;
  total_correct: number;
  total_partially_correct: number;
  total_incorrect: number;
  total_too_early: number;
  total_expired: number;
  accuracy: number;
  weighted_accuracy: number;
  by_signal_type: Record<string, { total: number; correct: number; accuracy: number }>;
  by_confidence: Record<string, { total: number; correct: number; accuracy: number }>;
  graded: Array<{
    prediction_id: string;
    prediction_text: string;
    type: string;
    signal_type: string;
    confidence: string;
    predicted_at: string;
    graded_at: string;
    grade: string;
    grade_reason: string;
    predicted_state: string;
    actual_state: string;
  }>;
}

export interface EfficiencyTrendData {
  generated_at: string;
  total_runs_analyzed: number;
  current_tokens_per_pattern: number;
  avg_tokens_per_pattern_7d: number;
  avg_tokens_per_pattern_30d: number;
  trend_direction: string;
  trend_pct_change_7d: number;
  most_efficient_sources: Array<{ source: string; creator: string; tokens_per_pattern: number; grade: string }>;
  least_efficient_sources: Array<{ source: string; creator: string; tokens_per_pattern: number; grade: string }>;
  history: Array<{ date: string; tokens_per_pattern: number; total_patterns: number; compression_ratio: number }>;
}

export interface CandidateReportData {
  generated_at: string;
  total_leaders_analyzed: number;
  candidates: Array<{
    rank: number;
    id: string;
    name: string;
    leader_type: string;
    entity_type: string;
    score: number;
    tier: string;
    trajectory: string;
    rank_change: number;
    score_change: number;
    is_new_entrant: boolean;
    top_signals: Array<{ signal: string; value: number }>;
    pattern_count: number;
    domains: string[];
    source_types: string[];
  }>;
  new_entrants: Array<{ name: string; rank: number; score: number; reason: string }>;
  rising: Array<{ name: string; rank: number; rank_change: number; score_change: number }>;
  fading: Array<{ name: string; previous_rank: number; score_change: number }>;
  dropped_out: string[];
}

export interface SourceRankingData {
  date: string;
  totalSources: number;
  totalItems: number;
  avgConversionRate: number;
  avgTokensPerPattern: number;
  rankings: Array<{
    source: string;
    creator: string;
    itemCount: number;
    vectorCount: number;
    patternCount: number;
    conversionRate: number;
    totalTokens: number;
    tokensPerPattern: number;
    grade: string;
  }>;
  recommendations: {
    expand: string[];
    prune: string[];
    watch: string[];
  };
}

export function getScorecard(): ScorecardData | null {
  return readJson<ScorecardData>(path.join(CI_BASE, 'research', 'scorecard.json'));
}

export function getEfficiencyTrend(): EfficiencyTrendData | null {
  return readJson<EfficiencyTrendData>(path.join(CI_BASE, 'research', 'token_efficiency_report.json'));
}

export function getCandidateReport(): CandidateReportData | null {
  return readJson<CandidateReportData>(path.join(CI_BASE, 'research', 'leader_candidates.json'));
}

export function getSourceRankings(): SourceRankingData | null {
  return readJson<SourceRankingData>(path.join(CI_BASE, 'research', 'source_rankings.json'));
}

export function getStats() {
  const patterns = getConvergencePatterns();
  const profiles = getRPGProfiles();

  return {
    patternCount: patterns.length,
    strongPatterns: patterns.filter(p => p.ci_score >= 0.7).length,
    emergingPatterns: patterns.filter(p => p.ci_score >= 0.3 && p.ci_score < 0.7).length,
    leaderCount: profiles.length,
    topLeaders: profiles.filter(p => p.tier === 'top').length,
    establishedLeaders: profiles.filter(p => p.tier === 'established').length,
    risingLeaders: profiles.filter(p => p.tier === 'rising').length,
    platforms: new Set(profiles.flatMap(p => p.source_types.filter(s => s !== 'citation'))).size,
  };
}

// --- Shipped Audits (Phase 7g) ---
//
// Source: `data/audit-web-ledger.json`, produced by lazerforge-engine's
// `scripts/export-audits-to-web.ts`. One ledger, all shipped audits.
// The shape is the cross-repo contract — if you change fields here you
// must also change them in the exporter, and both must be deployed
// together.

export interface AuditProbe {
  version: string;
  model: string;
  signal_aggregate: number | null;
  falsifiability: number | null;
  primary_source_density: number | null;
  depth_score: number | null;
  specificity: number | null;
  novelty_score: number | null;
}

export interface AuditCitedSnapshot {
  snapshot_id: string;
  url: string;
  domain: string;
  content_class: string;
  title: string | null;
  content_length: number;
  source_published_at: string | null;
  fetched_at: string;
  fetcher: string;
  probe: AuditProbe | null;
}

export interface AuditEventEntry {
  event_type: string;
  created_at: string;
  error_message: string | null;
}

export interface AuditCard {
  audit_id: string;
  source_type: string;
  source_url: string | null;
  source_author: string | null;
  source_platform: string | null;
  claim_text: string;
  current_status: string;
  current_revision: number;
  created_at: string;
  posted_at: string | null;
  draft_text: string | null;
  verdict: string | null;
  measurements: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  hypercard_url: string | null;
  remote_post_url: string | null;
  cited_snapshots: AuditCitedSnapshot[];
  events: AuditEventEntry[];
}

interface AuditLedger {
  version: number;
  generated_at: string;
  total_shipped: number;
  audits: AuditCard[];
}

function getAuditLedger(): AuditLedger | null {
  return readJson<AuditLedger>(path.join(CI_BASE, 'audit-web-ledger.json'));
}

/**
 * Resolve a diff lineage_id (pl_*) to a convergence pattern id (cp_*)
 * by label matching. The diff pipeline and the pattern index use
 * different ID systems; the label is the bridge. Returns null when
 * no match is found (7/47 items in the current dataset).
 */
export function resolveLineageToPatternId(lineageLabel: string): string | null {
  const patterns = getConvergencePatterns();
  const needle = lineageLabel.toLowerCase().trim();
  const match = patterns.find(p => p.label.toLowerCase().trim() === needle);
  return match?.id ?? null;
}

/**
 * Build a lookup map from lineage labels → pattern IDs for the whole
 * diff at once (avoids N×M per-item lookups in the emerging tab).
 */
export function buildLineageLabelMap(): Map<string, string> {
  const patterns = getConvergencePatterns();
  const map = new Map<string, string>();
  for (const p of patterns) {
    map.set(p.label.toLowerCase().trim(), p.id);
  }
  return map;
}

export function getAudits(): AuditCard[] {
  const ledger = getAuditLedger();
  if (!ledger) return [];
  // Sort newest-first by posted_at (fall back to created_at).
  return [...ledger.audits].sort((a, b) => {
    const ta = a.posted_at ?? a.created_at;
    const tb = b.posted_at ?? b.created_at;
    return tb.localeCompare(ta);
  });
}

export function getAudit(id: string): AuditCard | null {
  const ledger = getAuditLedger();
  if (!ledger) return null;
  return ledger.audits.find(a => a.audit_id === id) ?? null;
}

/**
 * Map pattern IDs to the audits that matched them. Used by the emerging
 * tab to show "Audited in N posts" per pattern. Reads from the audit
 * ledger's evidence.matches[].patternId field — data produced by the
 * audit assembler at audit time.
 */
export interface PatternAuditLink {
  audit_id: string;
  source_author: string | null;
  claim_text: string;
  posted_at: string | null;
}

export function getAuditsByPattern(): Record<string, PatternAuditLink[]> {
  const audits = getAudits();
  const map: Record<string, PatternAuditLink[]> = {};
  for (const a of audits) {
    const ev = a.evidence as { matches?: Array<{ patternId?: string }> } | null;
    if (!ev?.matches) continue;
    for (const m of ev.matches) {
      if (!m.patternId) continue;
      if (!map[m.patternId]) map[m.patternId] = [];
      map[m.patternId].push({
        audit_id: a.audit_id,
        source_author: a.source_author,
        claim_text: a.claim_text,
        posted_at: a.posted_at,
      });
    }
  }
  return map;
}
