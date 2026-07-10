# The Kitsune Protocol — Master Build Document

## Purpose

This document is the source of truth for building **The Kitsune Protocol** from a fresh repo named `TKP`.

The goal is to build a lightweight, mobile-first personal PWA that acts as:

* a dark premium beat player
* a personal archive
* a quick log system
* a fixation/rabbit-hole hub
* a searchable record of creative life

The project should stay focused. Do not overbuild. Do not add social features, user accounts, comments, likes, recommendation engines, or extra schemas unless explicitly requested later.

---

# 1. Core Identity

## Site Name

**The Kitsune Protocol**

## Core Definition

**My beats, my rabbit holes, and where my head is right now.**

## Expanded Definition

The Kitsune Protocol is a lightweight personal archive and beat-player PWA built around:

* beats
* releases
* lanes
* logs
* links
* playlists
* quotes
* fixations
* rabbit holes
* search/filtering

The site exists so people who already know the site owner can check one place and see:

* what he is making
* what he is listening to
* what he is saving
* what he is thinking
* what he is fixated on
* what creative/life phase he is currently in

The site should be personal but not writing-heavy. It should support quick thoughts, short notes, saved links, embedded media, playlists, quotes, and beats.

---

# 2. What the Site Is Not

The site is not:

* a blog
* a traditional portfolio
* a business website
* a social media profile
* a full essay archive
* a loud cyberpunk art project
* a brutalist design experiment
* a hacker terminal UI
* a giant category portal site
* a clone of Spotify or Apple Music
* a database-looking content dump

The site should feel personal and archival, but polished, fast, and easy to use.

---

# 3. Core Product Principles

## 3.1 Keep It Lightweight

The PWA should be simple to navigate and quick to update. Avoid creating unnecessary schemas, pages, dashboards, or nested systems.

## 3.2 Beats Are the Player

Beats are the core music experience. The Player should feel polished and central.

## 3.3 Fixations Are Rabbit Holes

Fixations are major areas of interest. Each fixation has its own page and can lead into a Rabbit Hole feed.

## 3.4 Logs Are Everything Else

Logs are quick lightweight posts. They replace blog posts and essays.

## 3.5 Search Ties the Archive Together

The whole site is essentially an archive. Search and filters must be part of the MVP.

## 3.6 Do Not Rebuild Worlds / Portals

The previous Worlds/Portals structure should not be rebuilt. Old “worlds” become tags.

---

# 4. Tech Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* selective shadcn/ui
* custom components

## CMS

* Sanity

## Hosting

* Vercel

## Audio Storage

* Cloudflare R2

## Image Storage

* Sanity assets for MVP

## Database/Auth

* No Supabase for MVP
* No user accounts for MVP
* No public login system for MVP

Supabase should only be considered later if the project needs:

* user accounts
* likes/favorites
* comments
* public user playlists
* advanced auth
* relational app data
* custom admin workflows beyond Sanity/Vercel

---

# 5. Sanity Project Setup

Use the existing Sanity project:

```text
Project name: The Kitsune Protocol
Dataset: tkp-v2
Dataset visibility: Public
```

Use `tkp-v2` as the clean dataset for the rebuild.

Do not use old datasets from the previous build if they contain old Worlds/Portals content.

