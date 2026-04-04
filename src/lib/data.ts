/**
 * Data layer — reads trenddistill JSON ledgers from the repo's data/ directory.
 *
 * Data is synced from trenddistill → data/ → git push → Vercel auto-deploy.
 * See scripts/sync-data.sh in the trenddistill repo.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

const CI_BASE = path.join(process.cwd(), 'data');

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
    const item = readJson<any>(itemPath);
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
      });
    }
  }

  return items;
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

export interface TokenCost {
  rawTokens: number;       // estimated tokens in raw source content
  curatedTokens: number;   // tokens in the curated pattern output
  savings: number;         // percentage saved (0-100)
  sourceCount: number;
  vectorCount: number;
}

export function getPatternTokenCost(pattern: ConvergencePattern): TokenCost {
  const sources = getPatternSources(pattern.vector_ids, 999);

  // Estimate raw tokens from source content (load body_text length)
  let rawChars = 0;
  const contentDir = path.join(CI_BASE, 'content/items');
  for (const s of sources) {
    const item = readJson<any>(path.join(contentDir, `${s.id}.json`));
    rawChars += (item?.body_text?.length || 2000); // fallback estimate
  }
  const rawTokens = Math.round(rawChars / 4);

  // Curated output = pattern label + description + presuppositions + resolution
  const curatedText = [
    pattern.label,
    pattern.description,
    ...pattern.presupposition_set,
    pattern.resolution_data?.tier1_summary || '',
    pattern.resolution_data?.tier2_temporal || '',
  ].join(' ');
  const curatedTokens = Math.round(curatedText.length / 4);

  const savings = rawTokens > 0 ? Math.round((1 - curatedTokens / rawTokens) * 10000) / 100 : 0;

  return {
    rawTokens,
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
    const item = readJson<any>(path.join(contentDir, file));
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
      const item = readJson<any>(path.join(contentDir, f));
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
