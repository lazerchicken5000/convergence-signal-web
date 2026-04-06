import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';

export const revalidate = 14400;

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

function loadPosts(): BlogPost[] {
  const dir = path.join(process.cwd(), 'content/blog');
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse();

  return files.map(f => {
    const raw = readFileSync(path.join(dir, f), 'utf-8');
    const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/);
    const meta: Record<string, string> = {};
    if (frontmatter) {
      for (const line of frontmatter[1].split('\n')) {
        const [key, ...val] = line.split(':');
        if (key && val.length) meta[key.trim()] = val.join(':').trim();
      }
    }

    const body = raw.replace(/^---[\s\S]*?---\n*/, '');
    const excerpt = body.split('\n').filter(l => l.trim().length > 0).slice(0, 2).join(' ').slice(0, 200);

    return {
      slug: meta.slug || f.replace('.md', ''),
      title: meta.title || 'Untitled',
      date: meta.date || '',
      excerpt,
    };
  });
}

export default function BlogPage() {
  const posts = loadPosts();

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 mb-8 block">&larr; Back to dashboard</Link>

      <h1 className="text-2xl font-bold text-zinc-100 mb-2">Transmissions</h1>
      <p className="text-sm text-zinc-500 mb-10">Rants, observations, and signal from the frontier.</p>

      <div className="space-y-8">
        {posts.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <p className="text-xs text-zinc-600 font-mono mb-1">{post.date}</p>
            <h2 className="text-lg font-semibold text-zinc-200 group-hover:text-white transition-colors">{post.title}</h2>
            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{post.excerpt}...</p>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-sm text-zinc-600 text-center py-10">No transmissions yet.</p>
      )}

      <footer className="text-xs text-zinc-600 text-center py-8 mt-10 border-t border-zinc-800">
        <Link href="/" className="underline">verg.dev</Link> · <Link href="/whitepaper" className="underline">Whitepaper</Link>
      </footer>
    </main>
  );
}
