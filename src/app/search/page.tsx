import { SearchBrowser, type SearchFilterGroup } from '@/src/components/search-browser';
import { normalizeSearchResult, type RawSearchResult, type SearchResultType } from '@/src/lib/search';
import { fetchSanity } from '@/src/sanity/lib/content';
import { fixationsQuery, lanesQuery, releasesQuery, searchResultsQuery, tagsQuery } from '@/src/sanity/lib/queries';

type FilterItem = { _id: string; title?: string; name?: string; group?: string };

export default async function SearchPage() {
  const [tags, lanes, fixations, releases, rawResults] = await Promise.all([
    fetchSanity<FilterItem[]>(tagsQuery, []),
    fetchSanity<FilterItem[]>(lanesQuery, []),
    fetchSanity<FilterItem[]>(fixationsQuery, []),
    fetchSanity<FilterItem[]>(releasesQuery, []),
    fetchSanity<RawSearchResult[]>(searchResultsQuery, []),
  ]);
  const results = rawResults.map(normalizeSearchResult).filter((result) => result !== null);
  const types = Array.from(new Set(results.map((result) => result.type))) as SearchResultType[];
  const platforms = Array.from(new Set(results.flatMap((result) => result.platforms))).sort();
  const years = Array.from(new Set(results.flatMap((result) => result.year ? [result.year] : []))).sort((a, b) => b.localeCompare(a));
  const quoteSources = Array.from(new Set(results.flatMap((result) => result.quoteSource ? [result.quoteSource] : []))).sort();
  const groups: SearchFilterGroup[] = [
    { key: 'tagId', label: 'Tags', items: filters(tags.filter((item) => item.group !== 'Mood')) },
    { key: 'moodId', label: 'Mood', items: filters(tags.filter((item) => item.group === 'Mood')) },
    { key: 'laneId', label: 'Lanes', items: filters(lanes) },
    { key: 'fixationId', label: 'Fixations', items: filters(fixations) },
    { key: 'platform', label: 'Platforms', items: platforms.map(asFilter) },
    { key: 'releaseId', label: 'Releases', items: filters(releases) },
    { key: 'year', label: 'Date', items: years.map(asFilter) },
    { key: 'quoteSource', label: 'Quote source', items: quoteSources.map(asFilter) },
  ];

  return <main className="mx-auto w-full max-w-5xl">
    <header className="max-w-[var(--reading-measure)] pb-8 pt-3 sm:pb-10 sm:pt-6">
      <p className="type-protocol-label">Search</p>
      <h1 className="mt-4 text-[clamp(2.5rem,10vw,5rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-[var(--text-primary)]">Find the thread again.</h1>
      <p className="type-small mt-5 max-w-xl">Search the published archive, then narrow it only as far as needed.</p>
    </header>
    <SearchBrowser groups={groups} results={results} types={types} />
  </main>;
}

function filters(items: FilterItem[]) {
  return items.flatMap((item) => item.name || item.title ? [{ id: item._id, label: item.name || item.title || '' }] : []);
}

function asFilter(value: string) {
  return { id: value, label: value };
}
