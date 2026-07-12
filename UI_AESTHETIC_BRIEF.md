# The Kitsune Protocol — Final Aesthetic Brief

## 1. Definitive aesthetic

**Internal name:** Midnight City-Pop Archive  
**Descriptive label:** Dark anime city-pop minimalism

### One-sentence definition
A mobile-first music PWA and private media archive presented through a near-black, high-contrast interface shaped by melancholic 1990s anime framing, 1980s city-pop color and illumination, underground Japanese web personality, modern usability, and rare Kitsune supernatural traces.

### Core identity
The Kitsune Protocol should feel difficult to categorize but immediately authored. It is not a portfolio, streaming-service clone, anime fan site, retro operating system, or generic personal blog. It is a private media world where music, fixations, links, logs, playlists, and personal canon reveal how one mind connects things.

The visitor should ultimately feel:

1. “I cannot categorize this, but it feels unmistakably authored.”
2. “This feels private, but I was allowed inside.”
3. “This is how his mind connects things.”

---

## 2. Reference hierarchy

### Primary visual influence — Dark anime city-pop
Use:
- cel-anime-inspired metropolitan environments
- dramatic city architecture
- deep nighttime color
- airbrushed glow and bokeh
- romantic urban solitude
- music-centered visual atmosphere

Darken the usual city-pop palette. Avoid cheerful poster energy, tropical nostalgia, and bright future-funk styling.

### Primary emotional influence — Melancholic anime ending sequence
Use:
- emotional stillness
- large negative space
- quiet nighttime environments
- reflective pacing
- subtle longing and memory
- nearly static scenes with small ambient movement

### Primary cultural/web influence — Underground Japanese personal web design
Use:
- personal archive intimacy
- unusual but usable navigation
- anti-platform character
- plain but specific naming
- idiosyncratic content relationships
- pages that feel authored rather than generated from a standard template

### Structural influence — Shibuya-kei modernism
Use:
- clean modernist grids
- precise spacing and alignment
- mixed typographic voices
- occasional retro-pop color
- controlled visual playfulness

Do not use collage-heavy or hyperactive Shibuya-kei styling as the main system.

### Behavioral influence — Technozen
Use only as a philosophy:
- calm technology
- clean usability
- ambient stillness
- approachable interaction
- no visual aggression

Do not adopt pale Wii-era color, overt friendliness, or device-like UI.

### Accent influence — Restrained Neo-Brutalism
Use sparingly:
- flat-color interruptions
- deliberate asymmetry
- one slightly confrontational element
- rare abrupt contrast

Do not use thick borders everywhere, sticker shadows, raw unfinished layouts, loud primary-color systems, or constant oversized type.

### Secondary interaction references
PS2 and DVD-era design may influence focused menu behavior, looping background scenes, sparse selection states, occasional layered depth, and rare title-card transitions. They must not make the site look like a literal operating system or fictional hardware interface.

### Explicitly rejected
- Vectorheart
- generic cyberpunk
- generic synthwave
- chrome-heavy Y2K
- anime wallpaper sites
- fake Japanese decoration
- forced CRT/VHS degradation
- cute mascot branding
- startup-dashboard aesthetics

---

## 3. Emotional target

The resting emotional state is:
- melancholy
- dreamlike nostalgia
- romantic solitude
- quiet urban beauty
- subtle emotional discomfort
- rare supernatural tension
- calm rather than bleak
- serious rather than playful

The site should feel like a private late-night listening space: beautiful enough to stay in, lonely enough to feel honest, and personal enough to suggest there is more beneath the surface.

The melancholy should not be constantly softened. Rare coral, cyan, yellow, or pink interruptions and occasional dry humor can punctuate it, but the site should not become cheerful, cute, ironic, or whimsical.

---

## 4. Design priorities

When implementation requires compromise, protect these in order:

1. Readability and interaction
2. Mobile fidelity
3. Performance

The identity elements that must never be simplified away are:

1. Dark city-pop palette
2. Kitsune mask identity
3. Strange emotional tone

When a screen feels overdesigned, remove in this order:

1. decorative motion
2. duplicate/reflected artwork treatments
3. background detail

Do not solve clutter by shrinking everything, adding cards, or reducing tap-target size.

---

## 5. Color system

