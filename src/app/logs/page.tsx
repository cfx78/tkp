export default function LogsPage() {
  return (
    <main className="flex flex-col gap-4">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.32em] text-ember">Logs</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Notes from the archive</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist/70">
          Thoughts, life updates, beat notes, and quick lists will live here in a later phase.
        </p>
      </section>
    </main>
  );
}
