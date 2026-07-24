import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import sharp from 'sharp';
// @ts-expect-error Node 24 executes this TypeScript test directly.
import { sanitizeThumbnailImage, THUMBNAIL_IMAGE_POLICY } from './thumbnail-image.ts';

async function fixture(format: 'jpeg' | 'png' | 'webp', width = 40, height = 20, alpha = false) {
  const image = sharp({ create: { width, height, channels: alpha ? 4 : 3, background: alpha ? { r: 10, g: 20, b: 30, alpha: 0.4 } : { r: 10, g: 20, b: 30 } } });
  return image[format]().toBuffer();
}

test('accepts JPEG, PNG, and WebP and always emits verified WebP', async () => {
  for (const format of ['jpeg', 'png', 'webp'] as const) {
    const result = await sanitizeThumbnailImage(await fixture(format));
    assert.equal(result.ok, true, format);
    if (!result.ok) continue;
    assert.equal(result.value.mimeType, 'image/webp');
    assert.equal(result.value.extension, 'webp');
    assert.equal(result.value.width, 40);
    assert.equal(result.value.height, 20);
    assert.equal((await sharp(result.value.bytes, { animated: true }).metadata()).pages ?? 1, 1);
  }
});

test('preserves transparency while stripping metadata', async () => {
  const input = await sharp(await fixture('png', 30, 30, true)).withMetadata({ orientation: 1 }).png().toBuffer();
  const result = await sanitizeThumbnailImage(input);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const metadata = await sharp(result.value.bytes).metadata();
  assert.equal(metadata.hasAlpha, true);
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.xmp, undefined);
  assert.equal(metadata.icc, undefined);
});

test('normalizes EXIF orientation and removes the orientation tag', async () => {
  const oriented = await sharp({ create: { width: 20, height: 40, channels: 3, background: 'red' } })
    .jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const result = await sanitizeThumbnailImage(oriented);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.width, 40);
  assert.equal(result.value.height, 20);
  assert.equal((await sharp(result.value.bytes).metadata()).orientation, undefined);
});

test('does not enlarge small input and resizes large input within 1600 square', async () => {
  const small = await sanitizeThumbnailImage(await fixture('png', 100, 50));
  assert.equal(small.ok && small.value.width, 100);
  assert.equal(small.ok && small.value.height, 50);
  const large = await sanitizeThumbnailImage(await fixture('png', 2000, 1000));
  assert.equal(large.ok && large.value.width, 1600);
  assert.equal(large.ok && large.value.height, 800);
});

test('returns deterministic bytes and SHA-256 metadata', async () => {
  const input = await fixture('png', 64, 32);
  const first = await sanitizeThumbnailImage(input);
  const second = await sanitizeThumbnailImage(input);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.deepEqual(first.value.bytes, second.value.bytes);
  assert.equal(first.value.sha256, second.value.sha256);
  assert.equal(first.value.sha256, createHash('sha256').update(first.value.bytes).digest('hex'));
  assert.equal(first.value.byteLength, first.value.bytes.byteLength);
});

test('rejects empty, malformed, truncated, SVG, GIF, and unsupported input safely', async () => {
  assert.deepEqual(await sanitizeThumbnailImage(Buffer.alloc(0)), { ok: false, reason: 'empty-input' });
  assert.deepEqual(await sanitizeThumbnailImage(Buffer.from('not an image')), { ok: false, reason: 'invalid-image' });
  const jpeg = await fixture('jpeg');
  assert.deepEqual(await sanitizeThumbnailImage(jpeg.subarray(0, 20)), { ok: false, reason: 'invalid-image' });
  assert.deepEqual(await sanitizeThumbnailImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>')), { ok: false, reason: 'unsupported-format' });
  const gif = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).gif().toBuffer();
  assert.deepEqual(await sanitizeThumbnailImage(gif), { ok: false, reason: 'unsupported-format' });
  const tiff = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).tiff().toBuffer();
  assert.deepEqual(await sanitizeThumbnailImage(tiff), { ok: false, reason: 'unsupported-format' });
});

test('rejects animated accepted-format input by decoded page count', async () => {
  const twoFrameGif = Buffer.from('47494638396101000100800000000000ffffff21f904000a0000002c000000000100010000020244010021f904000a0000002c00000000010001000002024c01003b', 'hex');
  const animatedWebp = await sharp(twoFrameGif, { animated: true }).webp().toBuffer();
  assert.equal((await sharp(animatedWebp, { animated: true }).metadata()).pages, 2);
  assert.deepEqual(await sanitizeThumbnailImage(animatedWebp), { ok: false, reason: 'animated-image' });
});

test('rejects input byte overflow before decoding', async () => {
  const oversized = Buffer.alloc(THUMBNAIL_IMAGE_POLICY.maximumInputBytes + 1);
  assert.deepEqual(await sanitizeThumbnailImage(oversized), { ok: false, reason: 'input-too-large' });
});

test('rejects excessive dimensions and pixel counts', async () => {
  const tooWide = await fixture('png', 8193, 1);
  assert.deepEqual(await sanitizeThumbnailImage(tooWide), { ok: false, reason: 'dimensions-too-large' });
  const tooTall = await fixture('png', 1, 8193);
  assert.deepEqual(await sanitizeThumbnailImage(tooTall), { ok: false, reason: 'dimensions-too-large' });
  const tooManyPixels = await fixture('png', 6400, 6400);
  assert.deepEqual(await sanitizeThumbnailImage(tooManyPixels), { ok: false, reason: 'pixel-count-too-large' });
});

test('enforces the final output byte policy and re-verifies output', async () => {
  const result = await sanitizeThumbnailImage(await fixture('png'), { maximumOutputBytes: 1 });
  assert.deepEqual(result, { ok: false, reason: 'output-too-large' });
});