### Stable base
- `--bg-0: #05070B` — primary black
- `--bg-1: #090D16` — midnight navy
- `--bg-2: #101725` — raised dark surface
- `--text-primary: #F4F6F8`
- `--text-secondary: #A3ACBA`
- `--text-muted: #6F7888`
- `--line-subtle: rgba(255,255,255,0.12)`

### City-pop accent families
Use one dominant accent family at a time:
- muted cyan: `#63CFE0`
- electric blue: `#5C8DF6`
- deep magenta: `#B95791`
- muted coral: `#D26F62`
- warm gold: `#D3B069`
- muted violet: `#8467C6`
- small orange indicator: `#D9874B`
- cool silver: `#B7C0CC`

### Accent behavior
The selected accent is a controlled design token. It may affect:
- Kitsune mark
- active navigation state
- progress bar
- status indicators
- focused controls
- selected metadata
- current-media state

It must not recolor every surface.

### Material hierarchy
- flat solid color: rare Neo-Brutalist interruption
- crisp emitted light: active UI, mask, focus state
- soft anime bloom: artwork, painted environment, listening mode only

### Lane guidance
Accent is manually controlled in Sanity, usually guided by lane or Current Phase.

- Rainview: muted gold, rain-blue, soft cyan
- Gray Shore: silver-gray, pale blue, fog blue
- Fluxwave: cyan, violet, coral, electric pink
- Pretty Dark: deep magenta, cold blue, dark red
- Neutral: one permanent signature accent

No automatic accent sampling is required.

---

## 6. Typography

### Functional hierarchy
English always carries function. Katakana is a restrained identity accent.

### Primary UI
Use a modern geometric or rounded-digital sans with a severe, disciplined layout.

Suggested direction:
- Geist Sans
- Manrope
- Satoshi
- Inter as fallback

### Metadata
Use a condensed or monospace companion.

Suggested direction:
- IBM Plex Mono
- Geist Mono
- Roboto Mono
- IBM Plex Sans Condensed

### Japanese
Use accurate katakana only.

Suggested direction:
- Noto Sans JP
- another licensed Japanese display face only if readability and accuracy are confirmed

### Usage rules
- English remains primary and readable.
- Katakana appears sparingly.
- Best placements: Kitsune Protocol wordmark, major section openings, selected listening-mode titles, rare title-card moments.
- Do not pair every label with Japanese text.
- Do not use random or mistranslated characters.
- Do not use katakana merely as texture.
- Functional screens should remain typographically quiet.

---

## 7. Kitsune identity

### Approved forms

1. **Thin monoline mask**
   - atmospheric
   - crisp neon edge
   - loading and ambient states

2. **Solid negative-space mask**
   - app icon
   - favicon
   - compact UI
   - small persistent brand mark

The proportions must remain consistent across both.

### App icon
A fixed negative-space Kitsune mask on a near-black base with one restrained accent.

No city background, chrome, complex gradients, character illustration, or multiple competing colors.

Accent variations are manually controlled in Sanity.

### Rare supernatural behavior
The Kitsune layer is a true Easter egg.

Allowed manifestations:
- brief mask apparition
- neon spirit trail
- typographic disturbance
- rare appearance in full-screen listening mode
- rare appearance in empty states or errors
- extremely rare altered opening state

It should be uncommon enough that many visitors may never encounter it.

No achievement popup. No visible collection system. No chatty guide. No cute reactions.

---

## 8. Imagery and environment

### Primary imagery rule
The user’s own content provides most of the imagery:
- beat covers
- release art
- fixation media
- playlists
- photographs
- links
- visual references

The interface frames the media instead of competing with it.

### Environmental art
Original anime-inspired scenes appear mainly at major moments:
- opening screen
- full-screen listening mode
- special pages
- rare transitions
- empty states

### Background direction
Normal use may include a subdued, hand-painted anime city environment.

Style:
- moody 1990s psychological anime
- romantic ending-sequence stillness
- dream-altered city
- believable architecture with subtly impossible sky, scale, lighting, or distant structures
- darker shadows
- quiet framing
- cel-anime atmosphere
- airbrushed glow and bokeh

Possible elements:
- dark city skyline
- high-rise window view
- shadowed listening-room fragments
- distant traffic
- rain
- clouds
- curtains
- reflected light

It should not resemble a bright anime wallpaper.

