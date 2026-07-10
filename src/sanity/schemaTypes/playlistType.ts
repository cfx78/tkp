import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({ name: 'playlist', title: 'Playlist', type: 'document', fields: [
  defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
  defineField({ name: 'spotifyUrl', title: 'Spotify URL', type: 'url', validation: (Rule) => Rule.required() }),
  defineField({ name: 'spotifyEmbedUrl', title: 'Spotify Embed URL', type: 'url' }),
  defineField({ name: 'appleMusicUrl', title: 'Apple Music URL', type: 'url' }),
  defineField({ name: 'youtubeMusicUrl', title: 'YouTube Music URL', type: 'url' }),
  defineField({ name: 'shortNote', title: 'Short Note', type: 'text', rows: 3 }),
  defineField({ name: 'relatedLanes', title: 'Related Lanes', type: 'array', of: [{ type: 'reference', to: [{ type: 'lane' }] }] }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  ...nsfwFields, publishedAtField
] });
