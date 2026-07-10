import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({ name: 'quote', title: 'Quote', type: 'document', fields: [
  defineField({ name: 'quoteText', title: 'Quote Text', type: 'text', validation: (Rule) => Rule.required() }),
  defineField({ name: 'person', title: 'Person', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'sourceTitle', title: 'Source Title', type: 'string' }),
  defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url' }),
  defineField({ name: 'foundViaLink', title: 'Found Via Link', type: 'reference', to: [{ type: 'link' }] }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  defineField({ name: 'relatedLinks', title: 'Related Links', type: 'array', of: [{ type: 'reference', to: [{ type: 'link' }] }] }),
  ...nsfwFields, publishedAtField
] });
