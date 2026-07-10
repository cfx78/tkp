import { defineField, defineType } from 'sanity';
import { nsfwFields } from './sharedFields';

export default defineType({ name: 'fixation', title: 'Fixation', type: 'document', fields: [
  defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() }),
  defineField({ name: 'shortDescription', title: 'Short Description', type: 'text', validation: (Rule) => Rule.required() }),
  defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', validation: (Rule) => Rule.required() }),
  defineField({ name: 'whyThisMatters', title: 'Why This Matters', type: 'text', validation: (Rule) => Rule.required() }),
  defineField({ name: 'status', title: 'Status', type: 'string', options: { list: [
    { title: 'Active', value: 'active' }, { title: 'Sleeping', value: 'sleeping' }, { title: 'Archived', value: 'archived' }
  ] }, initialValue: 'active' }),
  defineField({ name: 'isCore', title: 'Core Fixation', type: 'boolean', initialValue: false }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  ...nsfwFields
] });