### Human presence
Use first-person perspective.

Emphasize:
- stillness in a room
- looking toward media
- screen, player, speakers, or artwork as focal point
- abstract dissolution inside listening mode

Avoid recurring human characters.

---

## 9. Composition and shape language

### Core composition
- sparse cinematic composition
- large negative space
- one clear focal point
- clean modernist grid underneath
- occasional deliberate asymmetry
- mostly unframed content

### Shape language
Prioritize:
- direct placement into dark space
- thin line symbols
- soft organic silhouettes
- smoke, cloud, wave, shadow, tail, light trail

Avoid:
- card-heavy dashboards
- excessive rounded containers
- HUD frames
- technical grids
- decorative icon systems

### Controls
- text-first
- very few icons
- thin line icons only when necessary
- typography, spacing, opacity, and focus states communicate most actions

---

## 10. Glow and lighting

Use a mixed hierarchy:
- UI: crisp neon edge, minimal outer blur
- artwork: soft halo and restrained bloom
- environment: airbrushed windows, signs, headlights, bokeh
- listening mode: strongest allowed illumination
- Neo-Brutalist interruption: flat opaque color, no glow

Avoid smeared glow on every component.

---

## 11. Motion

### Normal browsing
Almost static.

Allowed:
- faint rain
- distant traffic
- slow clouds
- curtains
- subtle bokeh shifts
- reflected light
- essential UI transitions

### Playback
Motion may increase slightly.

### Full-screen listening mode
This is the most expressive state.

### Major transitions
Section-specific but restrained.

Preferred:
- clean crossfade
- layered depth for deeper archive states
- brief section-specific variation with strict timing limits

Avoid constant parallax, long title sequences, decorative cursor effects, constant glitch, animation on every card, or motion that slows navigation.

---

## 12. Sound

The interface is mostly silent.

Sound is reserved for music playback, possibly one or two major interactions, and rare hidden states.

No constant navigation beeps. No ambient hum. No automatic background audio.

---

## 13. Navigation

### Core model
Hybrid mobile system:
- persistent bottom navigation for primary usability
- contextual actions by screen
- selective console-menu behavior for major destinations
- scene-based interactions only when they add meaning

### Homepage menu
The opening layer should use:
- asymmetrical editorial composition
- sparse horizontal or semi-horizontal console menu
- focused destination state
- active preview that changes with the selected destination

### Active state hierarchy
1. luminous focus
2. hard editorial contrast
3. modest scale shift
4. rare flat-color interruption

### Naming
Use plain but specific functional names.

Preferred:
- Player
- Fixations
- Logs
- Archive
- Picks
- Releases
- Search

Existing personal terms may remain:
- Rabbit Holes
- Algorithms
- Personal Canon
- Current Phase
- Random Dive

Avoid turning every label into lore or technical jargon.

---

## 14. Information density

### General rule
Sparse first, detailed second.

### Progressive disclosure
The main view stays cinematic and clean. Tap or expand to reveal:
- metadata
- tags
- dates
- relationships
- versions
- annotations
- longer notes

### Section variation
- Player: sparsest
- Fixations: deepest and most layered
- Logs: text-led
- Releases: gallery-like
- Search: functional and restrained

Useful metadata must remain accessible.

---

## 15. Artwork behavior

Artwork presentation changes by section.

### Music
- floating square cover
- hidden-until-selected reveal
- current artwork may illuminate nearby space
- optional duplicate/reflection treatment
- optional screen-within-the-room treatment

### Fixations
- cinematic crops
- layered media
- deeper archive context
- stronger relationships between entries

### Logs
- primarily typographic
- imagery secondary
- full-screen reading state when needed

### Releases
- gallery-like staging
- large cover art
- sparse metadata

### Reveal behavior
1. sparse title or small cover
2. selection reveals artwork
3. color spreads into the environment
4. optional reflection or enlarged crop appears
5. deeper details remain expandable

---

## 16. Full-screen listening mode

This is the most visually expressive feature.

### Core behavior
- hidden or secondary entry point
- black digital void
- minimal visualizer
- line-specific or lane-guided accent
- strongest glow and motion state
- environment can dissolve away
- Kitsune may appear very rarely

### Lane logic
The shared structure remains consistent. Artwork leads the lane identity. Lighting and atmosphere adapt around the current media.

