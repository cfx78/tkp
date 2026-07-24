import type { PlayerBeat } from './player';

export type BeatFile = Omit<PlayerBeat, 'lane' | 'releases'> & {
  shortNote?: string; publishedAt?: string; nsfw?: boolean; nsfwReason?: string;
  lane?: PlayerBeat['lane'] & { primaryColor?: string; secondaryColor?: string };
  releases: Array<{ _id: string; title: string; slug?: string; releaseType?: string; coverArtUrl?: string }>;
  tags: Array<{ name: string; slug?: string; group?: string }>;
  relatedFixations: Array<{ _id: string; title: string; slug?: string; shortDescription?: string }>;
  relatedLogs: Array<{ _id: string; title?: string; body?: string; bullets?: string[]; logType?: string; publishedAt?: string }>;
  relatedLinks: Array<{ _id: string; title?: string; url: string; platformAuto?: string; platformOverride?: string; note?: string }>;
  relatedPlaylists: Array<{ _id: string; title: string; slug?: string; spotifyUrl?: string; spotifyEmbedUrl?: string; appleMusicUrl?: string; youtubeMusicUrl?: string; shortNote?: string }>;
  relatedQuotes: Array<{ _id: string; quoteText: string; person: string; sourceTitle?: string; sourceUrl?: string }>;
  versions: Array<{ _key: string; title: string; note?: string; versionType?: string; createdAt?: string; nsfw?: boolean; nsfwReason?: string; audioAvailable: boolean }>;
};
