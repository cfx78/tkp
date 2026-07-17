# Final Build Rebaseline

Audit date: 2026-07-16  
Branch and baseline: `ui/10-final-build-rebaseline` at `55ab09a` (`Add local Spotify thumbnail workflow`)  
Status vocabulary: **Complete**, **Visually incomplete**, **Functionally incomplete**, **Technically blocked**, **User-asset blocked**, **Deferred**.

## 1. Executive status

The application is no longer an early MVP shell. The music architecture, all named public route families, private R2 playback, the persistent audio runtime, archive relationships, safe Rabbit Hole previews, multi-provider Playlist entry/presentation, thumbnail security pipeline, and local Spotify thumbnail CLI exist in current source. The remaining work is convergence and launch hardening, not a rewrite.

- **Complete:** runtime modernization; core Sanity schemas and relationships; private signed playback; one persistent `HTMLAudioElement`; Main Beat/Context playback; queue/shuffle/repeat/history/Media Session; Home data selection; Player/Now Playing/Beat File/Release/Lane/Logs/Fixation/Rabbit Hole route foundations; safe provider parsing; current automated security/parser tests.
- **Visually incomplete:** Fixations index and Search retain the clearest old rounded-card/dashboard language. Shell, Home, Player, Beat Files, Releases, Lanes, Logs, Fixation detail, and Rabbit Holes are closer but still need one final systemwide typography/accent/artwork/composition pass.
- **Functionally incomplete:** Search lacks query text, content type, platform, date, and mood filters; Logs are absent from Search results; the item-specific NSFW approval/warning system does not exist; PWA manifest/icons/service worker/offline shell do not exist.
- **Technically blocked:** production launch verification depends on real Vercel/Sanity/R2/domain configuration and CORS checks outside this repository.
- **User-asset blocked:** approved solid and monoline Kitsune marks, favicon/app-icon exports, and any approved environment/listening/empty-state artwork are absent.
- **Deferred:** Quick Add, Monthly Picks, provider expansion, generic Open Graph crawling, inline social scripts, accounts/social features, sync, offline audio, upload management, Worlds, and Portals.

The project is ready to begin incremental final visual convergence. It is not launch-ready until Search, NSFW, PWA/assets, production content, accessibility/responsive/performance verification, and deployment checks are complete.

Older reports are stale where they predate Release/Lane detail routes, Logs/Fixation/Rabbit Hole phases, Search interaction fixes, Playlist provider expansion/previews, thumbnail sanitization/provenance, Spotify backend/CLI, and the current Next 16/React 19/Sanity 6 dependency state.

## 2. Source-of-truth hierarchy

1. `MASTER_DOC.md`: behavior, information architecture, routes, schemas, relationships, storage, security, and scope.
2. `UI_AESTHETIC_BRIEF.md`: final Midnight City-Pop Archive presentation, composition, color, typography, motion, artwork, voice, and responsive behavior.
3. `docs/references/midnight-city-pop-moodboard.png`: mood only; never authority for layout, navigation, Japanese, characters, cards, or density.

Functionality wins if documents conflict. The aesthetic brief supersedes older cobalt/ember, broad cyberpunk, vice, retro-futurist, and card-dashboard presentation language. No full rewrite is warranted.

## 3. Completed implementation inventory

| Area | Current classification | Evidence and remaining work |
|---|---|---|
| Node/npm and framework modernization | **Complete** | Node 24/npm 11 engines; Next 16.2.10, React 19.2.7, Sanity 6.4.0; modernization commits through `8a73f3a`. |
| UI tokens/foundation | **Complete; visual convergence remains** | `8744908`; semantic palette/type/layout/motion tokens and primitives exist. Compatibility aliases and hardcoded page styles remain. |
| Shell and Home | **Complete; visually incomplete** | `01eab70`, `de614a1`; correct five-item nav, editorial destination menu, current homepage queries/order. Final identity/assets and polish remain. |
| Player and MiniPlayer | **Complete; visually incomplete; protected** | `4b4f07f`, `1b3f545`; library sections, persistent MiniPlayer, coarse-pointer scrubber. Preserve offset/safe-area/audio behavior. |
| Now Playing | **Complete; visually incomplete** | `777ef14`; current media, transport, seek, repeat, queue, and listening-mode entry exist. |
| Beat Files and Context | **Complete; NSFW incomplete** | `c2c2214` plus playback phases; related archive and version queue exist. Current NSFW behavior locks rather than item-approves. |
| Queue/history/listening mode | **Complete; visually incomplete; protected** | Queue/repeat/shuffle/history/Media Session and listening overlay exist. Listening mode is a black-void foundation, not the final approved identity state. |
| Release details | **Complete; visually incomplete** | `b072a14`; required cover, manual Sanity track order, queue playback, lane/tags. |
| Lane details | **Complete; visually incomplete** | `3047d3a`; lane art/accent, beats, releases, related Playlists. |
| Logs | **Complete; visually incomplete** | `f74df2f`; unified Log/Link/Playlist/Quote feed, filters, reader dialog, relationships. |
| Fixations | **Complete; index visually stale** | `44de61d`; index/detail, pinned/recent hierarchy and relationship trails. Index retains old cards. |
| Rabbit Holes | **Complete; final visual pass remains** | `2084ab2`, `1cf6340`; Link-only model, categories, pinned ordering, 8+8 Load More, click-to-load trusted previews, external fallbacks. |
| Search | **Foundation complete; functionally incomplete** | `f0c696f`; Tag/Lane/Fixation/Release single-selection filters and safe destinations work. Required query/type/platform/date/mood coverage is missing. |
| Link entry | **Complete** | `ad2e91f`; trusted URL/embed-code normalization and manual platform override. |
| Playlist entry/previews | **Complete** | `df2d220`, `179b95a`, `9d95807`; Spotify, Apple Music, YouTube/YouTube Music parsing and shared provider preview selection. |
| Thumbnail security/sanitizer/backend/CLI | **Complete for approved Spotify track/album scope** | `a45eed8`, `0b24e9d`, `fb541c4`, `55ab09a`; provenance, bounded fetch/image normalization, Sharp isolation, authenticated local command. Extra providers are **Deferred**. |