The mode should not become a busy waveform dashboard.

---

## 17. Section-by-section direction

### Home
Keep the structure stable over time.

Opening composition:
- destination menu first
- Current Phase as a small contextual line
- restrained collage or preview of current activity
- painted nighttime environment behind it
- no promotional hero copy
- no feature list
- no automatic layout reshuffling

Preserve the current content priorities:
- Current Phase remains least dominant
- Latest Beat
- featured/active Fixations
- Latest Logs mini-feed

Render these as editorial previews, not equal cards.

### Player
The purest expression of the aesthetic.

- darkest
- sparsest
- artwork and playback dominate
- Continue Listening and Shuffle remain visible
- queue, versions, and metadata use a compact bottom sheet
- full-screen listening mode accessible but not forced

### Fixations
The deepest archive.

- image-rich
- layered
- interconnected
- related-item trails
- pinned items
- category tabs
- doom-scroll feed may remain, but presentation should feel authored rather than algorithmic
- optional expanded context layers

### Logs
A dark editorial journal.

- cleaner background
- stronger text hierarchy
- minimal imagery
- full-screen reading state
- concise preview on Home

### Releases
A sparse gallery.

- large cover art
- manual order
- optional release type
- clear relationship to beats and versions
- no product-card styling

### Search
Functional first.

- plain input
- clear results
- controlled randomness through Random Dive
- dry empty states
- no forced mystery

### Algorithms / Rabbit Holes / Personal Canon
Treat these as curated media structures, not social feeds.

- sequencing over engagement
- personal annotations
- related-item trails
- controlled randomness
- no recommendation algorithm language

---

## 18. Curation and discovery

### Discovery hierarchy
1. curated routes
2. related-item trails
3. controlled randomness

### Curated routes
Feel like minimal playlists.

- little explanation
- strong order
- deliberate juxtaposition
- personal annotations where useful
- optional expanded commentary

### Annotation system
Different content types may use different treatment, but all share one typographic system.

- music: clean liner notes
- Fixations: short personal comments
- Logs: fuller text
- routes: one-line transitions
- special content: archive note or subtitle-like fragment

### Return behavior
Visitors should return for:
1. new music
2. the ritual of revisiting the site
3. the user’s evolving taste

No engagement mechanics are needed.

---

## 19. Interface voice

### Default voice
- nearly silent
- clinical archive language when needed
- occasional anime-subtitle restraint
- no constant narration

### Humor
Tone:
- deadpan technical language
- dry understatement
- selective sarcasm
- socially uncomfortable self-deprecation
- themes may include loneliness, aging, identity, isolation, and specific insecurities

Use rarely.

Concentrate the strongest lines in:
- empty states
- hidden system messages
- rare errors
- occasional interface labels

Tone examples:
- `NO RESULTS FOUND. This has happened before.`
- `CONNECTION STATUS: technically available.`
- `ARCHIVE HEALTH: structurally sound, emotionally questionable.`
- `SESSION RESTORED. PERSONALITY RECOVERY REMAINS INCOMPLETE.`

Avoid cute jokes, constant quirkiness, conversational mascot voice, alarming self-harm language, melodrama, or humor on every screen.

---

## 20. Anti-corporate rules

The site should feel clean, not corporate.

Do not use:
- likes
- follower counts
- trending labels
- streaks
- engagement pressure
- recommendation feeds
- startup feature copy
- generic “Discover more” language
- repetitive card layouts
- SaaS dashboard conventions

Use:
- plain personal naming
- unusual but clear structure
- authored page compositions
- content importance rather than uniform module size
- quiet refusal of standard platform behavior

---

## 21. Accessibility and performance

Atmosphere may never obstruct:
- navigation
- readability
- tap targets
- keyboard focus
- playback
- responsiveness
- reduced motion
- color contrast
- load performance

### Required behavior
- dim background art before reducing text contrast
- remove blur before sacrificing performance
- shorten transitions before navigation feels slow
- keep touch targets at least 44×44 CSS pixels
- support `prefers-reduced-motion`
- avoid autoplay audio
- lazy-load heavy environment art and video loops
- provide static fallbacks
- maintain readable contrast even when accent changes
- ensure accent is never the only state indicator

---

## 22. Mobile and desktop

### Mobile
Canonical version.

