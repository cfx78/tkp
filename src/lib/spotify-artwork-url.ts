export type SpotifyArtworkUrlResult = { ok: true; url: string } | { ok: false; reason: string };
const MAX_URL_LENGTH = 2_048;
const ARTWORK_PATH = /^\/image\/[A-Za-z0-9]+$/;

export function validateSpotifyArtworkUrl(value: string | null | undefined): SpotifyArtworkUrlResult {
  if (!value || value.length > MAX_URL_LENGTH) return { ok: false, reason: 'invalid-url' };
  let url: URL;
  try { url = new URL(value); } catch { return { ok: false, reason: 'invalid-url' }; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || url.search) return { ok: false, reason: 'unsafe-url' };
  if (url.hostname !== 'i.scdn.co' || !ARTWORK_PATH.test(url.pathname)) return { ok: false, reason: 'unapproved-host-or-path' };
  return { ok: true, url: url.toString() };
}