## 4. Current route matrix

| Route | Functional/visual status | Components and protected behavior | Final gap, responsive/accessibility, change type |
|---|---|---|---|
| `/` | **Complete; visually incomplete** | Home server page, `HomeBeatPlay`, `PlaylistPreview`, primitives; protect automatic non-NSFW newest-item queries and settings curation. | Add approved identity/environment only when available; refine 320–430 spacing and Playlist density. Mostly restyle. |
| `/player` | **Complete; visually incomplete** | `PlayerSections`, `BeatLibrary`, history, provider; protect Main Library shuffle, histories and queues. | Make artwork/current-media hierarchy more central and secondary lists quieter. Markup refinement/restyle. |
| `/player/now-playing` | **Complete; visually incomplete** | `NowPlayingScreen`, `PlaybackQueue`, `ListeningMode`; protect transport, seek, queue/repeat/shuffle and continuous audio. | Final compact-sheet hierarchy and listening identity. Restyle/restructure without state changes. |
| `/player/beats/[slug]` | **Complete; NSFW incomplete** | Beat/Context players, related content and shared provider preview; protect Context IDs/queue and lane fallback. | Item-warning approval and final editorial spacing. Small markup/restyle plus later functional NSFW branch. |
| `/releases/[slug]` | **Complete; visually incomplete** | `ReleaseDetailPlayer`; protect manual track order and release queue. | Sparse gallery convergence and mobile long-title review. Mostly restyle. |
| `/lanes/[slug]` | **Complete; visually incomplete** | `LaneDetailPlayer`, shared Playlist preview; protect Sanity lane accent/art fallback and related data. | Restrain atmosphere/accent and make gallery rhythm consistent. Mostly restyle. |
| `/logs` | **Complete; visually incomplete** | `LogsBrowser`, reader dialog, provider preview; protect content-type distinctions, filters, focus trap/inert/scroll restoration. | Typography/measure and mobile filter disclosure polish. Mostly restyle. |
| `/fixations` | **Complete; visually incomplete** | Server list and direct links; protect Core/status ordering from query. | Old equal rounded-card grid conflicts with hierarchy and cinematic crops. Genuine composition/markup restructuring. |
| `/fixations/[slug]` | **Complete; visually incomplete** | Detail page, pinned/recent/related renderers; protect relationship qualification/order and Rabbit Hole availability. | Stronger authored hierarchy, shared media rows, crop audit. Markup refinement/restyle. |
| `/fixations/[slug]/rabbit-hole` | **Complete; visually incomplete** | `RabbitHoleBrowser`, YouTube/Spotify trusted preview parsers; protect pinned-first ordering, filter reset, Load More, click-to-load/no autoplay. | Reduce social-feed feeling, keep media density controlled, validate long URLs/titles. Mostly restyle. |
| `/search` | **Functionally and visually incomplete** | `SearchBrowser`, serialized server projection; protect external `target`/`rel` and internal Release/Lane/Beat/Fixation routes. | Complete filters/query, then replace cards/pills and improve mobile disclosure. Structural functional change required. |
| `/studio/[[...index]]` | **Complete; isolated** | `StudioClient`, Sanity config. `AppShell` returns children only for `/studio`; no public nav/MiniPlayer wrapper. | Production auth/origin behavior must be checked. Do not visually converge with public shell. |
| `POST /api/playback` | **Complete; protected** | Published-perspective Sanity lookup, validated object key, 15-minute signed GET, no-store response. | Main Beat query does not currently check beat-level `nsfw`; must align with approval design without exposing object keys. |
| `POST /api/playback-history/resolve` | **Complete; protected** | Resolves opaque IDs only, excludes unavailable/NSFW Context, no-store. | Align all NSFW types with approval design; preserve serialization and no object keys. |