Expected environment variables:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=tkp-v2
NEXT_PUBLIC_SANITY_API_VERSION=
```

Only add write tokens later if needed for future Quick Add. MVP can use Sanity Studio for content creation.

---

# 6. Storage Architecture

## Sanity Stores

Sanity is the source of truth for:

* beat metadata
* release metadata
* lane metadata
* logs
* links
* playlists
* quotes
* fixations
* tags
* homepage settings
* cover art/images for MVP

## Cloudflare R2 Stores

Cloudflare R2 stores:

* main beat audio files
* beat version/context audio files
* larger audio files if needed later

Recommended R2 bucket:

```text
kitsune-audio
```

## Important Audio Rule

Sanity should not store the beat audio files themselves.

Sanity should store R2 audio URLs.

Example:

```ts
beat {
  title
  audioUrl // Cloudflare R2 URL
}
```

For MVP, audio can be uploaded manually to R2 and the URL pasted into Sanity. Do not build an audio upload manager in MVP.

---

# 7. Main Navigation

The main bottom nav should be:

```text
Home
Player
Logs
Fixations
Search
```

The PWA is mobile-first. The nav should be persistent, simple, and easy to reach.

---

# 8. Core Pages

## MVP Pages

Build these in the initial version:

1. Home
2. Player
3. Beat File detail page
4. Release detail page
5. Lane detail page
6. Logs page
7. Fixations index page
8. Fixation detail page
9. Rabbit Hole page
10. Search page
11. Sanity Studio route/configuration

## Not MVP

Do not build these in the initial version:

* Quick Add
* Monthly Picks
* Supabase
* user accounts
* comments
* likes
* playlist sync engine
* audio upload manager
* separate Rabbit Hole schema
* Worlds / Portals

---

# 9. Homepage

The homepage should stay simple.

## Homepage Order

1. Current Phase ticker
2. New Release Broadcast, only if active
3. Latest Beat
4. Featured Fixations
5. Latest Logs section

## 9.1 Current Phase

The Current Phase should be a small static ticker/status strip.

It should be the least dominant homepage element.

Example:

```text
CURRENT_PHASE: Pretty Dark beats / MJ rabbit hole / rebuilding lighter
```

This should be manually controlled through `homepageSettings`.

## 9.2 New Release Broadcast

The homepage needs a limited-time release announcement system.

This is different from Latest Beat.

Example:

```text
NEW RELEASE
Pretty Dark Sessions 01
[Play Release]
```

This should be controlled through `homepageSettings`.

Fields:

```ts
releaseAnnouncement {
  enabled: boolean
  release: reference to release
  headline?: string
  startAt?: datetime
  endAt?: datetime
}
```

Behavior:

* If enabled and current date is between `startAt` and `endAt`, show it.
* If expired, hide it.
* If disabled, hide it.

## 9.3 Latest Beat

The homepage should automatically pull the newest published beat where `nsfw` is not true.

No manual homepage selection for Latest Beat.

## 9.4 Featured Fixations

Homepage fixations should be manually selected in `homepageSettings`.

Reason: there can be multiple active fixations, and some are core/constant, like Michael Jackson.

Fields:

```ts
featuredFixations: reference[] to fixation
```

## 9.5 Latest Logs Section

Do not make this a generic bloated feed.

The homepage Latest Logs section should show:

```text
Latest Link
Latest Playlist
Latest Thought
View All Logs
```

Each item should be automatically pulled.

Rules:

```text
Latest Link = newest published link where nsfw is not true
Latest Playlist = newest published playlist where nsfw is not true
Latest Thought = newest published log where logType = thought and nsfw is not true
```

---

# 10. Homepage Settings Schema

Create a singleton Sanity document:

```ts
homepageSettings {
  currentPhaseText: string
  featuredFixations: reference[] to fixation

  releaseAnnouncement {
    enabled: boolean
    release: reference to release
    headline?: string
    startAt?: datetime
    endAt?: datetime
  }
}
```

Do not use homepage settings to manually select Latest Beat, Latest Link, Latest Playlist, or Latest Thought.

Those stay automatic.

---

# 11. Player System

The Player should feel like:

```text
Apple Music layout + Spotify behavior
```

It should be a dark premium music-app experience.

## Player Page Should Include

* Continue Listening
* Shuffle button
* Recently Added
* Releases
* Lanes
* All Beats
* Queue behavior
* Mini Player
* Full Player

## Top of Player Page

Use a compact combination:

```text
Continue Listening + Shuffle button
```

## Mini Player

The mini player should appear everywhere once audio starts.

It should persist while navigating pages.

## Full Player

The full player should include:

* cover art
* beat title
* lane
* release if applicable
* queue
* shuffle/repeat
* link to Beat File

Tags and related logs should mostly live on the Beat File page, not the full player.

## Shuffle Behavior

Shuffle should support:

* Main Library
* Context / extra versions
* Everything

Default should be:

```text
Main Library
```

Main Library includes:

* main/final beats
* approved demos

Context-only files should not appear in Main Library unless explicitly allowed later.

---

# 12. Beat System

## Beat Definition

A Beat is an individual playable track.

A Beat can be final, approved demo, rough, sketch, context-only, etc.

## Required Beat Fields

```ts
title: string
audioUrl: string
lane: reference to lane
```

## Optional Beat Fields

```ts
slug
coverArt
status
tags
relatedFixations[]
relatedLogs[]
relatedLinks[]
relatedPlaylists[]
relatedQuotes[]
releaseRefs[]
shortNote
versions[]
nsfw
nsfwReason
publishedAt
```

## Cover Art Rule

Beat cover art is optional.

Fallback behavior:

```text
If beat has cover art:
  use beat cover

