# The Kitsune Protocol — Repo Instructions

These instructions apply to the `TKP` repo.

Use `MASTER_DOC.md` as the source of truth.

Do not add features, schemas, services, or UI systems that are not in `MASTER_DOC.md` unless explicitly requested.

---

# Project Definition

The Kitsune Protocol is a dark premium modern personal music PWA and archive.

Core definition:

```text
My beats, my rabbit holes, and where my head is right now.
```

The site is built around:

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

---

# Core Navigation

Main nav:

```text
Home
Player
Logs
Fixations
Search
```

Do not add extra top-level nav items unless explicitly requested.

---

# Core Schemas

Use Sanity as the source of truth.

Required MVP schemas:

* beat
* release
* lane
* fixation
* log
* link
* playlist
* quote
* tag
* homepageSettings

Future-only schemas:

* pickItem
* monthlyPick

Do not build future-only schemas unless explicitly requested.

---

# Tech Stack

Use:

* Next.js
* TypeScript
* Tailwind CSS
* selective shadcn/ui
* custom components
* Sanity
* Vercel
* Cloudflare R2 for audio storage

Do not add Supabase in MVP.

Do not add any other database unless explicitly requested.

---

# Sanity Setup

Use the existing Sanity project:

```text
Project name: The Kitsune Protocol
Dataset: tkp-v2
```

The dataset is public.

Sanity stores content metadata, images, schemas, and references.

Cloudflare R2 stores beat audio files.

Sanity beat documents should store R2 audio URLs.

---

# MVP Rules

Build the core PWA first.

Do not add:

* Supabase
* auth
* comments
* likes
* user accounts
* social features
* Quick Add
* Monthly Picks
* pickItem schema
* monthlyPick schema
* Worlds
* Portals
* separate Rabbit Hole schema
* playlist sync engine
* audio upload manager
* complex visibility system

---

# Homepage Rules

Homepage should include:

1. Current Phase ticker
2. New Release Broadcast if active
3. Latest Beat
4. Featured Fixations
5. Latest Logs:

   * Latest Link
   * Latest Playlist
   * Latest Thought
   * View All Logs

Latest Beat, Link, Playlist, and Thought are automatic pulls from newest published non-NSFW items.

Featured Fixations and Release Announcement are controlled by `homepageSettings`.

Do not add `showOnHome`.

Do not add `archiveOnly`.

Do not manually curate every homepage item.

---

# Player Rules

The Player should feel like:

```text
Apple Music layout + Spotify behavior
```

Build:

* persistent mini player
* full player
* queue
* shuffle
* Continue Listening
* Releases
* Lanes
* All Beats
* Beat File links

Music should continue playing while navigating pages.

Default shuffle should use Main Library.

Main Library includes:

* main beats
* approved demos

---

# Beat Rules

Required beat fields:

* title
* audioUrl
* lane

Beat cover art is optional.

If beat has no cover art, use lane fallback cover art.

Each beat should have a Beat File page.

Use **Context** for alternate versions, rough mixes, notes, and related material.

Do not use “Deluxe” as the main wording.

---

# Release Rules

Release means curated collection of beats.

A release can be formal or loose.

Do not enforce monthly or seasonal schedules.

Release cover art is required.

Track order should be manually controlled.

A beat can:

* exist without a release
* be added to a release later
* belong to multiple releases

`releaseType` is optional.

---

# Lane Rules

Lanes are Sanity documents, not just hardcoded strings.

Current lanes:

* Rainview
* Gray Shore
* Fluxwave
* Pretty Dark

Lane colors:

* Rainview: gold + deep rain blue
* Gray Shore: fog gray + pale blue
* Fluxwave: neon vice colors
* Pretty Dark: pink + deep violet/black

Lane styling should be subtle, not full theme changes.

---

# Logs Rules

Logs replace blog posts.

Logs are short, lightweight posts.

MVP log types:

* thought
* lifeUpdate
* beatNote
* fixationNote
* movieThought
* quickList

Title is optional.

Body and/or bullets are required.

Homepage Latest Thought should pull only from `logType = thought`.

Personal Canon, The More You Know, and Sound Byte are tags/purpose labels, not log types.

---

# Link Rules

Links are saved internet objects.

Supported platforms should include:

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

Platform should be auto-detected from URL, with manual override.

Links can support embeds, but fallback cards must exist.

Only Links can become Rabbit Hole items.

---

# Playlist Rules

Playlists are standalone cross-platform playlist objects.

Spotify is the primary embed layer.

Playlist should support:

* Spotify URL
* Spotify embed URL
* Apple Music URL
* YouTube Music URL

The PWA should not sync playlists across platforms.

External tools to remember for playlist syncing:

* Soundiiz
* Tune My Music
* FreeYourMusic
* SongShift
* Playlisty

The site only stores playlist links and embeds.

---

# Quote Rules

Quotes are quotes from other people.