No additional application routes exist. Studio is route-grouped but correctly isolated at runtime by pathname.

## 5. Shared-component matrix

| Component/system | Classification | Direction |
|---|---|---|
| `AppShell` / bottom nav | Retain behavior, restyle; **protected/high-risk** | Preserve five destinations, route active logic, safe-area padding, Studio bypass, MiniPlayer stacking. |
| `MiniPlayer` | Retain behavior, restyle; **protected/high-risk** | Preserve persistent state, scrubber interaction, controls and nav offset. |
| `PlayerProvider` | **Retain unchanged; protected/high-risk** | Owns the one persistent `Audio`; no replacement/provider duplication/audio remount. Only targeted NSFW authorization integration later. |
| `presentation-primitives` | Retain and extend carefully | Useful type/artwork/metadata/empty primitives; `MediaArtwork` native image sizing needs performance review. |
| `KitsuneMark` | **User-asset blocked** | Correctly renders an empty reserved slot; not obsolete and must not invent geometry. |
| Beat/Release/Lane/Home/Context players | Retain behavior, consolidate styling | Repeated circular play controls/current edges can share a visual control primitive after behavior is left local. |
| `PlaybackQueue`, history, `BeatLibrary` | Retain behavior, restyle | Compact editorial rows are directionally correct. Consolidate row rhythm/current-state styling, not data logic. |
| `NowPlayingScreen`, `ListeningMode` | Restructure markup while retaining behavior; protected | Refine compact layers/art hierarchy. Keep portal/focus/scroll and playback bindings. |
| `PlaylistPreview` / `SpotifyPlaylistEmbed` | Retain behavior; restyle | Shared provider selection is complete; remove residual rounded embed treatment only where provider constraints allow. |
| Link presentation | Consolidate duplicated styling | Home, Logs, Beat File, Fixation detail, Rabbit Hole, Search each implement external rows/actions; share visual primitives while preserving specialized safe-preview logic. |
| `LogsBrowser` / reader | Retain behavior, restyle; reader protected | Preserve semantic distinction and dialog focus/inert/scroll restoration. |
| `RabbitHoleBrowser` | Retain behavior, restyle; protected | Preserve parser-owned iframe URLs, explicit activation, category/reset/load behavior. |
| Headings/metadata/empty states | Retain; consolidate adoption | Primitives exist, but older pages use ad hoc `text-ember`, `text-mist`, and hardcoded headings. |
| Buttons/chips | Consolidate duplicated styling | Introduce shared text/action/filter/transport visual variants only where semantics match. Avoid a generic component abstraction merely to reduce files. |
| Overlays/sheets/dialogs | Restructure presentation; retain mechanics | Reader and listening overlay exist; queue is inline rather than a unified compact sheet. Preserve accessibility mechanics. |

No current component is clearly obsolete. Compatibility style aliases become removable only after every consumer migrates.

## 6. Global-token and style audit

Required aesthetic tokens already exist almost verbatim: `--bg-0/1/2`, primary/secondary/muted text, subtle line, all eight city-pop accent families, one active `--accent`, accent RGB/contrast, surface roles, focus/danger/warning, artwork halo, UI/meta/Japanese font roles, display/section/body/meta scales, reading measure, shell/insets/rhythm, bottom-nav/MiniPlayer/safe-area roles, touch target, artwork sizes, restrained radius vocabulary, dividers/focus/artwork bloom/scrim/sheet elevation, and motion timings. Reduced motion zeroes timings and suppresses listening echo.

Remaining convergence issues:

- Tailwind retains explicit compatibility aliases `ember`, `cobalt`, `ink`, and `mist`. Search and Fixations index still consume the old aliases and `shadow-soft`.
- Accent is centrally controllable only at root. Lane detail and listening mode use scoped inline variables/colors; this is restrained, but there is no documented page-level accent contract from Sanity/Current Phase.
- System/local font stacks avoid network cost, but final typography roles are not fully systematic: many pages use raw utility sizes/weights, and no approved Japanese identity use exists.
- Insets/safe-area/navigation/MiniPlayer values are semantic centrally. Page-level vertical spacing, max widths, fixed art sizes, and several mobile paddings remain hardcoded utilities.
- Search and Fixations index contain large rounded cards, equal grids, `bg-white/5`, opaque glass-like surfaces and broad shadows. Spotify iframe and transport buttons use pills/rounding. Other routes mostly use hairline rows and unframed composition.
- Background is a restrained CSS midnight gradient, not environmental art. It is acceptable as the asset-independent base and cheaper than decorative imagery.
- Blur/glow is concentrated around hero/current artwork and listening mode, directionally correct; final performance should cap simultaneous large blur layers.
- Global focus and selected-state rules are present. Some links rely on color/hover and need final visible-focus/active review.
- Tailwind breakpoints are defaults; the main desktop transition often starts at `sm`/`md`. Validate the requested 320/360/375/390/430 widths rather than adding arbitrary breakpoints.

