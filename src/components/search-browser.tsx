'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MediaArtwork } from './presentation-primitives';

export type SearchFilter = {
  id: string;
  label: string;
};

export type SearchFilterGroup = {
  label: 'Tags' | 'Lanes' | 'Fixations' | 'Releases';
  items: SearchFilter[];
};

export type SearchResult = {
  id: string;
  type: string;
  title: string;
  href: string;
  external?: boolean;
  subtitle?: string;
  imageUrl?: string;
  date?: string;
  tagIds: string[];
  laneIds: string[];
  fixationIds: string[];
  releaseIds: string[];
};

type Selection = { group: SearchFilterGroup['label']; id: string } | null;

const resultFilterKeys: Record<SearchFilterGroup['label'], keyof Pick<SearchResult, 'tagIds' | 'laneIds' | 'fixationIds' | 'releaseIds'>> = {
  Tags: 'tagIds',
  Lanes: 'laneIds',
  Fixations: 'fixationIds',
  Releases: 'releaseIds'
};

export function SearchBrowser({ groups, results }: { groups: SearchFilterGroup[]; results: SearchResult[] }) {
  const [selection, setSelection] = useState<Selection>(null);
  const filteredResults = selection
    ? results.filter((result) => result[resultFilterKeys[selection.group]].includes(selection.id) && (selection.group !== 'Fixations' || result.type !== 'Fixation'))
    : results;

  return <>
    <section className="grid gap-4 sm:grid-cols-2" aria-label="Search filters">
      {groups.map((group) => (
        <article key={group.label} className="rounded-[1.5rem] border border-white/10 bg-[#0a0d14]/80 p-5">
          <h2 className="font-semibold text-white">{group.label}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.items.length ? group.items.slice(0, 12).map((item) => {
              const selected = selection?.group === group.label && selection.id === item.id;
              return <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelection(selected ? null : { group: group.label, id: item.id })}
                className={`focusable-surface rounded-full border px-3 py-1 text-xs ${selected ? 'border-[var(--accent)] bg-[var(--surface-active)] text-white' : 'border-white/10 bg-white/5 text-mist/70'}`}
              >{item.label}</button>;
            }) : <span className="text-sm text-mist/50">No {group.label.toLowerCase()} available.</span>}
          </div>
        </article>
      ))}
    </section>

    <section aria-live="polite" aria-atomic="false">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[11px] uppercase tracking-[0.32em] text-ember">Results</p><h2 className="mt-2 text-xl font-semibold text-white">Archive entries</h2></div>
        <p className="type-numeric">{filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}</p>
      </div>
      <div className="mt-4 border-t border-white/10">
        {filteredResults.length ? filteredResults.map((result) => {
          const content = <><MediaArtwork src={result.imageUrl} size="compact" /><span className="min-w-0"><span className="block truncate font-semibold text-white">{result.title}</span><span className="type-metadata mt-1 block truncate">{result.type}{result.subtitle ? ` · ${result.subtitle}` : ''}{result.date ? ` · ${formatDate(result.date)}` : ''}</span></span><span aria-hidden="true" className="text-mist/50">↗</span></>;
          const className = 'focusable-surface grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 py-3';
          return result.external
            ? <a key={result.id} href={result.href} target="_blank" rel="noreferrer" className={className}>{content}</a>
            : <Link key={result.id} href={result.href} className={className}>{content}</Link>;
        }) : <p className="border-b border-white/10 py-6 text-sm text-mist/60">No archive entries match this filter.</p>}
      </div>
    </section>
  </>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}
