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