If beat has no cover art:
  use lane fallback cover art
```

## Beat Status

Use a flexible status field.

Suggested statuses:

```text
main
approved demo
sketch
rough mix
alternate mix
context only
draft
```

Do not make the statuses too restrictive.

Main Library rule:

```text
Main Library = beats marked main or approved demo
```

## Beat File

Each beat should have a detail page called a **Beat File**.

A Beat File contains:

* main playable beat
* alternate versions
* rough mixes
* sample chop tests
* drum-only versions
* related logs
* related links
* related playlist
* related release
* related lane
* context notes

Use the word **Context** for deeper material.

Do not use “Deluxe” as the main wording.

## Versions / Context Files

Beat versions should live inside the Beat document.

Example:

```ts
versions: [
  {
    title: string
    audioUrl: string
    note?: string
    versionType?: string
    createdAt?: datetime
    nsfw?: boolean
    nsfwReason?: string
  }
]
```

---

# 13. Release System

## Release Definition

A Release is a curated collection of beats.

A release can be formal or loose, but it should feel cohesive.

A release can be:

* lane-based
* mood-based
* seasonal
* era-based
* sound-based
* a loose collection
* a formal tape/project

Do not enforce a strict monthly or seasonal schedule.

## Required Release Fields

```ts
title
slug
coverArt
beats[]
manualTrackOrder
publishedAt
```

## Optional Release Fields

```ts
releaseType
lane
shortDescription
tags
relatedFixations[]
nsfw
nsfwReason
```

## Release Type

Use optional `releaseType`.

Examples:

```text
Tape
Session
Pack
Collection
Demo Set
```

Do not force releaseType on every release.

## Release Cover Art

Release cover art is required.

## Beat Membership

A beat can:

* exist without a release
* be published before being added to a release
* belong to more than one release

## Track Order

Track order must be manually controlled.

---

# 14. Lane System

## Lane Definition

Lanes are the main music categories.

Lanes should be their own Sanity schema because they need:

* page
* description
* colors
* fallback cover art
* related playlists
* related beats
* related releases
* sort order

## Lanes

The current lanes are:

```text
Rainview
Gray Shore
Fluxwave
Pretty Dark
```

## Lane Fields

```ts
lane {
  name
  slug
  plainDescription
  primaryColor
  secondaryColor
  fallbackCoverArt
  relatedPlaylists[]
  sortOrder
  tags[]
}
```

## Lane Color Direction

### Rainview

Gold + deep rain blue.

### Gray Shore

Fog gray + pale blue.

### Fluxwave

Neon vice colors:

* cyan
* hot pink
* purple
* deep navy/black base

### Pretty Dark

Pink with a dark contrasting color.

Suggested:

* hot pink
* deep violet
* black

Lane colors should be subtle accents, not full app themes.

---

# 15. Logs

## Log Definition

Logs replace blog posts.

Logs are short, lightweight posts.

They can be:

* quick thoughts
* life updates
* beat notes
* fixation notes
* movie thoughts
* quick lists

## Required Log Fields

```ts
title?: string
body?: block/string
bullets?: string[]
```

Rule:

```text
Title is optional.
Body and/or bullets are required.
```

## MVP Log Types

Use these log types:

```text
thought
lifeUpdate
beatNote
fixationNote
movieThought
quickList
```

Do not use these as log types:

```text
Personal Canon
The More You Know
Sound Byte
```

Those should be tags/purpose labels.

Quotes are not logs. Quotes have their own schema.

## Log Relations

Logs can reference multiple things:

```ts
relatedFixations[]
relatedBeats[]
relatedReleases[]
relatedPlaylists[]
relatedLinks[]
relatedQuotes[]
tags[]
```

Keep the frontend card UI simple. Do not display a giant metadata block.

## Homepage Latest Thought

Homepage Latest Thought should pull only from:

```text
logType = thought
```

Not all logs.

---

# 16. Links

## Link Definition

Links are saved objects from the internet.

Examples:

* Instagram reels
* YouTube videos
* YouTube Shorts
* TikToks
* X/Twitter posts
* articles
* tutorials
* sound-byte clips
* Letterboxd links
* personal canon finds

## Link Fields

```ts
link {
  title?: string
  url: string
  platformAuto?: string
  platformOverride?: string
  note?: string
  thumbnail?: image/url
  embedUrl?: string

  relatedFixations[]
  relatedBeats[]
  relatedReleases[]
  relatedPlaylists[]
  relatedQuotes[]

  tags[]

  isRabbitHoleItem: boolean
  rabbitHoleCategory?: reference to tag
  isPinnedInRabbitHole: boolean

  nsfw: boolean
  nsfwReason?: string

  publishedAt
}
```

## Platform Behavior

Platform should be auto-detected from URL, with manual override.

Supported platforms should include at least:

* YouTube
* Instagram
* TikTok
* X/Twitter
* Spotify
* Apple Music
* YouTube Music
* Letterboxd
* Website/Article
* Other

## Embed Behavior

Links should support embeds when possible.

If an embed fails, show a fallback link card.

Rabbit Hole pages should prioritize video/embed-style content, but fallback cards must exist.

---

# 17. Playlists

## Playlist Definition

A playlist is a standalone cross-platform playlist object.

Spotify is the primary embed layer.

The playlist should also support links to:

* Spotify
* Apple Music
* YouTube Music

## Playlist Fields

```ts
playlist {
  title
  slug
  spotifyUrl
  spotifyEmbedUrl
  appleMusicUrl?
  youtubeMusicUrl?
  shortNote?
  relatedLanes[]
  relatedFixations[]
  tags[]
  nsfw
  nsfwReason?
  publishedAt
}
```

## Required Playlist Fields

For MVP:

```text
title
spotifyUrl
```

Spotify embed URL should be strongly recommended.

## Playlist Display

Playlist card should show:

* title
* Spotify embedded preview
* listen buttons:

  * Spotify
  * Apple Music
  * YouTube Music
* optional note
* tags

## Playlist Sync

The PWA should not build playlist syncing.

Cross-platform playlist syncing should happen outside the site.

Mention these tools in documentation/notes:

* Soundiiz
* Tune My Music
* FreeYourMusic
* SongShift
* Playlisty

Workflow:

1. Create or sync playlist using an outside tool.
2. Copy Spotify embed into Sanity.
3. Copy Spotify, Apple Music, and YouTube Music links into Sanity.
4. PWA displays Spotify preview and platform buttons.

---

# 18. Quotes

## Quote Definition

Quotes are quotes from other people.

The site owner’s own thoughts should be Logs, not Quotes.

## Required Quote Fields

```ts
quoteText
person
```

## Optional Quote Fields

```ts
sourceTitle
sourceUrl
foundViaLink
tags
relatedFixations[]
relatedLinks[]
nsfw
nsfwReason
publishedAt
```

## Quote Display

Quotes should appear as quote cards in:

* Logs page
* Fixation pages
* Search results

Do not make Quotes a main nav item.

---

# 19. Fixations

## Fixation Definition

Fixations are major rabbit-hole containers.

Examples:

* Michael Jackson
* WWE
* Anime
* Horror Movies
* Gaming
* Tekken
* 80s Pop
* Michael Myers
* Bruce Lee

## Required Fixation Fields

```ts
title
slug
shortDescription
coverImage
whyThisMatters
```

## Optional Fixation Fields

```ts
status
isCore
pinnedLogs[]
pinnedLinks[]
pinnedPlaylists[]
pinnedQuotes[]
relatedBeats[]
relatedReleases[]
tags[]
nsfw
nsfwReason
```

## Fixation Status

Backend status values:

```text
active
sleeping
archived
```

Also include:

```ts
isCore: boolean
```

Frontend language can change later.

Example:

```text
Michael Jackson:
status = active
isCore = true
```

Core fixations should be prominent but should not overpower everything else.

## Multiple Active Fixations

Multiple active fixations are allowed.

Homepage featured fixations should be manually selected through `homepageSettings`.

## Fixations Index Page

The Fixations index page should group or visually separate:

* Core
* Active
* Sleeping
* Archived

Core should be visually prominent, but not overwhelming.

---

# 20. Rabbit Holes

## Rabbit Hole Definition

A Rabbit Hole is a video/link doom-scroll page tied to a specific fixation.

Flow:

```text
Fixations
→ Michael Jackson
→ Michael Jackson Fixation Page
→ Enter Rabbit Hole
→ /fixations/michael-jackson/rabbit-hole
```

## Rabbit Hole Content

Rabbit Hole content should be Links only.

Other related content types live on the main fixation page.

The main fixation page can show:

* beats
* releases
* playlists
* quotes
* logs
* general related links
* pinned content

The Rabbit Hole page should show:

* online videos
* embeds
* video links
* saved clips
* fallback cards when embeds fail

## Rabbit Hole Link Fields

Only Links can become Rabbit Hole items.

Link fields:

```ts
isRabbitHoleItem: boolean
relatedFixations[]
rabbitHoleCategory?: reference to tag
isPinnedInRabbitHole: boolean
```

## Rabbit Hole Page Layout

Use this structure:

1. Category tabs
2. Pinned/top items
3. Vertical doom-scroll style feed
4. Load More button

## Rabbit Hole Feed Rules

* no autoplay
* lazy-load embeds
* show platform labels
* use Load More instead of infinite scroll for MVP
* pinned/top items first
* newest after pinned
* fallback to link card if embed fails

## Rabbit Hole Categories

Rabbit Hole categories should be shared global category tags, filtered by fixation usage.

Example:

Michael Jackson page might show:

```text
All
Dance Details
Vocals
Interviews
Live Performances
Personal Canon
```

WWE page might show:

```text
All
Promos
Entrances
Crowd Reactions
```

Do not create separate category systems for each fixation in MVP.

Do not create a separate Rabbit Hole schema for MVP.

Only add a separate `rabbitHole` schema later if a fixation grows large enough to need multiple named sub-rabbit-holes.

---

# 21. Search and Filters

Search is MVP.

The whole site is essentially an archive, so search/filtering must exist from the start.

## Search Page

The Search page should support:

* content type
* tag
* lane
* fixation
* date
* platform
* mood
* release
* quote person/source if needed

## Global Search

Add a global search overlay or quick search behavior if feasible.

The full Search page is required. The overlay can be simpler.

## Search Results

Search results should be clean and grouped or filterable by type.

Supported result types:

* beats
* releases
* lanes
* logs
* links
* playlists
* quotes
* fixations

Search should prevent the need for a separate Archive nav item.

---

# 22. Tags

## Tag Purpose

Tags replace the old Worlds/Portals structure.

Old worlds should become major tags.

Examples:

* Music
* Movies
* TV
* Anime
* Gaming
* WWE
* Tech
* Personal
* Origin

## Tag Schema

```ts
tag {
  name
  slug
  group
  styleOverride?
}
```

## Tag Groups

Default groups:

```text
Media / Interest
Music Lane
Mood
Purpose / Meaning
Person / Artist
Platform
Genre
Era / Time Period
Fixation Category
Rabbit Hole Category
Life Phase
Production
General
```

## General Group

General is the catch-all group.

If many General tags start forming a pattern, create a new group later.

## Tag Styling

Tag group controls default visual style.

Individual tags can override style when needed.

Frontend should show tag groups subtly through chip styles, colors, or borders.

Do not display the UI like a database with obvious “Tag Group: Mood” labels everywhere.

## Purpose / Meaning Tags

Examples:

```text
Personal Canon
The More You Know
Sound Byte
Reference
Tutorial
Rabbit Hole
Relatable
Funny
```

Personal Canon should be a tag/purpose label, not its own schema.

---

# 23. NSFW / Content Warning System

Every major schema should include:

```ts
nsfw: boolean
nsfwReason?: string
```

## Behavior

If `nsfw` is true, the frontend must show a warning before the content is consumed.

This applies before:

* playing a beat
* loading an embed
* opening a Rabbit Hole item
* revealing a quote/log
* showing sensitive link content

## Warning Example

```text
Content Warning

