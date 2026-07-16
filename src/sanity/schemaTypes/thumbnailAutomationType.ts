import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'thumbnailAutomation',
  title: 'Thumbnail Automation',
  type: 'object',
  fields: [
    defineField({ name: 'provider', title: 'Provider', type: 'string', validation: (Rule) => Rule.required().regex(/^[a-z][a-zA-Z0-9]{1,31}$/) }),
    defineField({ name: 'sourceCanonicalUrl', title: 'Canonical Source URL', type: 'url', validation: (Rule) => Rule.required().uri({ scheme: ['https'] }) }),
    defineField({ name: 'fetchedAt', title: 'Fetched At', type: 'datetime', validation: (Rule) => Rule.required() }),
    defineField({ name: 'assetRef', title: 'Assigned Asset ID', type: 'string', validation: (Rule) => Rule.required().regex(/^image-[A-Za-z0-9]+-\d+x\d+-[A-Za-z0-9]+$/) }),
    defineField({ name: 'sha256', title: 'Sanitized SHA-256', type: 'string', validation: (Rule) => Rule.required().regex(/^[a-f0-9]{64}$/) }),
    defineField({ name: 'method', title: 'Approved Adapter', type: 'string', validation: (Rule) => Rule.required().regex(/^[a-z][a-z0-9-]{1,63}$/) }),
  ],
});
