import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const brand = new URL('public/brand/', root);
const rasters = [
  ['favicon-16.png', 16], ['favicon-32.png', 32], ['icon-48.png', 48],
  ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512],
  ['icon-maskable-192.png', 192], ['icon-maskable-512.png', 512],
] as const;

test('approved Kitsune vector is safe, square, currentColor geometry', async () => {
  const svg = await readFile(new URL('kitsune-mark.svg', brand), 'utf8');
  assert.match(svg, /viewBox="0 0 655 655"/);
  assert.match(svg, /fill="currentColor"/);
  assert.match(svg, /fill-rule="evenodd"/);
  assert.equal((svg.match(/<path\b/g) || []).length, 5);
  assert.doesNotMatch(svg, /<script|\son\w+=|(?:href|src)=["']|<image|<filter|<linearGradient|<radialGradient|<style|<text/i);
});

test('master and React component preserve identical approved path geometry', async () => {
  const svg = await readFile(new URL('kitsune-mark.svg', brand), 'utf8');
  const component = await readFile(new URL('src/components/kitsune-mark.tsx', root), 'utf8');
  const masterPaths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]);
  const componentPaths = [...component.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(componentPaths, masterPaths);
  assert.match(component, /viewBox="0 0 655 655"/);
  assert.doesNotMatch(component, /M9 6 24 15|viewBox="0 0 64 64"/);
});

test('required raster assets decode at exact dimensions with opaque corners', async () => {
  for (const [name, size] of rasters) {
    const file = new URL(name, brand);
    assert.ok((await stat(file)).size > 0);
    const image = sharp(fileURLToPath(file));
    const metadata = await image.metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(data[3], 255);
    assert.equal(data[(info.width * info.height - 1) * 4 + 3], 255);
    assert.ok(data.some((value, index) => index % 4 !== 3 && value > 96), `${name} is blank`);
  }
});

test('App Router convention icons exist with approved installed metadata', async () => {
  const layout = await readFile(new URL('src/app/layout.tsx', root), 'utf8');
  assert.match(layout, /icons\s*:/);
  assert.match(layout, /apple-touch-icon\.png/);
  for (const [name, size] of [['icon.png', 512], ['apple-icon.png', 180]] as const) {
    const metadata = await sharp(fileURLToPath(new URL(`src/app/${name}`, root))).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
  }
});

test('identity work keeps the approved mark and never restores the KP placeholder', async () => {
  const shell = await readFile(new URL('src/components/app-shell.tsx', root), 'utf8');
  assert.match(shell, /<KitsuneMark/);
  assert.doesNotMatch(shell, />KP</);
});
