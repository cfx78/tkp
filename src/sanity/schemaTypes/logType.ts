import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'log',
  title: 'Log',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string'
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' }
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text'
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      initialValue: 'thought',
      options: {
        list: [
          { title: 'Thought', value: 'thought' },
          { title: 'Link', value: 'link' },
          { title: 'Playlist', value: 'playlist' }
        ]
      }
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
      options: { list: [{ title: 'Draft', value: 'draft' }, { title: 'Published', value: 'published' }] }
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime'
    })
  ]
});
