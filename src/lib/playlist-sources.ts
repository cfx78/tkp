export type PlaylistSources = {
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
  youtubeMusicUrl?: string | null;
};

export const PLAYLIST_SOURCE_REQUIRED_MESSAGE = 'Add at least one Spotify, Apple Music, YouTube Music, or YouTube playlist.';

export function hasPlaylistSource(sources: PlaylistSources | null | undefined): boolean {
  return Boolean(
    cleanSource(sources?.spotifyUrl)
    || cleanSource(sources?.appleMusicUrl)
    || cleanSource(sources?.youtubeMusicUrl),
  );
}

function cleanSource(value?: string | null) {
  return value?.trim();
}