- persistent bottom navigation
- focused single-screen states
- bottom sheets
- reduced simultaneous information
- simplified environmental detail
- primary design target

### Desktop
Expanded mobile composition.

- same identity
- same navigation logic
- more breathing room
- more background may be visible
- no separate desktop redesign
- no dense multi-column dashboard by default

---

## 23. Hard anti-rules

Never turn the design into:
- generic cyberpunk
- generic synthwave
- retro-futurist control room
- literal PS2 operating system
- anime wallpaper with UI over it
- chrome-heavy Y2K
- Vectorheart
- gamer HUD
- fake Japanese typography
- card grid
- cute fox mascot app
- heavy scanline/VHS/CRT filter
- slow experimental art site
- inaccessible mystery navigation
- overanimated showpiece
- sterile luxury SaaS app

---

## 24. Final success criteria

The design succeeds when:
- music is obviously central
- the site remains difficult to categorize
- the interface feels private but welcoming enough to explore
- visitors understand navigation quickly
- the dark city-pop identity is recognizable without anime artwork
- the Kitsune mark is memorable without becoming a mascot
- the emotional tone is melancholy, calm, and slightly uncomfortable
- the site encourages deep browsing without engagement tricks
- mobile feels complete, not reduced
- content leads and the interface frames it
- every section feels authored but still part of one system

---

# Copy-ready handoff for another ChatGPT thread

Use this brief to create a Codex implementation prompt for my existing Next.js/Sanity PWA, **The Kitsune Protocol**.

The design direction is called **Midnight City-Pop Archive**, or descriptively **dark anime city-pop minimalism**.

It must be a modern, mobile-first music PWA and private media archive. The visible identity should combine:

- near-black and midnight-navy foundations
- muted cyan, magenta, coral, gold, violet, and silver accents
- dark 1980s–1990s cel-anime city atmosphere
- melancholic anime-ending stillness
- underground Japanese personal-web authorship
- clean Shibuya-kei modernist grids and mixed typography
- Technozen calm usability
- rare Neo-Brutalist flat-color or asymmetrical interruptions
- a restrained monoline / negative-space Kitsune mask

The site must not become a literal operating system, cyberpunk dashboard, synthwave page, chrome Y2K site, anime wallpaper site, or startup dashboard.

Protect, in order:

1. readability and interaction
2. mobile fidelity
3. performance

The non-negotiable identity elements are:

1. dark city-pop palette
2. Kitsune mask identity
3. melancholy + clinical restraint + uncomfortable humor + rare supernatural traces

The interface should be almost static during normal browsing. Use subtle environmental motion only. Reserve stronger motion, bloom, and lighting for the hidden full-screen listening mode.

English remains primary. Katakana is accurate, sparse, and used only as a visual identity accent on major moments. Use clean geometric UI type, condensed or monospace metadata, and restrained display treatment.

The homepage should remain stable. It opens with an asymmetrical editorial destination menu, a small Current Phase line, and restrained previews for Latest Beat, Fixations, and Latest Logs. Do not turn these into equal cards.

The Player is the purest and sparsest expression. Fixations are the deepest archive. Logs are a dark editorial journal. Releases are a sparse gallery. Search is functional first.

Use persistent bottom navigation on mobile, contextual actions, and section-specific bottom sheets or layered panels. Do not hide core navigation.

Artwork presentation changes by section. Music may use floating square covers and environmental light. Fixations may use cinematic crops and layered imagery. Logs remain mostly typographic.

The full-screen listening mode is the most expressive state: black digital void, minimal visualizer, artwork-led accent lighting, lane-guided atmosphere, and extremely rare Kitsune manifestation.

The interface voice is nearly silent and clinical. Rare empty states or hidden messages may use deadpan technical humor and uncomfortable self-deprecation. Do not make the site chatty, cute, or constantly quirky.

Generate a Codex prompt that:
- assumes an existing Next.js mobile-first PWA with Sanity content
- preserves the current information architecture and existing functionality
- asks Codex to inspect the existing codebase before changing components
- introduces reusable design tokens
- avoids a full rewrite
- prioritizes incremental implementation
- includes acceptance criteria for mobile, accessibility, performance, reduced motion, and visual consistency
- explicitly lists the anti-rules above
- separates foundation work, homepage, Player, listening mode, Fixations, Logs, and polish into implementation phases
