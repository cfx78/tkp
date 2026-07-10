import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

const platforms = ['YouTube', 'Instagram', 'TikTok', 'X/Twitter', 'Spotify', 'Apple Music', 'YouTube Music', 'Letterboxd', 'Website/Article', 'Other'];

export default defineType({ name: 'link', title: 'Link', type: 'document', fields: [
  defineField({ name: 'title', title: 'Title', type: 'string' }),
  defineField({ name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.required() }),
  defineField({ name: 'platformAuto', title: 'Auto-detected Platform', type: 'string', readOnly: true }),
  defineField({ name: 'platformOverride', title: 'Platform Override', type: 'string', options: { list: platforms } }),
  defineField({ name: 'note', title: 'Note', type: 'text' }),
  defineField({ name: 'thumbnail', title: 'Thumbnail', type: 'image' }),
  defineField({ name: 'embedUrl', title: 'Embed URL', type: 'url' }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  defineField({ name: 'isRabbitHoleItem', title: 'Rabbit Hole Item', type: 'boolean', initialValue: false }),
  defineField({ name: 'rabbitHoleCategory', title: 'Rabbit Hole Category', type: 'reference', to: [{ type: 'tag' }], hidden: ({ parent }) => !parent?.isRabbitHoleItem }),
  defineField({ name: 'isPinnedInRabbitHole', title: 'Pinned in Rabbit Hole', type: 'boolean', initialValue: false, hidden: ({ parent }) => !parent?.isRabbitHoleItem }),
  ...nsfwFields, publishedAtField
] });
