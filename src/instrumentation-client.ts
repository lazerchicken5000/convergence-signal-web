import posthog from 'posthog-js';

posthog.init('phc_nYeivdUS6oa9QWuZ7ieD3kM26ZyGVnZCZa2wK3x63J8H', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  // Privacy posture: respect Do-Not-Track, no session recording, no IP storage.
  // Verg is an open-methodology product — telemetry stays minimal and opt-out.
  respect_dnt: true,
  disable_session_recording: true,
  ip: false,
});

// Multi-tenant disambiguation. The same PostHog project key is shared across
// verg.dev, huntr.work, and convergence-signal-web. Without these registers
// every event collapses into a single undifferentiated stream.
//   - `site` is sticky-per-session and lets dashboards filter to verg only.
//   - `surface` distinguishes web from future MCP / CLI / extension surfaces.
//   - `first_seen_site` is a once-only attribution stamp on the person profile.
posthog.register({ site: 'verg', surface: 'web' });
posthog.register_once({ first_seen_site: 'verg' });
