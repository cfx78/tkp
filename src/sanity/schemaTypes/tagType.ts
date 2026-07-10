import { defineField, defineType } from 'sanity';

const groups = ['Media / Interest', 'Music Lane', 'Mood', 'Purpose / Meaning', 'Person / Artist', 'Platform', 'Genre', 'Era / Time Period', 'Fixation Category', 'Rabbit Hole Category', 'Life Phase', 'Production', 'General'];

export default defineType({ name: 'tag', title: 'Tag', type: 'document', fields: [
  defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (Rule) => Rule.required() }),
  defineField({ name: 'group', title: 'Group', type: 'string', options: { list: groups }, initialValue: 'General', validation: (Rule) => Rule.required() }),
  defineField({ name: 'styleOverride', title: 'Style Override', type: 'string' })
] });