## 7. Kitsune identity and asset status

Exact repository asset inventory:

- `docs/references/midnight-city-pop-moodboard.png` is the only raster reference asset.
- There is no `public/` directory, favicon, Apple touch icon, manifest icon, wordmark, approved monoline mask, approved solid negative-space mask, environmental background, listening environment, or empty-state art.
- `src/components/kitsune-mark.tsx` is intentionally an empty reserved slot and explicitly says no authoritative mask was found.
- No permanent fox placeholder/mascot image exists. The Lucide icon set is UI chrome, not branding.

Therefore identity/icon implementation is **User-asset blocked**. Reject the moodboard as production art and reject inventing a fox mark. Shell/Home/player/archive/search visual work can proceed using palette, typography, spacing, content imagery and the empty mark slot. Final favicon/app icons, persistent mask identity, and any artwork-dependent listening/environment branches require user-approved assets.

## 8. Homepage status

The current server fetch preserves the required data sequence and rules: Current Phase, conditional active release announcement, newest non-NSFW Beat, settings-curated featured Fixations, newest non-NSFW Link, Playlist, and Thought-only Log. The rendered order matches that sequence; `View All Logs` is present. No query change is indicated.

- The destination-menu concept exists as an asymmetrical opening composition with Player/Logs/Fixations/Search and no redundant Home item.
- Current Phase is a thin border strip and least dominant.
- Latest Beat is the largest media/title composition and focal content item.
- Featured Fixations are unequal: the first receives art and a larger two-column treatment; later entries are compact rows.
- Latest Link/Playlist/Thought are text-led overall, although the shared Playlist embed can dominate its row.
- Remaining dashboard/card residue is limited; the release broadcast is a deliberate flat interruption. Final work is typography/accent/negative-space consistency, content-image sizing, Playlist density, and approved identity/environment integration if supplied.
- At 320–430px the composition collapses to one column and touch targets are generally 44px. Risks: long release/beat/fixation titles, the Playlist iframe height, 1rem edge inset at 320px, and accumulated vertical length. These require manual width testing, not query changes.

## 9. Player and listening-mode status

Implemented visual phases cover Player library, MiniPlayer, Beat Files/Context, Now Playing/queue, and the listening-mode foundation. Continue Listening, Recently Played, Recently Added, Main Library, Releases, Lanes, shuffle, queue and Beat File relationships exist.

- Current-media art is central on Home, Now Playing, Beat File, Release/Lane hero and listening mode. Player landing is more section/list-driven and should make the current selection more visually central without duplicating playback state.
- Artwork-derived lighting is not sampled; the intended manual accent halo exists. This complies with the brief.
- Beat/Context/release track lists are editorial hairline rows, not cards. Release/Lane collection grids and history rows remain denser but acceptable after convergence.
- Queue/metadata are compact inline layers, but the final Player direction calls for a more coherent compact sheet/layer presentation.
- Listening mode uses a fixed near-black void, artwork echo, accent halo, restrained slow motion and lane-derived/manual colors. It lacks an approved Kitsune manifestation/environment asset and a true minimal visualizer; do not make a busy waveform dashboard.
- Reduced motion is implemented globally and removes echo/ongoing animation effectively.
- MiniPlayer/navigation separation is tokenized: nav height + safe area; shell adds extra bottom padding. Risk remains on very short viewports, browser zoom/dynamic safe areas, and long MiniPlayer errors.

Protected behavior: one shared audio element; route-continuous playback; signed URL acquisition; object-key secrecy; Main Library default shuffle; release/lane/context queue ordering; next/previous/repeat/queue completion; history persistence/resolution; Media Session metadata/actions; seek/resume; scrubber coarse-pointer behavior; lane fallback covers; no autoplay; and no audio remount when opening overlays/routes.

## 10. Archive-section status

### Fixations and Rabbit Holes

The source/query preserves Core-first then status/title ordering; all four statuses are represented by data values, though the index renders a flat equal card grid rather than clear Core/Active/Sleeping/Archived sections. Fixation detail has cinematic hero cropping, pinned versus recent content, beat/release relationships, archive trails, and Rabbit Hole entry. Rabbit Holes preserve pinned-first hierarchy, shared tag categories, explicit click-to-load YouTube/Spotify previews, platform labels, lazy iframes, fallback media/external links, and 8-item Load More increments.

