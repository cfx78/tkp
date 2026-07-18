import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/src/components/app-shell';
import { PlayerProvider } from '@/src/components/player-provider';
import { ContentWarningProvider } from '@/src/components/content-warning-provider';

export const metadata: Metadata = {
  title: 'The Kitsune Protocol',
  description: 'A dark premium personal music PWA and archive.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
