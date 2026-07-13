export type LogsTag = {
  id: string;
  name: string;
  slug?: string;
  group?: string;
};

export type LogType = 'thought' | 'lifeUpdate' | 'beatNote' | 'fixationNote' | 'movieThought' | 'quickList';

type FeedBase = {
  id: string;
  publishedAt: string;
  tags: LogsTag[];
};

export type RelatedArchiveItem = {
  id: string;
  title: string;
  href: string;
  kind: 'Fixation' | 'Beat' | 'Release';
};

export type LogFeedItem = FeedBase & {
  kind: 'log';
  title?: string;
  body?: string;
  bullets: string[];
  logType: LogType;
  related: RelatedArchiveItem[];
};

export type LinkFeedItem = FeedBase & {
  kind: 'link';
  title?: string;
  url?: string;
  domain?: string;
  note?: string;
  platform: string;
  thumbnailUrl?: string;
  thumbnailAspectRatio?: number;
};

export type PlaylistFeedItem = FeedBase & {
  kind: 'playlist';
  title: string;
  shortNote?: string;
  spotifyUrl?: string;
  spotifyEmbedUrl?: string;
  appleMusicUrl?: string;
  youtubeMusicUrl?: string;
};

export type QuoteFeedItem = FeedBase & {
  kind: 'quote';
  quoteText: string;
  person: string;
  sourceTitle?: string;
  sourceUrl?: string;
  foundVia?: { title: string; url: string };
};

export type LogsFeedItem = LogFeedItem | LinkFeedItem | PlaylistFeedItem | QuoteFeedItem;
