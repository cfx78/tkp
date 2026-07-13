import { fetchSanity } from '@/src/sanity/lib/content';
import { SearchBrowser, type SearchFilterGroup, type SearchResult } from '@/src/components/search-browser';
import { fixationsQuery, lanesQuery, releasesQuery, searchResultsQuery, tagsQuery } from '@/src/sanity/lib/queries';

type FilterItem = { _id: string; title?: string; name?: string; group?: string };
type RawSearchResult = {
  _id: string; _type: string; title?: string; quoteText?: string; person?: string; status?: string; releaseType?: string; shortDescription?: string; shortNote?: string;
  note?: string; platformAuto?: string; platformOverride?: string; url?: string;
  spotifyUrl?: string; sourceUrl?: string; publishedAt?: string; _createdAt?: string; slug?: string; imageUrl?: string;
  tagIds?: string[]; laneId?: string; relatedLaneIds?: string[]; fixationIds?: string[]; releaseIds?: string[];
  containingReleaseIds?: string[];
};

export default async function SearchPage() {
  const [tags, lanes, fixations, releases, rawResults] = await Promise.all([
    fetchSanity<FilterItem[]>(tagsQuery, []),
    fetchSanity<FilterItem[]>(lanesQuery, []),
    fetchSanity<FilterItem[]>(fixationsQuery, []),
    fetchSanity<FilterItem[]>(releasesQuery, []),
    fetchSanity<RawSearchResult[]>(searchResultsQuery, [])
  ]);
  const groups: SearchFilterGroup[] = [
    { label: 'Tags', items: filters(tags) },
    { label: 'Lanes', items: filters(lanes) },
    { label: 'Fixations', items: filters(fixations) },
    { label: 'Releases', items: filters(releases) }
  ];
  const results = rawResults.map(normalizeResult).filter((result): result is SearchResult => result !== null);

  return (
    <main className="flex flex-col gap-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.32em] text-ember">Search</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Archive recall</h1>
        <p className="mt-3 text-sm leading-7 text-mist/70">Filter the archive by tag, lane, fixation, or release.</p>
      </section>
      <SearchBrowser groups={groups} results={results} />
    </main>
  );
}

function filters(items: FilterItem[]) {
  return items.flatMap((item) => item.name || item.title ? [{ id: item._id, label: item.name || item.title || '' }] : []);
}

function normalizeResult(item: RawSearchResult): SearchResult | null {
  const title = item.title || (item._type === 'quote' ? item.quoteText : undefined);
  const destination = resultDestination(item);
  if (!title || !destination) return null;
  return {
    id: item._id,
    type: typeLabel(item._type),
    title: title.length > 100 ? `${title.slice(0, 97)}…` : title,
    ...destination,
    subtitle: item.person || item.releaseType || item.status || item.platformOverride || item.platformAuto || item.shortDescription || item.shortNote || item.note,
    imageUrl: item.imageUrl,
    date: item.publishedAt || item._createdAt,
    tagIds: item.tagIds || [],
    laneIds: [item.laneId, ...(item.relatedLaneIds || [])].filter((id): id is string => Boolean(id)),
    fixationIds: item._type === 'fixation' ? [item._id] : item.fixationIds || [],
    releaseIds: item._type === 'beat' ? [...(item.releaseIds || []), ...(item.containingReleaseIds || [])] : []
  };
}

function resultDestination(item: RawSearchResult): { href: string; external?: boolean } | null {
  if (item._type === 'beat' && item.slug) return { href: `/player/beats/${item.slug}` };
  if (item._type === 'release' && item.slug) return { href: `/releases/${item.slug}` };
  if (item._type === 'link' && item.url) return { href: item.url, external: true };
  if (item._type === 'playlist' && item.spotifyUrl) return { href: item.spotifyUrl, external: true };
  if (item._type === 'quote' && item.sourceUrl) return { href: item.sourceUrl, external: true };
  if (item._type === 'fixation') return { href: '/fixations' };
  return null;
}

function typeLabel(type: string) {
  return ({ beat: 'Beat', release: 'Release', link: 'Link', playlist: 'Playlist', quote: 'Quote', fixation: 'Fixation' } as Record<string, string>)[type] || type;
}
