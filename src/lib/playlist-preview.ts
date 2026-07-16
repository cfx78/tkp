// @ts-expect-error Node 24 executes the preview tests directly and requires the extension.
import { parseAppleMusicPlaylistSource } from './apple-music-playlist.ts';
// @ts-expect-error Node 24 executes the preview tests directly and requires the extension.
import { parseSpotifyPlaylistSource } from './spotify-playlist.ts';
// @ts-expect-error Node 24 executes the preview tests directly and requires the extension.
import { parseYouTubePlaylistSource } from './youtube-playlist.ts';

export type PlaylistPreviewProvider = 'spotify' | 'appleMusic' | 'youtubeMusic' | 'youtube';

export type PlaylistPreviewOption = {
  provider: PlaylistPreviewProvider;
  label: string;
  embedUrl: string;
  externalUrl: string;
};

export type PlaylistPreviewSources = {
  spotifyUrl?: string;
  spotifyEmbedUrl?: string;
  appleMusicUrl?: string;
  youtubeMusicUrl?: string;
};

export function getPlaylistPreviewOptions(sources: PlaylistPreviewSources): PlaylistPreviewOption[] {
  const options: PlaylistPreviewOption[] = [];
  const spotify = parseSpotifyPlaylistSource(sources.spotifyUrl);
  const legacySpotify = spotify.ok ? null : parseSpotifyPlaylistSource(sources.spotifyEmbedUrl);
  const trustedSpotify = spotify.ok ? spotify : legacySpotify?.ok ? legacySpotify : null;
  if (trustedSpotify) {
    options.push({
      provider: 'spotify',
      label: 'Spotify',
      embedUrl: trustedSpotify.trustedEmbedUrl,
      externalUrl: trustedSpotify.canonicalUrl,
    });
  }

  const appleMusic = parseAppleMusicPlaylistSource(sources.appleMusicUrl);
  if (appleMusic.ok) {
    options.push({
      provider: 'appleMusic',
      label: 'Apple Music',
      embedUrl: appleMusic.trustedEmbedUrl,
      externalUrl: appleMusic.canonicalUrl,
    });
  }

  const youtube = parseYouTubePlaylistSource(sources.youtubeMusicUrl);
  if (youtube.ok) {
    options.push({
      provider: youtube.provider,
      label: youtube.provider === 'youtubeMusic' ? 'YouTube Music' : 'YouTube',
      embedUrl: youtube.trustedEmbedUrl,
      externalUrl: youtube.canonicalUrl,
    });
  }

  return options;
}
