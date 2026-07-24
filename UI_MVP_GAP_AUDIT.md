# UI / MVP Gap Audit

## 1. Executive summary

The Kitsune Protocol is **PARTIAL** as an MVP. Its modernization is complete and its strongest implemented area—the shared private-audio Player—is functionally mature. The application also has a stable responsive shell, an editorial homepage, Beat Files with Context, a working Search filter interaction, Sanity Studio, and a data model that already supports most remaining MVP pages.

The project is not ready for deployment as the complete MVP. Four required canonical routes are absent: `/releases/[slug]`, `/lanes/[slug]`, `/fixations/[slug]`, and `/fixations/[slug]/rabbit-hole`. The `/logs` route renders only Log documents rather than the required mixed editorial archive. Search implements four relationship-filter groups but not full text/type/date/platform/person filtering. The per-item NSFW approval system and PWA install/offline shell are not implemented.

This is not evidence for a broad rewrite. Existing Player, shell, homepage, design tokens, and playback architecture should be preserved. Remaining work should proceed in small route/feature branches, starting with `ui/05-release-detail`.

## 2. Audit scope and source hierarchy

The audit used this authority order:

1. `MASTER_DOC.md` for product behavior, information architecture, routes, schemas, security, MVP scope, and implementation order.
2. `UI_AESTHETIC_BRIEF.md` for presentation, composition, color, typography, artwork, motion, responsiveness, accessibility, and performance.
3. `docs/references/midnight-city-pop-moodboard.png` as a secondary mood reference only.

The audit covered all routes and components under `src`, all Sanity schemas and queries, R2 signing/playback code, design tokens/global CSS, configuration and modernization reports, repository assets, PWA/special-route files, and Git UI-phase history. It was read-only except for this report.

Status terms used throughout:

- **COMPLETE**: route, data, relationships, interaction, visible and empty behavior, responsiveness, and integration are usable.
- **FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE**: behavior works but final section-specific presentation remains unfinished.
- **PARTIAL**: important required behavior or presentation is absent.
- **PLACEHOLDER**: a location/static rendering exists without the required feature.
- **MISSING**: no meaningful implementation exists.
- **DEFERRED**: explicitly outside MVP or ordered later.
- **BLOCKED**: a genuine decision, asset, or dependency prevents responsible implementation.

## 3. Current branch and technical baseline

- Branch: `ui/04-mvp-gap-audit`, based on merged `main` at `e55a4e3`.
- Modernization final report and functional Search commits are present.
- Node: 24.18.0; npm: 11.16.0.
- Next: 16.2.10; React/React DOM: 19.2.7; Sanity/Vision: 6.4.0; next-sanity: 13.1.1.
- TypeScript: 5.9.3 with ES2017, strict mode, `noEmit`, and bundler resolution.
- ESLint: 9.39.5 with official Next flat configuration.
- Tailwind CSS: 3.4.19; direct PostCSS: 8.5.16.
- Package tree was not changed by this audit.
- Final verification: lint passed with 17 known warnings; TypeScript passed; clean Turbopack build passed.

The merged history includes design foundation, shell/homepage, Player library/MiniPlayer, Beat File/Context, Now Playing/queue, Listening Mode, all modernization stages, unused-dependency cleanup, and functional Search filtering.

## 4. Existing route inventory

