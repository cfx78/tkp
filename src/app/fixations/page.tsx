import { fetchSanity, type FixationSummary } from '@/src/sanity/lib/content';
import { fixationsQuery } from '@/src/sanity/lib/queries';

export default async function FixationsPage() {
  const fixations = await fetchSanity<FixationSummary[]>(fixationsQuery, []);
  return (
    <main className="flex flex-col gap-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.32em] text-cobalt">Fixations</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Current obsessions</h1>
        <p className="mt-3 text-sm leading-7 text-mist/70">Core, active, sleeping, and archived rabbit-hole containers.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {fixations.length ? fixations.map((fixation) => (
          <article key={fixation._id} className="rounded-[1.5rem] border border-white/10 bg-[#0a0d14]/80 p-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-mist/50">
              {fixation.isCore && <span className="text-ember">Core</span>}
              <span>{fixation.status || 'active'}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">{fixation.title}</h2>
            <p className="mt-2 text-sm leading-6 text-mist/70">{fixation.shortDescription || 'Description coming soon.'}</p>
          </article>
        )) : <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-mist/60">No fixations have been published yet.</p>}
      </section>
    </main>
  );
}
