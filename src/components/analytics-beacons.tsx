'use client';

/**
 * Tiny client-side capture beacons. Server components can't call
 * posthog.capture() directly, so we drop these no-op-rendering components
 * inside server pages to fire one event on first mount.
 *
 * Kept in a single file so all the lazy-imports of posthog-js are
 * co-located and easy to audit.
 */

import { useEffect } from 'react';

interface PatternViewedBeaconProps {
  patternId: string;
  nSignals: number;
  noveltyScore?: number | null;
  ciScore?: number | null;
  convergenceType?: string | null;
}

/**
 * Fires `pattern_viewed` exactly once when a pattern detail page mounts.
 * Distinct from the dashboard `pattern_viewed` (which fires on row select)
 * because the surface property differentiates them.
 */
export function PatternViewedBeacon({
  patternId,
  nSignals,
  noveltyScore = null,
  ciScore = null,
  convergenceType = null,
}: PatternViewedBeaconProps) {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ph = (await import('posthog-js')).default;
        if (cancelled) return;
        ph.capture('pattern_viewed', {
          pattern_id: patternId,
          n_signals: nSignals,
          novelty_score: noveltyScore,
          ci_score: ciScore,
          convergence_type: convergenceType,
          surface: 'pattern_page',
        });
      } catch { /* posthog not loaded */ }
    })();
    return () => { cancelled = true; };
    // patternId is the natural identity of this view — re-fire if it changes.
  }, [patternId, nSignals, noveltyScore, ciScore, convergenceType]);

  return null;
}

interface RoomEntryViewedBeaconProps {
  /** Stable identifier, e.g. "room-01" or the entry slug. */
  entryId: string;
  /** CSS selector for the entry root element. The observer attaches here. */
  selector: string;
}

/**
 * Fires `room_entry_viewed` when an entry scrolls into view. One-shot per
 * entry id per page load — IntersectionObserver disconnects after the
 * first hit so we don't double-count.
 */
export function RoomEntryViewedBeacon({ entryId, selector }: RoomEntryViewedBeaconProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const target = document.querySelector(selector);
    if (!target) return;

    let fired = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          observer.disconnect();
          void (async () => {
            try {
              const ph = (await import('posthog-js')).default;
              ph.capture('room_entry_viewed', {
                entry_id: entryId,
                surface: 'room',
              });
            } catch { /* posthog not loaded */ }
          })();
        }
      }
    }, { threshold: 0.4 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [entryId, selector]);

  return null;
}

interface ProtocolSectionViewedBeaconProps {
  /** Map of section DOM id → human-readable section name. */
  sections: Record<string, string>;
}

/**
 * Fires `protocol_section_viewed` per section as it scrolls into view.
 * A single observer watches all sections; each is a one-shot capture.
 */
export function ProtocolSectionViewedBeacon({ sections }: ProtocolSectionViewedBeaconProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const fired = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (entry.isIntersecting && id && !fired.has(id)) {
          fired.add(id);
          const name = sections[id] ?? id;
          void (async () => {
            try {
              const ph = (await import('posthog-js')).default;
              ph.capture('protocol_section_viewed', {
                section_id: id,
                section_name: name,
                surface: 'protocol',
              });
            } catch { /* posthog not loaded */ }
          })();
        }
      }
    }, { threshold: 0.3 });

    for (const id of Object.keys(sections)) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
    // The sections map is expected to be stable for a given page render.
  }, [sections]);

  return null;
}
