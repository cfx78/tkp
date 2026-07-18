import type { LogType, LogsFeedItem, LogsTag, RelatedArchiveItem } from '@/src/types/logs';

type RawTag = { _id?: string; name?: string; slug?: string; group?: string };
type RawRelated = { _id?: string; title?: string; slug?: string } | null;

export type RawLogsFeedItem = {
  _id?: string;
  _type?: string;
  publishedAt?: string;
  tags?: RawTag[];
  title?: string;
  body?: string;
  bullets?: string[];
  logType?: string;
  relatedFixations?: RawRelated[];
  relatedBeats?: RawRelated[];
  relatedReleases?: RawRelated[];
  url?: string;
  note?: string;
  platformAuto?: string;
  platformOverride?: string;
  thumbnailUrl?: string;
  thumbnailAspectRatio?: number;
  spotifyUrl?: string;
  spotifyEmbedUrl?: string;
  appleMusicUrl?: string;
  youtubeMusicUrl?: string;
  shortNote?: string;
  quoteText?: string;
  person?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  foundViaLink?: { title?: string; url?: string };
  nsfw?: boolean;
  nsfwReason?: string;
};

const logTypes = new Set<LogType>(['thought', 'lifeUpdate', 'beatNote', 'fixationNote', 'movieThought', 'quickList']);

export function normalizeLogsFeed(items: RawLogsFeedItem[]): LogsFeedItem[] {
  return items.flatMap<LogsFeedItem>((item) => {
    if (!item._id || !item.publishedAt) return [];
    const base = { id: item._id, publishedAt: item.publishedAt, tags: normalizeTags(item.tags), nsfw: item.nsfw === true, nsfwReason: cleanText(item.nsfwReason) };

    if (item._type === 'log' && isLogType(item.logType)) {
      return [{
        ...base,
        kind: 'log' as const,
        title: cleanText(item.title),
        body: cleanText(item.body),
        bullets: (item.bullets || []).map(cleanText).filter((value): value is string => Boolean(value)),
        logType: item.logType,
        related: normalizeRelated(item.relatedFixations, item.relatedBeats, item.relatedReleases),
      }];
    }

    if (item._type === 'link') {
      const url = safeExternalUrl(item.url);
      return [{
        ...base,
        kind: 'link' as const,
        title: cleanText(item.title),
        url,
        domain: url ? getDomain(url) : undefined,
        note: cleanText(item.note),
        platform: cleanText(item.platformOverride) || cleanText(item.platformAuto) || detectPlatform(url),
        thumbnailUrl: safeExternalUrl(item.thumbnailUrl),
        thumbnailAspectRatio: normalizeAspectRatio(item.thumbnailAspectRatio),
      }];
    }

    if (item._type === 'playlist' && cleanText(item.title)) {
      return [{
        ...base,
        kind: 'playlist' as const,
        title: cleanText(item.title) as string,
        shortNote: cleanText(item.shortNote),
        spotifyUrl: safeExternalUrl(item.spotifyUrl),
        spotifyEmbedUrl: safeExternalUrl(item.spotifyEmbedUrl),
        appleMusicUrl: safeExternalUrl(item.appleMusicUrl),
        youtubeMusicUrl: safeExternalUrl(item.youtubeMusicUrl),
      }];
    }

    if (item._type === 'quote' && cleanText(item.quoteText) && cleanText(item.person)) {
      const foundViaUrl = safeExternalUrl(item.foundViaLink?.url);
      return [{
        ...base,
        kind: 'quote' as const,
        quoteText: cleanText(item.quoteText) as string,
        person: cleanText(item.person) as string,
        sourceTitle: cleanText(item.sourceTitle),
        sourceUrl: safeExternalUrl(item.sourceUrl),
        foundVia: foundViaUrl ? { title: cleanText(item.foundViaLink?.title) || 'Saved link', url: foundViaUrl } : undefined,
      }];
    }

    return [];
  });
}

export function safeExternalUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeTags(tags?: RawTag[]): LogsTag[] {
  const seen = new Set<string>();
  return (tags || []).flatMap((tag) => {
    const id = cleanText(tag._id);
    const name = cleanText(tag.name);
    if (!id || !name || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name, slug: cleanText(tag.slug), group: cleanText(tag.group) }];
  });
}

function normalizeRelated(fixations?: RawRelated[], beats?: RawRelated[], releases?: RawRelated[]): RelatedArchiveItem[] {
  const fixationItems = (fixations || []).flatMap((item) => item?._id && item.title && item.slug
    ? [{ id: item._id, title: item.title, href: `/fixations/${item.slug}`, kind: 'Fixation' as const }]
    : []);
  const beatItems = (beats || []).flatMap((item) => item?._id && item.title && item.slug
    ? [{ id: item._id, title: item.title, href: `/player/beats/${item.slug}`, kind: 'Beat' as const }]
    : []);
  const releaseItems = (releases || []).flatMap((item) => item?._id && item.title && item.slug
    ? [{ id: item._id, title: item.title, href: `/releases/${item.slug}`, kind: 'Release' as const }]
    : []);
  return [...fixationItems, ...beatItems, ...releaseItems];
}

function cleanText(value?: string): string | undefined {
  const result = value?.trim();
  return result || undefined;
}

function isLogType(value?: string): value is LogType {
  return Boolean(value && logTypes.has(value as LogType));
}

function normalizeAspectRatio(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0.5 && value <= 3 ? value : undefined;
}

function getDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function detectPlatform(value?: string) {
  if (!value) return 'Saved link';
  const host = getDomain(value) || '';
  if (host.endsWith('music.youtube.com')) return 'YouTube Music';
  if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'YouTube';
  if (host.endsWith('instagram.com')) return 'Instagram';
  if (host.endsWith('tiktok.com')) return 'TikTok';
  if (host === 'x.com' || host.endsWith('twitter.com')) return 'X/Twitter';
  if (host.endsWith('spotify.com')) return 'Spotify';
  if (host.endsWith('music.apple.com')) return 'Apple Music';
  if (host.endsWith('letterboxd.com')) return 'Letterboxd';
  return 'Website/Article';
}
