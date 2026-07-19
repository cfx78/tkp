import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { HomeBeatPlay } from '@/src/components/home-beat-play';
import { MediaArtwork, ProtocolLabel, SectionHeading } from '@/src/components/presentation-primitives';
import { PlaylistPreview } from '@/src/components/playlist-preview';
import { EditorialDisplayTitle } from '@/src/components/editorial-display-title';
import { externalDestinationLabel } from '@/src/lib/link-display';
import { youtubePlaylistProviderLabel } from '@/src/lib/youtube-playlist';
import { fetchSanity, type FixationSummary, type HomepageSettings, type ImageValue } from '@/src/sanity/lib/content';
import { homepageSettingsQuery, latestBeatQuery, latestLinkQuery, latestPlaylistQuery, latestThoughtQuery } from '@/src/sanity/lib/queries';
import type { PlayerBeat } from '@/src/types/player';

type Lane = { name?: string; slug?: string; primaryColor?: string; fallbackCoverArt?: ImageValue };
type LatestItem = { _id: string; title?: string; slug?: string; status?: string; body?: string; note?: string; shortNote?: string; url?: string; platformAuto?: string; platformOverride?: string; spotifyUrl?: string; spotifyEmbedUrl?: string; appleMusicUrl?: string; youtubeMusicUrl?: string; coverArt?: ImageValue; lane?: Lane };

