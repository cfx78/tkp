import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);

test('Player Releases preserve complete source artwork inside a square stage', async () => {
  const [sections, sensitiveArtwork, primitives] = await Promise.all([
    readFile(new URL('src/components/player-sections.tsx', root), 'utf8'),
    readFile(new URL('src/components/sensitive-sanity-artwork.tsx', root), 'utf8'),
    readFile(new URL('src/components/presentation-primitives.tsx', root), 'utf8'),
  ]);

  assert.match(sections, /<SensitiveSanityArtwork[^>]*size="feature"[^>]*fit="contain"/);
  assert.match(sensitiveArtwork, /urlFor\(source\)\.width\(1200\)/);
  assert.match(sensitiveArtwork, /fit === 'contain' \? image\.fit\('max'\) : image\.height\(1200\)\.fit\('crop'\)/);
  assert.match(sensitiveArtwork, /<MediaArtwork[^>]*fit=\{fit\}/);
  assert.match(primitives, /fit === 'contain' \? 'object-contain object-center' : 'object-cover'/);
  assert.match(primitives, /feature: 'aspect-square/);
});
