import { defineField, defineType } from 'sanity';

export default defineType({ name: 'homepageSettings', title: 'Homepage Settings', type: 'document', fields: [
  defineField({ name: 'currentPhaseText', title: 'Current Phase Text', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'featuredFixations', title: 'Featured Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  defineField({ name: 'releaseAnnouncement', title: 'Release Announcement', type: 'object', fields: [
    defineField({ name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: false }),
    defineField({ name: 'release', title: 'Release', type: 'reference', to: [{ type: 'release' }] }),
    defineField({ name: 'headline', title: 'Headline', type: 'string' }),
    defineField({ name: 'startAt', title: 'Start At', type: 'datetime' }),
    defineField({ name: 'endAt', title: 'End At', type: 'datetime' })
  ] })
] });
