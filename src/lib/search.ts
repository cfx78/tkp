// @ts-expect-error Node 24 executes tests directly and requires the extension.
import { getPlaylistPreviewOptions } from './playlist-preview.ts';

export type SearchResultType = 'Beat' | 'Release' | 'Lane' | 'Fixation' | 'Log' | 'Link' | 'Playlist' | 'Quote';

export type RawSearchResult = {
  _id?: string;
  _type?: string;
  title?: string;
  name?: string;
  quoteText?: string;
  person?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  body?: string;
  bullets?: string[];
  logType?: string;
  status?: string;
  releaseType?: string;
  plainDescription?: string;
  shortDescription?: string;
  shortNote?: string;
  note?: string;
  platformAuto?: string;
  platformOverride?: string;
  url?: string;
  spotifyUrl?: string;
  spotifyEmbedUrl?: string;
  appleMusicUrl?: string;
  youtubeMusicUrl?: string;
  effectivePublishedAt?: string;
  slug?: string;
  imageUrl?: string;
  tagIds?: string[];
  laneId?: string;
  relatedLaneIds?: string[];
  fixationIds?: string[];
  releaseIds?: string[];
  containingReleaseIds?: string[];
  nsfw?: boolean;
  nsfwReason?: string;
};

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  href: string;
  external?: boolean;
  externalLabel?: string;
  sourceHref?: string;
  sourceLabel?: string;
  subtitle?: string;
  imageUrl?: string;
  date?: string;
  year?: string;
  tagIds: string[];
  laneIds: string[];
  fixationIds: string[];
  releaseIds: string[];
  platforms: string[];
  quoteSource?: string;
  searchText: string;
  nsfw?: boolean;
  nsfwReason?: string;
  gatedHref?: string;
  gatedSourceHref?: string;
};

export type SearchCriteria = {
  query: string;
  type?: SearchResultType;
  tagId?: string;
  laneId?: string;
  fixationId?: string;
  platform?: string;
  releaseId?: string;
  year?: string;
  moodId?: string;
  quoteSource?: string;
};

const typeLabels: Record<string, SearchResultType | undefined> = {
  beat: 'Beat', release: 'Release', lane: 'Lane', fixation: 'Fixation', log: 'Log', link: 'Link', playlist: 'Playlist', quote: 'Quote',
};

export function normalizeSearchResult(item: RawSearchResult): SearchResult | null {
  const id = clean(item._id);
  const type = item._type ? typeLabels[item._type] : undefined;
  const fullTitle = clean(item.title) || clean(item.name) || (item.nsfw && type ? `Sensitive ${type}` : undefined) || (type === 'Quote' ? clean(item.quoteText) : undefined) || (type === 'Log' ? openingLine(item.body) : undefined);
  if (!id || !type || !fullTitle) return null;

  const destination = destinationFor(item, type);
  if (!destination) return null;
  const date = validDate(item.effectivePublishedAt);
  const subtitle = item.nsfw ? undefined : clean(item.person) || clean(item.releaseType) || clean(item.logType) || clean(item.status) || clean(item.platformOverride) || clean(item.platformAuto)
    || clean(item.plainDescription) || clean(item.shortDescription) || clean(item.shortNote) || clean(item.note);
  const platforms = type === 'Playlist' ? destination.platforms : type === 'Link' ? [clean(item.platformOverride) || clean(item.platformAuto) || 'Website/Article'] : [];
  const quoteSource = type === 'Quote' ? clean(item.sourceTitle) : undefined;
  const searchable = [fullTitle, subtitle, ...(item.nsfw ? [] : [item.body, ...(item.bullets || []), item.quoteText, item.person, quoteSource]), ...platforms]
    .map(clean).filter((value): value is string => Boolean(value)).join(' ').toLocaleLowerCase();

  const safeDestination = item.nsfw ? { ...destination, ...(destination.external ? { gatedHref: destination.href, href: '#' } : {}), ...(destination.sourceHref ? { gatedSourceHref: destination.sourceHref, sourceHref: '#' } : {}) } : destination;
  return {
    id,
    type,
    title: fullTitle,
    ...safeDestination,
    subtitle,
    imageUrl: item.nsfw ? undefined : searchThumbnailUrl(item.imageUrl),
    nsfw: item.nsfw === true,
    nsfwReason: clean(item.nsfwReason),
    date,
    year: date ? String(new Date(date).getUTCFullYear()) : undefined,
    tagIds: unique(item.tagIds),
    laneIds: unique([item.laneId, ...(item.relatedLaneIds || [])]),
    fixationIds: type === 'Fixation' ? unique([id, ...(item.fixationIds || [])]) : unique(item.fixationIds),
    releaseIds: unique([...(item.releaseIds || []), ...(item.containingReleaseIds || [])]),
    platforms,
    quoteSource,
    searchText: searchable,
  };
}

