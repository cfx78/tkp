export type ParsedAppleMusicPlaylistSource =
  | {
      ok: true;
      playlistId: string;
      canonicalUrl: string;
      trustedEmbedUrl: string;
    }
  | {
      ok: false;
      reason: string;
    };

const MAX_SOURCE_LENGTH = 100_000;
const STOREFRONT = /^[a-z]{2}$/i;
const PLAYLIST_ID = /^pl\.[A-Za-z0-9._-]+$/;
const HOSTS = new Set(['music.apple.com', 'embed.music.apple.com']);

export function parseAppleMusicPlaylistSource(source: string | null | undefined): ParsedAppleMusicPlaylistSource {
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

  if (url.protocol !== 'https:' || url.username || url.password || !HOSTS.has(url.hostname.toLowerCase())) {
    return invalidSource();
  }

  const parts = url.pathname.split('/').filter(Boolean);
  const playlistId = parts.at(-1);
  if (parts.length < 4 || !STOREFRONT.test(parts[0]) || parts[1] !== 'playlist' || !playlistId || !PLAYLIST_ID.test(playlistId)) {
    return { ok: false, reason: 'The pasted Apple Music source must be a public playlist.' };
  }

  const path = `/${parts.map(normalizePathPart).join('/')}`;
  return {
    ok: true,
    playlistId,
    canonicalUrl: `https://music.apple.com${path}`,
    trustedEmbedUrl: `https://embed.music.apple.com${path}`,
  };
}

function invalidSource(): ParsedAppleMusicPlaylistSource {
  return { ok: false, reason: 'Paste a valid Apple Music playlist URL, embed URL, or iframe code.' };
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

function normalizePathPart(part: string) {
  try {
    return encodeURIComponent(decodeURIComponent(part));
  } catch {
    return encodeURIComponent(part);
  }
}

function decodeHtmlUrl(value: string) {
  return value.replace(/&amp;/gi, '&').replace(/&#38;/g, '&').replace(/&#x26;/gi, '&').trim();
}
