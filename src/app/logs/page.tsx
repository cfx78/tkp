import { LogsBrowser } from '@/src/components/logs-browser';
import { normalizeLogsFeed, type RawLogsFeedItem } from '@/src/lib/logs';
import { fetchSanity } from '@/src/sanity/lib/content';
import { logsFeedQuery } from '@/src/sanity/lib/queries';

export default async function LogsPage() {
  const rawItems = await fetchSanity<RawLogsFeedItem[]>(logsFeedQuery, []);
  const items = normalizeLogsFeed(rawItems);

  return (
    <main className="mx-auto w-full max-w-4xl">
      <header className="max-w-[var(--reading-measure)] pb-8 pt-3 sm:pb-12 sm:pt-6">
        <p className="type-protocol-label">Logs</p>
        <h1 className="mt-4 text-[clamp(2.5rem,10vw,5.75rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-[var(--text-primary)]">Notes from the archive.</h1>
        <p className="type-small mt-5 max-w-xl">Logs, saved links, playlists, and other people&apos;s words&mdash;kept in the order they arrived.</p>
      </header>
      <LogsBrowser items={items} />
    </main>
  );
}
