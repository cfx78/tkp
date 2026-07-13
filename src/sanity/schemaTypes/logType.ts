import { defineField, defineType } from 'sanity';
import { nsfwFields, publishedAtField } from './sharedFields';

export default defineType({ name: 'log', title: 'Log', type: 'document', fields: [
  defineField({ name: 'title', title: 'Title', type: 'string' }),
  defineField({ name: 'body', title: 'Body', type: 'text' }),
  defineField({ name: 'bullets', title: 'Bullets', type: 'array', of: [{ type: 'string' }] }),
  defineField({ name: 'logType', title: 'Log Type', type: 'string', validation: (Rule) => Rule.required(), options: { list: [
    { title: 'Thought', value: 'thought' }, { title: 'Life Update', value: 'lifeUpdate' },
    { title: 'Beat Note', value: 'beatNote' }, { title: 'Fixation Note', value: 'fixationNote' },
    { title: 'Movie Thought', value: 'movieThought' }, { title: 'Quick List', value: 'quickList' }
  ] } }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  defineField({ name: 'relatedBeats', title: 'Related Beats', type: 'array', of: [{ type: 'reference', to: [{ type: 'beat' }] }] }),
  defineField({ name: 'relatedReleases', title: 'Related Releases', type: 'array', of: [{ type: 'reference', to: [{ type: 'release' }] }] }),
  defineField({ name: 'relatedPlaylists', title: 'Related Playlists', type: 'array', of: [{ type: 'reference', to: [{ type: 'playlist' }] }] }),
  defineField({ name: 'relatedLinks', title: 'Related Links', type: 'array', of: [{ type: 'reference', to: [{ type: 'link' }] }] }),
  defineField({ name: 'relatedQuotes', title: 'Related Quotes', type: 'array', of: [{ type: 'reference', to: [{ type: 'quote' }] }] }),
  ...nsfwFields, publishedAtField
], validation: (Rule) => Rule.custom((document) => document?.body || (Array.isArray(document?.bullets) && document.bullets.length > 0) ? true : 'Body and/or bullets are required.') });
