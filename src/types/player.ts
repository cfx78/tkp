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
  publishedAt?: string;
  nsfw?: boolean;
  nsfwReason?: string;
  coverArt?: { _type?: string; asset?: { _type?: string; _ref?: string } };
  coverArtUrl?: string;
  lane?: {
    _id?: string;
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

export type PlaybackContextType = 'main-library' | 'all-beats' | 'release' | 'lane' | 'manual' | 'context';
export type RepeatMode = 'off' | 'all' | 'one';

export type PlaybackContext = {
  type: PlaybackContextType;
  title: string;
};

export type PlayerRelease = {
  _id: string;
  title: string;
  slug?: string;
  releaseType?: string;
  coverArtUrl?: string;
  beats: PlayerBeat[];
};

export type PlayerLane = {
  _id: string;
  name: string;
  slug?: string;
  plainDescription?: string;
  coverArtUrl?: string;
  accentColor: string;
  beats: PlayerBeat[];
};

export type ResolvedHistoryItem = PlayerBeat & {
  sourceType: 'main' | 'version';
  beatId: string;
  eligible: true;
};
