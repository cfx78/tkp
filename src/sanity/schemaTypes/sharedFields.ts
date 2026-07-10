import { defineField } from 'sanity';

export const nsfwFields = [
  defineField({ name: 'nsfw', title: 'NSFW', type: 'boolean', initialValue: false }),
  defineField({
    name: 'nsfwReason',
    title: 'NSFW Reason',
    type: 'string',
    hidden: ({ parent }) => !parent?.nsfw
  })
];

export const publishedAtField = defineField({
  name: 'publishedAt',
  title: 'Published At',
  type: 'datetime'
});
