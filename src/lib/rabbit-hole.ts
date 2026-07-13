import type { SanityImageSource } from '@sanity/image-url';
import { getSpotifyPlaylistEmbedUrl } from './spotify';
import { getYouTubeEmbedUrl } from './youtube';

type RawCategory = {
  _id?: string;
  name?: string;
  slug?: string;
  group?: string;
} | null;

type RawRabbitHoleLink = {
  _id?: string;
  title?: string;
  url?: string;
  note?: string;
  thumbnail?: SanityImageSource;
  thumbnailAspectRatio?: number;
  embedUrl?: string;
  platformAuto?: string;
  platformOverride?: string;
  category?: RawCategory;
  isPinnedInRabbitHole?: boolean;
  effectivePublishedAt?: string;
} | null;

export type RawRabbitHoleData = {
  _id?: string;
  title?: string;
  slug?: string;
  shortDescription?: string;
  coverImage?: SanityImageSource;
  coverAspectRatio?: number;
  pinnedLinkIds?: Array<string | null>;
  directPinnedLinks?: RawRabbitHoleLink[];
  links?: RawRabbitHoleLink[];
} | null;

export type RabbitHoleCategory = {
  value: string;
  label: string;
  sourceId?: string;
  sourceGroup?: string;
};

export type RabbitHoleItem = {
  id: string;
  title?: string;
  url: string;
  note?: string;
  provider: string;
  category: RabbitHoleCategory;
  publishedAt: string;
  thumbnail?: SanityImageSource;
  thumbnailAspectRatio?: number;
  trustedEmbedUrl?: string;
  trustedEmbedProvider?: 'YouTube' | 'Spotify';
  pinnedSource?: 'fixation' | 'link';
  pinnedOrder?: number;
};

export type RabbitHoleData = {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  coverImage?: SanityImageSource;
  coverAspectRatio?: number;
  pinnedItems: RabbitHoleItem[];
  feedItems: RabbitHoleItem[];
  categories: RabbitHoleCategory[];
};

const supportedPlatforms = ['YouTube', 'Instagram', 'TikTok', 'X/Twitter', 'Spotify', 'Apple Music', 'YouTube Music', 'Letterboxd', 'Website/Article', 'Other'] as const;

export function normalizeRabbitHole(raw: RawRabbitHoleData): RabbitHoleData | null {
  const id = cleanText(raw?._id);
  const title = cleanText(raw?.title);
  const slug = cleanText(raw?.slug);
  if (!raw || !id || !title || !slug) return null;

  const candidates = new Map<string, RabbitHoleItem>();
  [...(raw.directPinnedLinks || []), ...(raw.links || [])].forEach((item) => {
    const normalized = normalizeItem(item);
    if (normalized && !candidates.has(normalized.id)) candidates.set(normalized.id, normalized);
  });

  const directIds = uniqueStrings(raw.pinnedLinkIds);
  const pinnedItems = directIds.flatMap((pinnedId, index) => {
    const item = candidates.get(pinnedId);
    return item ? [{ ...item, pinnedSource: 'fixation' as const, pinnedOrder: index }] : [];
  });
  const pinnedIds = new Set(pinnedItems.map((item) => item.id));
  const otherPinned = Array.from(candidates.values())
    .filter((item) => !pinnedIds.has(item.id) && rawItemIsPinned(item.id, raw))
    .sort(compareItems)
    .map((item, index) => ({ ...item, pinnedSource: 'link' as const, pinnedOrder: directIds.length + index }));
  otherPinned.forEach((item) => pinnedIds.add(item.id));

  const feedItems = Array.from(candidates.values()).filter((item) => !pinnedIds.has(item.id)).sort(compareItems);
  const allItems = [...pinnedItems, ...otherPinned, ...feedItems];
  const categories = Array.from(new Map(allItems.map((item) => [item.category.value, item.category])).values());

  return {
    id,
    title,
    slug,
    shortDescription: cleanText(raw.shortDescription),
    coverImage: raw.coverImage,
    coverAspectRatio: validAspectRatio(raw.coverAspectRatio),
    pinnedItems: [...pinnedItems, ...otherPinned],
    feedItems,
    categories,
  };
}

function normalizeItem(raw: RawRabbitHoleLink): RabbitHoleItem | null {
  const id = cleanText(raw?._id);
  const url = safeExternalUrl(raw?.url);
  if (!raw || !id || !url) return null;

  const youtubeEmbedUrl = getYouTubeEmbedUrl(url, raw.embedUrl);
  const spotifyEmbedUrl = getSpotifyPlaylistEmbedUrl(url, raw.embedUrl);
  const trustedEmbedUrl = youtubeEmbedUrl || spotifyEmbedUrl || undefined;
  return {
    id,
    title: cleanText(raw.title),
    url,
    note: cleanText(raw.note),
    provider: normalizeProvider(raw.platformOverride, raw.platformAuto, url),
    category: normalizeCategory(raw.category),
    publishedAt: normalizeDate(raw.effectivePublishedAt),
    thumbnail: raw.thumbnail,
    thumbnailAspectRatio: validAspectRatio(raw.thumbnailAspectRatio),
    trustedEmbedUrl,
    trustedEmbedProvider: youtubeEmbedUrl ? 'YouTube' : spotifyEmbedUrl ? 'Spotify' : undefined,
  };
}

function rawItemIsPinned(id: string, raw: Exclude<RawRabbitHoleData, null>) {
  return [...(raw.directPinnedLinks || []), ...(raw.links || [])].some((item) => item?._id === id && item.isPinnedInRabbitHole === true);
}

function normalizeCategory(raw?: RawCategory): RabbitHoleCategory {
  const sourceId = cleanText(raw?._id);
  const slug = cleanText(raw?.slug)?.toLowerCase();
  const name = cleanText(raw?.name);
  if (!sourceId && !slug && !name) return { value: 'uncategorized', label: 'Uncategorized' };

  return {
    value: slug ? `tag:${slug}` : `tag-id:${sourceId}`,
    label: name || humanize(slug || '') || 'Uncategorized',
    sourceId,
    sourceGroup: cleanText(raw?.group),
  };
}

function normalizeProvider(override: string | undefined, automatic: string | undefined, url: string) {
  return supportedPlatform(override) || detectPlatform(url) || supportedPlatform(automatic) || 'Other';
}

function supportedPlatform(value?: string) {
  const normalized = cleanText(value)?.toLowerCase();
  return supportedPlatforms.find((platform) => platform.toLowerCase() === normalized);
}

function detectPlatform(value: string) {
  const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'music.youtube.com') return 'YouTube Music';
  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) return 'YouTube';
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'Instagram';
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'TikTok';
  if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) return 'X/Twitter';
  if (host === 'spotify.com' || host.endsWith('.spotify.com')) return 'Spotify';
  if (host === 'music.apple.com') return 'Apple Music';
  if (host === 'letterboxd.com' || host.endsWith('.letterboxd.com')) return 'Letterboxd';
  return 'Website/Article';
}

function safeExternalUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function compareItems(a: RabbitHoleItem, b: RabbitHoleItem) {
  const difference = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  return difference || a.id.localeCompare(b.id);
}

function normalizeDate(value?: string) {
  const date = value ? new Date(value) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function uniqueStrings(values?: Array<string | null>) {
  return Array.from(new Set((values || []).map((value) => cleanText(value)).filter((value): value is string => Boolean(value))));
}

function cleanText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function humanize(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (character) => character.toUpperCase());
}

function validAspectRatio(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0.5 && value <= 2.5 ? value : undefined;
}
