import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({ name: 'release', title: 'Release', type: 'document', fields: [
  defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() }),
  defineField({ name: 'coverArt', title: 'Cover Art', type: 'image', validation: (Rule) => Rule.required() }),
  defineField({ name: 'beats', title: 'Beats (manual track order)', description: 'Arrange references in the intended release track order.', type: 'array', of: [{ type: 'reference', to: [{ type: 'beat' }] }], validation: (Rule) => Rule.required().min(1) }),
  defineField({ name: 'releaseType', title: 'Release Type', type: 'string' }),
  defineField({ name: 'lane', title: 'Lane', type: 'reference', to: [{ type: 'lane' }] }),
  defineField({ name: 'shortDescription', title: 'Short Description', type: 'text', rows: 3 }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  ...nsfwFields, publishedAtField
] });
