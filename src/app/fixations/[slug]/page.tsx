import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ExternalLink, ImageIcon } from 'lucide-react';
import type { SanityImageSource } from '@sanity/image-url';
import { ProtocolLabel, SectionHeading } from '@/src/components/presentation-primitives';
import { fetchSanity } from '@/src/sanity/lib/content';
import { urlFor } from '@/src/sanity/lib/image';
import { fixationDetailQuery } from '@/src/sanity/lib/queries';

type Props = { params: Promise<{ slug: string }> };
type Tag = { _id: string; name: string; slug?: string; group?: string };
type TrailBase = { _id: string; kind: 'log' | 'link' | 'playlist' | 'quote'; publishedAt: string };
type TrailLog = TrailBase & { kind: 'log'; title?: string; body?: string; bullets?: string[]; logType?: string };
type TrailLink = TrailBase & { kind: 'link'; title?: string; url?: string; note?: string; platformAuto?: string; platformOverride?: string; thumbnail?: SanityImageSource; thumbnailAspectRatio?: number };
type TrailPlaylist = TrailBase & { kind: 'playlist'; title?: string; shortNote?: string; spotifyUrl?: string; appleMusicUrl?: string; youtubeMusicUrl?: string };
type TrailQuote = TrailBase & { kind: 'quote'; quoteText?: string; person?: string; sourceTitle?: string; sourceUrl?: string };
type TrailItem = TrailLog | TrailLink | TrailPlaylist | TrailQuote;
type RelatedBeat = { _id: string; title: string; slug: string; status?: string; publishedAt?: string; coverArt?: SanityImageSource; lane?: { name?: string; fallbackCoverArt?: SanityImageSource } };
type RelatedRelease = { _id: string; title: string; slug: string; releaseType?: string; publishedAt?: string; coverArt?: SanityImageSource };
type FixationDetail = {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  whyThisMatters?: string;
  status?: 'active' | 'sleeping' | 'archived';
  isCore?: boolean;
  coverImage?: SanityImageSource;
  coverAspectRatio?: number;
  tags: Tag[];
  pinnedLogs: Array<TrailLog | null>;
  pinnedLinks: Array<TrailLink | null>;
  pinnedPlaylists: Array<TrailPlaylist | null>;
  pinnedQuotes: Array<TrailQuote | null>;
  relatedBeats: Array<RelatedBeat | null>;
  relatedReleases: Array<RelatedRelease | null>;
  recentLogs: Array<TrailLog | null>;
  recentLinks: Array<TrailLink | null>;
  recentPlaylists: Array<TrailPlaylist | null>;
  recentQuotes: Array<TrailQuote | null>;
  recentBeats: Array<RelatedBeat | null>;
  recentReleases: Array<RelatedRelease | null>;
  hasRabbitHoleItems?: boolean;
};

async function getFixation(slug: string) {
  if (!isValidSlug(slug)) return null;
  return fetchSanity<FixationDetail | null>(fixationDetailQuery, null, { slug });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fixation = await getFixation(slug);
  if (!fixation) return { title: 'Fixation Not Found | The Kitsune Protocol' };
  const artwork = imageUrl(fixation.coverImage, 1200);
  const description = fixation.shortDescription || fixation.whyThisMatters || `${fixation.title}, a Fixation from The Kitsune Protocol.`;
  return {
    title: `${fixation.title} | The Kitsune Protocol`,
    description,
    openGraph: { title: fixation.title, description, images: artwork ? [{ url: artwork }] : undefined }
  };
}

