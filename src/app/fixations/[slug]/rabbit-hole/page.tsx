import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProtocolLabel } from '@/src/components/presentation-primitives';
import { normalizeRabbitHole, type RawRabbitHoleData } from '@/src/lib/rabbit-hole';
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

  return <main className="mx-auto w-full max-w-3xl pb-8">
    <Link href={`/fixations/${rabbitHole.slug}`} className="focusable-surface inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
      <ArrowLeft className="h-4 w-4" /> Back to {rabbitHole.title}
    </Link>
    <header className="mt-8 border-y border-[var(--line-subtle)] py-10 sm:py-14">
      <ProtocolLabel>Rabbit Hole / Architecture</ProtocolLabel>
      <h1 className="mt-4 break-words text-[clamp(2.5rem,10vw,5rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-[var(--text-primary)]">{rabbitHole.title} Rabbit Hole</h1>
      {rabbitHole.shortDescription ? <p className="type-reading mt-6 max-w-[var(--reading-measure)]">{rabbitHole.shortDescription}</p> : null}
    </header>
    <section className="mt-10" aria-labelledby="rabbit-hole-status">
      <h2 id="rabbit-hole-status" className="type-protocol-label text-[var(--text-muted)]">Architecture checkpoint</h2>
      <dl className="type-metadata mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-y border-[var(--line-subtle)] py-5">
        <dt>Pinned items</dt><dd>{rabbitHole.pinnedItems.length}</dd>
        <dt>Remaining feed items</dt><dd>{rabbitHole.feedItems.length}</dd>
      </dl>
      <div className="mt-7">
        <h2 className="type-protocol-label text-[var(--text-muted)]">Normalized categories</h2>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Rabbit Hole categories">
          {rabbitHole.categories.map((category) => <li key={category.value} className="type-metadata border border-white/10 px-2 py-1 text-[var(--text-secondary)]">{category.label}</li>)}
        </ul>
      </div>
      <p className="type-small mt-8 max-w-xl border-l border-[var(--line-subtle)] pl-4">The server-side archive is ready. Media presentation and progressive controls arrive in the next Rabbit Hole checkpoint.</p>
    </section>
  </main>;
}

function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= 200 && /^[a-z0-9][a-z0-9._~-]*$/i.test(slug);
}
