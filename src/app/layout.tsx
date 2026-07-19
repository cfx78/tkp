import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/src/components/app-shell';
import { PlayerProvider } from '@/src/components/player-provider';
import { ContentWarningProvider } from '@/src/components/content-warning-provider';
import { Anton, Josefin_Sans } from 'next/font/google';

const brandDisplay = Anton({ subsets: ['latin'], weight: '400', variable: '--font-brand-display', display: 'swap' });
const editorialDisplay = Josefin_Sans({ subsets: ['latin'], weight: ['300', '400'], variable: '--font-editorial-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'The Kitsune Protocol',
  description: 'A dark premium personal music PWA and archive.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${brandDisplay.variable} ${editorialDisplay.variable}`}>
      <body>
        <ContentWarningProvider>
          <PlayerProvider>
            <AppShell>{children}</AppShell>
          </PlayerProvider>
        </ContentWarningProvider>
      </body>
    </html>
  );
}
