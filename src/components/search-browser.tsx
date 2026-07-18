'use client';

import Link from 'next/link';
import { ExternalLink, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { filterSearchResults, type SearchCriteria, type SearchResult, type SearchResultType } from '@/src/lib/search';
import { MediaArtwork } from './presentation-primitives';

export type SearchFilter = { id: string; label: string };
type FilterKey = Exclude<keyof SearchCriteria, 'query' | 'type'>;
export type SearchFilterGroup = { key: FilterKey; label: string; items: SearchFilter[] };

const emptyCriteria: SearchCriteria = { query: '' };

export function SearchBrowser({ groups, results, types }: { groups: SearchFilterGroup[]; results: SearchResult[]; types: SearchResultType[] }) {
  const [criteria, setCriteria] = useState<SearchCriteria>(emptyCriteria);
  const filteredResults = useMemo(() => filterSearchResults(results, criteria), [criteria, results]);
  const activeFilters = groups.flatMap((group) => {
    const selected = criteria[group.key];
    const item = selected ? group.items.find((candidate) => candidate.id === selected) : undefined;
    return item ? [{ key: group.key, group: group.label, label: item.label }] : [];
  });
  const active = Boolean(criteria.query.trim() || criteria.type || activeFilters.length);

  const setFilter = (key: FilterKey, id?: string) => setCriteria((current) => ({ ...current, [key]: current[key] === id ? undefined : id }));
  const clearAll = () => setCriteria(emptyCriteria);

  return <section aria-labelledby="search-controls-heading">
    <h2 id="search-controls-heading" className="sr-only">Search controls</h2>
    <div className="border-y border-[var(--line-subtle)] py-5">
      <label htmlFor="archive-query" className="type-protocol-label text-[var(--text-muted)]">Query</label>
      <div className="mt-3 flex min-h-12 items-center gap-3 border-b border-white/20 focus-within:border-[var(--accent)]">
        <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        <input id="archive-query" type="search" value={criteria.query} onChange={(event) => setCriteria((current) => ({ ...current, query: event.target.value }))} placeholder="Title, note, quote, person, provider…" className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" />
        {criteria.query ? <button type="button" onClick={() => setCriteria((current) => ({ ...current, query: '' }))} aria-label="Clear search query" className="icon-control focusable-surface border-0"><X aria-hidden="true" className="h-4 w-4" /></button> : null}
      </div>

      <fieldset className="mt-6">
        <legend className="type-protocol-label mb-3 text-[var(--text-muted)]">Content type</legend>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => <FilterButton key={type} selected={criteria.type === type} onClick={() => setCriteria((current) => ({ ...current, type: current.type === type ? undefined : type }))}>{type}</FilterButton>)}
        </div>
      </fieldset>

      <details className="group mt-5 border-t border-white/[0.08] pt-2">
        <summary className="focusable-surface flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--text-secondary)] marker:hidden hover:text-[var(--text-primary)]">
          <span>More filters{activeFilters.length ? ` (${activeFilters.length})` : ''}</span>
          <span aria-hidden="true" className="type-metadata group-open:hidden">Open</span><span aria-hidden="true" className="type-metadata hidden group-open:inline">Close</span>
        </summary>
        <div className="grid gap-6 pb-3 pt-5 sm:grid-cols-2">
          {groups.map((group) => <fieldset key={group.key} className={group.items.length ? '' : 'hidden'}>
            <legend className="type-protocol-label mb-3 text-[var(--text-muted)]">{group.label}</legend>
            <div className="flex flex-wrap gap-2">{group.items.map((item) => <FilterButton key={item.id} selected={criteria[group.key] === item.id} onClick={() => setFilter(group.key, item.id)}>{item.label}</FilterButton>)}</div>
          </fieldset>)}
        </div>
      </details>

      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
        <p className="type-metadata" aria-live="polite">{active ? `${filteredResults.length} ${filteredResults.length === 1 ? 'result' : 'results'}` : `${results.length} published entries available`}</p>
        {active ? <button type="button" onClick={clearAll} className="focusable-surface inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Clear all</button> : null}
      </div>

      {criteria.type || activeFilters.length ? <ul aria-label="Applied filters" className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {criteria.type ? <li><button type="button" onClick={() => setCriteria((current) => ({ ...current, type: undefined }))} className="metadata-link focusable-surface inline-flex min-h-11 items-center gap-1 text-sm">Type: {criteria.type}<X aria-hidden="true" className="h-3.5 w-3.5" /></button></li> : null}
        {activeFilters.map((filter) => <li key={filter.key}><button type="button" onClick={() => setFilter(filter.key)} className="metadata-link focusable-surface inline-flex min-h-11 items-center gap-1 text-sm">{filter.group}: {filter.label}<X aria-hidden="true" className="h-3.5 w-3.5" /></button></li>)}
      </ul> : null}
    </div>

    <section className="mt-8" aria-labelledby="search-results-heading">
      <div className="border-b border-[var(--line-subtle)] pb-4"><p className="type-protocol-label text-[var(--text-muted)]">Results</p><h2 id="search-results-heading" className="type-section-heading mt-2">Archive entries</h2></div>
      {!active ? <div className="border-b border-[var(--line-subtle)] py-10"><p className="type-small">Enter a query or choose a filter to begin.</p></div> : filteredResults.length ? <ol>{filteredResults.map((result) => <li key={result.id}><ResultRow result={result} /></li>)}</ol> : <div className="border-b border-[var(--line-subtle)] py-10"><p className="font-semibold text-[var(--text-primary)]">No matching archive items.</p><p className="type-small mt-2">Remove a filter or clear the current search to widen the result.</p><button type="button" onClick={clearAll} className="text-cta focusable-surface mt-4">Clear all filters</button></div>}
    </section>
  </section>;
}

function ResultRow({ result }: { result: SearchResult }) {
  const content = <><MediaArtwork src={result.imageUrl} alt="" size="compact" /><span className="min-w-0"><span className="type-protocol-label block text-[var(--text-muted)]">{result.type}</span><span className="mt-1 block break-words text-base font-semibold leading-snug text-[var(--text-primary)]">{result.title}</span><span className="type-metadata mt-1 block break-words">{[result.subtitle, result.externalLabel, result.date ? formatDate(result.date) : undefined].filter(Boolean).join(' · ')}</span></span>{result.external ? <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--text-muted)]" /> : null}</>;
  const className = 'row-link focusable-surface grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line-subtle)] py-4';
  return <article className="min-w-0">
    {result.external ? <a href={result.href} target="_blank" rel="noopener noreferrer" className={className} aria-label={`${result.title} — open ${result.externalLabel || 'external destination'} in a new tab`}>{content}</a> : <Link href={result.href} className={className}>{content}</Link>}
    {result.sourceHref ? <div className="-mt-2 flex justify-end border-b border-[var(--line-subtle)] pb-2"><a href={result.sourceHref} target="_blank" rel="noopener noreferrer" className="external-link focusable-surface" aria-label={`${result.sourceLabel || 'Open source'} for ${result.title} in a new tab`}>{result.sourceLabel || 'Open source'}<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a></div> : null}
  </article>;
}

function FilterButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`focusable-surface inline-flex min-h-11 items-center border px-3 text-sm font-semibold ${selected ? 'border-[var(--accent)] bg-[var(--surface-active)] text-[var(--text-primary)]' : 'border-white/10 text-[var(--text-secondary)] hover:border-white/25 hover:text-[var(--text-primary)]'}`}>{children}</button>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}
