import { PlayerSections } from '@/src/components/player-sections';
import { fetchSanity } from '@/src/sanity/lib/content';
import { lanesQuery, mainLibraryBeatsQuery, publishedBeatsQuery, recentlyAddedBeatsQuery, releasesQuery } from '@/src/sanity/lib/queries';
import type { PlayerBeat, PlayerRelease } from '@/src/types/player';

type Lane = { _id: string; name?: string; plainDescription?: string; primaryColor?: string; fallbackCoverArt?: { asset?: { url?: string } } };
type ServerRelease = Omit<PlayerRelease, 'beats'> & {
  beats?: Array<(PlayerBeat & { audioAvailable?: boolean }) | null>;
};

const releaseStatuses = new Set(['main', 'approvedDemo', 'sketch', 'roughMix', 'alternateMix']);

export default async function PlayerPage() {
  const [mainLibrary, allBeats, recentlyAdded, lanes, releaseResults] = await Promise.all([fetchSanity<PlayerBeat[]>(mainLibraryBeatsQuery, []), fetchSanity<PlayerBeat[]>(publishedBeatsQuery, []), fetchSanity<PlayerBeat[]>(recentlyAddedBeatsQuery, []), fetchSanity<Lane[]>(lanesQuery, []), fetchSanity<ServerRelease[]>(releasesQuery, [])]);
  const releases: PlayerRelease[] = releaseResults.map((release) => ({
    ...release,
    beats: (release.beats || [])
      .filter((beat): beat is PlayerBeat & { audioAvailable: true } => Boolean(beat?.audioAvailable && beat.status && releaseStatuses.has(beat.status)))
      .map(({ audioAvailable: _audioAvailable, ...beat }) => beat)
  }));
  return <main className="mx-auto w-full max-w-[var(--player-measure)]"><PlayerSections mainLibrary={mainLibrary} allBeats={allBeats} recentlyAdded={recentlyAdded} releases={releases} /><section className="mt-[var(--section-rhythm)]"><p className="type-protocol-label">Sound categories</p><h2 className="type-section-heading mt-2">Lanes</h2><div className="mt-6 border-t border-[var(--line-subtle)]">{lanes.map((lane, index) => <article key={lane._id} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-[var(--line-subtle)] py-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"><div className="aspect-square overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)]">{lane.fallbackCoverArt?.asset?.url ? <img src={lane.fallbackCoverArt.asset.url} alt="" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0"><h3 className="text-lg font-semibold text-[var(--text-primary)]">{lane.name}</h3><p className="type-small mt-1">{lane.plainDescription || 'Sound archive'}</p></div><span className="type-numeric hidden sm:block">0{index + 1}</span></article>)}</div></section></main>;
}