export default async function FixationPage({ params }: Props) {
  const { slug } = await params;
  const fixation = await getFixation(slug);
  if (!fixation) notFound();

  const heroArtwork = imageUrl(fixation.coverImage, 1400);
  const heroRatio = validAspectRatio(fixation.coverAspectRatio);
  const pinned = [...fixation.pinnedLogs, ...fixation.pinnedLinks, ...fixation.pinnedPlaylists, ...fixation.pinnedQuotes].filter(isTrailItem);
  const pinnedIds = new Set(pinned.map((item) => item._id));
  const recent = [...fixation.recentLogs, ...fixation.recentLinks, ...fixation.recentPlaylists, ...fixation.recentQuotes]
    .filter(isTrailItem)
    .filter((item) => !pinnedIds.has(item._id))
    .sort(compareDates)
    .slice(0, 10);
  const beats = appendUnique(fixation.relatedBeats.filter(isRelatedBeat), fixation.recentBeats.filter(isRelatedBeat));
  const releases = appendUnique(fixation.relatedReleases.filter(isRelatedRelease), fixation.recentReleases.filter(isRelatedRelease));
  const hasRelated = pinned.length > 0 || recent.length > 0 || beats.length > 0 || releases.length > 0;

  return <main className="mx-auto w-full max-w-6xl overflow-x-clip pb-8">
    <Link href="/fixations" className="focusable-surface inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
      <ArrowLeft className="h-4 w-4" /> Back to Fixations
    </Link>

    <header className="relative mt-5 isolate overflow-hidden border-y border-[var(--line-subtle)] bg-[#070a11] sm:min-h-[34rem]">
      {heroArtwork ? <div aria-hidden="true" className="absolute -right-[14%] -top-[16%] hidden h-[118%] w-[72%] opacity-[0.16] sm:block">
        {/* Decorative echo of the authored Fixation artwork. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroArtwork} alt="" className="h-full w-full scale-110 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#070a11]/35 to-[#070a11]" />
      </div> : null}
      <div className="relative grid gap-8 px-0 py-7 sm:grid-cols-[minmax(0,.9fr)_minmax(18rem,1.1fr)] sm:items-end sm:gap-10 sm:px-8 sm:py-10 lg:px-12">
        <div className="relative z-10 order-2 min-w-0 px-1 pb-2 sm:order-1 sm:px-0 sm:pb-4">
          <ProtocolLabel>{fixation.isCore ? 'Core Fixation' : statusLabel(fixation.status)}</ProtocolLabel>
          <h1 className="mt-4 max-w-[8ch] break-words text-[clamp(2.75rem,13vw,7rem)] font-semibold leading-[0.88] tracking-[-0.06em] text-[var(--text-primary)] sm:max-w-3xl">{fixation.title}</h1>
          {fixation.shortDescription ? <p className="mt-6 max-w-xl text-[1.05rem] leading-8 text-[var(--text-secondary)] sm:text-lg">{fixation.shortDescription}</p> : null}
          {fixation.hasRabbitHoleItems ? <Link href={`/fixations/${fixation.slug}/rabbit-hole`} className="focusable-surface mt-7 inline-flex min-h-11 items-center border-b border-[var(--accent)] px-1 text-sm font-semibold text-[var(--text-primary)]">Enter Rabbit Hole <ArrowUpRight className="ml-2 h-4 w-4" /></Link> : null}
        </div>
        <div className="relative order-1 mx-auto w-full max-w-[42rem] sm:order-2 sm:mx-0">
          <div aria-hidden="true" className="absolute inset-[12%] -z-10 bg-[var(--artwork-halo)] opacity-50 blur-3xl" />
          <div className="grid w-full place-items-center overflow-hidden bg-[var(--bg-2)] shadow-[var(--artwork-bloom)]" style={{ aspectRatio: heroRatio }}>
            {heroArtwork ? <>
              {/* The source ratio and Sanity crop/hotspot are retained by the image builder. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroArtwork} alt={`${fixation.title} Fixation artwork`} className="h-full w-full object-cover" />
            </> : <div className="grid h-full min-h-56 w-full place-items-center" role="img" aria-label={`${fixation.title} artwork unavailable`}><ImageIcon className="h-14 w-14 text-white/15" /></div>}
          </div>
        </div>
      </div>
    </header>

    {(fixation.whyThisMatters || fixation.shortDescription) ? <section className="mt-[var(--section-rhythm)] grid gap-7 md:grid-cols-[11rem_minmax(0,var(--reading-measure))] md:gap-12">
      <div><ProtocolLabel className="text-[var(--text-muted)]">Personal context</ProtocolLabel><p className="type-numeric mt-3">Why this stays</p></div>
      <div>{fixation.whyThisMatters ? <p className="whitespace-pre-line text-[clamp(1.25rem,4vw,1.7rem)] leading-[1.55] tracking-[-0.015em] text-[var(--text-primary)]">{fixation.whyThisMatters}</p> : <p className="type-reading">{fixation.shortDescription}</p>}</div>
    </section> : null}

    {pinned.length ? <section className="mt-[var(--section-rhythm)]">
      <SectionHeading label="Selected trail" title="Kept close" description="Directly arranged references from this Fixation." />
      <ol className="mt-6 border-t border-[var(--line-subtle)]">{pinned.map((item, index) => <li key={`${item.kind}-${item._id}`}><TrailEntry item={item} index={index} selected /></li>)}</ol>
    </section> : null}

    {recent.length ? <section className="mt-[var(--section-rhythm)]">
      <SectionHeading label="Recent connections" title="The trail around it" description="Newest related Logs and saved media, separate from the selected sequence." />
      <ol className="mt-6 border-t border-[var(--line-subtle)]">{recent.map((item, index) => <li key={`${item.kind}-${item._id}`}><TrailEntry item={item} index={index} /></li>)}</ol>
    </section> : null}

    {(beats.length || releases.length) ? <section className="mt-[var(--section-rhythm)]">
      <SectionHeading label="Music connection" title="Sound from this thread" />
      <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,.85fr)] lg:gap-16">
        {beats.length ? <div><h3 className="type-protocol-label text-[var(--text-muted)]">Beats</h3><div className="mt-3 border-t border-[var(--line-subtle)]">{beats.map((beat) => <MusicRow key={beat._id} title={beat.title} href={`/player/beats/${beat.slug}`} label={beat.lane?.name || statusLabel(beat.status)} artwork={imageUrl(beat.coverArt || beat.lane?.fallbackCoverArt, 240)} />)}</div></div> : null}
        {releases.length ? <div><h3 className="type-protocol-label text-[var(--text-muted)]">Releases</h3><div className="mt-3 border-t border-[var(--line-subtle)]">{releases.map((release) => <MusicRow key={release._id} title={release.title} href={`/releases/${release.slug}`} label={release.releaseType || 'Release'} artwork={imageUrl(release.coverArt, 240)} />)}</div></div> : null}
      </div>
    </section> : null}

    {!hasRelated ? <p className="type-small mt-[var(--section-rhythm)] border-y border-[var(--line-subtle)] py-6">The related trail is quiet for now.</p> : null}

    <footer className="mt-[var(--section-rhythm)] border-y border-[var(--line-subtle)] py-5">
      <dl className="type-metadata grid gap-y-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-5">
        <dt className="text-[var(--text-muted)]">State</dt><dd>{fixation.isCore ? `Core / ${statusLabel(fixation.status)}` : statusLabel(fixation.status)}</dd>
        {fixation.tags.length ? <><dt className="text-[var(--text-muted)]">Tags</dt><dd>{fixation.tags.map((tag) => tag.name).join(' / ')}</dd></> : null}
      </dl>
    </footer>
  </main>;
}

function TrailEntry({ item, index, selected = false }: { item: TrailItem; index: number; selected?: boolean }) {
  const image = item.kind === 'link' ? imageUrl(item.thumbnail, 720) : undefined;
  const destination = trailDestination(item);
  const title = trailTitle(item);
  const note = trailNote(item);
  return <article className={`grid min-w-0 gap-5 border-b border-[var(--line-subtle)] py-7 sm:py-9 ${image ? 'sm:grid-cols-[minmax(0,1fr)_minmax(10rem,.42fr)] sm:items-center' : index % 3 === 1 ? 'sm:pl-[9%]' : ''}`}>
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-3"><ProtocolLabel className="text-[var(--text-muted)]">{selected ? 'Selected ' : ''}{trailLabel(item)}</ProtocolLabel><time className="type-numeric" dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time></div>
      {item.kind === 'quote' ? <blockquote className="mt-4 max-w-[var(--reading-measure)]"><p className="break-words text-[clamp(1.3rem,4.5vw,2rem)] leading-[1.4] text-[var(--text-primary)]">{item.quoteText}</p><footer className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">&mdash; {item.person}{item.sourceTitle ? `, ${item.sourceTitle}` : ''}</footer></blockquote> : <><h3 className="mt-3 break-words text-xl font-semibold leading-snug text-[var(--text-primary)] sm:text-2xl">{destination ? destination.external ? <a href={destination.href} target="_blank" rel="noreferrer noopener" className="focusable-surface hover:text-[var(--accent)]">{title}</a> : <Link href={destination.href} className="focusable-surface hover:text-[var(--accent)]">{title}</Link> : title}</h3>{note ? <p className="type-reading mt-3 whitespace-pre-line">{note}</p> : null}</>}
      <TrailActions item={item} />
    </div>
    {image ? <div className="order-first max-w-sm overflow-hidden bg-[var(--bg-2)] sm:order-last sm:max-w-none" style={{ aspectRatio: validAspectRatio(item.kind === 'link' ? item.thumbnailAspectRatio : undefined) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div> : null}
  </article>;
}

function TrailActions({ item }: { item: TrailItem }) {
  if (item.kind === 'log') return <Link href="/logs" className="focusable-surface mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)]">Open Logs <ArrowUpRight className="ml-2 h-4 w-4" /></Link>;
  if (item.kind === 'link') return safeExternalUrl(item.url) ? <ExternalAction href={safeExternalUrl(item.url) as string} label={`Open ${item.platformOverride || item.platformAuto || 'link'}`} /> : null;
  if (item.kind === 'quote') return safeExternalUrl(item.sourceUrl) ? <ExternalAction href={safeExternalUrl(item.sourceUrl) as string} label="Open source" /> : null;
  const actions = [{ label: 'Spotify', href: safeExternalUrl(item.spotifyUrl) }, { label: 'Apple Music', href: safeExternalUrl(item.appleMusicUrl) }, { label: 'YouTube Music', href: safeExternalUrl(item.youtubeMusicUrl) }].filter((action): action is { label: string; href: string } => Boolean(action.href));
  return actions.length ? <div className="mt-4 flex flex-wrap gap-x-5">{actions.map((action) => <ExternalAction key={action.label} href={action.href} label={action.label} />)}</div> : null;
}

function ExternalAction({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer noopener" className="focusable-surface inline-flex min-h-11 items-center text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)]" aria-label={`${label} in a new tab`}>{label}<ExternalLink className="ml-2 h-4 w-4" /></a>;
}

function MusicRow({ title, href, label, artwork }: { title: string; href: string; label: string; artwork?: string }) {
  return <article className="grid min-h-20 grid-cols-[minmax(0,1fr)_4rem] items-center gap-4 border-b border-[var(--line-subtle)] py-4">
    <div className="min-w-0"><ProtocolLabel className="text-[var(--text-muted)]">{label}</ProtocolLabel><h3 className="mt-2 break-words font-semibold text-[var(--text-primary)]"><Link href={href} className="focusable-surface hover:text-[var(--accent)]">{title}</Link></h3></div>
    <div className="aspect-square overflow-hidden bg-[var(--bg-2)]">{artwork ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artwork} alt="" loading="lazy" className="h-full w-full object-cover" />
    </> : null}</div>
  </article>;
}

function trailDestination(item: TrailItem): { href: string; external?: boolean } | undefined {
  if (item.kind === 'log') return { href: '/logs' };
  if (item.kind === 'link') return safeExternalUrl(item.url) ? { href: safeExternalUrl(item.url) as string, external: true } : undefined;
  if (item.kind === 'quote') return safeExternalUrl(item.sourceUrl) ? { href: safeExternalUrl(item.sourceUrl) as string, external: true } : undefined;
  const href = safeExternalUrl(item.spotifyUrl) || safeExternalUrl(item.appleMusicUrl) || safeExternalUrl(item.youtubeMusicUrl);
  return href ? { href, external: true } : undefined;
}

function trailTitle(item: TrailItem) {
  if (item.kind === 'quote') return item.quoteText || 'Quote';
  if (item.kind === 'log') return item.title || item.body?.slice(0, 100) || item.bullets?.[0] || 'Untitled Log';
  if (item.kind === 'link') return item.title || 'Saved link';
  return item.title || 'Playlist';
}

function trailNote(item: TrailItem) {
  if (item.kind === 'log') return item.title ? item.body : undefined;
  if (item.kind === 'link') return item.note;
  if (item.kind === 'playlist') return item.shortNote;
  return undefined;
}

function trailLabel(item: TrailItem) {
  if (item.kind === 'log') return item.logType ? item.logType.replace(/([A-Z])/g, ' $1') : 'Log';
  if (item.kind === 'link') return item.platformOverride || item.platformAuto || 'Link';
  return item.kind;
}

function appendUnique<T extends { _id: string }>(first: T[], second: T[]) {
  const seen = new Set(first.map((item) => item._id));
  return [...first, ...second.filter((item) => !seen.has(item._id))];
}

function isTrailItem(item: TrailItem | null): item is TrailItem {
  return Boolean(item?._id && item.kind && item.publishedAt);
}

function isRelatedBeat(item: RelatedBeat | null): item is RelatedBeat {
  return Boolean(item?._id && item.title && item.slug);
}

function isRelatedRelease(item: RelatedRelease | null): item is RelatedRelease {
  return Boolean(item?._id && item.title && item.slug);
}

function compareDates(a: TrailItem, b: TrailItem) {
  const difference = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  return Number.isNaN(difference) || difference === 0 ? a._id.localeCompare(b._id) : difference;
}

function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= 200 && /^[a-z0-9][a-z0-9._~-]*$/i.test(slug);
}

function imageUrl(source?: SanityImageSource, width = 1200) {
  return source ? urlFor(source).width(width).fit('max').auto('format').url() : undefined;
}

function validAspectRatio(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0.5 && value <= 2.5 ? String(value) : '16 / 9';
}

function safeExternalUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function statusLabel(value?: string) {
  return ({ active: 'Active', sleeping: 'Sleeping', archived: 'Archived', main: 'Main Beat', approvedDemo: 'Approved Demo', sketch: 'Sketch', roughMix: 'Rough Mix', alternateMix: 'Alternate Mix' } as Record<string, string>)[value || ''] || 'Fixation';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}
