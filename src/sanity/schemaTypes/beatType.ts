import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'beat',
  title: 'Beat',
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
      name: 'audioUrl',
      title: 'Audio URL',
      type: 'url',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'lane',
      title: 'Lane',
      type: 'reference',
      to: [{ type: 'lane' }]
    }),
    defineField({
      name: 'coverArt',
      title: 'Cover Art',
      type: 'image'
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text'
    }),
    defineField({
      name: 'release',
      title: 'Release',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'release' }] }]
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }]
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'draft',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' }
        ]
      }
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime'
    })
  ],
  preview: {
    select: { title: 'title', subtitle: 'lane.title' }
  }
});
