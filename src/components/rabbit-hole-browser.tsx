'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ExternalLink, ImageIcon, Play, Plus } from 'lucide-react';
import { SpotifyPlaylistEmbed } from './spotify-playlist-embed';
import type { RabbitHoleCategory, RabbitHoleItem } from '@/src/lib/rabbit-hole';
import { useSensitiveAction, WarningExternalLink } from './content-warning-action';
import { urlFor } from '@/src/sanity/lib/image';

const INITIAL_FEED_COUNT = 8;
const FEED_INCREMENT = 8;

export type RabbitHoleBrowserItem = RabbitHoleItem;

type RabbitHoleBrowserProps = {
  categories: RabbitHoleCategory[];
  pinnedItems: RabbitHoleBrowserItem[];
  feedItems: RabbitHoleBrowserItem[];
};

export function RabbitHoleBrowser({ categories, pinnedItems, feedItems }: RabbitHoleBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(INITIAL_FEED_COUNT);
  const [openPreviews, setOpenPreviews] = useState<Set<string>>(() => new Set());
  const matchesCategory = (item: RabbitHoleBrowserItem) => selectedCategory === 'all' || item.category.value === selectedCategory;
  const filteredPinned = pinnedItems.filter(matchesCategory);
  const filteredFeed = feedItems.filter(matchesCategory);
  const visibleFeed = filteredFeed.slice(0, visibleCount);
  const remaining = Math.max(0, filteredFeed.length - visibleFeed.length);

  const selectCategory = (value: string) => {
    setSelectedCategory(value);
    setVisibleCount(INITIAL_FEED_COUNT);
    setOpenPreviews(new Set());
  };
  const togglePreview = (id: string) => {
    setOpenPreviews((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return <>
    <fieldset className="mt-10 min-w-0 border-y border-[var(--line-subtle)] py-5">
      <legend className="type-protocol-label px-2 text-[var(--text-muted)]">Browse categories</legend>
      <div className="flex max-w-full flex-wrap gap-2">
        <CategoryButton selected={selectedCategory === 'all'} onClick={() => selectCategory('all')}>All</CategoryButton>
        {categories.map((category) => <CategoryButton key={category.value} selected={selectedCategory === category.value} onClick={() => selectCategory(category.value)}>{category.label}</CategoryButton>)}
      </div>
      <p className="type-metadata mt-3" aria-live="polite">{filteredFeed.length} feed {filteredFeed.length === 1 ? 'item' : 'items'}{filteredPinned.length ? ` / ${filteredPinned.length} pinned` : ''}</p>
    </fieldset>

    {filteredPinned.length ? <section className="mt-[var(--section-rhythm)]" aria-labelledby="rabbit-hole-pinned-title">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line-subtle)] pb-4">
        <div><p className="type-protocol-label">Selected</p><h2 id="rabbit-hole-pinned-title" className="type-section-heading mt-2">Pinned to the top</h2></div>
        <p className="type-numeric">{filteredPinned.length} {filteredPinned.length === 1 ? 'item' : 'items'}</p>
      </div>
      <ol>{filteredPinned.map((item, index) => <li key={item.id}><RabbitHoleEntry item={item} featured index={index} previewOpen={openPreviews.has(item.id)} onTogglePreview={() => togglePreview(item.id)} /></li>)}</ol>
    </section> : null}

    {visibleFeed.length ? <section className="mt-[var(--section-rhythm)]" aria-labelledby="rabbit-hole-feed-title">
      <div className="border-b border-[var(--line-subtle)] pb-4"><p className="type-protocol-label text-[var(--text-muted)]">Chronological trail</p><h2 id="rabbit-hole-feed-title" className="type-section-heading mt-2">More from the archive</h2></div>
      <ol>{visibleFeed.map((item, index) => <li key={item.id}><RabbitHoleEntry item={item} index={index} previewOpen={openPreviews.has(item.id)} onTogglePreview={() => togglePreview(item.id)} /></li>)}</ol>
      {remaining ? <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--line-subtle)] py-4">
        <p className="type-metadata" aria-live="polite">{remaining} remaining</p>
        <button type="button" onClick={() => setVisibleCount((count) => count + FEED_INCREMENT)} className="action-control focusable-surface"><Plus aria-hidden="true" className="h-4 w-4" />Load More</button>
      </div> : null}
    </section> : null}

    {!filteredPinned.length && !filteredFeed.length ? <section className="mt-[var(--section-rhythm)] border-y border-[var(--line-subtle)] py-10" aria-live="polite">
      <p className="type-protocol-label text-[var(--text-muted)]">No matching items</p>
      <p className="type-small mt-3">This category is quiet in the current archive.</p>
      <button type="button" onClick={() => selectCategory('all')} className="action-control focusable-surface mt-5">Show all categories</button>
    </section> : null}
  </>;
}

function CategoryButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`focusable-surface inline-flex min-h-11 min-w-11 items-center gap-2 border px-3 text-sm font-semibold ${selected ? 'border-[var(--accent)] bg-[var(--surface-active)] text-[var(--text-primary)] shadow-[inset_0_-2px_0_var(--accent)]' : 'border-white/10 text-[var(--text-secondary)] hover:border-white/25 hover:text-[var(--text-primary)]'}`}><span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center border border-current">{selected ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}</span>{children}</button>;
}

