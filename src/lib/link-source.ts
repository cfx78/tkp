export type LinkSourceProvider =
  | 'youtube'
  | 'spotify'
  | 'tiktok'
  | 'instagram'
  | 'x'
  | 'appleMusic'
  | 'youtubeMusic'
  | 'letterboxd'
  | 'website'
  | 'other';

export type ParsedLinkSource = {
  canonicalUrl: string;
  provider: LinkSourceProvider;
  contentKind?: string;
  providerId?: string;
  trustedEmbedUrl?: string;
};

const MAX_SOURCE_LENGTH = 100_000;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_PLAYLIST_ID = /^[A-Za-z0-9_-]{10,80}$/;
const SPOTIFY_ID = /^[A-Za-z0-9]{10,64}$/;
const INSTAGRAM_ID = /^[A-Za-z0-9_-]+$/;
const NUMERIC_ID = /^\d+$/;
const SPOTIFY_KINDS = new Set(['album', 'artist', 'episode', 'playlist', 'show', 'track']);
const KNOWN_PROVIDER_HOSTS = new Set([
  'youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'youtube-nocookie.com',
  'open.spotify.com', 'tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com',
  'instagram.com', 'x.com', 'twitter.com', 'mobile.twitter.com', 'music.apple.com',
  'embed.music.apple.com', 'letterboxd.com',
]);

export function parseLinkSource(source: string | null | undefined): ParsedLinkSource | null {
  const value = source?.trim();
  if (!value || value.length > MAX_SOURCE_LENGTH || /\0/.test(value)) return null;

  const isMarkup = looksLikeMarkup(value);
  const candidates = isMarkup ? extractMarkupUrls(value) : [decodeHtmlUrl(value)];
  const parsed = candidates.map(parseCandidate).filter((result): result is ParsedLinkSource => Boolean(result));
  const providerResult = parsed.find((result) => result.provider !== 'website' && result.provider !== 'other');
  return providerResult || (isMarkup ? null : parsed[0]) || null;
}

export function linkSourceProviderLabel(provider: LinkSourceProvider): string {
  const labels: Record<LinkSourceProvider, string> = {
    youtube: 'YouTube',
    spotify: 'Spotify',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    x: 'X/Twitter',
    appleMusic: 'Apple Music',
    youtubeMusic: 'YouTube Music',
    letterboxd: 'Letterboxd',
    website: 'Website/Article',
    other: 'Other',
  };
  return labels[provider];
}

function parseCandidate(value: string): ParsedLinkSource | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  url.hostname = url.hostname.toLowerCase();

  const providerResult = parseYouTube(url)
    || parseSpotify(url)
    || parseTikTok(url)
    || parseInstagram(url)
    || parseX(url)
    || parseAppleMusic(url)
    || parseLetterboxd(url);
  if (providerResult) return providerResult;
  if (KNOWN_PROVIDER_HOSTS.has(stripWww(url.hostname))) return null;
  return parseWebsite(url);
}

function parseYouTube(url: URL): ParsedLinkSource | null {
  const host = stripWww(url.hostname);
  const parts = pathParts(url);
  const isMusic = host === 'music.youtube.com';
  const isStandard = host === 'youtube.com' || host === 'm.youtube.com' || isMusic;
  const isPrivateEmbed = host === 'youtube-nocookie.com';
  let id: string | null = null;
  let playlistId: string | null = null;

  if (host === 'youtu.be' && parts.length === 1) id = parts[0];
  if (isStandard) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (url.pathname === '/playlist') playlistId = url.searchParams.get('list');
    else if (parts.length === 2 && ['embed', 'shorts', 'live'].includes(parts[0])) id = parts[1];
  }
  if (isPrivateEmbed && parts.length === 2 && parts[0] === 'embed') id = parts[1];
  if ((isStandard || isPrivateEmbed) && parts.length === 2 && parts[0] === 'embed' && parts[1] === 'videoseries') playlistId = url.searchParams.get('list');
  if (playlistId && YOUTUBE_PLAYLIST_ID.test(playlistId)) {
    const provider = isMusic ? 'youtubeMusic' : 'youtube';
    return {
      canonicalUrl: isMusic ? `https://music.youtube.com/playlist?list=${playlistId}` : `https://www.youtube.com/playlist?list=${playlistId}`,
      provider,
      contentKind: 'playlist',
      providerId: playlistId,
      trustedEmbedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`,
    };
  }
  if (!id || !YOUTUBE_ID.test(id)) return null;

  const provider = isMusic ? 'youtubeMusic' : 'youtube';
  return {
    canonicalUrl: isMusic ? `https://music.youtube.com/watch?v=${id}` : `https://www.youtube.com/watch?v=${id}`,
    provider,
    contentKind: 'video',
    providerId: id,
    trustedEmbedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
  };
}

function parseSpotify(url: URL): ParsedLinkSource | null {
  if (stripWww(url.hostname) !== 'open.spotify.com') return null;
  const parts = pathParts(url);
  const offset = parts[0] === 'embed' ? 1 : 0;
  const kind = parts[offset];
  const id = parts[offset + 1];
  if (!kind || !SPOTIFY_KINDS.has(kind) || !id || !SPOTIFY_ID.test(id)) return null;
  return {
    canonicalUrl: `https://open.spotify.com/${kind}/${id}`,
    provider: 'spotify',
    contentKind: kind,
    providerId: id,
    trustedEmbedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
  };
}

