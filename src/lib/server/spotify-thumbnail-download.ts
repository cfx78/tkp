import { lookup as dnsLookup } from 'node:dns';
import { isIP, type LookupFunction } from 'node:net';
import { request } from 'node:https';
import type { RequestOptions } from 'node:https';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { collectBoundedBytes } from './bounded-bytes.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { sanitizeThumbnailImage, type SanitizedThumbnail } from './thumbnail-image.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { validateSpotifyArtworkUrl, type SpotifyArtworkHostname, type SpotifyArtworkUrlResult } from '../spotify-artwork-url.ts';

export type SpotifyDownloadFailure = 'unsafe-thumbnail-url' | 'unsafe-address' | 'thumbnail-download-failed' | 'thumbnail-too-large' | 'thumbnail-invalid' | 'thumbnail-processing-failed';
export type SpotifyDownloadResult = { ok: true; thumbnail: SanitizedThumbnail; downloadedBytes: number } | { ok: false; reason: SpotifyDownloadFailure };
type ValidatedArtwork = Extract<SpotifyArtworkUrlResult, {ok: true}>;
export type SpotifyImageTransport = (artwork: ValidatedArtwork) => Promise<{ status: number; contentType?: string; body?: AsyncIterable<Uint8Array> }>;

export async function downloadSpotifyThumbnail(value: string, transport: SpotifyImageTransport = nodeSpotifyTransport): Promise<SpotifyDownloadResult> {
  const validated = validateSpotifyArtworkUrl(value);
  if (!validated.ok) return { ok: false, reason: 'unsafe-thumbnail-url' };
  let response;
  try { response = await transport(validated); } catch { return { ok: false, reason: 'thumbnail-download-failed' }; }
  if (response.status !== 200 || !response.body) return { ok: false, reason: 'thumbnail-download-failed' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(response.contentType?.split(';')[0].trim().toLowerCase() || '')) return { ok: false, reason: 'thumbnail-invalid' };
  const collected = await collectBoundedBytes(response.body, 8 * 1024 * 1024);
  if (!collected.ok) return { ok: false, reason: collected.reason === 'input-too-large' ? 'thumbnail-too-large' : 'thumbnail-download-failed' };
  const sanitized = await sanitizeThumbnailImage(collected.bytes);
  if (!sanitized.ok) return { ok: false, reason: sanitized.reason === 'input-too-large' || sanitized.reason === 'output-too-large' ? 'thumbnail-too-large' : sanitized.reason === 'processing-failed' ? 'thumbnail-processing-failed' : 'thumbnail-invalid' };
  return { ok: true, thumbnail: sanitized.value, downloadedBytes: collected.byteLength };
}

async function nodeSpotifyTransport(artwork: ValidatedArtwork) {
  return new Promise<{ status: number; contentType?: string; body?: AsyncIterable<Uint8Array> }>((resolve, reject) => {
    const req = request(createSpotifyRequestOptions(artwork), (res) => {
      resolve({ status: res.statusCode || 0, contentType: Array.isArray(res.headers['content-type']) ? res.headers['content-type'][0] : res.headers['content-type'], body: res });
    });
    req.once('error', reject); req.end();
  });
}

export function createSpotifyRequestOptions(artwork: ValidatedArtwork, lookup?: LookupFunction): RequestOptions {
  const verified = validateSpotifyArtworkUrl(artwork.url);
  if (!verified.ok || verified.hostname !== artwork.hostname) throw new Error('artwork rejected');
  const url = new URL(verified.url);
  return { protocol: 'https:', hostname: verified.hostname, port: 443, path: url.pathname, method: 'GET', servername: verified.hostname, signal: AbortSignal.timeout(10_000), headers: { Accept: 'image/jpeg,image/png,image/webp', 'User-Agent': 'TKP-SpotifyThumbnail/1.0' }, lookup: lookup ?? createValidatedLookup(verified.hostname) };
}

type AllAddressResolver = (hostname: string, callback: (error: NodeJS.ErrnoException | null, addresses: Array<{address: string; family: 4 | 6}>) => void) => void;

export function createValidatedLookup(expectedHostname: SpotifyArtworkHostname, resolver: AllAddressResolver = resolveAll): LookupFunction {
  return (hostname, options, callback) => {
  const all = typeof options === 'object' && options.all === true;
  if (hostname !== expectedHostname) return all ? callback(Object.assign(new Error('host rejected'), { code: 'EACCES' }), []) : callback(Object.assign(new Error('host rejected'), { code: 'EACCES' }), '', 4);
  resolver(expectedHostname, (error, addresses) => {
    if (error) return all ? callback(error, []) : callback(error, '', 4);
    const address = addresses.find((entry) => isPublicAddress(entry.address));
    if (!address || addresses.some((entry) => !isPublicAddress(entry.address))) return all ? callback(Object.assign(new Error('address rejected'), { code: 'EACCES' }), []) : callback(Object.assign(new Error('address rejected'), { code: 'EACCES' }), '', 4);
    if (all) callback(null, addresses);
    else callback(null, address.address, address.family);
  });
  };
}

function resolveAll(hostname: string, callback: (error: NodeJS.ErrnoException | null, addresses: Array<{address: string; family: 4 | 6}>) => void) {
  dnsLookup(hostname, {all: true}, (error, addresses) => {
    const normalized = addresses.flatMap((entry) => entry.family === 4 || entry.family === 6 ? [{address: entry.address, family: entry.family as 4 | 6}] : []);
    callback(error, normalized);
  });
}

export function isPublicAddress(address: string) {
  const family = isIP(address); if (!family) return false;
  if (family === 6) {
    const lower = address.toLowerCase();
    if (lower === '::' || lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || /^fe[89ab]/.test(lower) || lower.startsWith('ff')) return false;
    if (lower.startsWith('::ffff:')) return isPublicAddress(lower.slice(7));
    return !lower.startsWith('2001:db8:');
  }
  const octets = address.split('.').map(Number); const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return false;
  if ((a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0)) return false;
  return true;
}
