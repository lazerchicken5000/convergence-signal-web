import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 14400;

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export function generateStaticParams() {
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const raw = readFileSync(path.join(BLOG_DIR, f), 'utf-8');
    const slugMatch = raw.match(/slug:\s*(.+)/);
    return { slug: slugMatch ? slugMatch[1].trim() : f.replace('.md', '') };
  });
}

function loadPost(slug: string) {
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
      return { title: meta.title || 'Untitled', date: meta.date || '', body };
    }
  }
  return null;
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

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
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
