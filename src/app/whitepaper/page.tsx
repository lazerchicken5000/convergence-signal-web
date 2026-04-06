import { readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';

export const revalidate = 14400;

export default function WhitepaperPage() {
  const raw = readFileSync(path.join(process.cwd(), 'public/whitepaper.md'), 'utf-8');

  // Simple markdown → HTML (headers, paragraphs, lists, code blocks, bold, italic, hr)
  const lines = raw.split('\n');
  const html: string[] = [];
  let inCode = false;
  let inList = false;

  for (const line of lines) {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-zinc-400 my-4"><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // Close list if needed
    if (inList && !line.startsWith('- ') && line.trim() !== '') {
      html.push('</ul>');
      inList = false;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      html.push('<hr class="border-zinc-800 my-8" />');
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      html.push(`<h1 class="text-2xl font-bold text-zinc-100 mt-10 mb-4">${fmt(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      html.push(`<h2 class="text-xl font-bold text-zinc-200 mt-10 mb-3">${fmt(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      html.push(`<h3 class="text-base font-semibold text-zinc-300 mt-6 mb-2">${fmt(line.slice(4))}</h3>`);
      continue;
    }

    // List items
    if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul class="space-y-1.5 my-3 ml-4">');
        inList = true;
      }
      html.push(`<li class="text-sm text-zinc-400 leading-relaxed list-disc">${fmt(line.slice(2))}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      html.push('<div class="h-2"></div>');
      continue;
    }

    // Italic line (like *Draft v0.1*)
    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      html.push(`<p class="text-xs text-zinc-600 italic">${fmt(line)}</p>`);
      continue;
    }

    // Regular paragraph
    html.push(`<p class="text-sm text-zinc-400 leading-relaxed my-2">${fmt(line)}</p>`);
  }

  if (inList) html.push('</ul>');

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 mb-8 block">&larr; Back to dashboard</Link>
      <article
        className="prose-invert"
        dangerouslySetInnerHTML={{ __html: html.join('\n') }}
      />
      <footer className="text-xs text-zinc-600 text-center py-8 mt-10 border-t border-zinc-800">
        This document evolves with the system it describes. · <Link href="/" className="underline">verg.dev</Link> · <Link href="/glossary" className="underline">Glossary</Link>
      </footer>
    </main>
  );
}

function fmt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-200 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono">$1</code>');
}
