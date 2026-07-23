import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { HomeBeatPlay } from '@/src/components/home-beat-play';
import { MediaArtwork, ProtocolLabel, SectionHeading } from '@/src/components/presentation-primitives';
import { PlaylistPreview } from '@/src/components/playlist-preview';
import { EditorialDisplayTitle } from '@/src/components/editorial-display-title';
import { BrandWordmark } from '@/src/components/brand-wordmark';
import { KitsuneMark } from '@/src/components/kitsune-mark';
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
  const homeStyle = { '--home-accent': beat?.lane?.primaryColor || '#63cfe0' } as CSSProperties;

  return <main className="home-environment relative mx-auto w-full max-w-6xl pb-8" style={homeStyle}>
    <div className="home-environment__city" aria-hidden="true" />
    <div className="home-opening relative z-[1]">
      <header className="home-identity">
        <div className="home-identity__mark" aria-hidden="true"><KitsuneMark /></div>
        <ProtocolLabel className="home-identity__archive">Personal Archive</ProtocolLabel>
        <BrandWordmark variant="title-card" className="home-identity__wordmark" />
      </header>

      <section aria-labelledby="latest-beat-title" className="home-beat">
        <section aria-label="Current Phase" className="home-phase">
          <ProtocolLabel className="home-phase__label">Current Phase</ProtocolLabel>
          <EditorialDisplayTitle variant="phase" className="home-phase__text">{settings?.currentPhaseText || 'The next phase is still taking shape.'}</EditorialDisplayTitle>
        </section>

        {announcementIsActive ? <section className="home-broadcast">
          <div className="min-w-0"><ProtocolLabel className="text-[var(--warning)]">New Release Broadcast</ProtocolLabel><h2 className="mt-2 break-words text-lg font-semibold text-[var(--text-primary)]">{announcement?.headline || announcement?.release?.title}</h2>{announcement?.release?.slug ? <Link href={`/releases/${announcement.release.slug}`} className="editorial-link focusable-surface mt-2 w-fit">Open {announcement.release.title}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link> : null}</div>
        </section> : null}

        <div className="home-beat__canvas">
          <div className="home-beat__art visual-artwork-stage">
            <ProtocolLabel className="home-beat__art-label">Latest Beat</ProtocolLabel>
            <MediaArtwork src={beatArtwork} alt="" size="feature" className="visual-artwork-primary" />
            <span className="home-beat__index type-numeric" aria-hidden="true">01 / LATEST</span>
          </div>
          <div className="home-beat__copy">
            <h1 id="latest-beat-title" className="home-beat__title">{beat?.slug ? <Link href={`/player/beats/${beat.slug}`} className="focusable-surface hover:text-[var(--home-accent)]">{beat.title}</Link> : beat?.title || 'No beats published yet'}</h1>
            <p className="home-beat__lane type-metadata">{beat?.lane?.name ? beat.lane.slug ? <Link href={`/lanes/${beat.lane.slug}`} className="metadata-link focusable-surface">{beat.lane.name}</Link> : beat.lane.name : 'The archive is waiting'}</p>
            {beat?.shortNote ? <p className="type-small home-beat__note">{beat.shortNote}</p> : null}
            <div className="home-beat__actions">{playerBeat ? <HomeBeatPlay beat={playerBeat} /> : null}{beat?.slug ? <Link href={`/player/beats/${beat.slug}`} className="editorial-link focusable-surface">Beat File<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link> : null}</div>
          </div>
        </div>
      </section>
    </div>

    <section className="home-fixations">
      <div className="home-section-opening"><SectionHeading label="Featured Fixations" title="Rabbit holes in focus" editorial /><p className="type-metadata">Selected from the current archive</p></div>
      <div className="home-fixations__list">{featuredFixations.length ? featuredFixations.map((fixation, index) => <FeaturedFixation key={fixation._id} fixation={fixation} primary={index === 0} index={index} />) : <p className="type-small border-b border-[var(--line-subtle)] py-7">No featured fixations yet.</p>}</div>
    </section>

    <section className="home-archive">
      <div className="home-section-opening"><SectionHeading label="Latest Logs" title="Recent entries" editorial /><Link href="/logs" className="editorial-link focusable-surface w-fit">View All<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></div>
      <div className="home-archive__feed"><FeedEntry label="Latest Link" item={link} href={link?.url} external index="01" /><PlaylistEntry item={playlist} /><FeedEntry label="Latest Thought" item={thought} href="/logs" index="03" /></div>
    </section>
  </main>;
}

