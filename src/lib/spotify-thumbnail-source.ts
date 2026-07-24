export type SpotifyThumbnailSource =
  | { ok: true; entityType: 'track' | 'album'; entityId: string; canonicalUrl: string }
  | { ok: false; reason: 'empty' | 'too-long' | 'unsafe-url' | 'unsupported-host' | 'unsupported-entity' | 'malformed-id' | 'invalid-source' };

const MAX_SOURCE_LENGTH = 100_000;
const SPOTIFY_ID = /^[A-Za-z0-9]{10,64}$/;

export function parseSpotifyThumbnailSource(source: string | null | undefined): SpotifyThumbnailSource {
  const value = source?.trim();
  if (!value) return { ok: false, reason: 'empty' };
  if (value.length > MAX_SOURCE_LENGTH) return { ok: false, reason: 'too-long' };
  if (/\0/.test(value)) return { ok: false, reason: 'invalid-source' };
  const candidate = extractIframeSource(value) ?? value;
  let url: URL;
  try { url = new URL(decodeHtmlUrl(candidate)); } catch { return { ok: false, reason: 'invalid-source' }; }
  if (url.protocol !== 'https:' || url.username || url.password) return { ok: false, reason: 'unsafe-url' };
  if (url.hostname.toLowerCase() !== 'open.spotify.com') return { ok: false, reason: 'unsupported-host' };
  const parts = url.pathname.split('/').filter(Boolean);
  const offset = parts[0] === 'embed' ? 1 : 0;
  const entityType = parts[offset];
  const entityId = parts[offset + 1];
  if (parts.length !== offset + 2 || (entityType !== 'track' && entityType !== 'album')) {
    return { ok: false, reason: 'unsupported-entity' };
  }
  if (!entityId || !SPOTIFY_ID.test(entityId)) return { ok: false, reason: 'malformed-id' };
  return { ok: true, entityType, entityId, canonicalUrl: `https://open.spotify.com/${entityType}/${entityId}` };
}

function extractIframeSource(value: string) {
  if (!/<\s*iframe\b/i.test(value)) return null;
  const tag = value.match(/^\s*<iframe\b[^>]*>\s*(?:<\/iframe>)?\s*$/i)?.[0];
  return tag?.match(/\ssrc\s*=\s*(["'])(.*?)\1/i)?.[2] ?? null;
}

function decodeHtmlUrl(value: string) {
  return value.replace(/&amp;/gi, '&').replace(/&#38;/g, '&').replace(/&#x26;/gi, '&').trim();
}
