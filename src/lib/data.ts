/**
 * Data layer — reads trenddistill JSON ledgers.
 *
 * For local dev: reads directly from the trenddistill data directory.
 * For production: would read from Vercel Blob (future).
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

const CI_BASE = '/Users/sol_agent/.openclaw/workspace/trenddistill/data';

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
    path.join(CI_BASE, 'ledger/convergence.json')
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
    path.join(CI_BASE, 'ledger/rpg_profiles.json')
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