Remaining convergence: rebuild only the Fixations index composition into unequal status hierarchy; refine cinematic crops and relationship trail primitives; reduce repeated feed resemblance; keep annotations and pinned selection authored; preserve every query/order/qualification and safe-preview parser.

### Logs

Logs use a typographic chronological stream, content-type and tag filters, restrained Link thumbnails, Playlist previews, distinct Quote rendering, and a full-screen reader with a 42rem measure. Quotes remain other people's words; owner writing is `log`. The reader implements dialog labeling, Escape, focus containment, inert background, scroll lock/restoration, and safe areas.

Remaining convergence: standardize headings/metadata and filter disclosure, verify long copy/bullets at 320px, keep images secondary, and reduce provider embed dominance. Card density is already low.

### Releases and Lanes

Release detail is gallery-like with required large art, sparse metadata and manual `beats[]` order. Lane detail uses fallback art, scoped accent/halo, Beat playback, releases and related Playlists. Remaining work is shared gallery/row rhythm, restrained lane atmosphere, long-title/mobile validation, and consistent related-content primitives. Do not alter order, qualification, or relationships.

## 11. Search status

| Requirement | Status | Finding |
|---|---|---|
| Query text | **Absent** | No text input or client text matching. |
| Content type | **Absent** | Type labels exist on results but no filter. Logs are not projected at all. |
| Tag | **Complete for current single selection** | Reference IDs are projected; only first 12 tags are exposed, with no disclosure/search. |
| Lane | **Complete for current single selection** | Direct and related lane IDs are projected. |
| Fixation | **Complete for current single selection** | Related IDs projected; selected Fixation result is intentionally excluded from its own related list. |
| Platform | **Absent** | Platform is projected as subtitle for Links only, not filterable. |
| Release | **Complete for current single selection** | Direct refs and containing-release IDs support Beat filtering. |
| Date | **Absent** | Dates are serialized/displayed but not filterable. |
| Mood | **Partial / compatibility update** | Mood can exist as a Tag group, but there is no dedicated mood control or group-aware behavior. |

Release and Lane results route to completed internal detail pages. Playlist destinations correctly fall back in order Spotify → Apple Music → YouTube/YouTube Music, so Apple-only and YouTube-only Playlists remain externally routable. Links are normalized as strings from Sanity and open externally; final work should explicitly reuse safe URL validation at consumption boundaries. Results are plain serializable data. Current filters reset predictably by toggling the selected button or selecting another, but there is no explicit Reset All control. Four always-open card groups are manageable only with small datasets and are poor mobile disclosure. The page truthfully says it filters only by tag/lane/fixation/release; it does not falsely advertise text search.

Search requires a functional branch before its final visual pass: add text, type, platform, date and mood compatibility; include Logs if still required as archive content; expose all options accessibly; retain safe destinations and predictable reset.

## 12. NSFW status

All major document schemas have `nsfw` and conditional `nsfwReason`; Context/version objects also have both. Tags, homepage settings and internal thumbnail automation are not major consumable content and correctly omit them.

| Consumer | Fields | Current server/public behavior | Warning/approval/media behavior | Missing work |
|---|---|---|---|---|
| Beats | Yes | Most lists exclude via query; Beat File can return NSFW; playback API Main Beat lookup does not check `nsfw`. | Beat File shows warning text but play control remains; no approval/localStorage. Playback may begin. | Gate reveal/play and API authorization per exact Beat. |
| Context/version | Yes | Shown in Beat File; queue and playback API exclude/403 NSFW versions. | Locked permanently; no approval; media cannot begin. | Replace permanent lock with exact version approval and authorized request. |
| Releases | Yes | Index/detail queries exclude; drafts excluded on detail. | No warning because inaccessible; no approval. | Decide approved-item reveal/route behavior and prevent nested Beat leakage. |
| Lanes | Yes | Lane detail itself does not filter lane `nsfw`; lane Beats are not NSFW-filtered in its nested query. | No warning/approval; media can be offered. | Gate lane and filter/gate nested media. |
| Logs | Yes | Logs feed excludes NSFW and drafts. | No warning/approval; hidden entirely. | Add item warning/reveal flow if NSFW content must be consumable. |
| Links | Yes | Home/Logs/Fixation/Rabbit Hole/Search generally exclude NSFW. | Hidden; no exact approval. Safe previews for allowed items are click-to-load. | Add warning/reveal/open flow without preloading sensitive thumbnails/embeds. |
| Playlists | Yes | Major queries exclude NSFW; Beat File related projection does not filter related Playlists. | Shared preview may load iframe immediately for supported provider; no approval. | Filter/gate every projection and delay all media until approval. |
| Quotes | Yes | Logs/Fixation/Search generally exclude; Beat File related projection does not filter Quotes. | No warning/approval. | Gate reveal and source action per exact Quote. |
| Fixations | Yes | Index/detail/Rabbit Hole exclude NSFW/drafts. | Hidden; no approval. | Item warning route/state if approved consumption is required. |
| Rabbit Hole entries | Link fields | Query excludes NSFW/drafts. | No NSFW warning; allowed iframe only after click. | Exact Link approval before thumbnail/note/embed/external open. |
| Embeds | Parent-dependent | Trusted provider parsers only. | Rabbit Hole is click-to-load; Playlist previews can render iframe on initial view. | Central content gate must prevent any iframe/image request before item approval. |