export function filterSearchResults(results: SearchResult[], criteria: SearchCriteria) {
  const query = criteria.query.trim().toLocaleLowerCase();
  return results.filter((result) => {
    if (query && !result.searchText.includes(query)) return false;
    if (criteria.type && result.type !== criteria.type) return false;
    if (criteria.tagId && !result.tagIds.includes(criteria.tagId)) return false;
    if (criteria.laneId && !result.laneIds.includes(criteria.laneId)) return false;
    if (criteria.fixationId && !result.fixationIds.includes(criteria.fixationId)) return false;
    if (criteria.platform && !result.platforms.includes(criteria.platform)) return false;
    if (criteria.releaseId && !result.releaseIds.includes(criteria.releaseId)) return false;
    if (criteria.year && result.year !== criteria.year) return false;
    if (criteria.moodId && !result.tagIds.includes(criteria.moodId)) return false;
    if (criteria.quoteSource && result.quoteSource !== criteria.quoteSource) return false;
    return true;
  });
}

function destinationFor(item: RawSearchResult, type: SearchResultType) {
  const slug = clean(item.slug);
  if (type === 'Beat' && slug) return { href: `/player/beats/${slug}`, platforms: [] as string[] };
  if (type === 'Release' && slug) return { href: `/releases/${slug}`, platforms: [] as string[] };
  if (type === 'Lane' && slug) return { href: `/lanes/${slug}`, platforms: [] as string[] };
  if (type === 'Fixation' && slug) return { href: `/fixations/${slug}`, platforms: [] as string[] };
  if (type === 'Log') return { href: '/logs', platforms: [] as string[] };
  if (type === 'Quote') {
    const sourceHref = safeHttpUrl(item.sourceUrl);
    return { href: '/logs', sourceHref, sourceLabel: sourceHref ? 'Open source' : undefined, platforms: [] as string[] };
  }
  if (type === 'Link') {
    const href = safeHttpUrl(item.url);
    return href ? { href, external: true, externalLabel: clean(item.platformOverride) || clean(item.platformAuto) || hostname(href), platforms: [] as string[] } : null;
  }
  if (type === 'Playlist') {
    const options = getPlaylistPreviewOptions(item);
    const first = options[0];
    return first ? { href: first.externalUrl, external: true, externalLabel: first.label, platforms: options.map((option) => option.label) } : null;
  }
  return null;
}

function safeHttpUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch { return undefined; }
}

function searchThumbnailUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith('/images/')) return undefined;
    url.searchParams.set('fm', 'webp');
    url.searchParams.set('w', '96');
    url.searchParams.set('h', '96');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  } catch { return undefined; }
}

function validDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function clean(value?: string) {
  const result = value?.trim();
  return result || undefined;
}

function unique(values?: Array<string | undefined>) {
  return Array.from(new Set((values || []).map(clean).filter((value): value is string => Boolean(value))));
}

function openingLine(value?: string) {
  return clean(value)?.split(/\r?\n/)[0]?.slice(0, 140);
}

function hostname(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return 'Website'; }
}