export default async function HomePage() {
  const [settings, beat, link, playlist, thought] = await Promise.all([
    fetchSanity<HomepageSettings | null>(homepageSettingsQuery, null),
    fetchSanity<LatestItem | null>(latestBeatQuery, null),
    fetchSanity<LatestItem | null>(latestLinkQuery, null),
    fetchSanity<LatestItem | null>(latestPlaylistQuery, null),
    fetchSanity<LatestItem | null>(latestThoughtQuery, null)
  ]);
  const announcement = settings?.releaseAnnouncement;
  const now = Date.now();
  const announcementIsActive = Boolean(announcement?.enabled && announcement.release && (!announcement.startAt || new Date(announcement.startAt).getTime() <= now) && (!announcement.endAt || new Date(announcement.endAt).getTime() >= now));
  const beatArtwork = beat?.coverArt?.asset?.url || beat?.lane?.fallbackCoverArt?.asset?.url;
  const playerBeat: PlayerBeat | null = beat ? { _id: beat._id, title: beat.title || 'Untitled Beat', slug: beat.slug, status: beat.status, coverArtUrl: beat.coverArt?.asset?.url, lane: { name: beat.lane?.name, slug: beat.lane?.slug, fallbackCoverArtUrl: beat.lane?.fallbackCoverArt?.asset?.url } } : null;
  const featuredFixations = (settings?.featuredFixations || []).filter((fixation): fixation is FixationSummary => Boolean(fixation?._id && fixation.slug && fixation.nsfw !== true));

  return <main className="mx-auto w-full max-w-6xl pb-8">
    <section aria-label="Current Phase" className="grid gap-1 border-y border-[var(--line-subtle)] py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-5">
      <EditorialDisplayTitle variant="phase">Current Phase</EditorialDisplayTitle>
      <p className="type-small">{settings?.currentPhaseText || 'The next phase is still taking shape.'}</p>
    </section>

    {announcementIsActive ? <section className="mt-7 min-w-0 border-l-2 border-[var(--warning)] py-3 pl-4">
      <div className="min-w-0"><ProtocolLabel className="text-[var(--warning)]">New Release Broadcast</ProtocolLabel><h2 className="mt-2 break-words text-lg font-semibold text-[var(--text-primary)]">{announcement?.headline || announcement?.release?.title}</h2>{announcement?.release?.slug ? <Link href={`/releases/${announcement.release.slug}`} className="editorial-link focusable-surface mt-2 w-fit">Open {announcement.release.title}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link> : null}</div>
    </section> : null}

    <section aria-labelledby="latest-beat-title" className="relative mt-[clamp(2.75rem,8vw,6.5rem)] grid items-center gap-9 md:grid-cols-[minmax(16rem,.92fr)_minmax(0,1.08fr)] md:gap-[clamp(3rem,8vw,7rem)]">
      <div className="relative mx-auto w-fit md:mx-0">
        <div aria-hidden="true" className="absolute inset-[18%] -z-10 bg-[var(--artwork-halo)] blur-3xl" />
        <MediaArtwork src={beatArtwork} alt="" size="feature" className="shadow-[0_26px_76px_rgba(0,0,0,0.46),var(--artwork-bloom)]" />
      </div>
      <div className="min-w-0 md:py-8">
        <ProtocolLabel>Latest Beat</ProtocolLabel>
        <h1 id="latest-beat-title" className="mt-4 max-w-2xl break-words text-[clamp(2.5rem,8vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--text-primary)]">{beat?.slug ? <Link href={`/player/beats/${beat.slug}`} className="focusable-surface hover:text-[var(--accent)]">{beat.title}</Link> : beat?.title || 'No beats published yet'}</h1>
        <p className="type-metadata mt-5">{beat?.lane?.name ? beat.lane.slug ? <Link href={`/lanes/${beat.lane.slug}`} className="metadata-link focusable-surface">{beat.lane.name}</Link> : beat.lane.name : 'The archive is waiting'}</p>
        {beat?.shortNote ? <p className="type-small mt-5 max-w-lg">{beat.shortNote}</p> : null}
        <div className="mt-7 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">{playerBeat ? <HomeBeatPlay beat={playerBeat} /> : null}{beat?.slug ? <Link href={`/player/beats/${beat.slug}`} className="editorial-link focusable-surface">Beat File<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link> : null}</div>
      </div>
    </section>

    <section className="mt-[clamp(4.5rem,12vw,9rem)]">
      <div className="grid gap-4 border-b border-[var(--line-subtle)] pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><SectionHeading label="Featured Fixations" title="Rabbit holes in focus" /><p className="type-metadata">Selected from the current archive</p></div>
      <div>{featuredFixations.length ? featuredFixations.map((fixation, index) => <FeaturedFixation key={fixation._id} fixation={fixation} primary={index === 0} index={index} />) : <p className="type-small border-b border-[var(--line-subtle)] py-7">No featured fixations yet.</p>}</div>
    </section>

    <section className="mt-[clamp(4.5rem,12vw,9rem)]">
      <div className="grid min-w-0 gap-3 border-b border-[var(--line-subtle)] pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><SectionHeading label="Latest Logs" title="Recent entries" /><Link href="/logs" className="editorial-link focusable-surface w-fit">View All<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></div>
      <div><FeedEntry label="Latest Link" item={link} href={link?.url} external /><PlaylistEntry item={playlist} /><FeedEntry label="Latest Thought" item={thought} href="/logs" /></div>
    </section>
  </main>;
}

function FeaturedFixation({ fixation, primary, index }: { fixation: FixationSummary; primary: boolean; index: number }) {
  const artwork = fixation.coverImage?.asset?.url;
  const href = fixation.slug ? `/fixations/${fixation.slug}` : '/fixations';
  if (primary) return <article className="grid gap-6 border-b border-[var(--line-subtle)] py-8 sm:grid-cols-[minmax(14rem,.82fr)_minmax(0,1.18fr)] sm:items-center sm:gap-10 sm:py-12">
    <Link href={href} aria-label={`Open ${fixation.title} Fixation`} className="focusable-surface aspect-[16/9] overflow-hidden rounded-[var(--radius-artwork)] bg-[var(--bg-2)]">{artwork ? <img src={artwork} alt="" className="h-full w-full object-cover" /> : null}</Link>
    <div className="min-w-0"><ProtocolLabel>{fixation.isCore ? 'Core Fixation' : fixation.status || 'Active'}</ProtocolLabel><h3 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] sm:text-4xl"><Link href={href} className="focusable-surface hover:text-[var(--accent)]">{fixation.title}</Link></h3>{fixation.shortDescription ? <p className="type-small mt-4 max-w-xl">{fixation.shortDescription}</p> : null}<Link href={href} className="editorial-link focusable-surface mt-5 w-fit">Open Fixation<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></div>
  </article>;
  return <article className="grid min-w-0 gap-3 border-b border-[var(--line-subtle)] py-6 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-5">
    <span className="type-numeric hidden sm:block">{String(index + 1).padStart(2, '0')}</span>
    <div className="min-w-0"><ProtocolLabel className="text-[var(--text-muted)]">{fixation.isCore ? 'Core Fixation' : fixation.status || 'Active'}</ProtocolLabel><h3 className="mt-2 break-words text-xl font-semibold text-[var(--text-primary)]"><Link href={href} className="focusable-surface hover:text-[var(--accent)]">{fixation.title}</Link></h3>{fixation.shortDescription ? <p className="type-small mt-2 max-w-xl line-clamp-2">{fixation.shortDescription}</p> : null}<Link href={href} className="editorial-link focusable-surface mt-2 w-fit">Open<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></div>
  </article>;
}

