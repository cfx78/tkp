import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, ListMusic } from 'lucide-react';
import type { SanityImageSource } from '@sanity/image-url';
import { LaneDetailPlayer } from '@/src/components/lane-detail-player';
import { MediaArtwork, ProtocolLabel, SectionHeading } from '@/src/components/presentation-primitives';
import { defaultLaneAccent, defaultLaneSecondary, validatedLaneColor } from '@/src/lib/lane-colors';
import { buildLaneQueue, type LaneBeatCandidate } from '@/src/lib/lane-queue';
import { youtubePlaylistProviderLabel } from '@/src/lib/youtube-playlist';
import { fetchSanity } from '@/src/sanity/lib/content';
import { urlFor } from '@/src/sanity/lib/image';
import { laneDetailQuery } from '@/src/sanity/lib/queries';

type Props = { params: Promise<{ slug: string }> };
type LaneRelease = { _id: string; title: string; slug: string; releaseType?: string; publishedAt?: string; coverArtUrl?: string };
type LanePlaylist = { _id: string; title: string; spotifyUrl?: string; appleMusicUrl?: string; youtubeMusicUrl?: string; shortNote?: string };
type LaneDetail = {
  _id: string;
  name: string;
  slug: string;
  plainDescription?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fallbackCoverArt?: SanityImageSource;
  fallbackArtworkAspectRatio?: number;
  tags: Array<{ _id: string; name: string; slug?: string; group?: string }>;
  beats: Array<LaneBeatCandidate | null>;
  releases: LaneRelease[];
  playlists: LanePlaylist[];
};

async function getLane(slug: string) {
  if (!isValidSlug(slug)) return null;
  return fetchSanity<LaneDetail | null>(laneDetailQuery, null, { slug });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lane = await getLane(slug);
  if (!lane) return { title: 'Lane Not Found | The Kitsune Protocol' };
  const artwork = getArtworkUrl(lane.fallbackCoverArt);
  const description = lane.plainDescription || `${lane.name}, a music Lane from The Kitsune Protocol.`;
  return {
    title: `${lane.name} | The Kitsune Protocol`,
    description,
    openGraph: { title: lane.name, description, images: artwork ? [{ url: artwork }] : undefined }
  };
}

export default async function LanePage({ params }: Props) {
  const { slug } = await params;
  const lane = await getLane(slug);
  if (!lane) notFound();

  const artwork = getArtworkUrl(lane.fallbackCoverArt);
  const artworkRatio = validAspectRatio(lane.fallbackArtworkAspectRatio);
  const accentColor = validatedLaneColor(lane.primaryColor, defaultLaneAccent);
  const secondaryColor = validatedLaneColor(lane.secondaryColor, defaultLaneSecondary);
  const beats = buildLaneQueue(lane.beats, lane._id);

  return <main className="mx-auto w-full max-w-6xl pb-8">
    <Link href="/player" className="focusable-surface inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
      <ArrowLeft className="h-4 w-4" /> Back to Player
    </Link>

    <header className="mt-7 max-w-3xl">
      <ProtocolLabel>Lane</ProtocolLabel>
      <h1 className="mt-4 break-words text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl lg:text-6xl">{lane.name}</h1>
      <div aria-hidden="true" className="mt-6 h-px w-full max-w-md" style={{ background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor}, transparent)` }} />
    </header>

    <section className="mt-9 grid gap-10 md:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] md:items-start md:gap-14 lg:gap-20">
      <div className="relative mx-auto w-full max-w-[34rem] md:mx-0">
        <div aria-hidden="true" className="absolute inset-[14%] -z-10 blur-3xl" style={{ backgroundColor: accentColor, opacity: 0.18 }} />
        <div className="grid max-h-[38rem] w-full place-items-center overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)] shadow-[var(--artwork-bloom)]" style={{ aspectRatio: artworkRatio }}>
          {artwork ? <img src={artwork} alt={`${lane.name} Lane artwork`} className="h-full w-full object-contain" /> : <div className="grid h-full min-h-72 w-full place-items-center" role="img" aria-label={`${lane.name} Lane artwork unavailable`}><ListMusic className="h-16 w-16 text-white/15" /></div>}
        </div>
      </div>

      <div className="min-w-0 md:pt-2">
        <LaneDetailPlayer laneName={lane.name} beats={beats} description={lane.plainDescription} accentColor={accentColor} />
      </div>
    </section>

    {lane.releases.length ? <section className="mt-[var(--section-rhythm)]">
      <SectionHeading label="Curated from this sound" title="Related Releases" />
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{lane.releases.map((release) => <article key={release._id} className="min-w-0">
        <Link href={`/releases/${release.slug}`} aria-label={`Open release ${release.title}`}><MediaArtwork src={release.coverArtUrl} size="feature" className="w-full max-w-none shadow-none" /></Link>
        <ProtocolLabel className="mt-4 text-[var(--text-muted)]">{release.releaseType || 'Release'}</ProtocolLabel>
        <h3 className="mt-2 truncate text-lg font-semibold text-[var(--text-primary)]"><Link href={`/releases/${release.slug}`} className="focusable-surface hover:text-[var(--accent)]">{release.title}</Link></h3>
        {release.publishedAt ? <p className="type-numeric mt-2">{formatDate(release.publishedAt)}</p> : null}
      </article>)}</div>
    </section> : null}

    {lane.playlists.length ? <section className="mt-[var(--section-rhythm)]">
      <SectionHeading label="Listening trail" title="Related Playlists" />
      <div className="mt-5 border-t border-[var(--line-subtle)]">{lane.playlists.map((playlist) => <article key={playlist._id} className="grid gap-4 border-b border-[var(--line-subtle)] py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0"><h3 className="font-semibold text-[var(--text-primary)]">{playlist.title}</h3>{playlist.shortNote ? <p className="type-small mt-2 max-w-2xl">{playlist.shortNote}</p> : null}</div>
        <div className="flex flex-wrap gap-x-4">{playlist.spotifyUrl ? <ExternalPlaylistLink href={playlist.spotifyUrl} label="Spotify" /> : null}{playlist.appleMusicUrl ? <ExternalPlaylistLink href={playlist.appleMusicUrl} label="Apple Music" /> : null}{playlist.youtubeMusicUrl ? <ExternalPlaylistLink href={playlist.youtubeMusicUrl} label={youtubePlaylistProviderLabel(playlist.youtubeMusicUrl)} /> : null}</div>
      </article>)}</div>
    </section> : null}

    <dl className="type-metadata mt-[var(--section-rhythm)] grid gap-y-3 border-y border-[var(--line-subtle)] py-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-5">
      <dt className="text-[var(--text-muted)]">Playable Beats</dt><dd>{beats.length}</dd>
      <dt className="text-[var(--text-muted)]">Releases</dt><dd>{lane.releases.length}</dd>
      {lane.tags.length ? <><dt className="text-[var(--text-muted)]">Tags</dt><dd>{lane.tags.map((tag) => tag.name).join(' / ')}</dd></> : null}
    </dl>
  </main>;
}

function ExternalPlaylistLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer noopener" className="focusable-surface inline-flex min-h-11 items-center text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]" aria-label={`Open ${label} playlist in a new tab`}>{label}<ExternalLink className="ml-2 h-4 w-4" /></a>;
}

function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= 200 && /^[a-z0-9][a-z0-9._~-]*$/i.test(slug);
}

function getArtworkUrl(source?: SanityImageSource) {
  return source ? urlFor(source).width(1400).auto('format').url() : undefined;
}

function validAspectRatio(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0.5 && value <= 2 ? String(value) : '1 / 1';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}
