import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({
  name: 'beat', title: 'Beat', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'audioObjectKey',
      title: 'R2 Audio Object Key',
      description: 'R2 object key only, for example beats/test-beat.mp3. Do not paste a public URL.',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
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
      defineField({
        name: 'audioObjectKey',
        title: 'R2 Audio Object Key',
        description: 'Optional. Add an R2 object key, for example beats/test-beat-version.mp3, only when this Context entry should be playable. Do not paste a public URL.',
        type: 'string'
      }),
      defineField({ name: 'note', title: 'Note', type: 'text' }),
      defineField({ name: 'versionType', title: 'Version Type', type: 'string' }),
      defineField({ name: 'createdAt', title: 'Created At', type: 'datetime' }),
      ...nsfwFields
    ] }] }),
    ...nsfwFields, publishedAtField
  ]
});
