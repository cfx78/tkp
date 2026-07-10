import { fetchSanity } from '@/src/sanity/lib/content';
import { fixationsQuery, lanesQuery, releasesQuery, tagsQuery } from '@/src/sanity/lib/queries';

type FilterItem = { _id: string; title?: string; name?: string; group?: string };

export default async function SearchPage() {
  const [tags, lanes, fixations, releases] = await Promise.all([
    fetchSanity<FilterItem[]>(tagsQuery, []),
    fetchSanity<FilterItem[]>(lanesQuery, []),
    fetchSanity<FilterItem[]>(fixationsQuery, []),
    fetchSanity<FilterItem[]>(releasesQuery, [])
  ]);
  const groups = [
    { label: 'Tags', items: tags },
    { label: 'Lanes', items: lanes },
    { label: 'Fixations', items: fixations },
    { label: 'Releases', items: releases }
  ];

  return (
    <main className="flex flex-col gap-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.32em] text-ember">Search</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Archive recall</h1>
        <p className="mt-3 text-sm leading-7 text-mist/70">Filter data is connected; interactive search behavior arrives in the dedicated search phase.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <article key={group.label} className="rounded-[1.5rem] border border-white/10 bg-[#0a0d14]/80 p-5">
            <h2 className="font-semibold text-white">{group.label}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.length ? group.items.slice(0, 12).map((item) => (
                <span key={item._id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist/70">{item.name || item.title}</span>
              )) : <span className="text-sm text-mist/50">No {group.label.toLowerCase()} available.</span>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
