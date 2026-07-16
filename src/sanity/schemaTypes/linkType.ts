import { defineField, defineType } from 'sanity';
import { LinkSourceInput } from '../components/link-source-input';
import { parseLinkSource } from '../../lib/link-source';
import { nsfwFields, publishedAtField } from './sharedFields';

const platforms = ['YouTube', 'Instagram', 'TikTok', 'X/Twitter', 'Spotify', 'Apple Music', 'YouTube Music', 'Letterboxd', 'Website/Article', 'Other'];

export default defineType({ name: 'link', title: 'Link', type: 'document', fields: [
  defineField({ name: 'title', title: 'Title', type: 'string' }),
  defineField({
    name: 'url',
    title: 'Post URL or embed code',
    description: 'Paste a public URL or copied provider embed. Only the normalized destination is stored.',
    type: 'url',
    components: { input: LinkSourceInput },
    validation: (Rule) => Rule.required().custom((value) => !value || parseLinkSource(value) ? true : 'Enter a safe public HTTP/HTTPS destination.')
  }),
  defineField({ name: 'platformAuto', title: 'Auto-detected Platform', type: 'string', readOnly: true }),
  defineField({ name: 'platformOverride', title: 'Platform Override', type: 'string', options: { list: platforms } }),
  defineField({ name: 'note', title: 'Note', type: 'text' }),
  defineField({ name: 'thumbnail', title: 'Thumbnail', type: 'image' }),
  defineField({ name: 'embedUrl', title: 'Embed URL', type: 'url' }),
  defineField({ name: 'relatedFixations', title: 'Related Fixations', type: 'array', of: [{ type: 'reference', to: [{ type: 'fixation' }] }] }),
  defineField({ name: 'relatedBeats', title: 'Related Beats', type: 'array', of: [{ type: 'reference', to: [{ type: 'beat' }] }] }),
  defineField({ name: 'relatedReleases', title: 'Related Releases', type: 'array', of: [{ type: 'reference', to: [{ type: 'release' }] }] }),
  defineField({ name: 'relatedPlaylists', title: 'Related Playlists', type: 'array', of: [{ type: 'reference', to: [{ type: 'playlist' }] }] }),
  defineField({ name: 'relatedQuotes', title: 'Related Quotes', type: 'array', of: [{ type: 'reference', to: [{ type: 'quote' }] }] }),
  defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
  defineField({ name: 'isRabbitHoleItem', title: 'Rabbit Hole Item', type: 'boolean', initialValue: false }),
  defineField({ name: 'rabbitHoleCategory', title: 'Rabbit Hole Category', type: 'reference', to: [{ type: 'tag' }], hidden: ({ parent }) => !parent?.isRabbitHoleItem }),
  defineField({ name: 'isPinnedInRabbitHole', title: 'Pinned in Rabbit Hole', type: 'boolean', initialValue: false, hidden: ({ parent }) => !parent?.isRabbitHoleItem }),
  ...nsfwFields, publishedAtField
] });