function FeedEntry({ label, item, href, external = false }: { label: string; item: LatestItem | null; href?: string; external?: boolean }) {
  const title = item ? item.title || (item.url ? 'Saved link' : 'Untitled thought') : label === 'Latest Link' ? 'No links saved yet' : 'No thoughts published yet';
  const destinationLabel = external ? item?.platformOverride || item?.platformAuto || externalDestinationLabel(href) : undefined;
  const detail = item?.body || item?.note || item?.shortNote || (external ? destinationLabel : undefined) || 'Content will appear here automatically.';
  const action = item && href ? external ? <a href={href} target="_blank" rel="noreferrer noopener" className="external-link focusable-surface mt-2 w-fit" aria-label={`Open ${title} on ${destinationLabel} in a new tab`}>Open {destinationLabel}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></a> : <Link href={href} className="editorial-link focusable-surface mt-2 w-fit">Open<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link> : null;
  return <article className="grid min-w-0 gap-3 border-b border-[var(--line-subtle)] py-6 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-5"><ProtocolLabel className="text-[var(--text-muted)]">{label}</ProtocolLabel><div className="min-w-0"><h3 className="break-words text-lg font-semibold text-[var(--text-primary)]">{title}</h3><p className="url-metadata type-small mt-2 max-w-2xl line-clamp-2">{detail}</p>{action}</div></article>;
}

function PlaylistEntry({ item }: { item: LatestItem | null }) {
  return <article className="min-w-0 border-b border-[var(--line-subtle)] py-8"><ProtocolLabel className="text-[var(--text-muted)]">Latest Playlist</ProtocolLabel><div className="mt-3 min-w-0 max-w-3xl"><h3 className="break-words text-xl font-semibold text-[var(--text-primary)]">{item?.title || 'No playlists saved yet'}</h3>{item?.shortNote ? <p className="type-small mt-2 max-w-2xl">{item.shortNote}</p> : null}{item ? <div className="mt-5 min-w-0"><PlaylistPreview title={item.title || 'Playlist'} spotifyUrl={item.spotifyUrl} spotifyEmbedUrl={item.spotifyEmbedUrl} appleMusicUrl={item.appleMusicUrl} youtubeMusicUrl={item.youtubeMusicUrl} /><div className="mt-5 border-t border-[var(--line-subtle)] pt-3"><span className="type-metadata block">Open on</span><div className="mt-1 flex min-w-0 flex-wrap gap-x-5 gap-y-1">{item.spotifyUrl ? <PlaylistAction href={item.spotifyUrl} label="Spotify" /> : null}{item.appleMusicUrl ? <PlaylistAction href={item.appleMusicUrl} label="Apple Music" /> : null}{item.youtubeMusicUrl ? <PlaylistAction href={item.youtubeMusicUrl} label={youtubePlaylistProviderLabel(item.youtubeMusicUrl)} /> : null}</div></div></div> : <p className="type-small mt-2">Content will appear here automatically.</p>}</div></article>;
}

function PlaylistAction({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer noopener" className="external-link focusable-surface" aria-label={`Open on ${label} in a new tab`}>{label}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></a>;
}
