import { NextResponse } from 'next/server';

/**
 * OpenAPI 3.0 spec for Verg intelligence API.
 * Machine-readable endpoint for AI agents to discover available tools and schemas.
 *
 * GET /api/openapi.json
 */

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Verg Intelligence API',
    version: '0.1.0',
    description:
      'Verg is a protocol for convergence intelligence — detecting cross-community convergence where unaffiliated sources arrive at the same observation without direct coordination. This API exposes curated patterns, contributor profiles, and signal/noise audits for AI agents and developers.',
    termsOfService: 'https://verg.dev/whitepaper',
    contact: {
      name: 'Verg',
      url: 'https://verg.dev',
      email: '@lazerhawk5000',
    },
    license: {
      name: 'Public API — no authentication required',
      url: 'https://verg.dev',
    },
  },
  servers: [
    { url: 'https://verg.dev', description: 'Production' },
  ],
  paths: {
    '/api/patterns': {
      get: {
        summary: 'Get convergence patterns',
        description:
          'Returns the current convergence patterns — clusters of assertions from unaffiliated sources across different communities sharing the same thesis. Each pattern includes a CI score, independence-adjusted scoring, token bake cost, and source links back to raw papers/repos/talks. Sorted by CI score descending.',
        operationId: 'getPatterns',
        tags: ['Intelligence'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of patterns to return',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'min_ci',
            in: 'query',
            description: 'Minimum CI score filter (0-1)',
            required: false,
            schema: { type: 'number', minimum: 0, maximum: 1 },
          },
        ],
        responses: {
          '200': {
            description: 'List of convergence patterns with metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PatternsResponse' },
              },
            },
          },
          '429': { description: 'Rate limit exceeded (60/min per IP)' },
        },
      },
    },
    '/api/leaders': {
      get: {
        summary: 'Get thought leaders',
        description:
          'Returns discovered thought leaders ranked by contribution score. Leaders are identified by the system through signal analysis — NOT by follower count. Each leader has a contribution profile (originality, independence, centrality, source depth) and pattern involvement data.',
        operationId: 'getLeaders',
        tags: ['Intelligence'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10, maximum: 100 },
          },
          {
            name: 'type',
            in: 'query',
            description: 'Filter by leader type',
            schema: { type: 'string', enum: ['architect', 'philosopher', 'amplifier', 'contrarian', 'bridge'] },
          },
          {
            name: 'min_score',
            in: 'query',
            schema: { type: 'number', minimum: 0, maximum: 1 },
          },
        ],
        responses: {
          '200': {
            description: 'List of thought leaders with contribution profiles',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LeadersResponse' },
              },
            },
          },
        },
      },
    },
    '/api/feedback': {
      post: {
        summary: 'Submit feedback on a pattern or source',
        description: 'Agents and humans can provide feedback on pattern quality or source reliability.',
        operationId: 'submitFeedback',
        tags: ['Interaction'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['pattern', 'source'] },
                  target_id: { type: 'string' },
                  useful: { type: 'boolean' },
                  reason: { type: 'string' },
                },
                required: ['type', 'target_id'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Feedback received' },
        },
      },
    },
  },
  components: {
    schemas: {
      PatternsResponse: {
        type: 'object',
        properties: {
          meta: {
            type: 'object',
            properties: {
              total_patterns: { type: 'integer' },
              total_leaders: { type: 'integer' },
              source_platforms: { type: 'integer' },
              generated_at: { type: 'string', format: 'date-time' },
            },
          },
          patterns: {
            type: 'array',
            items: { $ref: '#/components/schemas/Pattern' },
          },
        },
      },
      Pattern: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cp_e40f7a3c' },
          label: { type: 'string', description: 'Short pattern label' },
          description: { type: 'string', description: 'Full pattern description' },
          convergence_type: { type: 'string', enum: ['problem', 'metaphor', 'solution'] },
          ci_score: {
            type: 'number',
            description: 'Convergence Intelligence score — strength of the convergence (0-1). 0.7+ is strong.',
          },
          independence_score: {
            type: 'number',
            description: 'Independence verification score (0-1). 0.7+ = strong cross-community convergence. <0.5 = potential echo chamber.',
          },
          creator_count: { type: 'integer' },
          stability_weeks: { type: 'integer' },
          acceleration: { type: 'number', description: 'CI score change rate. Positive = strengthening.' },
          presuppositions: { type: 'array', items: { type: 'string' }, description: 'Shared assumptions underlying the convergence' },
          token_cost: {
            type: 'object',
            properties: {
              raw_tokens: { type: 'integer', description: 'Total tokens processed from raw sources' },
              curated_tokens: { type: 'integer', description: 'Tokens in the curated pattern output' },
              savings_percent: { type: 'number', description: 'Compression ratio — typically 99%+' },
              source_count: { type: 'integer' },
            },
          },
          signal_quality: {
            type: 'object',
            properties: {
              independence: { type: 'string', enum: ['high', 'medium', 'low'] },
              platform_diversity: { type: 'integer' },
              platforms: { type: 'array', items: { type: 'string' } },
              narrative_direction: { type: 'string', enum: ['accelerating', 'stable', 'fading'] },
            },
          },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                creator: { type: 'string' },
                platform: { type: 'string', enum: ['arxiv', 'github', 'youtube', 'rss', 'semantic_scholar', 'web'] },
                type: { type: 'string' },
              },
            },
          },
        },
      },
      LeadersResponse: {
        type: 'object',
        properties: {
          meta: {
            type: 'object',
            properties: {
              total_returned: { type: 'integer' },
              generated_at: { type: 'string', format: 'date-time' },
            },
          },
          leaders: {
            type: 'array',
            items: { $ref: '#/components/schemas/Leader' },
          },
        },
      },
      Leader: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          leader_score: { type: 'number' },
          leader_type: { type: 'string', enum: ['architect', 'philosopher', 'amplifier', 'contrarian', 'bridge'] },
          entity_type: { type: 'string', enum: ['individual', 'organization', 'media_channel', 'open_source_project', 'academic_group'] },
          tier: { type: 'string', enum: ['emerging', 'rising', 'established', 'top'] },
          trajectory: { type: 'string', enum: ['rising', 'stable', 'declining'] },
          domains: { type: 'array', items: { type: 'string' } },
          source_types: { type: 'array', items: { type: 'string' } },
          contribution: {
            type: 'object',
            description: 'Contribution-based scoring (NOT follower-based)',
            properties: {
              type: { type: 'string', description: 'Derived contribution type: Researcher, Builder, Synthesizer, Analyst, Contributor' },
              originality: { type: 'integer', description: '0-100' },
              independence: { type: 'integer', description: '0-100' },
              centrality: { type: 'integer', description: '0-100' },
              source_depth: { type: 'integer', description: '0-100' },
            },
          },
          pattern_count: { type: 'integer', description: 'Number of convergence patterns this leader has contributed to' },
          tenure_weeks: { type: 'integer' },
          themes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                frequency: { type: 'integer' },
              },
            },
          },
          links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                url: { type: 'string', format: 'uri' },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Intelligence', description: 'Query curated convergence intelligence' },
    { name: 'Interaction', description: 'Provide feedback to improve the system' },
  ],
  externalDocs: {
    description: 'Verg Whitepaper — full protocol specification',
    url: 'https://verg.dev/whitepaper',
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
}
