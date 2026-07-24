import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/src/components/app-shell';
import { PlayerProvider } from '@/src/components/player-provider';
import { ContentWarningProvider } from '@/src/components/content-warning-provider';
import { Anton, Josefin_Sans } from 'next/font/google';
import { PwaRegistration } from '@/src/components/pwa-registration';

const brandDisplay = Anton({ subsets: ['latin'], weight: '400', variable: '--font-brand-display', display: 'swap' });
const editorialDisplay = Josefin_Sans({ subsets: ['latin'], weight: ['300', '400'], variable: '--font-editorial-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'The Kitsune Protocol',
  description: 'A dark premium personal music PWA and archive.',
  manifest: '/manifest.webmanifest',
  applicationName: 'The Kitsune Protocol',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Kitsune Protocol',
  },
  icons: {
    icon: [
      { url: '/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05070b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${brandDisplay.variable} ${editorialDisplay.variable}`}>
      <body>
        <PwaRegistration />
        <ContentWarningProvider>
          <PlayerProvider>
            <AppShell>{children}</AppShell>
          </PlayerProvider>
        </ContentWarningProvider>
      </body>
    </html>
  );
}
