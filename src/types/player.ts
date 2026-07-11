export type PlayerBeat = {
  _id: string;
  sourceType?: 'main' | 'version';
  parentBeatId?: string;
  versionKey?: string;
  versionType?: string;
  parentBeatTitle?: string;
  parentBeatSlug?: string;
  title: string;
  slug?: string;
  status?: string;
  coverArtUrl?: string;
  lane?: {
    name?: string;
    slug?: string;
    fallbackCoverArtUrl?: string;
  };
  releases?: Array<{
    _id: string;
    title: string;
    slug?: string;
  }>;
};

export type PlaybackContextType = 'main-library' | 'all-beats' | 'release' | 'manual' | 'context';
export type RepeatMode = 'off' | 'all' | 'one';

export type PlaybackContext = {
  type: PlaybackContextType;
  title: string;
};

export type PlayerRelease = {
  _id: string;
  title: string;
  releaseType?: string;
  coverArtUrl?: string;
  beats: PlayerBeat[];
};
