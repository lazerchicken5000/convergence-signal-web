import type { ContentItem } from '@/lib/data';

const SOURCE_ICONS: Record<string, string> = {
  youtube: '▶',
  arxiv: '📄',
  github: '⌘',
  web: '🌐',
  rss: '◉',
  x: '𝕏',
  twitter: '𝕏',
};

const TYPE_LABELS: Record<string, string> = {
  talk: 'Talk',
  paper: 'Paper',
  repo: 'Repo',
  article: 'Article',
  post: 'Post',
  tutorial: 'Tutorial',
  newsletter: 'Newsletter',
  podcast: 'Podcast',
};

export function SourceLinks({ sources }: { sources: ContentItem[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Sources</p>
      {sources.map(s => (
        <a
          key={s.id}
          href={s.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2.5 py-1.5 group"
        >
          <span className="text-sm shrink-0 mt-0.5 opacity-60 group-hover:opacity-100">
            {SOURCE_ICONS[s.source] ?? '·'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-300 group-hover:text-white truncate transition-colors">
              {s.title}
            </p>
            <p className="text-xs text-zinc-500">
              {s.creator.name}
              {TYPE_LABELS[s.content_type] ? ` · ${TYPE_LABELS[s.content_type]}` : ''}
              {' · '}{s.source}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

export function PlatformLinks({ links }: { links: Array<{ platform: string; url: string; handle: string }> }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(l => (
        <a
          key={l.platform}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          <span>{SOURCE_ICONS[l.platform] ?? '·'}</span>
          <span>{l.platform}</span>
        </a>
      ))}
    </div>
  );
}
