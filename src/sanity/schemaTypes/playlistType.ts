import { defineField, defineType } from 'sanity';
import { parseAppleMusicPlaylistSource } from '../../lib/apple-music-playlist';
import { parseSpotifyPlaylistSource } from '../../lib/spotify-playlist';
import { parseYouTubePlaylistSource } from '../../lib/youtube-playlist';
import { hasPlaylistSource, PLAYLIST_SOURCE_REQUIRED_MESSAGE, type PlaylistSources } from '../../lib/playlist-sources';
import { AppleMusicPlaylistSourceInput } from '../components/apple-music-playlist-source-input';
import { SpotifyPlaylistSourceInput } from '../components/spotify-playlist-source-input';
import { YouTubePlaylistSourceInput } from '../components/youtube-playlist-source-input';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({
  name: 'playlist',
  title: 'Playlist',
  type: 'document',
  validation: (Rule) => Rule.custom((document) => hasPlaylistSource(document as PlaylistSources) ? true : PLAYLIST_SOURCE_REQUIRED_MESSAGE),
  fields: [
  defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
  defineField({
    name: 'spotifyUrl',
    title: 'Playlist URL or embed code',
    description: 'Optional when an Apple Music or YouTube playlist is provided. Paste a Spotify playlist URL, share URL, embed URL, or complete iframe. At least one platform is required overall; only the canonical public playlist URL is stored.',
    type: 'url',
    components: { input: SpotifyPlaylistSourceInput },
    validation: (Rule) => Rule.custom((value) => {
      if (!value) return true;
      const result = parseSpotifyPlaylistSource(value);
      return result.ok ? true : result.reason;
    })
  }),
  defineField({ name: 'shortNote', title: 'Short Note', type: 'text', rows: 3 }),
  defineField({
    name: 'appleMusicUrl',
    title: 'Apple Music playlist URL or embed code',
    description: 'Paste a normal Apple Music playlist link, Apple Music embed link, or complete Apple Music iframe code. At least one platform is required overall; only the normalized public playlist URL is stored.',
    type: 'url',
    components: { input: AppleMusicPlaylistSourceInput },
    validation: (Rule) => Rule.custom((value) => { if (!value) return true; const result = parseAppleMusicPlaylistSource(value); return result.ok ? true : result.reason; })
  }),
  defineField({
    name: 'youtubeMusicUrl',
    title: 'YouTube or YouTube Music playlist URL or embed code',
    description: 'Paste a YouTube or YouTube Music playlist link, trusted playlist embed link, or complete trusted playlist iframe code. At least one platform is required overall; only the normalized public playlist URL is stored.',
    type: 'url',
    components: { input: YouTubePlaylistSourceInput },
    validation: (Rule) => Rule.custom((value) => { if (!value) return true; const result = parseYouTubePlaylistSource(value); return result.ok ? true : result.reason; })
  }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  defineField({ name: 'relatedLanes', title: 'Related Lanes', type: 'array', of: [{ type: 'reference', to: [{ type: 'lane' }] }] }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  publishedAtField,
  ...nsfwFields,
  defineField({
    name: 'spotifyEmbedUrl',
    title: 'Spotify Embed URL',
    description: 'Legacy fallback. Existing trusted Spotify embed URLs remain supported; new entries should use Playlist URL or embed code.',
    type: 'url',
    validation: (Rule) => Rule.uri({ scheme: ['https'] }).custom((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.hostname === 'open.spotify.com' && /^\/embed\/playlist\/[^/]+\/?$/.test(url.pathname)
          ? true
          : 'Enter only an open.spotify.com/embed/playlist URL.';
      } catch {
        return 'Enter a valid Spotify embed URL.';
      }
    })
  })
] });
