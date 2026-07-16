import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

export const THUMBNAIL_IMAGE_POLICY = Object.freeze({
  maximumInputBytes: 8 * 1024 * 1024,
  maximumInputWidth: 8_192,
  maximumInputHeight: 8_192,
  maximumInputPixels: 40_000_000,
  maximumOutputWidth: 1_600,
  maximumOutputHeight: 1_600,
  maximumOutputBytes: 3 * 1024 * 1024,
  webpQuality: 82,
});

type ThumbnailImagePolicy = typeof THUMBNAIL_IMAGE_POLICY;

export type SanitizedThumbnail = {
  bytes: Buffer;
  mimeType: 'image/webp';
  extension: 'webp';
  width: number;
  height: number;
  byteLength: number;
  sha256: string;
};

export type ThumbnailImageFailure =
  | 'empty-input'
  | 'input-too-large'
  | 'unsupported-format'
  | 'invalid-image'
  | 'animated-image'
  | 'multipage-image'
  | 'dimensions-too-large'
  | 'pixel-count-too-large'
  | 'output-too-large'
  | 'processing-failed';

export type ThumbnailImageResult =
  | { ok: true; value: SanitizedThumbnail }
  | { ok: false; reason: ThumbnailImageFailure };

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export async function sanitizeThumbnailImage(
  input: Buffer | Uint8Array,
  policyOverrides: Partial<ThumbnailImagePolicy> = {},
): Promise<ThumbnailImageResult> {
  const policy = { ...THUMBNAIL_IMAGE_POLICY, ...policyOverrides };
  const bytes = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (bytes.byteLength === 0) return failure('empty-input');
  if (bytes.byteLength > policy.maximumInputBytes) return failure('input-too-large');

  try {
    const metadata = await sharp(bytes, {
      animated: true,
      limitInputPixels: policy.maximumInputPixels,
      sequentialRead: true,
    }).metadata();

    if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) return failure('unsupported-format');
    const pageCount = metadata.pages ?? 1;
    if (pageCount > 1) {
      return metadata.format === 'webp' || metadata.format === 'png'
        ? failure('animated-image')
        : failure('multipage-image');
    }
    if (!validDimension(metadata.width) || !validDimension(metadata.height)) return failure('invalid-image');
    if (metadata.width > policy.maximumInputWidth || metadata.height > policy.maximumInputHeight) {
      return failure('dimensions-too-large');
    }
    if (metadata.width * metadata.height > policy.maximumInputPixels) return failure('pixel-count-too-large');

    const output = await sharp(bytes, {
      animated: false,
      limitInputPixels: policy.maximumInputPixels,
      sequentialRead: true,
    })
      .autoOrient()
      .resize({
        width: policy.maximumOutputWidth,
        height: policy.maximumOutputHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: policy.webpQuality, effort: 4, smartSubsample: true })
      .toBuffer();

    if (output.byteLength > policy.maximumOutputBytes) return failure('output-too-large');
    const verified = await sharp(output, {
      animated: true,
      limitInputPixels: policy.maximumInputPixels,
      sequentialRead: true,
    }).metadata();
    if (verified.format !== 'webp' || (verified.pages ?? 1) !== 1) return failure('processing-failed');
    if (!validDimension(verified.width) || !validDimension(verified.height)) return failure('processing-failed');
    if (verified.width > policy.maximumOutputWidth || verified.height > policy.maximumOutputHeight) {
      return failure('processing-failed');
    }
    if (verified.width * verified.height > policy.maximumInputPixels) return failure('processing-failed');

    return {
      ok: true,
      value: {
        bytes: output,
        mimeType: 'image/webp',
        extension: 'webp',
        width: verified.width,
        height: verified.height,
        byteLength: output.byteLength,
        sha256: createHash('sha256').update(output).digest('hex'),
      },
    };
  } catch (error) {
    if (isPixelLimitError(error)) return failure('pixel-count-too-large');
    return failure('invalid-image');
  }
}

function validDimension(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isPixelLimitError(error: unknown) {
  return error instanceof Error && /pixel limit|exceeds pixel limit/i.test(error.message);
}

function failure(reason: ThumbnailImageFailure): ThumbnailImageResult {
  return { ok: false, reason };
}
