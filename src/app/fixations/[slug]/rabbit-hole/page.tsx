/* eslint-disable @next/next/no-img-element */
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
import { SensitivePageReveal } from '@/src/components/content-warning-action';

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
  const artwork = !rabbitHole.nsfw && rabbitHole.coverImage ? urlFor(rabbitHole.coverImage).width(1200).fit('max').auto('format').url() : undefined;
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

  const identity = { id: rabbitHole.id, type: 'fixation' as const, nsfw: rabbitHole.nsfw, nsfwReason: rabbitHole.nsfwReason, title: rabbitHole.title };
  return <SensitivePageReveal identity={identity}><main className="mx-auto w-full max-w-5xl overflow-x-clip pb-8">
    <Link href={`/fixations/${rabbitHole.slug}`} className="editorial-link focusable-surface"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to {rabbitHole.title}</Link>
    <header className="mt-5 grid gap-7 border-y border-[var(--line-subtle)] py-8 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,.72fr)] sm:items-center sm:gap-10 sm:py-12">
      <div className="min-w-0"><ProtocolLabel>Rabbit Hole</ProtocolLabel><h1 className="mt-4 break-words text-[clamp(2.5rem,9vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[var(--text-primary)]">{rabbitHole.title} Rabbit Hole</h1>{rabbitHole.shortDescription ? <p className="type-reading mt-6">{rabbitHole.shortDescription}</p> : null}</div>
      <div className="order-first overflow-hidden bg-[var(--bg-2)] sm:order-last" style={{ aspectRatio: rabbitHole.coverAspectRatio || 16 / 10 }}>{coverArtwork ? <img src={coverArtwork} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full min-h-48 place-items-center text-[var(--text-muted)]"><span className="type-metadata">Archive image unavailable</span></div>}</div>
    </header>
    <RabbitHoleBrowser categories={rabbitHole.categories} pinnedItems={pinnedItems} feedItems={feedItems} />
  </main></SensitivePageReveal>;
}

function toBrowserItem(item: RabbitHoleItem): RabbitHoleBrowserItem {
  return item;
}

function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= 200 && /^[a-z0-9][a-z0-9._~-]*$/i.test(slug);
}
