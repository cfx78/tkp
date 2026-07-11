import { BeatLibrary } from '@/src/components/beat-library';
import { fetchSanity } from '@/src/sanity/lib/content';
import { lanesQuery, publishedBeatsQuery, releasesQuery } from '@/src/sanity/lib/queries';
import type { PlayerBeat } from '@/src/types/player';

type NamedItem = { _id: string; title?: string; name?: string; shortDescription?: string; plainDescription?: string; trackCount?: number };

export default async function PlayerPage() {
  const [beats, lanes, releases] = await Promise.all([
    fetchSanity<PlayerBeat[]>(publishedBeatsQuery, []),
    fetchSanity<NamedItem[]>(lanesQuery, []),
    fetchSanity<NamedItem[]>(releasesQuery, [])
  ]);

  return (
    <main className="flex flex-col gap-7">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.32em] text-cobalt">Player library</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Beats</h1>
        <p className="mt-3 text-sm leading-7 text-mist/70">Private R2 listening copies, delivered with temporary signed playback access.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">All Beats</h2>
        <div className="mt-3"><BeatLibrary beats={beats} /></div>
      </section>

      <ContentGrid title="Lanes" items={lanes} empty="No lanes have been published." />
      <ContentGrid title="Releases" items={releases} empty="No releases have been published." />
    </main>
  );
}

function ContentGrid({ title, items, empty }: { title: string; items: NamedItem[]; empty: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.length ? items.map((item) => (
          <article key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold text-white">{item.title || item.name}</h3>
            <p className="mt-2 text-sm text-mist/60">{item.shortDescription || item.plainDescription || (item.trackCount != null ? `${item.trackCount} tracks` : 'Archive entry')}</p>
          </article>
        )) : <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-mist/60">{empty}</p>}
      </div>
    </section>
  );
}
