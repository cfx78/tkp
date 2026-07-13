import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ListMusic } from 'lucide-react';
import type { SanityImageSource } from '@sanity/image-url';
import { ReleaseDetailPlayer } from '@/src/components/release-detail-player';
import { ProtocolLabel } from '@/src/components/presentation-primitives';
import { buildReleaseQueue, type ReleaseBeatCandidate } from '@/src/lib/release-queue';
import { fetchSanity } from '@/src/sanity/lib/content';
import { urlFor } from '@/src/sanity/lib/image';
import { releaseDetailQuery } from '@/src/sanity/lib/queries';

type Props = { params: Promise<{ slug: string }> };
type ReleaseDetail = {
  _id: string;
  title: string;
  slug: string;
  coverArt?: SanityImageSource;
  releaseType?: string;
  shortDescription?: string;
  publishedAt?: string;
  lane?: { _id: string; name?: string; slug?: string; primaryColor?: string; secondaryColor?: string };
  tags: Array<{ _id: string; name: string; slug?: string; group?: string }>;
  beats: Array<ReleaseBeatCandidate | null>;
};

async function getRelease(slug: string) {
  if (!isValidSlug(slug)) return null;
  return fetchSanity<ReleaseDetail | null>(releaseDetailQuery, null, { slug });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const release = await getRelease(slug);
  if (!release) return { title: 'Release Not Found | The Kitsune Protocol' };
  const artwork = getArtworkUrl(release.coverArt);
  const description = release.shortDescription || `${release.title}, a Release from The Kitsune Protocol.`;
  return {
    title: `${release.title} | The Kitsune Protocol`,
    description,
    openGraph: { title: release.title, description, images: artwork ? [{ url: artwork }] : undefined }
  };
}

export default async function ReleasePage({ params }: Props) {
  const { slug } = await params;
  const release = await getRelease(slug);
  if (!release) notFound();

  const artwork = getArtworkUrl(release.coverArt);
  const beats = buildReleaseQueue(release.beats);

  return <main className="mx-auto w-full max-w-6xl pb-8">
    <Link href="/player" className="focusable-surface inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
      <ArrowLeft className="h-4 w-4" /> Back to Player
    </Link>

    <header className="mt-7 max-w-3xl">
      <ProtocolLabel>{release.releaseType || 'Release'}</ProtocolLabel>
      <h1 className="mt-4 break-words text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl lg:text-6xl">{release.title}</h1>
    </header>

    <section className="mt-9 grid gap-10 md:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] md:items-start md:gap-14 lg:gap-20">
      <div className="relative mx-auto w-full max-w-[32rem] md:mx-0">
        <div aria-hidden="true" className="absolute inset-[13%] -z-10 bg-[var(--artwork-halo)] blur-3xl" />
        <div className="aspect-square overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)] shadow-[var(--artwork-bloom)]">
          {artwork ? <img src={artwork} alt={`${release.title} cover artwork`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center" role="img" aria-label={`${release.title} artwork unavailable`}><ListMusic className="h-16 w-16 text-white/15" /></div>}
        </div>
      </div>

      <div className="min-w-0 md:pt-2">
        <ReleaseDetailPlayer releaseTitle={release.title} beats={beats} description={release.shortDescription} />

        <dl className="type-metadata mt-[var(--section-rhythm)] grid gap-y-3 border-y border-[var(--line-subtle)] py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-5">
          <dt className="text-[var(--text-muted)]">Playable tracks</dt><dd>{beats.length}</dd>
          {release.lane?.name ? <><dt className="text-[var(--text-muted)]">Lane</dt><dd>{release.lane.slug ? <Link href={`/lanes/${release.lane.slug}`} className="focusable-surface hover:text-[var(--text-primary)]">{release.lane.name}</Link> : release.lane.name}</dd></> : null}
          {release.releaseType ? <><dt className="text-[var(--text-muted)]">Type</dt><dd>{release.releaseType}</dd></> : null}
          {release.publishedAt ? <><dt className="text-[var(--text-muted)]">Published</dt><dd>{formatDate(release.publishedAt)}</dd></> : null}
          {release.tags.length ? <><dt className="text-[var(--text-muted)]">Tags</dt><dd>{release.tags.map((tag) => tag.name).join(' / ')}</dd></> : null}
        </dl>
      </div>
    </section>
  </main>;
}

function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= 200 && /^[a-z0-9][a-z0-9._~-]*$/i.test(slug);
}

function getArtworkUrl(source?: SanityImageSource) {
  return source ? urlFor(source).width(1200).height(1200).fit('crop').auto('format').url() : undefined;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}
