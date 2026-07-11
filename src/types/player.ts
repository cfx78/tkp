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
