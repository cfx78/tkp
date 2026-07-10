import { fetchSanity } from '@/src/sanity/lib/content';
import { logsQuery } from '@/src/sanity/lib/queries';

type LogItem = { _id: string; title?: string; body?: string; bullets?: string[]; logType: string; publishedAt?: string };

export default async function LogsPage() {
  const logs = await fetchSanity<LogItem[]>(logsQuery, []);
  return (
    <main className="flex flex-col gap-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.32em] text-ember">Logs</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Notes from the archive</h1>
        <p className="mt-3 text-sm leading-7 text-mist/70">Thoughts, life updates, beat notes, fixation notes, movie thoughts, and quick lists.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {logs.length ? logs.map((log) => (
          <article key={log._id} className="rounded-[1.5rem] border border-white/10 bg-[#0a0d14]/80 p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-cobalt">{log.logType}</p>
            {log.title && <h2 className="mt-3 text-lg font-semibold text-white">{log.title}</h2>}
            {log.body && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-mist/70">{log.body}</p>}
            {log.bullets?.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist/70">{log.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
          </article>
        )) : <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-mist/60">No logs have been published yet.</p>}
      </section>
    </main>
  );
}