function RabbitHoleEntry({ item, featured, index, previewOpen, onTogglePreview }: { item: RabbitHoleBrowserItem; featured?: boolean; index: number; previewOpen: boolean; onTogglePreview: () => void }) {
  const previewId = useId();
  const identity = { id: item.id, type: 'link' as const, nsfw: item.nsfw, nsfwReason: item.nsfwReason, title: item.title };
  const { approved, run } = useSensitiveAction(identity, 'open this Rabbit Hole item');
  const previewActionRef = useRef<HTMLButtonElement>(null);
  const wasPreviewOpen = useRef(previewOpen);
  useEffect(() => {
    if (previewOpen && !wasPreviewOpen.current && !document.activeElement?.closest('[data-preview-action]')) previewActionRef.current?.focus();
    wasPreviewOpen.current = previewOpen;
  }, [previewOpen]);

  return <article className={`grid min-w-0 gap-6 border-b border-[var(--line-subtle)] py-8 sm:py-12 ${featured ? 'border-l border-l-[var(--accent)] pl-4 sm:pl-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,.8fr)] lg:items-center' : `md:grid-cols-[8rem_minmax(0,1fr)] md:gap-10 ${index % 3 === 1 ? 'md:pl-[6%]' : ''}`}`}>
    {featured ? <MediaPresentation item={item} previewId={previewId} previewOpen={previewOpen} onTogglePreview={onTogglePreview} /> : <EntryMetadata item={item} />}
    <div className="min-w-0">
      {featured ? <EntryMetadata item={item} /> : null}
      {item.title ? <h3 className={`${featured ? 'mt-3 text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} break-words font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)]`}>{item.title}</h3> : <p className="type-section-heading break-words">{domain(item.url)}</p>}
      {approved && item.note ? <p className="type-reading mt-4 whitespace-pre-line">{item.note}</p> : null}
      {!featured ? <div className="mt-6"><MediaPresentation item={item} previewId={previewId} previewOpen={previewOpen} onTogglePreview={onTogglePreview} /></div> : null}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {item.trustedEmbedUrl ? <button ref={previewActionRef} type="button" data-preview-action aria-controls={previewId} aria-expanded={previewOpen} onClick={() => previewOpen ? onTogglePreview() : void run(onTogglePreview)} className="action-control focusable-surface">{previewOpen ? 'Close Preview' : `Load ${item.trustedEmbedProvider} Preview`}</button> : null}
        <WarningExternalLink identity={identity} href={item.url} className="external-link focusable-surface" ariaLabel={`Open ${item.provider} in a new tab`}>Open {item.provider}<ExternalLink aria-hidden="true" className="h-4 w-4" /></WarningExternalLink>
      </div>
    </div>
  </article>;
}

function EntryMetadata({ item }: { item: RabbitHoleBrowserItem }) {
  return <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:block">
    <p className="type-protocol-label text-[var(--text-muted)]">{item.provider}</p>
    <p className="type-metadata md:mt-2">{item.category.label}</p>
    <time className="type-numeric md:mt-2 md:block" dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
  </div>;
}

function MediaPresentation({ item, previewId, previewOpen, onTogglePreview }: { item: RabbitHoleBrowserItem; previewId: string; previewOpen: boolean; onTogglePreview: () => void }) {
  const identity = { id: item.id, type: 'link' as const, nsfw: item.nsfw, nsfwReason: item.nsfwReason, title: item.title };
  const { approved, run } = useSensitiveAction(identity, 'load this preview');
  const thumbnailUrl = approved && item.thumbnail ? urlFor(item.thumbnail).width(1200).fit('max').auto('format').url() : undefined;
  if (previewOpen && item.trustedEmbedUrl && item.trustedEmbedProvider === 'YouTube') {
    return <div id={previewId} role="region" aria-label={`${item.title || item.provider} preview`} className="w-full overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      <iframe src={item.trustedEmbedUrl} title={`${item.title || item.provider} YouTube preview`} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full border-0" />
    </div>;
  }
  if (previewOpen && item.trustedEmbedUrl && item.trustedEmbedProvider === 'Spotify') {
    return <div id={previewId} role="region" aria-label={`${item.title || item.provider} preview`} className="w-full max-w-2xl overflow-hidden"><SpotifyPlaylistEmbed title={item.title || 'Spotify playlist'} spotifyEmbedUrl={item.trustedEmbedUrl} /></div>;
  }

  const fallback = <>
    {thumbnailUrl ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnailUrl} alt={`${item.title || item.provider} preview image`} loading="lazy" className="h-full w-full object-cover" />
      {item.trustedEmbedUrl ? <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/20"><span className="grid h-14 w-14 place-items-center rounded-full bg-black/75 text-white"><Play className="h-5 w-5" fill="currentColor" /></span></span> : null}
    </> : <span className="grid min-h-48 place-items-center text-[var(--text-muted)]"><span className="text-center"><ImageIcon className="mx-auto h-10 w-10" /><span className="type-metadata mt-3 block">{item.provider}</span></span></span>}
  </>;
  const className = "focusable-surface relative grid w-full place-items-center overflow-hidden bg-[var(--bg-2)] text-left";
  const style = { aspectRatio: item.thumbnailAspectRatio || 16 / 9 };
  return item.trustedEmbedUrl
    ? <button id={previewId} type="button" aria-expanded="false" onClick={() => void run(onTogglePreview)} className={`${className} cursor-pointer`} style={style} aria-label={`Load ${item.trustedEmbedProvider} preview for ${item.title || item.provider}`}>{fallback}</button>
    : <div id={previewId} className={className} style={style}>{fallback}</div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function domain(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return 'External link'; }
}
