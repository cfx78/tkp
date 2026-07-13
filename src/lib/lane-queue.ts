import type { PlayerBeat } from '@/src/types/player';

export type LaneBeatCandidate = PlayerBeat & {
  audioAvailable?: boolean;
};

const playableLaneStatuses = new Set([
  'main',
  'approvedDemo',
  'sketch',
  'roughMix',
  'alternateMix'
]);

export function buildLaneQueue(beats: Array<LaneBeatCandidate | null> | undefined, laneId?: string): PlayerBeat[] {
  return (beats || [])
    .filter((beat): beat is LaneBeatCandidate => Boolean(
      beat
      && beat.audioAvailable !== false
      && beat.status
      && playableLaneStatuses.has(beat.status)
      && (!laneId || beat.lane?._id === laneId)
    ))
    .map((beat) => {
      const playerBeat = { ...beat };
      delete playerBeat.audioAvailable;
      return playerBeat;
    });
}
