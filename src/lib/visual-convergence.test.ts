import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);

test('Home and Player visual convergence hooks are defined and connected', async () => {
  const [css, home, playerPage, playerSections] = await Promise.all([
    readFile(new URL('src/app/globals.css', root), 'utf8'),
    readFile(new URL('src/app/page.tsx', root), 'utf8'),
    readFile(new URL('src/app/player/page.tsx', root), 'utf8'),
    readFile(new URL('src/components/player-sections.tsx', root), 'utf8'),
  ]);

  for (const hook of ['home-environment', 'home-environment__city', 'visual-artwork-stage', 'visual-artwork-primary']) {
    assert.match(home, new RegExp(`className="[^"]*${hook}`));
    assert.match(css, new RegExp(`\\.${hook}(?:[\\s:{.])`));
  }

  assert.match(playerPage, /player-convergence/);
  assert.match(playerSections, /player-convergence__hero/);
  assert.match(playerSections, /visual-artwork-stage/);
  assert.match(playerSections, /visual-artwork-primary/);
  assert.match(css, /\.player-convergence\s*\{/);
  assert.match(css, /\.player-convergence__hero\s*\{/);
  assert.match(css, /--player-wide-measure:\s*64rem/);
  assert.match(playerPage, /max-w-\[var\(--player-wide-measure\)\]/);
});

test('visual atmosphere remains decorative and has accessibility fallbacks', async () => {
  const css = await readFile(new URL('src/app/globals.css', root), 'utf8');
  const home = await readFile(new URL('src/app/page.tsx', root), 'utf8');

  assert.match(home, /home-environment__city" aria-hidden="true"/);
  assert.match(css, /\.home-environment__city\s*\{[\s\S]*?pointer-events:\s*none/);
  assert.match(css, /\.visual-artwork-stage::before,[\s\S]*?pointer-events:\s*none/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*?\.home-environment__city/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
