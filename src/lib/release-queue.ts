import type { PlayerBeat } from '@/src/types/player';

export type ReleaseBeatCandidate = PlayerBeat & {
  audioAvailable?: boolean;
};

const playableReleaseStatuses = new Set([
  'main',
  'approvedDemo',
  'sketch',
  'roughMix',
  'alternateMix'
]);

export function buildReleaseQueue(beats: Array<ReleaseBeatCandidate | null> | undefined): PlayerBeat[] {
  return (beats || [])
    .filter((beat): beat is ReleaseBeatCandidate & { audioAvailable: true } =>
      Boolean(beat?.audioAvailable && beat.status && playableReleaseStatuses.has(beat.status)))
    .map(({ audioAvailable: _audioAvailable, ...beat }) => beat);
}
