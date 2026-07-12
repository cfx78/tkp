import { groq } from 'next-sanity';

const imageProjection = `{
  asset->{_id, url, metadata { lqip, dimensions }}
}`;

export const homepageSettingsQuery = groq`*[_type == "homepageSettings"][0]{
  currentPhaseText,
  releaseAnnouncement{
    enabled,
    headline,
    startAt,
    endAt,
    release->{_id, title, "slug": slug.current, coverArt${imageProjection}}
  },
  featuredFixations[]->{
    _id, title, "slug": slug.current, shortDescription, status, isCore, coverImage${imageProjection}
  }
}`;

export const latestBeatQuery = groq`*[_type == "beat" && nsfw != true && status in ["main", "approvedDemo", "sketch", "roughMix", "alternateMix"]] | order(coalesce(publishedAt, _createdAt) desc)[0]{
  _id, title, "slug": slug.current, status, shortNote, publishedAt,
  coverArt${imageProjection},
  lane->{_id, name, "slug": slug.current, primaryColor, fallbackCoverArt${imageProjection}}
}`;

const playerBeatProjection = groq`{
  _id,
  title,
  "slug": slug.current,
  status,
  "coverArtUrl": coverArt.asset->url,
  lane->{
    name,
    "slug": slug.current,
    "fallbackCoverArtUrl": fallbackCoverArt.asset->url
  },
  "releases": *[_type == "release" && references(^._id)]{
    _id,
    title,
    "slug": slug.current
  }
}`;

export const mainLibraryBeatsQuery = groq`*[_type == "beat" && defined(audioObjectKey) && status in ["main", "approvedDemo"]] | order(coalesce(publishedAt, _createdAt) desc)${playerBeatProjection}`;

export const publishedBeatsQuery = groq`*[_type == "beat" && defined(audioObjectKey) && status in ["main", "approvedDemo", "sketch", "roughMix", "alternateMix"]] | order(coalesce(publishedAt, _createdAt) desc)${playerBeatProjection}`;

export const recentlyAddedBeatsQuery = groq`*[_type == "beat" && defined(audioObjectKey) && status in ["main", "approvedDemo", "sketch", "roughMix", "alternateMix"]] | order(coalesce(publishedAt, _createdAt) desc)[0...8]${playerBeatProjection}`;

export const beatFileQuery = groq`*[_type == "beat" && slug.current == $slug && status in ["main", "approvedDemo", "sketch", "roughMix", "alternateMix"]][0]{
  _id, title, "slug": slug.current, status, shortNote, publishedAt, nsfw, nsfwReason,
  "coverArtUrl": coverArt.asset->url,
  lane->{name, "slug": slug.current, primaryColor, secondaryColor, "fallbackCoverArtUrl": fallbackCoverArt.asset->url},
  "releases": *[_type == "release" && (references(^._id) || _id in ^.releaseRefs[]._ref)] | order(coalesce(publishedAt, _createdAt) desc){
    _id, title, "slug": slug.current, releaseType, "coverArtUrl": coverArt.asset->url
  },
  "tags": coalesce(tags[]->{name, "slug": slug.current, group}, []),
  "relatedFixations": coalesce(relatedFixations[]->{_id, title, "slug": slug.current, shortDescription}, []),
  "relatedLogs": coalesce(relatedLogs[]->{_id, title, body, bullets, logType, publishedAt}, []),
  "relatedLinks": coalesce(relatedLinks[]->{_id, title, url, platformAuto, platformOverride, note}, []),
  "relatedPlaylists": coalesce(relatedPlaylists[]->{_id, title, "slug": slug.current, spotifyUrl, appleMusicUrl, youtubeMusicUrl, shortNote}, []),
  "relatedQuotes": coalesce(relatedQuotes[]->{_id, quoteText, person, sourceTitle, sourceUrl}, []),
  "versions": coalesce(versions[]{_key, title, note, versionType, createdAt, nsfw, nsfwReason, "audioAvailable": defined(audioObjectKey)}, [])
}`;

export const latestLinkQuery = groq`*[_type == "link" && nsfw != true] | order(coalesce(publishedAt, _createdAt) desc)[0]{
  _id, title, url, platformAuto, platformOverride, note, publishedAt
}`;

export const latestPlaylistQuery = groq`*[_type == "playlist" && nsfw != true] | order(coalesce(publishedAt, _createdAt) desc)[0]{
  _id, title, "slug": slug.current, spotifyUrl, spotifyEmbedUrl, shortNote, publishedAt
}`;

export const latestThoughtQuery = groq`*[_type == "log" && logType == "thought" && nsfw != true] | order(coalesce(publishedAt, _createdAt) desc)[0]{
  _id, title, body, bullets, logType, publishedAt
}`;

export const featuredFixationsQuery = groq`*[_type == "homepageSettings"][0].featuredFixations[]->{
  _id, title, "slug": slug.current, shortDescription, status, isCore, coverImage${imageProjection}
}`;

export const lanesQuery = groq`*[_type == "lane"] | order(sortOrder asc, name asc){
  _id, name, "slug": slug.current, plainDescription, primaryColor, secondaryColor,
  fallbackCoverArt${imageProjection}
}`;

export const releasesQuery = groq`*[_type == "release" && nsfw != true] | order(coalesce(publishedAt, _createdAt) desc){
  _id, title, "slug": slug.current, releaseType, shortDescription, publishedAt,
  coverArt${imageProjection}, "coverArtUrl": coverArt.asset->url,
  lane->{_id, name, "slug": slug.current},
  "beats": beats[]->{
    _id,
    title,
    "slug": slug.current,
    status,
    "audioAvailable": defined(audioObjectKey),
    "coverArtUrl": coverArt.asset->url,
    lane->{
      name,
      "slug": slug.current,
      "fallbackCoverArtUrl": fallbackCoverArt.asset->url
    }
  }
}`;

export const logsQuery = groq`*[_type == "log" && nsfw != true] | order(coalesce(publishedAt, _createdAt) desc){
  _id, title, body, bullets, logType, publishedAt,
  tags[]->{_id, name, "slug": slug.current, group}
}`;

export const fixationsQuery = groq`*[_type == "fixation" && nsfw != true] | order(isCore desc, status asc, title asc){
  _id, title, "slug": slug.current, shortDescription, whyThisMatters, status, isCore,
  coverImage${imageProjection}
}`;

export const tagsQuery = groq`*[_type == "tag"] | order(group asc, name asc){
  _id, name, "slug": slug.current, group, styleOverride
}`;
