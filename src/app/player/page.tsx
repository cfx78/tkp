import { PlayerSections } from '@/src/components/player-sections';
import { defaultLaneAccent, validatedLaneColor } from '@/src/lib/lane-colors';
import { buildLaneQueue } from '@/src/lib/lane-queue';
import { buildReleaseQueue, type ReleaseBeatCandidate } from '@/src/lib/release-queue';
import { fetchSanity } from '@/src/sanity/lib/content';
import { lanesQuery, mainLibraryBeatsQuery, publishedBeatsQuery, recentlyAddedBeatsQuery, releasesQuery } from '@/src/sanity/lib/queries';
import type { PlayerBeat, PlayerLane, PlayerRelease } from '@/src/types/player';

type Lane = { _id: string; name?: string; slug?: string; plainDescription?: string; primaryColor?: string; coverArtUrl?: string };
type ServerRelease = Omit<PlayerRelease, 'beats'> & {
  beats?: Array<ReleaseBeatCandidate | null>;
};

export default async function PlayerPage() {
  const [mainLibrary, allBeats, recentlyAdded, lanes, releaseResults] = await Promise.all([fetchSanity<PlayerBeat[]>(mainLibraryBeatsQuery, []), fetchSanity<PlayerBeat[]>(publishedBeatsQuery, []), fetchSanity<PlayerBeat[]>(recentlyAddedBeatsQuery, []), fetchSanity<Lane[]>(lanesQuery, []), fetchSanity<ServerRelease[]>(releasesQuery, [])]);
  const releases: PlayerRelease[] = releaseResults.map((release) => ({
    ...release,
    beats: buildReleaseQueue(release.beats)
  }));
  const playerLanes: PlayerLane[] = lanes.flatMap((lane) => lane.name ? [{
    _id: lane._id,
    name: lane.name,
    slug: lane.slug,
    plainDescription: lane.plainDescription,
    coverArtUrl: lane.coverArtUrl,
    accentColor: validatedLaneColor(lane.primaryColor, defaultLaneAccent),
    beats: buildLaneQueue(allBeats, lane._id)
  }] : []);
  return <main className="mx-auto w-full max-w-[var(--player-measure)]"><PlayerSections mainLibrary={mainLibrary} allBeats={allBeats} recentlyAdded={recentlyAdded} releases={releases} lanes={playerLanes} /></main>;
}
