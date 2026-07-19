import type { Metadata } from 'next';
import { PwaDiagnosticsPanel } from '@/src/components/pwa-diagnostics-panel';

export const metadata: Metadata = {
  title: 'PWA Diagnostics | The Kitsune Protocol',
  robots: { index: false, follow: false },
};

export default function PwaDiagnosticsPage() {
  return <PwaDiagnosticsPanel />;
}
