export type YouTubePlaylistProvider = 'youtube' | 'youtubeMusic';

export type ParsedYouTubePlaylistSource =
  | {
      ok: true;
      provider: YouTubePlaylistProvider;
      playlistId: string;
      canonicalUrl: string;
      trustedEmbedUrl: string;
    }
  | {
      ok: false;
      reason: string;
    };

const MAX_SOURCE_LENGTH = 100_000;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,80}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PUBLIC_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
const EMBED_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com']);

export function parseYouTubePlaylistSource(source: string | null | undefined): ParsedYouTubePlaylistSource {
  const value = source?.trim();
  if (!value || value.length > MAX_SOURCE_LENGTH || /\0/.test(value)) return invalidSource();

  const extracted = extractIframeSource(value);
  if (looksLikeMarkup(value) && !extracted) return invalidSource();
  const candidate = extracted || value;

  let url: URL;
  try {
    url = new URL(decodeHtmlUrl(candidate));
  } catch {
    return invalidSource();
  }

  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || (!PUBLIC_HOSTS.has(host) && !EMBED_HOSTS.has(host))) {
    return invalidSource();
  }

  const parts = url.pathname.split('/').filter(Boolean);
  const isEmbedHost = EMBED_HOSTS.has(host);
  const isEmbedPath = parts[0] === 'embed';
  const isPublicPlaylist = url.pathname === '/playlist';
  const isWatchPlaylist = url.pathname === '/watch' && Boolean(url.searchParams.get('v'));
  const isVideoEmbedPlaylist = isEmbedPath && parts.length === 2 && (parts[1] === 'videoseries' || VIDEO_ID.test(parts[1]));
  const isListOnlyEmbed = isEmbedPath && parts.length === 1 && url.searchParams.get('listType') === 'playlist';
  const supportedPath = isPublicPlaylist || isWatchPlaylist || isVideoEmbedPlaylist || isListOnlyEmbed;

  if (!supportedPath || (isEmbedHost && !isEmbedPath)) {
    return { ok: false, reason: 'The pasted YouTube source must be a supported playlist URL or playlist embed.' };
  }

  const playlistId = url.searchParams.get('list');
  if (!playlistId || !PLAYLIST_ID.test(playlistId) || playlistId.startsWith('RD')) {
    return { ok: false, reason: 'The YouTube playlist ID is missing, malformed, or not a stable playlist.' };
  }

  const provider: YouTubePlaylistProvider = host === 'music.youtube.com' ? 'youtubeMusic' : 'youtube';
  const publicHost = provider === 'youtubeMusic' ? 'music.youtube.com' : 'www.youtube.com';
  return {
    ok: true,
    provider,
    playlistId,
    canonicalUrl: `https://${publicHost}/playlist?list=${playlistId}`,
    trustedEmbedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`,
  };
}

export function youtubePlaylistProviderLabel(value?: string): 'YouTube' | 'YouTube Music' {
  const parsed = parseYouTubePlaylistSource(value);
  return parsed.ok && parsed.provider === 'youtubeMusic' ? 'YouTube Music' : 'YouTube';
}

function invalidSource(): ParsedYouTubePlaylistSource {
  return { ok: false, reason: 'Paste a valid YouTube or YouTube Music playlist URL, embed URL, or iframe code.' };
}

function looksLikeMarkup(value: string) {
  return /<[^>]*>/i.test(value);
}

function extractIframeSource(value: string): string | null {
  const completeIframe = value.match(/^\s*(<iframe\b[^>]*>[\s\S]*?<\/iframe>)\s*$/i)?.[1];
  if (!completeIframe) return null;
  const tag = completeIframe.match(/<iframe\b[^>]*>/i)?.[0];
  return tag?.match(/\ssrc\s*=\s*(["'])(.*?)\1/i)?.[2] || null;
}

function decodeHtmlUrl(value: string) {
  return value.replace(/&amp;/gi, '&').replace(/&#38;/g, '&').replace(/&#x26;/gi, '&').trim();
}
