import { PlayerSections } from '@/src/components/player-sections';
import { fetchSanity } from '@/src/sanity/lib/content';
import { lanesQuery, mainLibraryBeatsQuery, publishedBeatsQuery, releasesQuery } from '@/src/sanity/lib/queries';
import type { PlayerBeat, PlayerRelease } from '@/src/types/player';

type Lane = { _id: string; name?: string; plainDescription?: string };
export default async function PlayerPage() {
  const [mainLibrary, allBeats, lanes, releases] = await Promise.all([fetchSanity<PlayerBeat[]>(mainLibraryBeatsQuery, []), fetchSanity<PlayerBeat[]>(publishedBeatsQuery, []), fetchSanity<Lane[]>(lanesQuery, []), fetchSanity<PlayerRelease[]>(releasesQuery, [])]);
  return <main className="flex flex-col gap-7"><PlayerSections mainLibrary={mainLibrary} allBeats={allBeats} releases={releases} /><section><h2 className="text-xl font-semibold text-white">Lanes</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{lanes.map((lane) => <article key={lane._id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="font-semibold text-white">{lane.name}</h3><p className="mt-2 text-sm text-mist/60">{lane.plainDescription || 'Sound archive'}</p></article>)}</div></section></main>;
}
