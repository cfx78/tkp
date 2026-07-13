import { defineField, defineType } from 'sanity';
import { nsfwFields } from './sharedFields';

export default defineType({ name: 'lane', title: 'Lane', type: 'document', fields: [
  defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (Rule) => Rule.required() }),
  defineField({ name: 'plainDescription', title: 'Plain Description', type: 'text' }),
  defineField({ name: 'primaryColor', title: 'Primary Color', type: 'string' }),
  defineField({ name: 'secondaryColor', title: 'Secondary Color', type: 'string' }),
  defineField({ name: 'fallbackCoverArt', title: 'Fallback Cover Art', type: 'image' }),
  defineField({ name: 'relatedPlaylists', title: 'Related Playlists', type: 'array', of: [{ type: 'reference', to: [{ type: 'playlist' }] }] }),
  defineField({ name: 'sortOrder', title: 'Sort Order', type: 'number' }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  ...nsfwFields
] });
