import { PlayerSections } from '@/src/components/player-sections';
import { fetchSanity } from '@/src/sanity/lib/content';
import { lanesQuery, mainLibraryBeatsQuery, publishedBeatsQuery, releasesQuery } from '@/src/sanity/lib/queries';
import type { PlayerBeat, PlayerRelease } from '@/src/types/player';

type Lane = { _id: string; name?: string; plainDescription?: string };
type ServerRelease = Omit<PlayerRelease, 'beats'> & {
  beats?: Array<(PlayerBeat & { audioAvailable?: boolean }) | null>;
};

const releaseStatuses = new Set(['main', 'approvedDemo', 'sketch', 'roughMix', 'alternateMix']);

export default async function PlayerPage() {
  const [mainLibrary, allBeats, lanes, releaseResults] = await Promise.all([fetchSanity<PlayerBeat[]>(mainLibraryBeatsQuery, []), fetchSanity<PlayerBeat[]>(publishedBeatsQuery, []), fetchSanity<Lane[]>(lanesQuery, []), fetchSanity<ServerRelease[]>(releasesQuery, [])]);
  const releases: PlayerRelease[] = releaseResults.map((release) => ({
    ...release,
    beats: (release.beats || [])
      .filter((beat): beat is PlayerBeat & { audioAvailable: true } => Boolean(beat?.audioAvailable && beat.status && releaseStatuses.has(beat.status)))
      .map(({ audioAvailable: _audioAvailable, ...beat }) => beat)
  }));
  return <main className="flex flex-col gap-7"><PlayerSections mainLibrary={mainLibrary} allBeats={allBeats} releases={releases} /><section><h2 className="text-xl font-semibold text-white">Lanes</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{lanes.map((lane) => <article key={lane._id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="font-semibold text-white">{lane.name}</h3><p className="mt-2 text-sm text-mist/60">{lane.plainDescription || 'Sound archive'}</p></article>)}</div></section></main>;
}