No `kp_nsfw_approved:*` key exists. The target must be `kp_nsfw_approved:<contentType>:<sanityDocumentId>` (Context needs an exact stable type/id convention incorporating parent and version key). One approval must never authorize another. Published perspective/draft exclusions are strong in newer detail/archive queries but inconsistent in older Home/player/list queries; the NSFW branch should audit every GROQ projection and API, not rely only on client hiding.

## 13. PWA status

There is no manifest, `public/` icons, favicon, Apple touch icon, service worker, offline route/fallback, install/update mechanism, or explicit theme/background metadata. Therefore installability and basic offline shell are **Functionally incomplete** and icons are **User-asset blocked**.

Existing positives: `100dvh`, bottom safe-area tokens, persistent provider above route content, and private playback fetches marked `no-store`. Signed playback responses use `Cache-Control: no-store, max-age=0`; URLs expire after 900 seconds. No service worker exists, so audio is not being accidentally placed into a custom persistent cache.

Required PWA branch: approved mask-based icons/favicons/touch icon; manifest with near-black theme/background and standalone display; scoped service worker/basic offline shell and fallback; update lifecycle; installed-mode safe-area tests; explicit exclusion of `/api/playback`, signed R2 audio, Studio, and media/iframe responses from persistent caching. Offline music remains out of scope.

## 14. Deployment status

- No `vercel.json` or repository deployment workflow exists; standard Next/Vercel behavior is assumed.
- Runtime expectations are Node 24/npm 11. Next production build is the runtime baseline; playback routes require a Node-compatible AWS SDK environment.
- Sanity config uses `NEXT_PUBLIC_SANITY_PROJECT_ID`, dataset `tkp-v2`, configured API version, `/studio`, Structure and Vision. The dataset is public; production Studio access/auth must still be checked.
- R2 server-only variables are `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`. None use `NEXT_PUBLIC_`. Do not print or store their values in Sanity.
- R2 remains designed as a private bucket; the app signs validated `beats/...mp3` keys server-side for 15 minutes. Actual bucket privacy, least-privilege credentials, production CORS allowing the final site origins/methods/headers, and signed range playback must be verified in Cloudflare/Vercel.
- Production domain dependencies: Vercel environment values, Sanity CORS origin for public site/Studio, R2 CORS, HTTPS, install scope/start URL, and any final allowed Studio origin.
- Deployment documentation is inadequate (`README.md` is only a title; `.env.example` lists names but no setup/checklist). Add operational docs in the deployment branch without exposing secrets.

No deployment or environment change belongs in this audit.

## 15. Accessibility/responsive status

Strengths: global 44px interactive minimum, visible focus ring, semantic primary nav, `aria-current`, `aria-pressed`, labeled playback controls, iframe titles, Rabbit Hole explicit preview state, reduced motion, dialog mechanics, safe-area tokens, truncation/break-word use, and mobile-first single-column defaults.

Required final checks:

- At 320/360/375/390/430: long Beat/Release/Fixation/Playlist titles; long URLs/metadata; five bottom-nav labels; MiniPlayer controls/scrubber/error; filter horizontal scrolling; reader padding; and no body overflow.
- Tablet/desktop: retain expanded mobile composition rather than dense dashboards; verify focus order follows visual order in asymmetric grids.
- 44×44: global minimum covers buttons but not every text link; verify inline destination/external links and native iframe controls.
- Selected state: many controls use color plus border/check/edge, which is good; review navigation underline and playback current state at contrast extremes.
- Heading structure: major routes generally have one `h1`; dynamic archive/list section levels require an automated/manual outline review.
- Dialogs/overlays: reader is strong; listening mode needs equivalent focus containment/return/inert review. Queue is not a true sheet today.
- Color: muted text `#6f7888` on near-black and translucent overlay combinations need measured WCAG contrast; accent may never be the only signal.
- Long content: several rows use `truncate`; ensure essential titles/URLs remain discoverable and do not disappear at zoom.
- Bottom layers: test safe-area inset, dynamic browser bars, landscape/short viewport, 200% zoom, and MiniPlayer/nav separation.

## 16. Performance status

