import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 14400;

const BLOG_DIR = path.join(process.cwd(), 'content/blog');
const SITE_URL = 'https://verg.dev';

export function generateStaticParams() {
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const raw = readFileSync(path.join(BLOG_DIR, f), 'utf-8');
    const slugMatch = raw.match(/slug:\s*(.+)/);
    return { slug: slugMatch ? slugMatch[1].trim() : f.replace('.md', '') };
  });
}

interface LoadedPost {
  title: string;
  date: string;
  updated: string;
  description: string;
  excerpt: string;
  body: string;
  slug: string;
}

function deriveDescription(body: string): string {
  // First non-empty paragraph, stripped of markdown emphasis, truncated to 160 chars.
  const firstPara = body
    .split('\n\n')
    .map(p => p.trim())
    .find(p => p.length > 0 && !p.startsWith('#')) || '';
  const stripped = firstPara
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length <= 160) return stripped;
  // Cut at last sentence/word boundary before 160 chars.
  const cut = stripped.slice(0, 160);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + '…';
}

function loadPost(slug: string): LoadedPost | null {
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const raw = readFileSync(path.join(BLOG_DIR, f), 'utf-8');
    const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/);
    const meta: Record<string, string> = {};
    if (frontmatter) {
      for (const line of frontmatter[1].split('\n')) {
        const [key, ...val] = line.split(':');
        if (key && val.length) meta[key.trim()] = val.join(':').trim();
      }
    }
    const postSlug = meta.slug || f.replace('.md', '');
    if (postSlug === slug) {
      const body = raw.replace(/^---[\s\S]*?---\n*/, '');
      const description = meta.description || meta.excerpt || deriveDescription(body);
      return {
        title: meta.title || 'Untitled',
        date: meta.date || '',
        updated: meta.updated || meta.date || '',
        description,
        excerpt: meta.excerpt || description,
        body,
        slug: postSlug,
      };
    }
  }
  return null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = loadPost(slug);
  if (!post) {
    return {
      title: 'Not found — Verg',
      robots: { index: false, follow: true },
    };
  }
  const url = `${SITE_URL}/blog/${post.slug}`;
  const publishedTime = post.date ? new Date(post.date).toISOString() : undefined;
  const modifiedTime = post.updated ? new Date(post.updated).toISOString() : publishedTime;
  return {
    title: `${post.title} — Verg`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      siteName: 'Verg',
      publishedTime,
      modifiedTime,
      authors: ['Andrew Crittenden'],
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.description,
      site: '@lazerhawk5000',
      creator: '@lazerhawk5000',
    },
  };
}

function renderMarkdown(text: string): string {
  return text
    .split('\n\n')
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        return `<p class="text-sm text-zinc-500 italic mt-6">${trimmed.replace(/^\*|\*$/g, '')}</p>`;
      }
      return `<p class="text-base text-zinc-400 leading-relaxed mb-4">${
        trimmed
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-200">$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br/>')
      }</p>`;
    })
    .join('\n');
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = loadPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const publishedTime = post.date ? new Date(post.date).toISOString() : undefined;
  const modifiedTime = post.updated ? new Date(post.updated).toISOString() : publishedTime;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: publishedTime,
    dateModified: modifiedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: {
      '@type': 'Person',
      name: 'Andrew Crittenden',
      alternateName: '@lazerhawk5000',
      url: 'https://verg.dev/about',
      sameAs: [
        'https://x.com/lazerhawk5000',
        'https://github.com/lazerchicken5000',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'Verg',
      url: 'https://verg.dev',
      logo: {
        '@type': 'ImageObject',
        url: 'https://verg.dev/favicon.ico',
      },
    },
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link href="/blog" className="text-xs text-zinc-500 hover:text-zinc-300 mb-8 block">&larr; All transmissions</Link>

      <p className="text-xs text-zinc-600 font-mono mb-2">{post.date}</p>
      <h1 className="text-2xl font-bold text-zinc-100 mb-8">{post.title}</h1>

      <article dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />

      <footer className="text-xs text-zinc-600 text-center py-8 mt-10 border-t border-zinc-800">
        <Link href="/blog" className="underline">More transmissions</Link> · <Link href="/" className="underline">verg.dev</Link>
      </footer>
    </main>
  );
}
