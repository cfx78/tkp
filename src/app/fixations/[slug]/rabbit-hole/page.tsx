import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProtocolLabel } from '@/src/components/presentation-primitives';
import { RabbitHoleBrowser, type RabbitHoleBrowserItem } from '@/src/components/rabbit-hole-browser';
import { normalizeRabbitHole, type RabbitHoleItem, type RawRabbitHoleData } from '@/src/lib/rabbit-hole';
import { fetchSanity } from '@/src/sanity/lib/content';
import { urlFor } from '@/src/sanity/lib/image';
import { rabbitHoleQuery } from '@/src/sanity/lib/queries';

type Props = { params: Promise<{ slug: string }> };

async function getRabbitHole(slug: string) {
  if (!isValidSlug(slug)) return null;
  const raw = await fetchSanity<RawRabbitHoleData>(rabbitHoleQuery, null, { slug });
  const rabbitHole = normalizeRabbitHole(raw);
  return rabbitHole && (rabbitHole.pinnedItems.length || rabbitHole.feedItems.length) ? rabbitHole : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const rabbitHole = await getRabbitHole(slug);
  if (!rabbitHole) return { title: 'Rabbit Hole Not Found | The Kitsune Protocol' };
  const description = rabbitHole.shortDescription || `A curated Rabbit Hole for ${rabbitHole.title}.`;
  const artwork = rabbitHole.coverImage ? urlFor(rabbitHole.coverImage).width(1200).fit('max').auto('format').url() : undefined;
  return {
    title: `${rabbitHole.title} Rabbit Hole | The Kitsune Protocol`,
    description,
    openGraph: { title: `${rabbitHole.title} Rabbit Hole`, description, images: artwork ? [{ url: artwork }] : undefined },
  };
}

export default async function RabbitHolePage({ params }: Props) {
  const { slug } = await params;
  const rabbitHole = await getRabbitHole(slug);
  if (!rabbitHole) notFound();

  const pinnedItems = rabbitHole.pinnedItems.map(toBrowserItem);
  const feedItems = rabbitHole.feedItems.map(toBrowserItem);
  const coverArtwork = rabbitHole.coverImage ? urlFor(rabbitHole.coverImage).width(1200).fit('max').auto('format').url() : undefined;

  return <main className="mx-auto w-full max-w-5xl overflow-x-clip pb-8">
    <header className="relative isolate min-h-64 overflow-hidden border-y border-[var(--line-subtle)] py-9 sm:min-h-80 sm:py-12">
      {coverArtwork ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverArtwork} alt="" aria-hidden="true" className="absolute inset-y-0 right-0 -z-20 h-full w-[72%] object-cover object-center opacity-25 sm:w-[58%]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--bg-0)_8%,rgba(5,7,11,.92)_38%,rgba(5,7,11,.45)_100%)]" />
      </> : null}
      <div className="relative max-w-3xl">
        <ProtocolLabel>Rabbit Hole</ProtocolLabel>
        <h1 className="mt-4 break-words text-[clamp(2.5rem,10vw,5rem)] font-semibold leading-[0.98] tracking-normal text-[var(--text-primary)]">{rabbitHole.title} Rabbit Hole</h1>
        {rabbitHole.shortDescription ? <p className="type-reading mt-6 max-w-[var(--reading-measure)]">{rabbitHole.shortDescription}</p> : null}
      </div>
    </header>
    <Link href={`/fixations/${rabbitHole.slug}`} className="editorial-link focusable-surface mt-5"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to {rabbitHole.title}</Link>
    <RabbitHoleBrowser categories={rabbitHole.categories} pinnedItems={pinnedItems} feedItems={feedItems} />
  </main>;
}

function toBrowserItem(item: RabbitHoleItem): RabbitHoleBrowserItem {
  const { thumbnail, ...safeItem } = item;
  const thumbnailUrl = thumbnail ? urlFor(thumbnail).width(1200).fit('max').auto('format').url() : undefined;
  return { ...safeItem, thumbnailUrl };
}

function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= 200 && /^[a-z0-9][a-z0-9._~-]*$/i.test(slug);
}
