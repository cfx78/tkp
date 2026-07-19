import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Kitsune Protocol',
    short_name: 'Kitsune',
    description: 'A dark premium personal music PWA and archive.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#05070b',
    theme_color: '#05070b',
    lang: 'en',
    categories: ['music', 'entertainment'],
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
