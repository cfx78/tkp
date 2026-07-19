import Link from 'next/link';
import { BrandWordmark } from '@/src/components/brand-wordmark';
import { KitsuneMark } from '@/src/components/kitsune-mark';
import { OfflineRetry } from '@/src/components/offline-retry';

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <main className="mx-auto grid min-h-screen min-h-dvh w-full max-w-2xl content-center px-[var(--page-inset-mobile)] py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="border-y border-[var(--line-subtle)] py-10 sm:py-14">
        <div className="flex items-center gap-4" aria-label="The Kitsune Protocol">
          <KitsuneMark className="h-14 w-14 shrink-0 text-[var(--text-primary)]" label="The Kitsune Protocol mask" />
          <BrandWordmark variant="compact" aria-hidden="true" />
        </div>
        <p className="type-protocol-label mt-10 text-[var(--text-muted)]">Offline</p>
        <h1 className="mt-3 text-[clamp(2rem,9vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--text-primary)]">The archive needs a connection.</h1>
        <p className="type-reading mt-5">This offline shell keeps the app recognizable, but current archive content and music are not available offline.</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
          <OfflineRetry />
          <Link href="/" className="editorial-link focusable-surface">Go Home</Link>
        </div>
      </div>
    </main>
  );
}