- Rabbit Hole iframes do not exist until explicit activation and are lazy. Shared Playlist previews can create a provider iframe immediately; defer below-fold/NSFW media and retain static fallback.
- Sanity image builder is used with explicit transformations in Fixation/Rabbit Hole areas, but many projected CDN URLs are passed to native `<img>` without `srcset`, `sizes`, width/height, or centralized quality/fit. This risks oversized downloads and layout shift. `next/image` has no remote allowlist and is not currently used.
- Hero/listening art is duplicated visually via CSS/another image echo; cap duplicate downloads (same URL should browser-cache) and large blur layers. Remove decorative blur before compromising mobile fidelity.
- No heavy environmental assets or third-party scripts exist. This is a strong baseline.
- `PlayerProvider` owns one audio element in a ref and is mounted once above route content. Preserve this to avoid remounts.
- Playback `timeupdate` dispatches state updates through provider context; all consumers can rerender at playback frequency. Profile and split/memoize read paths if needed without creating another audio owner.
- Server/client boundaries are reasonable: pages/querying are server components; interactive browsers/player are client. Server-only R2 and thumbnail modules must remain unreachable from client bundles.
- Sharp is confined to server/CLI thumbnail processing and tests, not public browser code.
- Signed playback and history requests use no-store; future service workers must never cache them or signed audio.

## 17. Current technical baseline

Starting state confirmed before the audit: correct branch, clean worktree, Node `v24.18.0`, npm `11.16.0`, and Spotify CLI commit `55ab09a`. Package majors are Next `16.2.10`, React/React DOM `19.2.7`, Sanity/Vision `6.4.0`, next-sanity `13.1.1`, TypeScript `5.7.x`, ESLint `9.39.5`, AWS SDK `3.1085.x`, and direct Sharp `0.35.3`.

Final verification results (captured after document creation):

- Lint: exit 0, **0 errors and 18 warnings**. Categories: 11 `@next/next/no-img-element`; 4 unused variables/imports (including two playback-history destructures); 1 React render-purity (`Date.now()`); 1 synchronous effect update; and 1 ref write during render. These are existing application findings, not audit-document regressions.
- TypeScript `npx tsc --noEmit`: exit 0, no diagnostics.
- Production build: exit 0, clean `.next` rebuild on Next 16.2.10; all 15 routes enumerated successfully. It emitted four existing deprecation notices for the default `@sanity/image-url` export.
- Tests: `node --test --experimental-strip-types "src/**/*.test.ts"`; **173 passed, 0 failed/skipped/cancelled/todo**. Node emitted the existing `MODULE_TYPELESS_PACKAGE_JSON` reparsing warning for TypeScript test modules.
- Dependency validity: `npm ls` exit 0; `npm query ':invalid'` = `[]`; `npm query ':extraneous'` = `[]`.
- Installed resolution differs from some manifest minimums because of compatible lockfile resolution: `@sanity/client` 7.23.0, TypeScript 5.9.3, Tailwind 3.4.19, PostCSS 8.5.16, and tailwind-merge 2.6.1.
- `npm audit --omit=dev --json`: **14 moderate, 0 low/high/critical** across 1,390 dependencies. Full `npm audit --json`: the same **14 moderate, 0 low/high/critical**. Findings are centered on current Next's nested PostCSS and the Sanity/next-sanity toolchain (`uuid`, `js-yaml`, `smol-toml`, and affected wrappers). npm's suggested fixes are incompatible major downgrades, so no fix was applied. This is a launch security review item, not permission to mutate dependencies in a UI branch.
- Sharp: direct `sharp@0.35.3`; `next@16.2.10` also resolves nested `sharp@0.34.5`.
- `next-env.d.ts` changed during the build exactly as Next switches dev/build route type paths; it was inspected and restored to the branch version.

These values intentionally replace older report counts after the prescribed commands run.

## 18. Critical-path branch sequence

