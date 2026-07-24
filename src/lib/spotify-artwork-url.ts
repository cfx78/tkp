export type SpotifyArtworkHostname = 'i.scdn.co' | 'image-cdn-fa.spotifycdn.com';
export type SpotifyArtworkUrlFailure = 'invalid-url' | 'https-required' | 'credentials-not-allowed' | 'alternate-port' | 'query-not-allowed' | 'fragment-not-allowed' | 'unsupported-host' | 'invalid-path';
export type SpotifyArtworkUrlResult = { ok: true; url: string; hostname: SpotifyArtworkHostname } | { ok: false; reason: SpotifyArtworkUrlFailure };
const MAX_URL_LENGTH = 2_048;
const ARTWORK_PATH = /^\/image\/[A-Za-z0-9]+$/;
const APPROVED_HOSTS = new Set<SpotifyArtworkHostname>(['i.scdn.co', 'image-cdn-fa.spotifycdn.com']);

export function validateSpotifyArtworkUrl(value: string | null | undefined): SpotifyArtworkUrlResult {
  if (!value || value.length > MAX_URL_LENGTH) return { ok: false, reason: 'invalid-url' };
  let url: URL;
  try { url = new URL(value); } catch { return { ok: false, reason: 'invalid-url' }; }
  if (url.protocol !== 'https:') return { ok: false, reason: 'https-required' };
  if (url.username || url.password) return { ok: false, reason: 'credentials-not-allowed' };
  if (url.port) return { ok: false, reason: 'alternate-port' };
  if (url.search) return { ok: false, reason: 'query-not-allowed' };
  if (url.hash) return { ok: false, reason: 'fragment-not-allowed' };
  if (!APPROVED_HOSTS.has(url.hostname as SpotifyArtworkHostname)) return { ok: false, reason: 'unsupported-host' };
  if (!ARTWORK_PATH.test(url.pathname)) return { ok: false, reason: 'invalid-path' };
  return { ok: true, url: url.toString(), hostname: url.hostname as SpotifyArtworkHostname };
}
