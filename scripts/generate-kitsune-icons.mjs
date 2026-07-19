import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const brandDir = path.join(root, 'public', 'brand');
const source = await readFile(path.join(brandDir, 'kitsune-mark.svg'), 'utf8');
const whiteMark = source.replaceAll('currentColor', '#F4F6F8');
const background = '#05070B';

await mkdir(brandDir, { recursive: true });

const assets = [
  ['favicon-16.png', 16, 0.82],
  ['favicon-32.png', 32, 0.82],
  ['icon-48.png', 48, 0.78],
  ['apple-touch-icon.png', 180, 0.72],
  ['icon-192.png', 192, 0.72],
  ['icon-512.png', 512, 0.72],
  ['icon-maskable-192.png', 192, 0.58],
  ['icon-maskable-512.png', 512, 0.58],
];

for (const [name, size, scale] of assets) {
  const markSize = Math.max(1, Math.round(size * scale));
  const inset = Math.floor((size - markSize) / 2);
  const mark = await sharp(Buffer.from(whiteMark)).resize(markSize, markSize, { fit: 'contain' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, left: inset, top: inset }])
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(path.join(brandDir, name));
}

const appDir = path.join(root, 'src', 'app');
await copyFile(path.join(brandDir, 'icon-512.png'), path.join(appDir, 'icon.png'));
await copyFile(path.join(brandDir, 'apple-touch-icon.png'), path.join(appDir, 'apple-icon.png'));
