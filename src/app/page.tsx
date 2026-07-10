export default function HomePage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-cobalt">Phase 1</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">The Kitsune Protocol</h1>
            <p className="mt-3 max-w-2xl text-sm text-mist/70 sm:text-base">
              A dark premium personal music PWA scaffold with a calm, readable system layer for beats, logs, fixations, and search.
            </p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
            Mobile-first shell
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.75rem] border border-white/10 bg-[#0a0d14]/80 p-6 shadow-soft">
          <p className="text-[11px] uppercase tracking-[0.32em] text-ember">Current phase</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Core archive foundation</h2>
          <p className="mt-3 text-sm leading-7 text-mist/70">
            This shell keeps the experience focused: a premium dark canvas, a persistent bottom rail, and clear sections for the main modes of the archive.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-cobalt">Latest beat</p>
          <p className="mt-3 text-xl font-semibold text-white">Queued for Sanity</p>
          <p className="mt-2 text-sm text-mist/70">Audio and metadata will be wired in later phases without changing this layout.</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {['Latest logs', 'Featured fixations', 'Release broadcast'].map((item) => (
          <article key={item} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-mist/50">{item}</p>
            <p className="mt-3 text-sm leading-7 text-mist/70">Prepared for structured content without adding extra features yet.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
