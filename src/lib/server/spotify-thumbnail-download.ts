import { lookup as dnsLookup } from 'node:dns';
import { isIP } from 'node:net';
import { request } from 'node:https';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { collectBoundedBytes } from './bounded-bytes.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { sanitizeThumbnailImage, type SanitizedThumbnail } from './thumbnail-image.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { validateSpotifyArtworkUrl } from '../spotify-artwork-url.ts';

export type SpotifyDownloadFailure = 'unsafe-thumbnail-url' | 'unsafe-address' | 'thumbnail-download-failed' | 'thumbnail-too-large' | 'thumbnail-invalid' | 'thumbnail-processing-failed';
export type SpotifyDownloadResult = { ok: true; thumbnail: SanitizedThumbnail; downloadedBytes: number } | { ok: false; reason: SpotifyDownloadFailure };
export type SpotifyImageTransport = (url: URL) => Promise<{ status: number; contentType?: string; body?: AsyncIterable<Uint8Array> }>;

export async function downloadSpotifyThumbnail(value: string, transport: SpotifyImageTransport = nodeSpotifyTransport): Promise<SpotifyDownloadResult> {
  const validated = validateSpotifyArtworkUrl(value);
  if (!validated.ok) return { ok: false, reason: 'unsafe-thumbnail-url' };
  let response;
  try { response = await transport(new URL(validated.url)); } catch { return { ok: false, reason: 'thumbnail-download-failed' }; }
  if (response.status !== 200 || !response.body) return { ok: false, reason: 'thumbnail-download-failed' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(response.contentType?.split(';')[0].trim().toLowerCase() || '')) return { ok: false, reason: 'thumbnail-invalid' };
  const collected = await collectBoundedBytes(response.body, 8 * 1024 * 1024);
  if (!collected.ok) return { ok: false, reason: collected.reason === 'input-too-large' ? 'thumbnail-too-large' : 'thumbnail-download-failed' };
  const sanitized = await sanitizeThumbnailImage(collected.bytes);
  if (!sanitized.ok) return { ok: false, reason: sanitized.reason === 'input-too-large' || sanitized.reason === 'output-too-large' ? 'thumbnail-too-large' : sanitized.reason === 'processing-failed' ? 'thumbnail-processing-failed' : 'thumbnail-invalid' };
  return { ok: true, thumbnail: sanitized.value, downloadedBytes: collected.byteLength };
}

async function nodeSpotifyTransport(url: URL) {
  return new Promise<{ status: number; contentType?: string; body?: AsyncIterable<Uint8Array> }>((resolve, reject) => {
    const req = request({ protocol: 'https:', hostname: 'i.scdn.co', port: 443, path: url.pathname, method: 'GET', servername: 'i.scdn.co', signal: AbortSignal.timeout(10_000), headers: { Accept: 'image/jpeg,image/png,image/webp', 'User-Agent': 'TKP-SpotifyThumbnail/1.0' }, lookup: validatedLookup }, (res) => {
      resolve({ status: res.statusCode || 0, contentType: Array.isArray(res.headers['content-type']) ? res.headers['content-type'][0] : res.headers['content-type'], body: res });
    });
    req.once('error', reject); req.end();
  });
}

function validatedLookup(hostname: string, options: object, callback: (error: NodeJS.ErrnoException | null, address: string, family: number) => void) {
  if (hostname !== 'i.scdn.co') return callback(Object.assign(new Error('host rejected'), { code: 'EACCES' }), '', 4);
  dnsLookup(hostname, { ...(options as object), all: true }, (error, addresses) => {
    if (error) return callback(error, '', 4);
    const address = addresses.find((entry) => isPublicAddress(entry.address));
    if (!address || addresses.some((entry) => !isPublicAddress(entry.address))) return callback(Object.assign(new Error('address rejected'), { code: 'EACCES' }), '', 4);
    callback(null, address.address, address.family);
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
