import { fetchSanity, type FixationSummary, type HomepageSettings } from '@/src/sanity/lib/content';
import { SpotifyPlaylistEmbed } from '@/src/components/spotify-playlist-embed';
import {
  homepageSettingsQuery,
  latestBeatQuery,
  latestLinkQuery,
  latestPlaylistQuery,
  latestThoughtQuery
} from '@/src/sanity/lib/queries';

type LatestItem = { _id: string; title?: string; body?: string; note?: string; shortNote?: string; url?: string; spotifyUrl?: string; spotifyEmbedUrl?: string };

export default async function HomePage() {
  const [settings, beat, link, playlist, thought] = await Promise.all([
    fetchSanity<HomepageSettings | null>(homepageSettingsQuery, null),
    fetchSanity<LatestItem | null>(latestBeatQuery, null),
    fetchSanity<LatestItem | null>(latestLinkQuery, null),
    fetchSanity<LatestItem | null>(latestPlaylistQuery, null),
    fetchSanity<LatestItem | null>(latestThoughtQuery, null)
  ]);

  const announcement = settings?.releaseAnnouncement;
  const now = Date.now();
  const announcementIsActive = Boolean(
    announcement?.enabled &&
      announcement.release &&
      (!announcement.startAt || new Date(announcement.startAt).getTime() <= now) &&
      (!announcement.endAt || new Date(announcement.endAt).getTime() >= now)
  );

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-2xl border border-cobalt/20 bg-cobalt/10 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.32em] text-cobalt">Current phase</p>
        <p className="mt-1 text-sm text-mist/80">{settings?.currentPhaseText || 'The next phase is still taking shape.'}</p>
      </section>

      {announcementIsActive && (
        <section className="rounded-[1.75rem] border border-ember/30 bg-ember/10 p-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-ember">New release</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            {announcement?.headline || announcement?.release?.title}
          </h1>
        </section>
      )}

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cobalt">Latest beat</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{beat?.title || 'No beats published yet'}</h1>
        <p className="mt-3 text-sm text-mist/70">{beat?.shortNote || 'The latest beat will appear here when the archive is ready.'}</p>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-ember">Featured fixations</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Rabbit holes in focus</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(settings?.featuredFixations?.length ? settings.featuredFixations : [null]).map((fixation: FixationSummary | null, index) => (
            <article key={fixation?._id || index} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-lg font-semibold text-white">{fixation?.title || 'No featured fixations yet'}</p>
              <p className="mt-2 text-sm leading-6 text-mist/70">
                {fixation?.shortDescription || 'Selected fixations will appear here once homepage settings are published.'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.32em] text-cobalt">Latest logs</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <LatestCard label="Latest link" item={link} empty="No links saved yet" />
          <PlaylistCard item={playlist} />
          <LatestCard label="Latest thought" item={thought} empty="No thoughts published yet" />
        </div>
      </section>
    </main>
  );
}

function PlaylistCard({ item }: { item: LatestItem | null }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[#0a0d14]/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.28em] text-mist/50">Latest playlist</p>
      <h3 className="mt-3 font-semibold text-white">{item?.title || 'No playlists saved yet'}</h3>
      {item ? (
        <SpotifyPlaylistEmbed title={item.title || 'Spotify playlist'} spotifyUrl={item.spotifyUrl} spotifyEmbedUrl={item.spotifyEmbedUrl} />
      ) : (
        <p className="mt-2 text-sm leading-6 text-mist/70">Content will appear here automatically.</p>
      )}
    </article>
  );
}

function LatestCard({ label, item, empty }: { label: string; item: LatestItem | null; empty: string }) {
  const untitledLabel = item?.url ? 'Saved link' : 'Untitled thought';

  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[#0a0d14]/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.28em] text-mist/50">{label}</p>
      <h3 className="mt-3 font-semibold text-white">{item ? item.title || untitledLabel : empty}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-mist/70">
        {item?.body || item?.note || item?.shortNote || item?.url || 'Content will appear here automatically.'}
      </p>
    </article>
  );
}
