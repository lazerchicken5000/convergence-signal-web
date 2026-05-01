import type { MetadataRoute } from 'next';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

const SITE_URL = 'https://verg.dev';
const BLOG_DIR = path.join(process.cwd(), 'content/blog');

interface BlogEntry {
  slug: string;
  date: string;
  updated: string;
}

function loadBlogEntries(): BlogEntry[] {
  let files: string[];
  try {
    files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  } catch {
    return [];
  }
  return files.map(f => {
    const raw = readFileSync(path.join(BLOG_DIR, f), 'utf-8');
    const meta: Record<string, string> = {};
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (fm) {
      for (const line of fm[1].split('\n')) {
        const [key, ...val] = line.split(':');
        if (key && val.length) meta[key.trim()] = val.join(':').trim();
      }
    }
    return {
      slug: meta.slug || f.replace('.md', ''),
      date: meta.date || '',
      updated: meta.updated || meta.date || '',
    };
  });
}

function latestPipelineRun(): Date {
  // Use convergence.json mtime if present — that's the last pipeline output.
  try {
    const stat = statSync(path.join(process.cwd(), 'data/convergence.json'));
    return stat.mtime;
  } catch {
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastRun = latestPipelineRun();
  const blogPosts = loadBlogEntries();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: lastRun,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/protocol`,
      lastModified: lastRun,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/whitepaper`,
      lastModified: lastRun,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: lastRun,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/glossary`,
      lastModified: lastRun,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: lastRun,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/self-audit`,
      lastModified: lastRun,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/tip`,
      lastModified: lastRun,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map(p => {
    const lastModified = p.updated || p.date
      ? new Date(p.updated || p.date)
      : lastRun;
    return {
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    };
  });

  // /room is intentionally noindex — exclude from sitemap.
  return [...staticEntries, ...blogEntries];
}