| Branch | Purpose / expected scope | Protected systems and dependencies | Manual checks / asset need | Effort |
|---|---|---|---|---|
| `ui/11-shell-home-final-convergence` | Global token adoption, AppShell/nav/MiniPlayer surface, Home typography/composition; CSS, shell, Home, primitives only. | Preserve route IA, homepage queries/order, provider/audio placement and offsets. | 320–desktop, safe areas, keyboard, active route, continuous playback. Approved asset **not required**; leave mark slot empty. | Medium |
| `ui/12-player-listening-final-convergence` | Player, Now Playing, queue/history, Beat lists, listening overlay presentation. | PlayerProvider, single audio, queues/history/Media Session/signed fetch. Depends on branch 11 tokens. | Every transport/queue/context flow, reduced motion, short viewports. Approved identity/environment **optional for most work; required for final mask/art manifestation**. | Large |
| `ui/13-fixations-rabbit-hole-final-convergence` | Restructure index hierarchy; refine detail/trails/Rabbit Hole visual authorship. | Queries/order, Link-only rule, parsers, click-to-load, Load More/filter resets. | All statuses, 8+ items, preview failure, long content, widths. Asset not required; content media leads. | Large |
| `ui/14-archive-detail-final-convergence` | Logs, reader, Releases, Lanes, Beat Files and shared rows/gallery primitives. | Reader focus/scroll, manual release order, lane queues, Context IDs, related projections. | Keyboard/dialog, queue playback, long copy/art fallbacks, widths. Asset not required. | Large |
| `feature/15-search-completion` | Add text/type/platform/date/mood-compatible filtering, Logs compatibility, complete reset/disclosure, then visual convergence. | Safe destinations, serialization, completed detail routes, external rel. | Empty/reset/combinations, Apple-only/YouTube-only Playlist, mobile disclosure. No asset. | Large |
| `feature/16-sitewide-content-warnings` | Exact-item NSFW gate across schemas' consumers, APIs, playback, embeds and storage. | Object-key secrecy, published perspective, provider parsers, no preapproval media requests. | Cross-item isolation, reload persistence, every matrix row, nested content, drafts. No asset. | Large |
| `assets/17-kitsune-identity-pwa-assets` | Integrate approved solid/monoline mark; export favicon/touch/PWA icons and optional approved static art. | Consistent proportions, no placeholder/moodboard production use. | Small-size legibility, contrast, transparency, icon mask/safe zone. **Approved user assets required.** | Medium |
| `feature/18-pwa-offline-shell` | Manifest, metadata, service worker/basic offline shell/fallback/update policy. | Continuous online audio; never cache signed URLs/audio/API/Studio/embeds. Depends on branch 17 icons. | Install/update/offline navigation, standalone safe areas, online recovery. **Icons required.** | Medium |
| `fix/19-final-a11y-responsive-performance` | Measured accessibility, all target widths, image sizing/lazy loading, render profiling and regression fixes. | All behavior above; no decorative cost escalation. | Keyboard/screen reader/contrast/zoom/width matrix/reduced motion/network profile/audio continuity. No new art. | Large |
| `content/20-production-content-cleanup` | Validate Sanity production documents, relationships, missing art/audio keys, NSFW flags and thumbnails without schema expansion. | Ordering/selection rules; no masters/public R2. | Empty/full data, broken refs, content warnings, release order, Rabbit Hole >8. User content/assets may be required. | Medium |
| `release/21-production-deployment` | Vercel/env/domain/CORS/Studio/R2 validation, operational docs and launch smoke tests. | Secrets server-only, private R2, signed range playback, no environment leakage. | Real devices/install, all routes, Studio isolation/auth, CORS/range/expiry, rollback. External configuration required. | Medium |

This is the shortest safe sequence because shared visual foundations precede section work, functional Search/NSFW precede final regression, approved icons precede installability, and deployment follows production content. Additional provider thumbnails are not critical path.

## 19. Deferred post-launch work

The following remain explicitly **Deferred** and must not delay launch: Quick Add; Monthly Picks and `pickItem`/`monthlyPick`; Apple/YouTube/other thumbnail automation; generic Open Graph crawling; inline social-provider scripts; user accounts/auth; comments; likes; playlist synchronization; offline music playback; audio upload manager; Worlds; Portals; a separate Rabbit Hole schema; and other social/recommendation systems.

## 20. Exact recommended next implementation branch

Create `ui/11-shell-home-final-convergence` from the completed rebaseline. Scope it to global token adoption and the public shell/Home/MiniPlayer visual layer. Do not change queries, schemas, dependencies, PlayerProvider/audio architecture, Search, NSFW behavior, PWA behavior, or production configuration. It can proceed without an approved Kitsune asset by preserving the empty shared mark slot.

Exit criteria: no old cobalt/ember/card-dashboard language in the touched public surfaces; correct Home order and destination menu; Latest Beat remains focal; Current Phase remains least dominant; five-item bottom nav and MiniPlayer remain separated at every target width; continuous playback survives navigation; reduced motion/focus/contrast pass; clean lint/type/build/tests.

## 21. Go/no-go checklist for beginning final visual convergence

- [x] Correct audit branch and clean starting worktree.
- [x] Spotify thumbnail CLI baseline commit present.
- [x] Current source/history, not old gap reports, used for status.
- [x] Product IA, schemas and queries are not being redesigned.
- [x] Shared semantic palette/layout/motion foundation exists.
- [x] Persistent player/audio, R2 signing and Studio isolation are identified as protected.
- [x] First convergence branch can proceed without inventing a Kitsune asset.
- [ ] Approved Kitsune solid/monoline artwork exists (not required for branch 11; required before branch 17).
- [ ] Search functional completion, NSFW, PWA, content and deployment work is complete (launch gate, not visual-start gate).
- [x] Required verification completed; lint/build/test/dependency results are recorded without source or dependency mutation.

**Decision:** **GO** for incremental final visual convergence after this audit verifies cleanly. **NO-GO** for production launch until every functional, asset, content, PWA and deployment gate above is closed.
