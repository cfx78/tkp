import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'release',
  title: 'Release',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(1)
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'coverArt',
      title: 'Cover Art',
      type: 'image',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text'
    }),
    defineField({
      name: 'tracks',
      title: 'Tracks',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'beat' }] }]
    }),
    defineField({
      name: 'releaseType',
      title: 'Release Type',
      type: 'string',
      options: { list: [{ title: 'Formal', value: 'formal' }, { title: 'Loose', value: 'loose' }] }
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'draft',
      options: { list: [{ title: 'Draft', value: 'draft' }, { title: 'Published', value: 'published' }] }
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime'
    })
  ]
});
