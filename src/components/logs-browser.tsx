'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ExternalLink, Filter, X } from 'lucide-react';
import { youtubePlaylistProviderLabel } from '@/src/lib/youtube-playlist';
import type { LinkFeedItem, LogFeedItem, LogsFeedItem, LogsTag, LogType, PlaylistFeedItem, QuoteFeedItem } from '@/src/types/logs';
import { PlaylistPreview } from './playlist-preview';

type ContentFilter = LogsFeedItem['kind'] | null;

const contentFilters: Array<{ value: ContentFilter; label: string }> = [
  { value: null, label: 'All' },
  { value: 'log', label: 'Logs' },
  { value: 'link', label: 'Links' },
  { value: 'playlist', label: 'Playlists' },
  { value: 'quote', label: 'Quotes' },
];

const logTypeLabels: Record<LogType, string> = {
  thought: 'Thought',
  lifeUpdate: 'Life Update',
  beatNote: 'Beat Note',
  fixationNote: 'Fixation Note',
  movieThought: 'Movie Thought',
  quickList: 'Quick List',
};

const logTypes = Object.entries(logTypeLabels) as Array<[LogType, string]>;

export function LogsBrowser({ items }: { items: LogsFeedItem[] }) {
  const [contentType, setContentType] = useState<ContentFilter>(null);
  const [logType, setLogType] = useState<LogType | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [readingLog, setReadingLog] = useState<LogFeedItem | null>(null);
  const readingOpener = useRef<HTMLButtonElement | null>(null);

  const tags = useMemo(() => collectTags(items), [items]);
  const filteredItems = useMemo(() => items.filter((item) => {
    if (contentType && item.kind !== contentType) return false;
    if (logType && (item.kind !== 'log' || item.logType !== logType)) return false;
    if (tagId && !item.tags.some((tag) => tag.id === tagId)) return false;
    return true;
  }), [contentType, items, logType, tagId]);
  const activeFilterCount = Number(Boolean(contentType)) + Number(Boolean(logType)) + Number(Boolean(tagId));

  const resetFilters = () => {
    setContentType(null);
    setLogType(null);
    setTagId(null);
  };

  const openReading = (log: LogFeedItem, opener: HTMLButtonElement) => {
    readingOpener.current = opener;
    setReadingLog(log);
  };

  const closeReading = useCallback(() => {
    setReadingLog(null);
    requestAnimationFrame(() => readingOpener.current?.focus());
  }, []);

  if (!items.length) {
    return <section className="border-y border-[var(--line-subtle)] py-10" aria-label="Logs archive"><p className="type-protocol-label text-[var(--text-muted)]">Archive empty</p><p className="type-small mt-3">No published entries are available.</p></section>;
  }

  return (
    <section aria-labelledby="logs-feed-heading">
      <h2 id="logs-feed-heading" className="sr-only">Chronological archive</h2>

      <div className="border-y border-[var(--line-subtle)] py-4">
        <fieldset>
          <legend className="type-protocol-label mb-3 text-[var(--text-muted)]">Content type</legend>
          <div className="flex flex-wrap gap-2">
            {contentFilters.map((filter) => {
              const selected = contentType === filter.value;
              return <FilterButton key={filter.label} selected={selected} onClick={() => setContentType(selected && filter.value ? null : filter.value)}>{filter.label}</FilterButton>;
            })}
          </div>
        </fieldset>

        <details className="group mt-3 border-t border-white/[0.07] pt-2">
          <summary className="focusable-surface flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--text-secondary)] marker:hidden hover:text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-2"><Filter aria-hidden="true" className="h-4 w-4" /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</span>
            <span aria-hidden="true" className="type-metadata group-open:hidden">Open</span><span aria-hidden="true" className="type-metadata hidden group-open:inline">Close</span>
          </summary>
          <div className="grid gap-6 pb-3 pt-4 sm:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
            <fieldset>
              <legend className="type-protocol-label mb-3 text-[var(--text-muted)]">Log type</legend>
              <div className="flex flex-wrap gap-2">
                {logTypes.map(([value, label]) => <FilterButton key={value} selected={logType === value} onClick={() => setLogType(logType === value ? null : value)}>{label}</FilterButton>)}
              </div>
            </fieldset>
            {tags.length ? <fieldset><legend className="type-protocol-label mb-3 text-[var(--text-muted)]">Tag</legend><div className="flex flex-wrap gap-2">{tags.map((tag) => <FilterButton key={tag.id} selected={tagId === tag.id} onClick={() => setTagId(tagId === tag.id ? null : tag.id)}>{tag.name}</FilterButton>)}</div></fieldset> : null}
          </div>
        </details>

        <div className="mt-2 flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
          <p className="type-metadata" aria-live="polite">{filteredItems.length} {filteredItems.length === 1 ? 'entry' : 'entries'}</p>
          {activeFilterCount ? <button type="button" onClick={resetFilters} className="focusable-surface inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Reset filters</button> : null}
        </div>
      </div>

      {filteredItems.length ? (
        <ol className="border-b border-[var(--line-subtle)]">
          {filteredItems.map((item, index) => <li key={item.id}><FeedEntry item={item} index={index} onOpenReading={openReading} /></li>)}
        </ol>
      ) : (
        <div className="border-b border-[var(--line-subtle)] py-12">
          <p className="type-protocol-label text-[var(--text-muted)]">No matching entries</p>
          <p className="type-small mt-3">The selected dimensions do not overlap.</p>
          <button type="button" onClick={resetFilters} className="focusable-surface mt-5 inline-flex min-h-11 items-center border-b border-[var(--accent)] px-1 text-sm font-semibold text-[var(--text-primary)]">Reset filters</button>
        </div>
      )}

      {readingLog ? <ReadingDialog log={readingLog} onClose={closeReading} /> : null}
    </section>
  );
}

function FeedEntry({ item, index, onOpenReading }: { item: LogsFeedItem; index: number; onOpenReading: (log: LogFeedItem, opener: HTMLButtonElement) => void }) {
  const offset = index % 4 === 2 ? 'sm:pl-[8%]' : index % 4 === 3 ? 'sm:pr-[5%]' : '';
  return (
    <article className={`grid gap-4 border-t border-[var(--line-subtle)] py-7 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-8 sm:py-10 ${offset}`} aria-label={`${contentLabel(item.kind)} entry`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:block">
        <p className="type-protocol-label text-[var(--text-muted)]">{item.kind === 'log' ? logTypeLabels[item.logType] : contentLabel(item.kind)}</p>
        <time className="type-numeric sm:mt-2 sm:block" dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
      </div>
      {item.kind === 'log' ? <LogEntry item={item} onOpenReading={onOpenReading} /> : null}
      {item.kind === 'link' ? <LinkEntry item={item} /> : null}
      {item.kind === 'playlist' ? <PlaylistEntry item={item} /> : null}
      {item.kind === 'quote' ? <QuoteEntry item={item} /> : null}
    </article>
  );
}

function LogEntry({ item, onOpenReading }: { item: LogFeedItem; onOpenReading: (log: LogFeedItem, opener: HTMLButtonElement) => void }) {
  const bodyPreview = item.body ? excerpt(item.body, 360) : undefined;
  const bulletPreview = item.bullets.slice(0, 3);
  return <div className="min-w-0 max-w-[var(--reading-measure)]">
    {item.title ? <h3 className="break-words text-2xl font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)] sm:text-3xl">{item.title}</h3> : null}
    {bodyPreview ? <p className={`${item.title ? 'mt-4' : ''} whitespace-pre-line text-[1.05rem] leading-8 text-[var(--text-secondary)]`}>{bodyPreview}</p> : null}
    {bulletPreview.length ? <ul className={`${item.body || item.title ? 'mt-4' : ''} list-disc space-y-2 pl-5 text-[var(--text-secondary)]`}>{bulletPreview.map((bullet, index) => <li key={`${index}-${bullet}`}>{bullet}</li>)}</ul> : null}
    {item.bullets.length > bulletPreview.length ? <p className="type-metadata mt-3">+{item.bullets.length - bulletPreview.length} more</p> : null}
    <EntryFooter tags={item.tags}><button type="button" onClick={(event) => onOpenReading(item, event.currentTarget)} className="focusable-surface inline-flex min-h-11 items-center border-b border-[var(--accent)] px-1 text-sm font-semibold text-[var(--text-primary)]">Read log</button></EntryFooter>
  </div>;
}

function LinkEntry({ item }: { item: LinkFeedItem }) {
  return <div className={`grid min-w-0 gap-5 ${item.thumbnailUrl ? 'sm:grid-cols-[minmax(0,1fr)_10rem]' : ''}`}>
    <div className="min-w-0">
      {item.title ? <h3 className="break-words text-xl font-semibold leading-snug text-[var(--text-primary)] sm:text-2xl">{item.title}</h3> : <h3 className="text-lg font-semibold text-[var(--text-primary)]">Saved link</h3>}
      {item.note ? <p className="type-reading mt-3 whitespace-pre-line">{item.note}</p> : null}
      {item.domain ? <p className="type-metadata mt-3 break-all">{item.domain}</p> : null}
      <EntryFooter tags={item.tags}>{item.url ? <ExternalAction href={item.url}>Open {item.platform}</ExternalAction> : <span className="type-small">Destination unavailable.</span>}</EntryFooter>
    </div>
    {item.thumbnailUrl ? <div className="order-first w-full max-w-[12rem] overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)] sm:order-last sm:max-w-none" style={{ aspectRatio: item.thumbnailAspectRatio || 1.5 }}>
      {/* Sanity thumbnails have content-defined remote hosts and aspect ratios; native lazy loading avoids an eager CSS background request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div> : null}
  </div>;
}

function PlaylistEntry({ item }: { item: PlaylistFeedItem }) {
  return <div className="min-w-0 max-w-2xl">
    <h3 className="break-words text-2xl font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)] sm:text-3xl">{item.title}</h3>
    {item.shortNote ? <p className="type-reading mt-3 whitespace-pre-line">{item.shortNote}</p> : null}
    <PlaylistPreview className="mt-4 max-w-xl" title={item.title} spotifyUrl={item.spotifyUrl} spotifyEmbedUrl={item.spotifyEmbedUrl} appleMusicUrl={item.appleMusicUrl} youtubeMusicUrl={item.youtubeMusicUrl} />
    <EntryFooter tags={item.tags}><div className="flex flex-wrap gap-x-5">{item.spotifyUrl ? <ExternalAction href={item.spotifyUrl}>Spotify</ExternalAction> : null}{item.appleMusicUrl ? <ExternalAction href={item.appleMusicUrl}>Apple Music</ExternalAction> : null}{item.youtubeMusicUrl ? <ExternalAction href={item.youtubeMusicUrl}>{youtubePlaylistProviderLabel(item.youtubeMusicUrl)}</ExternalAction> : null}</div></EntryFooter>
  </div>;
}

function QuoteEntry({ item }: { item: QuoteFeedItem }) {
  return <div className="min-w-0 max-w-[var(--reading-measure)]">
    <blockquote>
      <p className="break-words text-[clamp(1.35rem,5vw,2.15rem)] leading-[1.35] tracking-[-0.025em] text-[var(--text-primary)]">{item.quoteText}</p>
      <footer className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">&mdash; {item.person}{item.sourceTitle ? `, ${item.sourceTitle}` : ''}</footer>
    </blockquote>
    <EntryFooter tags={item.tags}><div className="flex flex-wrap gap-x-5">{item.sourceUrl ? <ExternalAction href={item.sourceUrl}>Open source</ExternalAction> : null}{item.foundVia ? <ExternalAction href={item.foundVia.url}>Found via {item.foundVia.title}</ExternalAction> : null}</div></EntryFooter>
  </div>;
}

function EntryFooter({ tags, children }: { tags: LogsTag[]; children?: ReactNode }) {
  return <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">{children}{tags.length ? <ul aria-label="Tags" className="flex flex-wrap gap-2">{tags.map((tag) => <li key={tag.id} className="type-metadata border border-white/10 px-2 py-1 text-[var(--text-secondary)]">{tag.name}</li>)}</ul> : null}</div>;
}

function ReadingDialog({ log, onClose }: { log: LogFeedItem; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.public-app-shell');
    const scrollY = window.scrollY;
    const previousAriaHidden = shell ? shell.getAttribute('aria-hidden') : null;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    if (shell) {
      shell.inert = true;
      shell.setAttribute('aria-hidden', 'true');
    }
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (shell) {
        shell.inert = false;
        if (previousAriaHidden === null) shell.removeAttribute('aria-hidden');
        else shell.setAttribute('aria-hidden', previousAriaHidden);
      }
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[200] isolate overflow-hidden bg-[#030509] px-4 text-[var(--text-primary)]" role="presentation">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="log-reading-title" aria-describedby={log.body ? 'log-reading-body' : undefined} className="mx-auto flex h-[100dvh] min-h-0 w-full max-w-3xl flex-col overflow-hidden bg-[#05070b]">
        <header className="relative z-10 flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--line-subtle)] bg-[#05070b] pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <p className="type-protocol-label">{logTypeLabels[log.logType]}</p>
          <button ref={closeRef} type="button" onClick={onClose} className="focusable-surface inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><span>Close</span><X aria-hidden="true" className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(2rem,env(safe-area-inset-bottom))]">
          <article className="mx-auto max-w-[var(--reading-measure)] py-10 sm:py-16">
            <time className="type-numeric" dateTime={log.publishedAt}>{formatDate(log.publishedAt)}</time>
            <h2 id="log-reading-title" className="mt-4 break-words text-[clamp(2rem,8vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.045em]">{log.title || logTypeLabels[log.logType]}</h2>
            {log.body ? <div id="log-reading-body" className="mt-8 space-y-5 text-[1.0625rem] leading-8 text-[var(--text-secondary)]">{paragraphs(log.body).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`} className="whitespace-pre-line">{paragraph}</p>)}</div> : null}
            {log.bullets.length ? <ul className={`${log.body ? 'mt-8' : 'mt-6'} list-disc space-y-3 pl-5 text-[1.0625rem] leading-8 text-[var(--text-secondary)]`}>{log.bullets.map((bullet, index) => <li key={`${index}-${bullet}`}>{bullet}</li>)}</ul> : null}
            {log.tags.length ? <ul aria-label="Tags" className="mt-9 flex flex-wrap gap-2">{log.tags.map((tag) => <li key={tag.id} className="type-metadata border border-white/10 px-2 py-1 text-[var(--text-secondary)]">{tag.name}</li>)}</ul> : null}
            {log.related.length ? <aside className="mt-12 border-t border-[var(--line-subtle)] pt-6" aria-labelledby="log-related-title"><h3 id="log-related-title" className="type-protocol-label text-[var(--text-muted)]">Related</h3><ul className="mt-3">{log.related.map((item) => <li key={`${item.kind}-${item.id}`}><Link href={item.href} className="row-link focusable-surface flex min-h-11 items-center justify-between gap-4 border-b border-white/[0.08] py-2 text-sm text-[var(--text-secondary)]"><span>{item.title}</span><span className="type-metadata">{item.kind}</span></Link></li>)}</ul></aside> : null}
          </article>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FilterButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`focusable-surface inline-flex min-h-11 items-center border px-3 text-sm font-semibold ${selected ? 'border-[var(--accent)] bg-[var(--surface-active)] text-[var(--text-primary)]' : 'border-white/10 text-[var(--text-secondary)] hover:border-white/25 hover:text-[var(--text-primary)]'}`}>{children}</button>;
}

function ExternalAction({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="external-link focusable-surface" aria-label={`${String(children)} (opens in a new tab)`}>{children}<ExternalLink aria-hidden="true" className="h-4 w-4" /></a>;
}

function collectTags(items: LogsFeedItem[]) {
  const tags = new Map<string, LogsTag>();
  items.forEach((item) => item.tags.forEach((tag) => tags.set(tag.id, tag)));
  return Array.from(tags.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function contentLabel(kind: LogsFeedItem['kind']) {
  return ({ log: 'Log', link: 'Link', playlist: 'Playlist', quote: 'Quote' } as const)[kind];
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function excerpt(value: string, limit: number) {
  if (value.length <= limit) return value;
  const slice = value.slice(0, limit);
  const boundary = slice.lastIndexOf(' ');
  return `${slice.slice(0, boundary > limit * 0.7 ? boundary : limit).trim()}…`;
}

function paragraphs(value: string) {
  return value.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}