| Route | Source / boundary | Data and major components | Navigation / canonical purpose | Status | Main gaps / dependencies |
| --- | --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx`; async server with client Play control | Sanity homepage/latest queries; `HomeBeatPlay`, artwork and Spotify embed | Home nav; canonical homepage | **FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE** | All required blocks exist; final artwork/identity and browser visual review remain |
| `/player` | `src/app/player/page.tsx`; async server into client Player components | Beat, Release, Lane queries; `PlayerSections`, history, libraries | Player nav; canonical player landing | **FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE** | Lane rows are informational; Release/Lane detail destinations absent |
| `/player/now-playing` | server wrapper around client `NowPlayingScreen` | shared PlayerProvider state, queue and Listening Mode | Contextual player destination | **COMPLETE** | Browser/device regression still appropriate |
| `/player/beats/[slug]` | async server route with client playback controls | `beatFileQuery`; `BeatFilePlayer`, `ContextPlayer`, related sections | Canonical Beat File | **PARTIAL** | Main Beat NSFW warns but is not gated; related items often lack canonical links |
| `/logs` | `src/app/logs/page.tsx`; async server | `logsQuery`; inline Log cards | Logs nav | **PLACEHOLDER** | No mixed Links/Playlists/Quotes feed, filters, embeds, NSFW reveal, or full-reading behavior |
| `/fixations` | `src/app/fixations/page.tsx`; async server | `fixationsQuery`; static cards | Fixations nav; aggregate destination | **PARTIAL** | No explicit status grouping, detail navigation, rich artwork treatment, pinned/related content, or Rabbit Hole action |
| `/search` | async server plus client `SearchBrowser` | filter queries and normalized `searchResultsQuery` | Search nav | **PARTIAL** | Relationship chips work; text, type, date, platform, quote-person/source and broader destination coverage remain |
| `/studio/[[...index]]` | server route to client-only dynamic `StudioClient` | Sanity config, `NextStudio` with SSR disabled | Admin-only canonical Studio | **COMPLETE** | Public shell/nav correctly excluded |
| `/api/playback` | server POST route | resolves Beat/Context object key in Sanity; temporary R2 signing | Private playback API | **COMPLETE** | Production CORS/environment validation remains deployment work |
| `/api/playback-history/resolve` | server POST route | resolves stored non-secret playback references | History display API | **COMPLETE** | No material MVP gap found |

No custom `loading.tsx`, `error.tsx`, or `not-found.tsx` exists. Beat Files correctly call Next `notFound()`, but the application otherwise relies on framework defaults for loading/error/not-found presentation and route transitions.

Required routes that do not exist:

- `/releases/[slug]` — **MISSING**
- `/lanes/[slug]` — **MISSING**
- `/fixations/[slug]` — **MISSING**
- `/fixations/[slug]/rabbit-hole` — **MISSING**

Consequences: Releases and Lanes cannot be standalone Search results; Fixation Search results can only land on the aggregate index; related Release/Fixation rows cannot open their documents; Rabbit Hole behavior has no frontend location.

## 5. Schema and relationship readiness

All ten required MVP schemas exist. No new schema is needed merely to start the missing Release, Lane, Fixation, Rabbit Hole, or mixed Logs frontend work.

| Schema | Current model and relationships | Frontend/query readiness | Unused/incomplete presentation | Schema change needed? |
| --- | --- | --- | --- | --- |
| `beat` | Title, optional slug/art, required R2 key and Lane, status, note, tags, Fixations/Logs/Links/Playlists/Quotes, `releaseRefs`, Context versions, NSFW, date | Strong queries for player and full Beat File; lane fallback and reverse Release lookup work | Main Beat gate absent; many related entries display without canonical links | No for current MVP pages; slugs are practically required for canonical files but schema marks them optional |
| `release` | Required title/slug/art/manual ordered Beat refs; optional type, Lane, description, tags, Fixations, NSFW/date | Query preserves manual Beat order and supports Player playback/Search filtering | No detail query/page; tags/description/Fixations underused | No |
| `lane` | Required name/slug; description, colors, fallback art, related Playlists, order, tags, NSFW | Lane query and Beat projections work | No detail query/page, lane playback/filter experience, related Release/Playlist presentation, or applied accent system | No |
| `log` | Optional title; body and/or bullets required; six log types; tags and relations to all archive types; NSFW/date | Logs query returns content and tags | Relations, filters, mixed feed, NSFW and full-reading behavior unused | Probably no; decide whether individual Log routes are required before adding slug fields |
| `link` | URL, title/note/thumbnail/embed, platform fields, broad relations/tags, Rabbit Hole flags/category/pin, NSFW/date | Search supports external routable Links; homepage latest Link works | Mixed feed, embeds/fallback cards, platform detection workflow, Rabbit Hole feed, NSFW gate absent | No |
| `playlist` | Required Spotify URL; optional slug/embed/Apple/YouTube URLs/note; Lane/Fixation/tag refs; NSFW/date | Homepage Spotify embed and Search external destination work | Logs/archive cards and alternate platform links absent; NSFW gate absent | No |
| `quote` | Required quote/person; optional source title/URL, found-via Link, tags/Fixations/Links, NSFW/date | Beat related quotes and sourced Search results work | No archive cards/feed; unsourced Quotes have no canonical public destination; NSFW gate absent | Route decision may affect whether a slug is needed; not required for aggregate feed |
| `fixation` | Required title/slug/description/art/why; status/core; pinned Logs/Links/Playlists/Quotes; related Beats/Releases; tags/NSFW | Index/home/Search queries cover summaries | Detail data query and all pinned/related presentation absent | No |
| `tag` | Required stable name/slug/group; optional style override; includes Mood/Platform/Rabbit Hole groups | Stable IDs power Search Tags; grouping supports future filters/styles | Group-specific presentation and style override largely unused | No |
| `homepageSettings` | Current Phase, featured Fixations, timed Release announcement | Homepage query and scheduling logic implemented | Release broadcast cannot open a Release detail page | No |

NSFW fields exist on every major content schema and Context entry, but model presence must not be confused with consumption protection. `homepageSettings` and `tag` appropriately do not use the shared NSFW fields.

## 6. Existing UI-phase history

| Historical phase | Actual scope | Nature |
| --- | --- | --- |
| UI Phase 0 | Design tokens, typography roles, color/material/motion variables, accessibility foundations, reserved Kitsune asset slot | Visual foundation |
| UI Phase 1 | AppShell, five-item navigation, Studio exclusion, editorial homepage | Functional and visual |
| UI Phase 2A | Player landing, libraries, Releases playback, Lanes rows, persistent MiniPlayer | Functional and visual |
| UI Phase 2B1 | Beat File and Context presentation | Functional and visual |
| UI Phase 2B2 | Now Playing and queue presentation | Functional and visual |
| UI Phase 3A | Full-screen Listening Mode, focus containment and expressive artwork state | Functional and visual, limited to Listening Mode |
| Search branch | Server/client filter split, relationship chips, normalized routable results | Functional with restrained presentation |

“UI Phase 3A complete” meant that the planned Listening Mode phase was complete, not that all MASTER_DOC MVP pages existed. Git history shows those phases focused deliberately on shell/home and Player experiences; it contains no Release detail, Lane detail, Fixation detail, Rabbit Hole, full mixed Logs archive, NSFW approval system, or PWA phase.

## 7. Page-by-page product status

### A. App shell and navigation — FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE

- Correct primary navigation: Home, Player, Logs, Fixations, Search.
- Active states, 44px targets, bottom safe-area padding, persistent MiniPlayer, and Studio exclusion exist.
- Desktop expands the mobile shell rather than becoming a separate sidebar application.
- No custom transition/loading/error surfaces; identity mark is an intentional empty slot pending an approved asset.
- Source/CSS align with restrained navigation, but browser inspection is still needed for real mobile safe-area and desktop density.

### B. Homepage — FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE

- Current Phase, conditional New Release Broadcast, Latest Beat, Featured Fixations, Latest Link, Latest Playlist, Latest Thought, and View All Logs all exist.
- Latest content is automatic; featured Fixations and broadcast are controlled by `homepageSettings`.
- Current Phase is a thin secondary strip. The page uses asymmetry, editorial rows, and one artwork-led Beat rather than equal dashboard cards.
- Featured Fixations still link only to the index, and the broadcast cannot open a Release detail route.
- Preserve the structure; revisit only assets, destination links, and final browser-tested spacing later.

### C. Player — FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE

- Continue Listening, Recently Played, Recently Added, Main Library shuffle, Releases, All Beats, queue, MiniPlayer, Now Playing, Listening Mode, repeat, Media Session, completion actions, history, artwork fallback, and functional empty/error states exist.
- One shared `HTMLAudioElement` in PlayerProvider persists across navigation; R2 URLs are temporary and server-generated.
- Release playback respects ordered query results. Lanes are descriptive rows only, not playable/filterable sections.
- Player is sparse and dark as required; final device/browser validation and canonical Release/Lane linking remain.

### D. Beat Files and Context — PARTIAL

- Main Beat and eligible Context playback use the shared player.
- Context notes, dates/types, NSFW Context lockout, lane/art fallback, tags, related Logs/Links/Playlists/Quotes/Fixations/Releases, metadata, and valid 404 behavior exist.
- Related Links open externally and Playlists embed. Other related rows are often display-only because canonical pages are missing.
- NSFW main Beats show a warning but are still playable without per-item approval; this prevents a complete classification.
- Progressive disclosure is reasonable through sections/details and should be preserved.

### E. Releases — PARTIAL

- Schema, required art, manual Beat ordering, Player gallery, play-Release action, Beat reverse relationships, and Search Release-to-Beat filtering work.
- `/releases/[slug]` and its data query are missing. Search correctly excludes Release documents rather than using a false fallback.
- Detail work should present art, description/type/Lane/tags, ordered tracks, playback, related Fixations, and NSFW gate as a sparse gallery—not alter existing Player playback.

### F. Lanes — PARTIAL

- Schema, descriptions/colors/fallback artwork/order/tags/related Playlists, Player rows, and Beat association exist.
- No `/lanes/[slug]`, lane Beat/Release/Playlist query, lane playback/filtering, or subtle accent application exists.
- Lane styling is not currently a full-app theme, which is correct.

### G. Logs, Links, Playlists, and Quotes — PLACEHOLDER

- `/logs` only renders Log documents in a simple grid with body/bullets.
- There is no mixed feed, Log type/tag filter, Link card/embed/fallback behavior, Playlist card with Spotify/Apple/YouTube destinations, Quote card/source handling, NSFW reveal, or full-reading behavior.
- Homepage and Beat Files prove some isolated Link/Playlist/Quote presentation primitives, but not the required archive experience.
- Presentation is card-like rather than the final text-led editorial journal.

### H. Fixations — PARTIAL

- Index, homepage features, core/status labels, descriptions, art query, and Search aggregate destination exist.
- Index does not explicitly group Core/Active/Sleeping/Archived and barely uses artwork.
- No detail route, why-this-matters page, pinned items, related content, Enter Rabbit Hole action, or layered image-rich composition exists.

### I. Rabbit Holes — MISSING

The Link schema is ready (`isRabbitHoleItem`, category, pinned flag, Fixation relations), but there is no route, query, or UI for category tabs, pinned-first/newest ordering, Link-only feed, lazy embeds, fallbacks, Load More, platform labels, no-autoplay enforcement, NSFW gate, or video-first presentation. No separate Rabbit Hole schema is needed or approved.

### J. Search — PARTIAL

See Section 8.

### K. NSFW system — PARTIAL

See Section 9.

### L. PWA — MISSING

See Section 10.

### M. Production readiness — PARTIAL

- Runtime declarations, `.env.example`, Sanity configuration, private R2 server design, clean build, and security documentation exist.
- No in-repo Vercel connection/config confirms production state; external project settings are unknown.
- Production R2 CORS, environment variables, Sanity production access, and Node selection need external verification.
- There is no test script/CI, approved PWA icon package, manifest, offline shell, or completed manual MVP regression.
- Upstream moderate Next/Sanity security findings remain documented and deferred; deployment must not precede core MVP completion.

## 8. Search status

Recently completed and working:

- Async server Search page with a dedicated client browser.
- Semantic buttons, `aria-pressed`, native keyboard activation, selected state, and second-click clearing.
- Visible Tags, Lanes, Fixations, and Releases chip groups; all four are real filters.
- Stable Tag-ID matching across Beats, Links, Playlists, sourced Quotes, and Fixations.
- Lane matching for Beats and related Playlists.
- Fixation matching through relationships plus Fixation documents themselves.
- Release filtering returns associated Beats only; Beats use `/player/beats/[slug]`.
- Routable result policy: stored Link URL, Spotify Playlist URL, sourced Quote URL, and `/fixations` for Fixations.
- Clear result type metadata and empty result state.

Still missing from the full MVP specification:

- Text input/search.
- Content-type filter.
- Date filter.
- Dedicated platform filter (Platform tags may appear generically but are not a distinct platform control).
- Dedicated Mood control (Mood tags may appear generically but are not a distinct control).
- Quote person/source filter.
- Result grouping beyond per-row type clarity.
- Standalone Releases and Lanes, excluded because canonical routes do not exist.
- Logs, excluded because no canonical individual destination was established.
- Unsourced Quotes, excluded because they have no valid destination.
- Fixations currently land on the index rather than a canonical detail route.
- Random Dive is not implemented and must not become primary navigation.

Search should be extended after canonical content routes and archive decisions are settled, not rewritten.

## 9. NSFW status

Overall classification: **PARTIAL**.

What exists:

- `nsfw` and `nsfwReason` fields on Beats, Releases, Lanes, Fixations, Logs, Links, Playlists, Quotes, and Context items.
- Homepage and most aggregate queries exclude NSFW documents.
- Context rows visibly lock NSFW Context audio and omit it from the playable queue.
- Beat File displays the warning reason for an NSFW Beat.

What is absent or insufficient:

- No `kp_nsfw_approved:<contentType>:<id>` localStorage implementation.
- No per-item approval component, persistence, keyboard flow, or exact item scoping.
- Main Beat playback is not blocked before approval.
- Links are not gated before opening.
- Embeds are not gated before loading.
- Playlists, Quotes, Logs, and Fixations have no reveal gates.
- Rabbit Hole consumption does not exist.
- Query exclusion is not a substitute for the specified warning/reveal experience.

There is no global approve-all behavior, but only because the approval system itself is absent.

## 10. PWA status

Overall classification: **MISSING**.

- No web app manifest.
- No `public/` directory, install icons, approved Kitsune app mark, or favicon.
- No theme metadata or standalone display declaration.
- No service worker, basic offline shell, or offline fallback.
- No installability implementation.
- Mobile viewport defaults, safe-area CSS, responsive shell, and persistent audio continuity exist.
- Offline music is correctly absent and must remain explicitly out of scope.

PWA work is **BLOCKED** only for final production icon/mark assets and decisions about browser support/offline caching details; manifest/offline-shell architecture can otherwise be planned from MASTER_DOC.

## 11. Visual and interaction alignment

This assessment is source/CSS-backed, not a claim of live pixel review.

| Section | Alignment | Evidence / concern |
| --- | --- | --- |
| Shell/navigation | Partly aligned | Correct five-item mobile navigation, dark overlay, safe areas and restrained icons; approved mark absent |
| Home | Aligned in structure | Editorial asymmetry, negative space, thin dividers, dominant Beat, restrained Current Phase; final assets/real viewport review pending |
| Player | Aligned | Sparse/dark, text-first rows, artwork used selectively, disciplined accent and controls |
| MiniPlayer | Aligned | Compact persistent surface with clear controls and progress |
| Now Playing | Aligned | Focused music-first composition, restrained glow and metadata |
| Listening Mode | Aligned | Most expressive state, artwork-led bloom, lane palette, restrained animation and focus handling |
| Beat Files | Partly aligned | Strong progressive sections and artwork; related content destinations and NSFW behavior incomplete |
| Releases | Partly aligned | Player gallery is sparse; required detail gallery not implemented |
| Lanes | Partly aligned | Subtle metadata/art rows, no full-theme misuse; detail/accent behavior absent |
| Logs | Clearly misaligned | Generic equal cards rather than text-led editorial journal; mixed archive absent |
| Fixations | Clearly misaligned | Simple cards with minimal artwork rather than deepest, layered, image-rich section |
| Rabbit Holes | Not implemented | No visual surface exists |
| Search | Partly aligned | Functional, restrained, accessible chips/rows; still card-group heavy and feature-incomplete |

Sitewide positives: near-black/navy tokens, disciplined accent families, readable English-first hierarchy, mono metadata roles, thin dividers, minimum 44×44 targets, visible global focus, reduced-motion handling, responsive breakpoints, and limited strong motion.

Sitewide concerns: no approved Kitsune identity asset; repeated rounded containers on incomplete routes; raw `<img>` usage and blur effects merit later performance review; no live contrast/keyboard/device testing was available. Desktop remains an expanded mobile layout, correctly avoiding a separate sidebar application.

## 12. Moodboard interpretation

The inspected file is `docs/references/midnight-city-pop-moodboard.png`.

Safe principles to carry forward:

- Near-black/night-navy foundation.
- Restrained magenta, cyan, coral and gold accents.
- Thin dividers and precise grids.
- Late-night city atmosphere and emotional stillness.
- Editorial spacing and negative space.
- Sparse music presentation and compact persistent MiniPlayer.
- Gallery treatment for Releases.
- Image-led, layered Fixations.
- Text-led Logs.

Literal elements not approved:

- Desktop sidebar navigation.
- Recurring anime protagonist or character-led brand system.
- Japanese translations under every label.
- Exact moodboard mask artwork as production identity.
- Dense equal panel layouts and exact card grid.
- Replacement navigation labels.
- Card-heavy dashboard structure.
- Random Dive as primary navigation.
- A separately designed desktop application.

The moodboard is atmosphere, not a wireframe. MASTER_DOC navigation and behavior remain authoritative.

## 13. MVP implementation-gap matrix

| Area | MVP? | Route? | Model ready? | Query ready? | Interaction ready? | Mobile ready? | Final aesthetic? | NSFW ready? | Status | Main missing pieces | Dependencies | Future branch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shell/navigation | Yes | Yes | N/A | N/A | Yes | Yes | Partial | N/A | **FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE** | Identity asset, loading/error transitions, live review | Approved mark later | `ui/13-final-polish` |
| Home | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Query exclusion only | **FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE** | Canonical Release/Fixation links, asset polish | Release/Fixation detail | `ui/13-final-polish` |
| Player landing | Yes | Yes | Yes | Yes | Yes | Yes | Mostly | Partial | **FUNCTIONALLY COMPLETE / VISUALLY INCOMPLETE** | Lane interaction/detail links, final review | Lane/Release detail | `ui/06-lane-detail` |
| MiniPlayer | Yes | Shared | Yes | Yes | Yes | Yes | Mostly | No main gate | **COMPLETE** | NSFW integration | NSFW phase | `ui/12-nsfw-system` |
| Now Playing | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No main gate | **COMPLETE** | NSFW integration only | NSFW phase | `ui/12-nsfw-system` |
| Listening Mode | Yes | Overlay | Yes | Yes | Yes | Yes | Yes | Inherits player gap | **COMPLETE** | Approved rare identity asset later | Asset/NSFW | `ui/13-final-polish` |
| Beat Files | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Partial | **PARTIAL** | Main gate and canonical related links | Detail routes, NSFW | `ui/12-nsfw-system` |
| Releases | Yes | Missing detail | Yes | Partial | Playback only | Player only | Partial | No | **PARTIAL** | Detail query/page, metadata, track list and related content | None | `ui/05-release-detail` |
| Lanes | Yes | Missing detail | Yes | Partial | No lane playback/filter | Player rows only | Partial | No | **PARTIAL** | Detail query/page, Beats/Releases/Playlists, accent | Release route helpful | `ui/06-lane-detail` |
| Logs | Yes | Aggregate only | Yes | Basic | Basic render | Basic | No | No | **PLACEHOLDER** | Mixed feed, filters, editorial layouts, reveal | Route decision | `ui/07-archive-feed` |
| Links | Yes | External only | Yes | Partial | Isolated external links | Partial | No | No | **PARTIAL** | Cards, embeds/fallbacks, platform behavior, archive integration | Archive feed | `ui/07-archive-feed` |
| Playlists | Yes | External/embed | Yes | Partial | Homepage embed | Partial | Partial | No | **PARTIAL** | Archive cards, all platform links, NSFW | Archive feed | `ui/07-archive-feed` |
| Quotes | Yes | Source URL only | Yes | Partial | Isolated display | Partial | No | No | **PARTIAL** | Quote cards, sources, archive integration/reveal | Archive route decision | `ui/07-archive-feed` |
| Fixations index | Yes | Yes | Yes | Yes | Basic | Basic | No | No | **PARTIAL** | Grouping, art hierarchy, detail links | Fixation detail | `ui/08-fixation-detail` |
| Fixation detail | Yes | No | Yes | No | No | No | No | No | **MISSING** | Entire detail query/page and related/pinned sections | Archive components useful | `ui/08-fixation-detail` |
| Rabbit Holes | Yes | No | Yes | No | No | No | No | No | **MISSING** | Entire Link-only feed/category/load/embed/gate experience | Fixation detail | `ui/09-rabbit-holes` |
| Search | Yes | Yes | Yes | Partial | Partial | Yes | Partial | Query exclusion only | **PARTIAL** | Text/type/date/platform/mood/person, canonical result routes | Content detail routes | `ui/10-search-completion` |
| NSFW system | Yes | Cross-site | Yes | Partial | No approval system | No | N/A | No | **PARTIAL** | Per-item approval/gates across every consumption path | Core routes first | `ui/12-nsfw-system` |
| PWA | Yes | No manifest | N/A | N/A | No | Shell only | No assets | N/A | **MISSING** | Manifest, icons, service worker, offline shell/fallback | Approved icons | `ui/11-pwa-shell` |
| Production deployment | Yes, after MVP | N/A | N/A | N/A | No | N/A | N/A | Must verify | **DEFERRED** | Vercel/env/CORS/manual regression/CI decisions | All core MVP phases | `ops/01-production-readiness` |

## 14. Missing canonical routes

1. `/releases/[slug]`: explicitly required; model is ready. Its absence blocks standalone Release Search results and homepage/related Release navigation.
2. `/lanes/[slug]`: explicitly required; model is ready. Its absence blocks canonical Lane discovery and grouped Lane content.
3. `/fixations/[slug]`: explicitly required; model is ready. Its absence collapses all Fixation results/features onto the index.
4. `/fixations/[slug]/rabbit-hole`: explicitly required; Link model is ready. Its absence blocks the Rabbit Hole MVP.

Generic fallback destinations should not be introduced. Search’s current exclusions are preferable to misleading links. A decision about individual Log routes is genuinely open: MASTER_DOC requires a Logs page and full-reading behavior but does not state a canonical `/logs/[slug]` convention, and Log currently has no slug.

## 15. Required decisions and asset blockers

- Approved production Kitsune mask/app-icon/favicon assets. The current `KitsuneMark` intentionally renders no invented geometry; moodboard art is not approved.
- Environmental artwork availability and licensing for later Fixation/listening/home polish. Existing Sanity content art can carry core pages without blocking route implementation.
- Decide whether Logs need individual detail pages or whether accessible expansion/reading within `/logs` satisfies full-reading behavior. This affects slug/schema and Search destinations.
- Decide the public treatment of unsourced Quotes: aggregate archive destination versus non-clickable result; do not invent a fallback.
- Define supported browser floor and offline caching policy for the basic PWA shell. Offline audio remains excluded.
- Verify production R2 CORS and Vercel/Sanity environment configuration externally before deployment.

Not blockers: Release, Lane, Fixation, and Rabbit Hole route conventions are already specified; their schemas already carry sufficient initial data.

## 16. Prioritized remaining roadmap

Each phase must start from the previous verified checkpoint, preserve the five-item navigation and shared PlayerProvider, and end with lint, TypeScript, clean build, diff check, and route-focused manual checks.

### 1. `ui/05-release-detail` — medium risk

- Scope/files: add `/releases/[slug]`, narrow query/types, sparse gallery detail, ordered playable tracks, metadata/relationships, not-found behavior; update truthful existing Release links/Search eligibility.
- Depends on: current branch only.
- Must not change: Release schema/manual order, Player release playback, queue/audio architecture, primary navigation.
- Manual checks (max five): open Release; play first track; confirm track order; open Beat File; invalid slug returns not found.
- Rollback: merged `main`/this audit checkpoint.

### 2. `ui/06-lane-detail` — medium risk

- Scope/files: add `/lanes/[slug]`, Lane query, related Beats/Releases/Playlists, subtle lane accents, playback entry using shared player.
- Depends on: Release detail for canonical Release links.
- Must not change: global theme, Lane schema, default shuffle, audio lifecycle.
- Manual checks: open Lane; play Beat; open Release; verify fallback art; compare mobile/desktop.
- Rollback: completed Release branch.

### 3. `ui/07-archive-feed` — medium-high risk

- Scope/files: complete `/logs` as text-led mixed Logs/Links/Playlists/Quotes archive; filters, Link fallbacks/lazy embeds, platform links, Quote sources, empty states; resolve full-reading route/expansion decision first.
- Depends on: route decision; reusable destination patterns from earlier details.
- Must not change: schemas without explicit decision, autoplay rules, primary navigation, Spotify validation.
- Manual checks: filter Log type; open Link fallback; load allowed embed; open alternate Playlist platform; read Quote/source.
- Rollback: Lane checkpoint.

### 4. `ui/08-fixation-detail` — medium risk

- Scope/files: add `/fixations/[slug]`, full query, why-this-matters, pinned and related content, status/core metadata, image-rich progressive layout, Enter Rabbit Hole link target.
- Depends on: canonical Release and archive presentation components.
- Must not change: Fixation schema/status values, homepage curation, navigation.
- Manual checks: open each status; inspect why content; open pinned item; open related Beat/Release; invalid slug.
- Rollback: archive-feed checkpoint.

### 5. `ui/09-rabbit-holes` — high risk

- Scope/files: add nested route/query/client pagination; Link-only categories, pinned-first/newest ordering, lazy embeds/fallbacks, Load More, no autoplay, platform labels.
- Depends on: Fixation detail and archive Link cards.
- Must not change: no new Rabbit Hole schema, no infinite scroll/autoplay, no non-Link feed items.
- Manual checks: category filter; pinned ordering; Load More; fallback/embed behavior; navigation back to Fixation.
- Rollback: Fixation checkpoint.

### 6. `ui/10-search-completion` — medium risk

- Scope/files: extend current Search incrementally with text, content type, date, platform/Mood/person where data supports it; enable new canonical result types; preserve current relationship filters.
- Depends on: canonical routes and archive decision.
- Must not change: Search server/client split, stable IDs, Release-to-Beat behavior, schemas without approval.
- Manual checks: text search; content type; non-Beat Tag; Release-to-Beat; empty/clear state.
- Rollback: Rabbit Hole checkpoint.

### 7. `ui/11-pwa-shell` — medium risk

- Scope/files: manifest, approved icons, metadata, service worker/basic offline shell and fallback; explicitly exclude offline audio.
- Depends on: approved icon assets and browser/cache policy.
- Must not change: playback storage/security, public R2, navigation.
- Manual checks: installability; standalone launch; offline shell; online recovery; playback remains online-only.
- Rollback: Search checkpoint.

### 8. `ui/12-nsfw-system` — high risk

- Scope/files: reusable per-item approval gate and localStorage keying across Beats, Context, Links/embeds, Rabbit Holes, Playlists, Quotes, Logs, Fixations; preserve reasons and keyboard access.
- Depends on: all consumption routes existing. Although listed after PWA to match general sequencing, it must finish before production and may safely precede PWA if assets block PWA.
- Must not change: item-scoped approvals, no global approve-all, server secrets, audio lifecycle.
- Manual checks: gate one item; persistence; another item remains locked; keyboard approval; refresh/revoke behavior.
- Rollback: prior verified checkpoint.

### 9. `ui/13-final-polish` — medium risk

- Scope/files: cross-site aesthetic/accessibility/performance pass, approved Kitsune assets, loading/error/not-found surfaces, live responsive/focus/contrast review, targeted image/blur decisions.
- Depends on: core routes/features complete.
- Must not become: full rewrite, sidebar, card dashboard, moodboard copy, navigation change.
- Manual checks: Home mobile; Player continuity; Logs reading; Fixation/Rabbit Hole; keyboard/reduced motion.
- Rollback: NSFW/PWA-complete checkpoint.

### 10. `ops/01-production-readiness` — high risk

- Scope: Vercel project/runtime/env, R2 CORS, Sanity production access, security recheck, preview smoke tests, deployment plan.
- Depends on: all MVP and final regression phases.
- Must not change: dependency versions via opportunistic upgrade, bucket privacy, secrets exposure.
- Manual checks: deployed Home playback; navigation continuity; Search; Studio exclusion; PWA/NSFW smoke.
- Rollback: final predeployment release checkpoint and prior deployment.

## 17. Recommended immediate next branch

Create `ui/05-release-detail` from the reviewed audit checkpoint.

Why first: Release data, ordered playback, art, slugs, Lane/tag/Fixation relations, and Player presentation already exist. The missing canonical page is a bounded gap with no required schema migration. Completing it unlocks truthful homepage/Beat File links and standalone Release Search results, and provides a pattern for Lane/Fixation details without touching PlayerProvider.

Acceptance boundary: one Release detail route/query/presentation with existing shared playback, correct 404/empty behavior, responsive sparse-gallery styling, and no navigation/schema/dependency changes.

## 18. Automated verification

Final audit verification record:

- `npm run lint`: passed with 0 errors and the existing 17 warnings (10 `no-img-element`, 4 unused variables, and 3 narrow React warnings).
- `npx tsc --noEmit`: passed.
- User confirmed no known TKP `dev` or `build` terminal was active; unrelated Node processes were explicitly nonblocking.
- Only `.next` was deleted; deletion succeeded without locks.
- `npm run build`: passed with Next 16.2.10 Turbopack.
- Built routes: `/`, `/fixations`, `/logs`, `/player`, `/player/beats/[slug]`, `/player/now-playing`, `/search`, `/studio/[[...index]]`, `/api/playback`, `/api/playback-history/resolve`.
- `git diff --check`: run after report creation.
- Build-only `next-env.d.ts` route import was inspected and restored by the user to the branch version.
- No test script exists in `package.json`.

## 19. Visual-inspection limitations

The moodboard image itself was inspected at original resolution. No existing automated browser interaction/screenshot capability was available for rendering the live application at approximately 390px and desktop widths, and no browser package was installed.

Visual findings therefore come from authoritative documents, JSX structure, Tailwind classes, global CSS/tokens, responsive breakpoints, accessibility attributes, and the moodboard—not invented pixel observations. Live review is still required for actual content lengths, remote artwork, contrast, focus order, device safe areas, browser media controls, blur performance, and desktop/mobile composition.

## 20. Integrity statement

This task audited implementation only. It did not create or alter a route, component, schema, query, feature, dependency, asset, configuration, package manifest, lockfile, environment file, service worker, or deployment setting. It did not merge, rebase, reset, commit, run automatic fixes, or begin implementation.

The only intended tracked change is `UI_MVP_GAP_AUDIT.md`. The report is ready for review and should be used to sequence small future branches rather than justify a broad UI rewrite.
