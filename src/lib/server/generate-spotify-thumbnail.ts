// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { parseSpotifyThumbnailSource } from '../spotify-thumbnail-source.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { validateSpotifyArtworkUrl } from '../spotify-artwork-url.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { decideThumbnailOverwrite, type ThumbnailAutomationProvenance } from '../thumbnail-overwrite-policy.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { fetchSpotifyOEmbed, type SpotifyOEmbedResult } from './spotify-oembed.ts';
// @ts-expect-error Node 24 executes provider tests directly and requires extensions.
import { downloadSpotifyThumbnail, type SpotifyDownloadResult } from './spotify-thumbnail-download.ts';

export type GenerateSpotifyThumbnailFailure = 'invalid-request' | 'wrong-document-type' | 'document-not-found' | 'unsupported-source' | 'source-changed' | 'thumbnail-protected' | 'replacement-confirmation-required' | 'provider-not-found' | 'provider-rate-limited' | 'provider-timeout' | 'provider-unavailable' | 'unsafe-provider-response' | 'no-thumbnail' | 'unsafe-thumbnail-url' | 'thumbnail-download-failed' | 'thumbnail-too-large' | 'thumbnail-invalid' | 'thumbnail-processing-failed' | 'sanity-upload-failed' | 'document-conflict' | 'document-patch-failed';
export type GenerateSpotifyThumbnailResult = { ok: true; documentId: string; assetId: string; sha256: string } | { ok: false; reason: GenerateSpotifyThumbnailFailure };

type LinkDocument = { _id: string; _rev: string; _type: string; url?: string; thumbnail?: { asset?: { _ref?: string } }; thumbnailAutomation?: ThumbnailAutomationProvenance };
type UploadedAsset = { _id: string };
type PatchBuilder = { ifRevisionId(revision: string): PatchBuilder; set(value: Record<string, unknown>): PatchBuilder; commit(): Promise<unknown> };
export type ThumbnailSanityClient = {
  getDocument<T>(id: string): Promise<T | undefined>;
  assets: { upload(type: 'image', bytes: Buffer, options: { filename: string; contentType: 'image/webp' }): Promise<UploadedAsset> };
  patch(id: string): PatchBuilder;
};

export type GenerateSpotifyThumbnailDependencies = {
  client: ThumbnailSanityClient;
  oEmbed?: (canonicalUrl: string) => Promise<SpotifyOEmbedResult>;
  download?: (url: string) => Promise<SpotifyDownloadResult>;
  now?: () => Date;
};

export async function generateSpotifyThumbnail(command: { documentId: string; expectedRevision: string; sourceCanonicalUrl: string; replacementConfirmed: boolean }, dependencies: GenerateSpotifyThumbnailDependencies): Promise<GenerateSpotifyThumbnailResult> {
  if (!validDocumentId(command.documentId) || !command.expectedRevision || typeof command.sourceCanonicalUrl !== 'string' || typeof command.replacementConfirmed !== 'boolean') return fail('invalid-request');
  const initial = await dependencies.client.getDocument<LinkDocument>(command.documentId);
  if (!initial) return fail('document-not-found');
  if (initial._type !== 'link') return fail('wrong-document-type');
  if (initial._rev !== command.expectedRevision) return fail('document-conflict');
  const parsed = parseSpotifyThumbnailSource(initial.url);
  if (!parsed.ok) return fail('unsupported-source');
  if (parsed.canonicalUrl !== initial.url || command.sourceCanonicalUrl !== initial.url) return fail('source-changed');
  const overwrite = decideThumbnailOverwrite({ currentThumbnailAssetRef: initial.thumbnail?.asset?._ref, currentSourceUrl: initial.url, provenance: initial.thumbnailAutomation, replacementConfirmed: command.replacementConfirmed });
  if (!overwrite.allowed) return fail(overwrite.requiresConfirmation ? 'replacement-confirmation-required' : 'thumbnail-protected');

  const metadata = await (dependencies.oEmbed ?? fetchSpotifyOEmbed)(parsed.canonicalUrl);
  if (!metadata.ok) return fail(metadata.reason === 'invalid-source' ? 'unsupported-source' : metadata.reason);
  const artwork = validateSpotifyArtworkUrl(metadata.thumbnailUrl);
  if (!artwork.ok) return fail('unsafe-thumbnail-url');
  const downloaded = await (dependencies.download ?? downloadSpotifyThumbnail)(artwork.url);
  if (!downloaded.ok) return fail(downloaded.reason === 'unsafe-address' ? 'thumbnail-download-failed' : downloaded.reason);
  const shortHash = downloaded.thumbnail.sha256.slice(0, 12);
  let asset: UploadedAsset;
  try {
    asset = await dependencies.client.assets.upload('image', downloaded.thumbnail.bytes, { filename: `spotify-${parsed.entityType}-${parsed.entityId}-${shortHash}.webp`, contentType: 'image/webp' });
  } catch { return fail('sanity-upload-failed'); }
  if (!asset._id) return fail('sanity-upload-failed');

  const current = await dependencies.client.getDocument<LinkDocument>(command.documentId);
  if (!current || current._type !== 'link' || current._rev !== initial._rev) return fail('document-conflict');
  if (current.url !== initial.url) return fail('source-changed');
  if (current.thumbnail?.asset?._ref !== initial.thumbnail?.asset?._ref || JSON.stringify(current.thumbnailAutomation ?? null) !== JSON.stringify(initial.thumbnailAutomation ?? null)) return fail('document-conflict');
  const provenance = { provider: 'spotify', sourceCanonicalUrl: parsed.canonicalUrl, fetchedAt: (dependencies.now ?? (() => new Date()))().toISOString(), assetRef: asset._id, sha256: downloaded.thumbnail.sha256, method: 'spotify-oembed-v1' };
  try {
    await dependencies.client.patch(command.documentId).ifRevisionId(initial._rev).set({ thumbnail: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }, thumbnailAutomation: { _type: 'thumbnailAutomation', ...provenance } }).commit();
  } catch (error) {
    return fail(isConflict(error) ? 'document-conflict' : 'document-patch-failed');
  }
  return { ok: true, documentId: command.documentId, assetId: asset._id, sha256: downloaded.thumbnail.sha256 };
}

function validDocumentId(value: string) { return typeof value === 'string' && value.length <= 256 && /^(?:drafts\.)?[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(value); }
function isConflict(error: unknown) { return error instanceof Error && /conflict|revision/i.test(error.message); }
function fail(reason: GenerateSpotifyThumbnailFailure): GenerateSpotifyThumbnailResult { return { ok: false, reason }; }
