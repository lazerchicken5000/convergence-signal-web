import posthog from 'posthog-js';

posthog.init('phc_nYeivdUS6oa9QWuZ7ieD3kM26ZyGVnZCZa2wK3x63J8H', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
});