The site owner’s own thoughts should be Logs, not Quotes.

Required quote fields:

* quoteText
* person

Quotes can relate to fixations and appear as quote cards.

Do not make Quotes a main nav item.

---

# Fixation Rules

Fixations are major rabbit-hole containers.

Required fixation fields:

* title
* slug
* shortDescription
* coverImage
* whyThisMatters

Fixation status values:

* active
* sleeping
* archived

Also include:

* isCore: boolean

Multiple active fixations are allowed.

Core fixations should be prominent but not overpowering.

Homepage featured fixations are selected through `homepageSettings`.

---

# Rabbit Hole Rules

Rabbit Holes are link-powered pages tied to Fixations.

Only Links can become Rabbit Hole items.

Do not create a separate Rabbit Hole schema for MVP.

Rabbit Hole page structure:

1. Category tabs
2. Pinned/top items
3. Vertical doom-scroll style feed
4. Load More button

Rules:

* no autoplay
* lazy-load embeds
* show platform labels
* use Load More instead of infinite scroll
* pinned/top first
* newest after pinned
* fallback cards if embeds fail

Rabbit Hole categories are shared global tag values filtered by fixation usage.

---

# Search Rules

Search is MVP.

Search page must support filtering by:

* content type
* tag
* lane
* fixation
* date
* platform
* mood
* release
* quote person/source if needed

Search replaces the need for a separate Archive nav item.

---

# Tag Rules

Tags replace old Worlds/Portals.

Old worlds become tags:

* Music
* Movies
* TV
* Anime
* Gaming
* WWE
* Tech
* Personal
* Origin

Tag schema:

```ts
tag {
  name
  slug
  group
  styleOverride?
}
```

Default groups:

* Media / Interest
* Music Lane
* Mood
* Purpose / Meaning
* Person / Artist
* Platform
* Genre
* Era / Time Period
* Fixation Category
* Rabbit Hole Category
* Life Phase
* Production
* General

General is the catch-all group.

Tag group controls default visual style.

Individual tags can override style when needed.

---

# NSFW Rules

Every major schema should include:

```ts
nsfw: boolean
nsfwReason?: string
```

If `nsfw` is true, content must show a warning before being consumed.

This applies before:

* playing a beat
* loading an embed
* opening a Rabbit Hole item
* revealing a quote/log
* showing sensitive link content

Remember approval per content item using client-side storage.

Example key:

```text
kp_nsfw_approved:<contentType>:<sanityDocumentId>
```

Approving one NSFW item must not approve all NSFW content.

---

# Visual Identity

The site should be:

```text
A dark premium modern app first — with subtle cyberpunk vice color blends and sparse brutalist accents.
```

Dominant style:

* dark premium modern app
* clean mobile dashboard
* polished music-player interface
* readable typography
* smooth spacing
* refined cards and controls

Use subtle system-style details:

* mono accent labels
* status strips
* metadata chips
* Current Phase ticker
* labels like `BEAT_FILE`, `CURRENT_PHASE`, `ENTER_RABBIT_HOLE`

Use brutalist accents sparingly:

* occasional hard borders
* sharp accent cards
* bold outlined buttons

Use cyberpunk/vice colors sparingly:

* subtle neon blends
* soft glows
* lane accents
* electric blue/yellow/pink/cyan touches

Do not make the site look like:

* loud cyberpunk theme
* brutalist experiment
* hacker terminal
* Windows 95 novelty UI
* overdesigned portal app

Typography:

* modern sans-serif for normal UI
* mono accent font for metadata, labels, timestamps, and status elements

---

# PWA Rules

The site should be:

* mobile-first
* installable as a PWA
* decent on desktop
* lightweight
* fast
* easy to use

Music should keep playing while navigating pages.

MVP offline support:

```text
basic offline shell only
```

Do not build offline music playback for MVP.

---

# Future Features

Future-only features:

* Quick Add
* Monthly Picks

## Quick Add

Quick Add is a late/final feature after the PWA works.

It should be a private mobile-friendly route that creates Sanity documents.

It should not use separate storage.

Potential route:

```text
/quick-add
```

Do not expose Sanity write tokens in the frontend.

## Monthly Picks

Monthly Picks is a future-only lightweight recommendation feature.

Each month:

* one show
* one movie
* one anime
* one song

Future schemas:

* pickItem
* monthlyPick

Do not build in MVP.

---

# Build Order

Recommended build order:

1. Core schemas
2. Base layout/nav
3. Home
4. Player
5. Beat Files
6. Releases
7. Lanes
8. Logs
9. Fixations
10. Rabbit Holes
11. Search and filters
12. NSFW system
13. PWA polish
14. Quick Add later

Do not build everything in one pass.

Stop after each phase and summarize what changed.

---

# Final Rule

Keep the site lightweight.

The core mental model is:

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

Do not reintroduce old complexity.
