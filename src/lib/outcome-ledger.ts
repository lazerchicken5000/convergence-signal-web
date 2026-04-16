/**
 * Read-side helpers for the outcome ledger.
 *
 * The ledger is produced by trenddistill's scripts/snapshot-outcomes.ts.
 * This module is the web's read path — it loads the JSON and computes
 * drift/stats for display. No writes from the web.
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

const LEDGER_PATH = path.join(process.cwd(), 'data', 'outcome-ledger.json');

export interface PatternSnapshot {
  date: string;
  pattern_id: string;
  label: string;
  ci_score: number;
  source_count: number;
  slurry_class?: 'sharp' | 'marginal' | 'slurry';
  counter_novelty?: number;
  counter_verdict?: 'novel' | 'rehash' | 'mixed' | 'unclear';
}

export interface OutcomeLedger {
  version: number;
  created_at: string;
  updated_at: string;
  snapshots: PatternSnapshot[];
}

export interface PatternDrift {
  pattern_id: string;
  label: string;
  first_seen: string;
  last_seen: string;
  age_days: number;
  ci_initial: number;
  ci_current: number;
  ci_delta: number;
  source_initial: number;
  source_current: number;
  source_delta: number;
  status: 'growing' | 'stable' | 'decaying' | 'died' | 'fresh';
  snapshot_count: number;
}

export interface OutcomeStats {
  total_patterns_tracked: number;
  oldest_snapshot: string | null;
  latest_snapshot: string | null;
  span_days: number;
  status_counts: Record<PatternDrift['status'], number>;
  mean_age_days: number;
  survival_rate: number;
  growth_rate: number;
}

export function loadOutcomeLedger(): OutcomeLedger | null {
  if (!existsSync(LEDGER_PATH)) return null;
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf-8')) as OutcomeLedger;
  } catch {
    return null;
  }
}

function daysBetween(a: string, b: string): number {
  const ma = Date.parse(a);
  const mb = Date.parse(b);
  return Math.max(0, Math.round((mb - ma) / (1000 * 60 * 60 * 24)));
}

export function computeDrift(ledger: OutcomeLedger): PatternDrift[] {
  if (ledger.snapshots.length === 0) return [];

  const latestDay = ledger.snapshots.reduce(
    (max, s) => (s.date > max ? s.date : max),
    ledger.snapshots[0].date,
  );
  const latestIds = new Set(
    ledger.snapshots.filter(s => s.date === latestDay).map(s => s.pattern_id),
  );

  const byPattern = new Map<string, PatternSnapshot[]>();
  for (const s of ledger.snapshots) {
    const arr = byPattern.get(s.pattern_id) ?? [];
    arr.push(s);
    byPattern.set(s.pattern_id, arr);
  }

  const out: PatternDrift[] = [];
  for (const [pattern_id, snaps] of byPattern) {
    snaps.sort((a, b) => a.date.localeCompare(b.date));
    const first = snaps[0];
    const last = snaps[snaps.length - 1];
    const age_days = daysBetween(first.date, last.date);
    const ci_delta = last.ci_score - first.ci_score;
    const source_delta = last.source_count - first.source_count;
    const present = latestIds.has(pattern_id);

    let status: PatternDrift['status'];
    if (snaps.length === 1) status = 'fresh';
    else if (!present) status = 'died';
    else if (source_delta > 0 && ci_delta >= -0.02) status = 'growing';
    else if (Math.abs(source_delta) <= 1 && Math.abs(ci_delta) < 0.05) status = 'stable';
    else status = 'decaying';

    out.push({
      pattern_id,
      label: last.label,
      first_seen: first.date,
      last_seen: last.date,
      age_days,
      ci_initial: first.ci_score,
      ci_current: last.ci_score,
      ci_delta,
      source_initial: first.source_count,
      source_current: last.source_count,
      source_delta,
      status,
      snapshot_count: snaps.length,
    });
  }
  return out;
}

export function summarize(drifts: PatternDrift[]): OutcomeStats {
  if (drifts.length === 0) {
    return {
      total_patterns_tracked: 0,
      oldest_snapshot: null,
      latest_snapshot: null,
      span_days: 0,
      status_counts: { growing: 0, stable: 0, decaying: 0, died: 0, fresh: 0 },
      mean_age_days: 0,
      survival_rate: 0,
      growth_rate: 0,
    };
  }
  const status_counts = { growing: 0, stable: 0, decaying: 0, died: 0, fresh: 0 };
  let oldest = drifts[0].first_seen;
  let latest = drifts[0].last_seen;
  let totalAge = 0;
  for (const d of drifts) {
    status_counts[d.status]++;
    if (d.first_seen < oldest) oldest = d.first_seen;
    if (d.last_seen > latest) latest = d.last_seen;
    totalAge += d.age_days;
  }
  const survivors = status_counts.growing + status_counts.stable;
  const non_fresh = drifts.length - status_counts.fresh;
  return {
    total_patterns_tracked: drifts.length,
    oldest_snapshot: oldest,
    latest_snapshot: latest,
    span_days: daysBetween(oldest, latest),
    status_counts,
    mean_age_days: Math.round(totalAge / drifts.length),
    survival_rate: non_fresh > 0 ? survivors / non_fresh : 0,
    growth_rate: non_fresh > 0 ? status_counts.growing / non_fresh : 0,
  };
}
