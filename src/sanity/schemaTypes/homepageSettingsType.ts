import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'homepageSettings',
  title: 'Homepage Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Homepage Settings'
    }),
    defineField({
      name: 'currentPhase',
      title: 'Current Phase',
      type: 'string'
    }),
    defineField({
      name: 'releaseAnnouncement',
      title: 'Release Announcement',
      type: 'text'
    }),
    defineField({
      name: 'featuredFixations',
      title: 'Featured Fixations',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'fixation' }] }]
    }),
    defineField({
      name: 'isReleaseActive',
      title: 'Release Broadcast Active',
      type: 'boolean',
      initialValue: false
    })
  ]
});
