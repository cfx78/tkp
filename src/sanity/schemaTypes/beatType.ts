import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({
  name: 'beat', title: 'Beat', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'audioUrl', title: 'R2 Audio URL', type: 'url', validation: (Rule) => Rule.required() }),
    defineField({ name: 'lane', title: 'Lane', type: 'reference', to: [{ type: 'lane' }], validation: (Rule) => Rule.required() }),
    defineField({ name: 'coverArt', title: 'Cover Art', type: 'image' }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: [
      { title: 'Main', value: 'main' }, { title: 'Approved Demo', value: 'approvedDemo' },
      { title: 'Sketch', value: 'sketch' }, { title: 'Rough Mix', value: 'roughMix' },
      { title: 'Alternate Mix', value: 'alternateMix' }, { title: 'Context Only', value: 'contextOnly' },
      { title: 'Draft', value: 'draft' }
    ] } }),
    defineField({ name: 'shortNote', title: 'Short Note', type: 'text', rows: 3 }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
    defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
    defineField({ name: 'relatedLogs', title: 'Related Logs', type: 'array', of: [{ type: 'reference', to: [{ type: 'log' }] }] }),
    defineField({ name: 'relatedLinks', title: 'Related Links', type: 'array', of: [{ type: 'reference', to: [{ type: 'link' }] }] }),
    defineField({ name: 'relatedPlaylists', title: 'Related Playlists', type: 'array', of: [{ type: 'reference', to: [{ type: 'playlist' }] }] }),
    defineField({ name: 'relatedQuotes', title: 'Related Quotes', type: 'array', of: [{ type: 'reference', to: [{ type: 'quote' }] }] }),
    defineField({ name: 'releaseRefs', title: 'Releases', type: 'array', of: [{ type: 'reference', to: [{ type: 'release' }] }] }),
    defineField({ name: 'versions', title: 'Context / Versions', type: 'array', of: [{ type: 'object', fields: [
      defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
      defineField({ name: 'audioUrl', title: 'R2 Audio URL', type: 'url', validation: (Rule) => Rule.required() }),
      defineField({ name: 'note', title: 'Note', type: 'text' }),
      defineField({ name: 'versionType', title: 'Version Type', type: 'string' }),
      defineField({ name: 'createdAt', title: 'Created At', type: 'datetime' }),
      ...nsfwFields
    ] }] }),
    ...nsfwFields, publishedAtField
  ]
});
