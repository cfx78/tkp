import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({ name: 'playlist', title: 'Playlist', type: 'document', fields: [
  defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
  defineField({
    name: 'spotifyUrl',
    title: 'Spotify URL',
    description: 'Paste the normal Spotify playlist URL.',
    type: 'url',
    validation: (Rule) => Rule.required().uri({ scheme: ['https'] }).custom((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.hostname === 'open.spotify.com' && /^\/playlist\/[^/]+\/?$/.test(url.pathname)
          ? true
          : 'Enter a normal open.spotify.com playlist URL.';
      } catch {
        return 'Enter a valid Spotify playlist URL.';
      }
    })
  }),
  defineField({
    name: 'spotifyEmbedUrl',
    title: 'Spotify Embed URL',
    description: 'Optional. Paste only the URL from the iframe src attribute, not the full iframe code.',
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
  }),
  defineField({ name: 'appleMusicUrl', title: 'Apple Music URL', type: 'url' }),
  defineField({ name: 'youtubeMusicUrl', title: 'YouTube Music URL', type: 'url' }),
  defineField({ name: 'shortNote', title: 'Short Note', type: 'text', rows: 3 }),
  defineField({ name: 'relatedLanes', title: 'Related Lanes', type: 'array', of: [{ type: 'reference', to: [{ type: 'lane' }] }] }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  ...nsfwFields, publishedAtField
] });
