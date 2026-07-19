import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);

test('display font variables are scoped while functional body font remains unchanged', async () => {
  const layout = await readFile(new URL('src/app/layout.tsx', root), 'utf8');
  const css = await readFile(new URL('src/app/globals.css', root), 'utf8');
  assert.match(layout, /Anton/);
  assert.match(layout, /Josefin_Sans/);
  assert.match(layout, /--font-brand-display/);
  assert.match(layout, /--font-editorial-display/);
  assert.match(css, /--font-ui: "Avenir Next"/);
  assert.match(css, /body[\s\S]*font-family: var\(--font-ui\)/);
  assert.doesNotMatch(css, /(?:^|\n)h1\s*\{/);
});

test('wordmark exposes semantic text once and glow only through CSS', async () => {
  const component = await readFile(new URL('src/components/brand-wordmark.tsx', root), 'utf8');
  const semanticText = component.match(/>\s*THE KITSUNE PROTOCOL\s*</g) || [];
  assert.equal(semanticText.length, 1);
  assert.doesNotMatch(component, /aria-hidden|use client|<svg|<img/);
  const css = await readFile(new URL('src/app/globals.css', root), 'utf8');
  assert.match(css, /\.brand-wordmark/);
  assert.match(css, /text-shadow:/);
});

test('editorial extrusion is opt-in and accessibility-tree neutral', async () => {
  const component = await readFile(new URL('src/components/editorial-display-title.tsx', root), 'utf8');
  const css = await readFile(new URL('src/app/globals.css', root), 'utf8');
  assert.doesNotMatch(component, /use client/);
  assert.match(css, /\.editorial-display-title--extruded::before/);
  assert.match(css, /content: attr\(data-text\)/);
});
