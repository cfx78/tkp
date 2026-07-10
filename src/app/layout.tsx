import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/src/components/app-shell';

export const metadata: Metadata = {
  title: 'The Kitsune Protocol',
  description: 'A dark premium personal music PWA and archive.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