function FeaturedFixation({ fixation, primary, index }: { fixation: FixationSummary; primary: boolean; index: number }) {
  const artwork = fixation.coverImage?.asset?.url;
  const href = fixation.slug ? `/fixations/${fixation.slug}` : '/fixations';
  if (primary) return <article className="home-fixation home-fixation--lead">
    <Link href={href} aria-label={`Open ${fixation.title} Fixation`} className="home-fixation__image focusable-surface">{artwork ? <img src={artwork} alt="" /> : <span aria-hidden="true" />}</Link>
    <div className="home-fixation__copy"><ProtocolLabel>{fixation.isCore ? 'Core Fixation' : fixation.status || 'Active'}</ProtocolLabel><EditorialDisplayTitle variant="section" className="mt-3"><Link href={href} className="focusable-surface hover:text-[var(--accent)]">{fixation.title}</Link></EditorialDisplayTitle>{fixation.shortDescription ? <p className="type-small mt-4 max-w-xl">{fixation.shortDescription}</p> : null}<Link href={href} className="editorial-link focusable-surface mt-5 w-fit">Enter Rabbit Hole<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></div>
  </article>;
  return <article className="home-fixation home-fixation--secondary">
    <span className="type-numeric">{String(index + 1).padStart(2, '0')}</span>
    <div className="min-w-0"><ProtocolLabel className="text-[var(--text-muted)]">{fixation.isCore ? 'Core Fixation' : fixation.status || 'Active'}</ProtocolLabel><h3><Link href={href} className="focusable-surface hover:text-[var(--accent)]">{fixation.title}</Link></h3>{fixation.shortDescription ? <p className="type-small line-clamp-2">{fixation.shortDescription}</p> : null}<Link href={href} className="editorial-link focusable-surface w-fit">Open<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link></div>
  </article>;
}

function FeedEntry({ label, item, href, external = false, index }: { label: string; item: LatestItem | null; href?: string; external?: boolean; index: string }) {
  const title = item ? item.title || (item.url ? 'Saved link' : 'Untitled thought') : label === 'Latest Link' ? 'No links saved yet' : 'No thoughts published yet';
  const destinationLabel = external ? item?.platformOverride || item?.platformAuto || externalDestinationLabel(href) : undefined;
  const detail = item?.body || item?.note || item?.shortNote || (external ? destinationLabel : undefined) || 'Content will appear here automatically.';
  const action = item && href ? external ? <a href={href} target="_blank" rel="noreferrer noopener" className="external-link focusable-surface mt-2 w-fit" aria-label={`Open ${title} on ${destinationLabel} in a new tab`}>Open {destinationLabel}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></a> : <Link href={href} className="editorial-link focusable-surface mt-2 w-fit">Open<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link> : null;
  return <article className="home-archive-entry"><span className="type-numeric" aria-hidden="true">{index}</span><ProtocolLabel className="text-[var(--text-muted)]">{label}</ProtocolLabel><div className="home-archive-entry__body"><h3>{title}</h3><p className="url-metadata type-small line-clamp-2">{detail}</p>{action}</div></article>;
}

function PlaylistEntry({ item }: { item: LatestItem | null }) {
  return <article className="home-archive-entry home-archive-entry--playlist"><span className="type-numeric" aria-hidden="true">02</span><ProtocolLabel className="text-[var(--text-muted)]">Latest Playlist</ProtocolLabel><div className="home-archive-entry__body"><h3>{item?.title || 'No playlists saved yet'}</h3>{item?.shortNote ? <p className="type-small">{item.shortNote}</p> : null}{item ? <div className="home-playlist-preview"><PlaylistPreview title={item.title || 'Playlist'} spotifyUrl={item.spotifyUrl} spotifyEmbedUrl={item.spotifyEmbedUrl} appleMusicUrl={item.appleMusicUrl} youtubeMusicUrl={item.youtubeMusicUrl} /></div> : <p className="type-small">Content will appear here automatically.</p>}<div className="home-playlist-actions"><span className="type-metadata">Open on</span><div>{item?.spotifyUrl ? <PlaylistAction href={item.spotifyUrl} label="Spotify" /> : null}{item?.appleMusicUrl ? <PlaylistAction href={item.appleMusicUrl} label="Apple Music" /> : null}{item?.youtubeMusicUrl ? <PlaylistAction href={item.youtubeMusicUrl} label={youtubePlaylistProviderLabel(item.youtubeMusicUrl)} /> : null}</div></div></div></article>;
}

function PlaylistAction({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer noopener" className="external-link focusable-surface" aria-label={`Open on ${label} in a new tab`}>{label}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></a>;
}
