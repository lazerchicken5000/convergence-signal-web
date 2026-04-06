import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

/**
 * /llms-full.txt — bundled markdown for deep context ingestion.
 * Concatenates llms.txt + whitepaper + all blog posts into a single file.
 * Agents can fetch this for full understanding without multiple requests.
 */

export async function GET() {
  const root = process.cwd();

  // Read all source files
  const llmsTxt = safeRead(path.join(root, 'public/llms.txt'));
  const whitepaper = safeRead(path.join(root, 'public/whitepaper.md'));

  // Read all blog posts
  const blogDir = path.join(root, 'content/blog');
  const blogFiles = safeReaddir(blogDir).filter(f => f.endsWith('.md')).sort();
  const blogPosts = blogFiles.map(f => {
    const raw = safeRead(path.join(blogDir, f));
    return { filename: f, content: raw };
  });

  // Build bundled output
  const parts: string[] = [];

  parts.push('# Verg — Full Context Bundle');
  parts.push('');
  parts.push('> This is the complete Verg context bundled into one file for deep agent ingestion. Contains the llms.txt index, the full whitepaper, and all blog posts.');
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('# llms.txt');
  parts.push('');
  parts.push(llmsTxt);
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('# Whitepaper');
  parts.push('');
  parts.push(whitepaper);
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('# Transmissions (Blog)');
  parts.push('');

  for (const post of blogPosts) {
    parts.push(post.content);
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  const bundled = parts.join('\n');

  return new NextResponse(bundled, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function safeRead(p: string): string {
  try {
    return readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
}

function safeReaddir(p: string): string[] {
  try {
    return readdirSync(p);
  } catch {
    return [];
  }
}