function parseTikTok(url: URL): ParsedLinkSource | null {
  const host = stripWww(url.hostname);
  if (host === 'vm.tiktok.com' || host === 'vt.tiktok.com') return genericProviderUrl(url, 'tiktok', 'share');
  if (host !== 'tiktok.com' && host !== 'm.tiktok.com') return null;
  const parts = pathParts(url);
  if (parts.length === 3 && parts[0] === 'player' && parts[1] === 'v1' && NUMERIC_ID.test(parts[2])) {
    return { canonicalUrl: `https://www.tiktok.com/player/v1/${parts[2]}`, provider: 'tiktok', contentKind: 'video', providerId: parts[2] };
  }
  if (parts.length >= 3 && parts[0].startsWith('@') && parts[1] === 'video' && NUMERIC_ID.test(parts[2])) {
    return { canonicalUrl: `https://www.tiktok.com/${parts[0]}/video/${parts[2]}`, provider: 'tiktok', contentKind: 'video', providerId: parts[2] };
  }
  return genericProviderUrl(url, 'tiktok');
}

function parseInstagram(url: URL): ParsedLinkSource | null {
  const host = stripWww(url.hostname);
  if (host !== 'instagram.com') return null;
  const parts = pathParts(url);
  if (parts.length >= 2 && ['p', 'reel', 'tv'].includes(parts[0]) && INSTAGRAM_ID.test(parts[1])) {
    return { canonicalUrl: `https://www.instagram.com/${parts[0]}/${parts[1]}/`, provider: 'instagram', contentKind: parts[0] === 'p' ? 'post' : 'video', providerId: parts[1] };
  }
  return genericProviderUrl(url, 'instagram', parts[0] === 'share' ? 'share' : undefined);
}

function parseX(url: URL): ParsedLinkSource | null {
  const host = stripWww(url.hostname);
  if (host !== 'x.com' && host !== 'twitter.com' && host !== 'mobile.twitter.com') return null;
  const parts = pathParts(url);
  if (parts.length >= 3 && parts[1] === 'status' && NUMERIC_ID.test(parts[2])) {
    return { canonicalUrl: `https://x.com/${parts[0]}/status/${parts[2]}`, provider: 'x', contentKind: 'post', providerId: parts[2] };
  }
  return genericProviderUrl(url, 'x');
}

function parseAppleMusic(url: URL): ParsedLinkSource | null {
  const host = stripWww(url.hostname);
  if (host !== 'music.apple.com' && host !== 'embed.music.apple.com') return null;
  const parts = pathParts(url);
  const kind = parts.find((part) => ['album', 'artist', 'music-video', 'playlist', 'song'].includes(part));
  const canonical = new URL(`https://music.apple.com${url.pathname}`);
  copyUsefulSearch(url, canonical, ['i']);
  return { canonicalUrl: canonical.toString(), provider: 'appleMusic', contentKind: kind };
}

function parseLetterboxd(url: URL): ParsedLinkSource | null {
  if (stripWww(url.hostname) !== 'letterboxd.com') return null;
  const parts = pathParts(url);
  const kind = ['film', 'list', 'review'].includes(parts[0]) ? parts[0] : undefined;
  return { canonicalUrl: cleanUrl(url, 'https://letterboxd.com').toString(), provider: 'letterboxd', contentKind: kind };
}

function parseWebsite(url: URL): ParsedLinkSource {
  const provider = url.hostname.includes('.') ? 'website' : 'other';
  url.hash = '';
  return { canonicalUrl: url.toString(), provider };
}

function genericProviderUrl(url: URL, provider: LinkSourceProvider, contentKind?: string): ParsedLinkSource {
  url.protocol = 'https:';
  url.hash = '';
  url.username = '';
  url.password = '';
  return { canonicalUrl: url.toString(), provider, contentKind };
}

function cleanUrl(url: URL, origin: string): URL {
  const clean = new URL(url.pathname, origin);
  clean.search = url.search;
  return clean;
}

function copyUsefulSearch(source: URL, target: URL, keys: string[]) {
  for (const key of keys) {
    const value = source.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
}

function pathParts(url: URL) {
  return url.pathname.split('/').filter(Boolean);
}

function stripWww(hostname: string) {
  return hostname.replace(/^www\./, '');
}

function looksLikeMarkup(value: string) {
  return /<\s*(?:iframe|blockquote|a)\b/i.test(value);
}

function extractMarkupUrls(markup: string): string[] {
  const urls: string[] = [];
  const tags = markup.match(/<(?:iframe|blockquote|a)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    for (const attribute of ['src', 'cite', 'data-instgrm-permalink', 'href']) {
      const match = tag.match(new RegExp(`\\s${attribute}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
      if (match?.[2]) urls.push(decodeHtmlUrl(match[2]));
    }
  }
  return urls;
}

function decodeHtmlUrl(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#x26;/gi, '&')
    .trim();
}
