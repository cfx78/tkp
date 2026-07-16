export type ParsedSpotifyPlaylistSource =
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
const SPOTIFY_PLAYLIST_ID = /^[A-Za-z0-9]{10,64}$/;

export function parseSpotifyPlaylistSource(source: string | null | undefined): ParsedSpotifyPlaylistSource {
  const value = source?.trim();
  if (!value || value.length > MAX_SOURCE_LENGTH || /\0/.test(value)) {
    return { ok: false, reason: 'Paste a valid Spotify playlist URL, embed URL, or iframe code.' };
  }

  const candidate = extractIframeSource(value) || value;
  let url: URL;
  try {
    url = new URL(decodeHtmlUrl(candidate));
  } catch {
    return { ok: false, reason: 'Paste a valid Spotify playlist URL, embed URL, or iframe code.' };
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.hostname.toLowerCase() !== 'open.spotify.com') {
    return { ok: false, reason: 'Paste a valid Spotify playlist URL, embed URL, or iframe code.' };
  }

  const parts = url.pathname.split('/').filter(Boolean);
  const offset = parts[0] === 'embed' ? 1 : 0;
  const playlistId = parts[offset + 1];
  if (parts.length !== offset + 2 || parts[offset] !== 'playlist' || !playlistId || !SPOTIFY_PLAYLIST_ID.test(playlistId)) {
    return { ok: false, reason: 'The pasted Spotify source must be a playlist.' };
  }

  return {
    ok: true,
    playlistId,
    canonicalUrl: `https://open.spotify.com/playlist/${playlistId}`,
    trustedEmbedUrl: `https://open.spotify.com/embed/playlist/${playlistId}`,
  };
}

export function getSpotifyPlaylistEmbedUrl(spotifyUrl?: string, spotifyEmbedUrl?: string): string | null {
  const canonical = parseSpotifyPlaylistSource(spotifyUrl);
  if (canonical.ok) return canonical.trustedEmbedUrl;

  const legacy = parseSpotifyPlaylistSource(spotifyEmbedUrl);
  return legacy.ok ? legacy.trustedEmbedUrl : null;
}

function extractIframeSource(value: string): string | null {
  if (!/<\s*iframe\b/i.test(value)) return null;
  const tag = value.match(/<iframe\b[^>]*>/i)?.[0];
  if (!tag) return null;
  return tag.match(/\ssrc\s*=\s*(["'])(.*?)\1/i)?.[2] || null;
}

function decodeHtmlUrl(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#x26;/gi, '&')
    .trim();
}