This item may contain explicit language or sensitive material.

Reason:
Contains an explicit soundbite in the sample.

[View Anyway]
```

## Per-Content Approval Memory

When the user approves the warning, remember approval for that exact item only.

Use client-side storage for MVP.

Example localStorage key:

```text
kp_nsfw_approved:<contentType>:<sanityDocumentId>
```

Important:

```text
Approving one NSFW item does not approve all NSFW items.
```

Do not create a global “approve all NSFW” behavior.

---

# 24. Visual Identity

## Final Visual Direction

The site should be:

```text
A dark premium modern app first — with subtle cyberpunk vice color blends and sparse brutalist accents.
```

## Dominant Style

The dominant style should be:

* dark premium modern app
* clean mobile dashboard
* polished music-player interface
* readable typography
* smooth spacing
* large cover art where appropriate
* refined cards and controls

## Secondary Details

Use subtle system-style details:

* mono accent labels
* small status strips
* metadata chips
* Current Phase ticker
* structured labels like `BEAT_FILE`, `CURRENT_PHASE`, `ENTER_RABBIT_HOLE`

## Brutalist Accents

Use sparingly:

* occasional hard borders
* sharp accent cards
* bold outlined buttons
* slightly blocky highlight elements

Do not make the site look like a full brutalist UI.

## Cyberpunk / Vice Color Accents

Use sparingly:

* subtle neon blends
* soft glows
* lane color highlights
* accent gradients
* electric blue/yellow/pink/cyan touches

Do not make the site look like a loud cyberpunk theme.

## Typography

Use:

* modern sans-serif for normal UI
* mono accent font for metadata, labels, timestamps, and status elements

## Logo / Mark

Kitsune mark/mask should be:

* app icon
* subtle watermark/mark
* not heavily repeated

---

# 25. PWA Behavior

The site should be:

* mobile-first
* installable as a PWA
* decent on desktop
* lightweight
* fast
* easy to use

## Audio Continuity

Music should keep playing while moving between pages.

## Offline Support

MVP should include:

```text
basic offline shell
```

Do not build offline music playback for MVP.

## Install Behavior

Include:

* app manifest
* app icon
* mobile-friendly installable PWA behavior

---

# 26. Quick Add

Quick Add is not MVP.

For MVP, use Sanity Studio for content entry.

Quick Add should be a late/final feature after the rest of the PWA is stable.

## Quick Add Definition

Quick Add would be a private mobile-friendly route inside the PWA.

It would save content to Sanity.

It would not use separate storage.

Examples:

```text
Add Thought → creates Log
Add Link → creates Link
Add Playlist → creates Playlist
Add Quote → creates Quote
Add Beat Note → creates Log related to Beat
```

## Quick Add Route

Potential future route:

```text
/quick-add
```

## Security

Do not expose Sanity write tokens in the frontend.

Quick Add should write through a secure server/API route.

## Master Rule

Quick Add is a convenience layer over existing Sanity schemas.

Do not build it until the core PWA works properly.

---

# 27. Monthly Picks

Monthly Picks is a future-only feature.

It is not MVP.

## Monthly Picks Definition

A lightweight curated recommendation feature.

Each month, the site owner can select:

* one show
* one movie
* one anime
* one song

This should not be algorithmic and should not rely on external recommendation APIs.

## Purpose

Give visitors an easy “what should I check out?” section based on the site owner’s taste.

## Future Schemas

Use these later only:

```ts
pickItem {
  title
  type: "show" | "movie" | "anime" | "song"
  creatorOrArtist?
  externalUrl?
  spotifyUrl?
  appleMusicUrl?
  youtubeUrl?
  tags[]
  relatedFixations[]
  nsfw
  nsfwReason?
}
```

```ts
monthlyPick {
  month
  year
  showPick: reference to pickItem
  moviePick: reference to pickItem
  animePick: reference to pickItem
  songPick: reference to pickItem
  shortNote?
  publishedAt
}
```

## Repeat Tracking

The reason for `pickItem` is to avoid repeating picks too often.

Sanity can later show/query:

```text
How many monthlyPick documents reference this pickItem?
When was it last picked?
```

Do not build this in MVP.

---

# 28. Build Phases

## Phase 1 — Foundation

* Set up Next.js + TypeScript
* Set up Tailwind
* Set up selective shadcn/ui
* Set up Sanity Studio
* Define schemas
* Connect frontend to Sanity
* Set up base layout and nav

## Phase 2 — Core Content

Build schemas/pages for:

* beat
* release
* lane
* log
* link
* playlist
* quote
* fixation
* tag
* homepageSettings

## Phase 3 — Player

Build:

* Player page
* persistent mini player
* full player
* queue
* shuffle main library
* recently added
* releases
* lanes
* Beat File page
* R2 audio URL playback

## Phase 4 — Home

Build homepage:

* Current Phase ticker
* New Release Broadcast
* Latest Beat
* Featured Fixations
* Latest Logs:

  * Latest Link
  * Latest Playlist
  * Latest Thought
  * View All Logs

## Phase 5 — Logs / Links / Playlists / Quotes

Build:

* Logs page
* mixed compact cards
* link cards
* playlist cards with Spotify embed
* quote cards
* filters by type/tag

## Phase 6 — Fixations / Rabbit Holes

Build:

* Fixations index
* Fixation detail page
* related content sections
* Enter Rabbit Hole CTA
* Rabbit Hole page
* category tabs
* pinned/top items
* doom-scroll style vertical feed
* Load More behavior
* lazy embeds with fallback cards

## Phase 7 — Search

Build:

* Search page
* content type filters
* tag filters
* lane filters
* fixation filters
* platform filters
* release filters
* date filters
* mood filters

## Phase 8 — NSFW System

Build:

* Sanity fields
* warning UI
* per-item approval memory with localStorage
* block playback/embed/reveal until approval

## Phase 9 — PWA Polish

Build:

* manifest
* icons
* offline shell
* mobile install behavior
* smooth transitions
* player persistence

## Phase 10 — Quick Add

Only after the rest works:

* private route
* secure API route
* create Sanity documents from simplified forms

---

# 29. Out of Scope for MVP

Do not build these in MVP:

* Quick Add
* Monthly Picks
* pickItem schema
* monthlyPick schema
* user accounts
* comments
* likes
* public profiles
* social feed features
* Supabase
* full playlist syncing engine
* offline music playback
* separate Rabbit Hole schema
* Worlds
* Portals
* giant category pages
* long-form blog system
* complex visibility system
* archive-only workflow
* homepage curation for every item
* audio upload manager

---

# 30. Special Rules

## Do Not Use “Worlds” or “Portals”

Old World/Portal structure should be removed.

Use tags instead.

## Do Not Use Heavy Essay Patterns

Logs should be short by default.

Do not build article-first UI.

## Do Not Use a Visibility System

Do not add:

* showOnHome
* archiveOnly
* hide/show everywhere
* manual homepage flags on every item

Homepage should automatically pull latest published non-NSFW items for:

* Beat
* Link
* Playlist
* Thought

Only the New Release Broadcast and Featured Fixations are manually controlled.

## Do Not Overuse Cyberpunk or Brutalism

The visual base must remain premium, modern, dark, and usable.

Cyberpunk/vice colors and brutalist styling should remain accents only.

---

# 31. Final Product Summary

The Kitsune Protocol should function as:

```text
A dark premium personal music PWA and archive.
```

The simplest mental model:

```text
Beats = the player
Releases = curated beat collections
Lanes = sound categories
Fixations = rabbit holes
Logs = quick thoughts/updates
Links = saved internet objects
Playlists = cross-platform music references
Quotes = words from other people
Search = the archive
```

The core rule:

```text
Beats are the player.
Fixations are rabbit holes.
Logs are everything else.
Search ties the archive together.
```
