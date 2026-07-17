/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowUpRight, ImageIcon } from 'lucide-react';
import { ProtocolLabel, SectionHeading } from '@/src/components/presentation-primitives';
import { fetchSanity, type FixationSummary } from '@/src/sanity/lib/content';
import { fixationsQuery } from '@/src/sanity/lib/queries';

type Group = { key: 'core' | 'active' | 'sleeping' | 'archived'; label: string; title: string; description: string; items: FixationSummary[] };

export default async function FixationsPage() {
  const fixations = await fetchSanity<FixationSummary[]>(fixationsQuery, []);
  const groups: Group[] = [
    { key: 'core', label: 'Permanent signal', title: 'Core', description: 'The obsessions that never fully leave.', items: fixations.filter((item) => item.isCore) },
    { key: 'active', label: 'Current frequency', title: 'Active', description: 'Threads with momentum right now.', items: fixations.filter((item) => !item.isCore && (!item.status || item.status === 'active')) },
    { key: 'sleeping', label: 'Quiet frequency', title: 'Sleeping', description: 'Dormant, not finished.', items: fixations.filter((item) => !item.isCore && item.status === 'sleeping') },
    { key: 'archived', label: 'Recorded memory', title: 'Archived', description: 'Closed chapters that remain part of the record.', items: fixations.filter((item) => !item.isCore && item.status === 'archived') },
  ];

  return <main className="mx-auto w-full max-w-6xl overflow-x-clip pb-8">
    <header className="border-y border-[var(--line-subtle)] py-[clamp(3rem,10vw,7rem)]">
      <ProtocolLabel>Fixations</ProtocolLabel>
      <h1 className="mt-5 max-w-3xl text-[clamp(2.75rem,9vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--text-primary)]">Current obsessions</h1>
      <p className="type-reading mt-6">Personal threads, recurring signals, and the archive trails they leave behind.</p>
    </header>

    {fixations.length ? <div>{groups.map((group) => group.items.length ? <FixationGroup key={group.key} group={group} /> : null)}</div> : <p className="type-small mt-[var(--section-rhythm)] border-y border-[var(--line-subtle)] py-8">No Fixations have been published yet.</p>}
  </main>;
}

function FixationGroup({ group }: { group: Group }) {
  const [lead, ...secondary] = group.items;
  return <section className="mt-[clamp(4.5rem,12vw,9rem)]">
    <div className="border-b border-[var(--line-subtle)] pb-5"><SectionHeading label={group.label} title={group.title} description={group.description} /></div>
    <LeadFixation fixation={lead} status={group.key} />
    {secondary.length ? <ol className="border-t border-[var(--line-subtle)]">{secondary.map((fixation, index) => <li key={fixation._id}><SecondaryFixation fixation={fixation} index={index + 2} status={group.key} /></li>)}</ol> : null}
  </section>;
}

function LeadFixation({ fixation, status }: { fixation: FixationSummary; status: string }) {
  if (!fixation.slug) return null;
  const artwork = fixation.coverImage?.asset?.url;
  return <article className="grid gap-7 border-b border-[var(--line-subtle)] py-8 sm:grid-cols-[minmax(15rem,.9fr)_minmax(0,1.1fr)] sm:items-center sm:gap-12 sm:py-12">
    <Link href={`/fixations/${fixation.slug}`} className="artwork-link focusable-surface relative aspect-[16/10] overflow-hidden bg-[var(--bg-2)]" aria-label={`Open ${fixation.title} Fixation`}>{artwork ? <img src={artwork} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center"><ImageIcon aria-hidden="true" className="h-12 w-12 text-white/15" /></span>}</Link>
    <div className="min-w-0"><ProtocolLabel>{fixation.isCore ? 'Core Fixation' : status}</ProtocolLabel><h2 className="mt-4 break-words text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl"><Link href={`/fixations/${fixation.slug}`} className="metadata-link focusable-surface">{fixation.title}</Link></h2>{fixation.shortDescription ? <p className="type-reading mt-4">{fixation.shortDescription}</p> : null}<Link href={`/fixations/${fixation.slug}`} className="text-cta focusable-surface mt-6">Open Fixation <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div>
  </article>;
}

function SecondaryFixation({ fixation, index, status }: { fixation: FixationSummary; index: number; status: string }) {
  if (!fixation.slug) return null;
  const artwork = fixation.coverImage?.asset?.url;
  return <article className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_5rem] sm:gap-5">
    <span className="type-numeric">{String(index).padStart(2, '0')}</span><div className="min-w-0"><ProtocolLabel className="text-[var(--text-muted)]">{fixation.isCore ? 'Core Fixation' : status}</ProtocolLabel><h3 className="mt-2 break-words text-xl font-semibold text-[var(--text-primary)]"><Link href={`/fixations/${fixation.slug}`} className="metadata-link focusable-surface">{fixation.title}</Link></h3>{fixation.shortDescription ? <p className="type-small mt-2 line-clamp-2 max-w-2xl">{fixation.shortDescription}</p> : null}</div><Link href={`/fixations/${fixation.slug}`} className="artwork-link focusable-surface aspect-square overflow-hidden bg-[var(--bg-2)]" aria-label={`Open ${fixation.title} Fixation`}>{artwork ? <img src={artwork} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center"><ImageIcon aria-hidden="true" className="h-5 w-5 text-white/15" /></span>}</Link>
  </article>;
}
