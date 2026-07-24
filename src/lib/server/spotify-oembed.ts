import { Buffer } from 'node:buffer';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { collectBoundedBytes } from './bounded-bytes.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { parseSpotifyThumbnailSource } from '../spotify-thumbnail-source.ts';

export type SpotifyOEmbedFailure = 'invalid-source' | 'provider-not-found' | 'provider-rate-limited' | 'provider-timeout' | 'provider-unavailable' | 'unsafe-provider-response' | 'no-thumbnail';
export type SpotifyOEmbedResult = { ok: true; title: string; thumbnailUrl: string; reportedWidth?: number; reportedHeight?: number; responseBytes: number } | { ok: false; reason: SpotifyOEmbedFailure };
export type OEmbedTransport = (url: URL, init: RequestInit) => Promise<Response>;
const ENDPOINT = 'https://open.spotify.com/oembed';
const MAX_BODY = 256 * 1024;

export async function fetchSpotifyOEmbed(canonicalUrl: string, transport: OEmbedTransport = fetch): Promise<SpotifyOEmbedResult> {
  const source = parseSpotifyThumbnailSource(canonicalUrl);
  if (!source.ok || source.canonicalUrl !== canonicalUrl) return { ok: false, reason: 'invalid-source' };
  const endpoint = new URL(ENDPOINT); endpoint.searchParams.set('url', source.canonicalUrl);
  let response: Response;
  try {
    response = await transport(endpoint, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(5_000), headers: { Accept: 'application/json', 'User-Agent': 'TKP-SpotifyThumbnail/1.0' } });
  } catch (error) {
    return { ok: false, reason: error instanceof DOMException && error.name === 'TimeoutError' ? 'provider-timeout' : 'provider-unavailable' };
  }
  if (response.status >= 300 && response.status < 400) return { ok: false, reason: 'unsafe-provider-response' };
  if (response.status === 404) return { ok: false, reason: 'provider-not-found' };
  if (response.status === 429) return { ok: false, reason: 'provider-rate-limited' };
  if (response.status >= 500) return { ok: false, reason: 'provider-unavailable' };
  if (response.status !== 200) return { ok: false, reason: 'unsafe-provider-response' };
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return { ok: false, reason: 'unsafe-provider-response' };
  if (!response.body) return { ok: false, reason: 'unsafe-provider-response' };
  const collected = await collectBoundedBytes(response.body, MAX_BODY);
  if (!collected.ok) return { ok: false, reason: 'unsafe-provider-response' };
  let body: unknown;
  try { body = JSON.parse(Buffer.from(collected.bytes).toString('utf8')); } catch { return { ok: false, reason: 'unsafe-provider-response' }; }
  if (!isRecord(body) || body.provider_name !== 'Spotify' || body.type !== 'rich' || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 500) return { ok: false, reason: 'unsafe-provider-response' };
  if (body.thumbnail_url == null) return { ok: false, reason: 'no-thumbnail' };
  if (typeof body.thumbnail_url !== 'string') return { ok: false, reason: 'unsafe-provider-response' };
  if (!validOptionalDimension(body.thumbnail_width) || !validOptionalDimension(body.thumbnail_height)) return { ok: false, reason: 'unsafe-provider-response' };
  return { ok: true, title: body.title.trim(), thumbnailUrl: body.thumbnail_url, reportedWidth: body.thumbnail_width as number | undefined, reportedHeight: body.thumbnail_height as number | undefined, responseBytes: collected.byteLength };
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function validOptionalDimension(value: unknown) { return value == null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 20_000); }
