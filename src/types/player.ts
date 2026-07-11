export type PlayerBeat = {
  _id: string;
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

export type PlaybackContextType = 'main-library' | 'all-beats' | 'release' | 'manual';

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
