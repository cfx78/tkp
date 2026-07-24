# Typography System

## Primary brand display

Anton, self-hosted by `next/font/google` as `--font-brand-display`, is reserved for `THE KITSUNE PROTOCOL`, rare brand title cards, and rare high-priority identity statements. It uses uppercase real text, tight spacing, a crisp white center, restrained amber/orange bloom biased left, and restrained cyan/blue bloom biased right.

Variants are `compact`, `standard`, and `title-card`. Compact stays on one line in the public header without changing its height. Standard and title-card wrap at natural spaces and remain selectable. Glow stays close to glyph edges, communicates no state, and is removed in forced-colors and print.

Do not use the primary face for ordinary page titles, navigation, controls, metadata, body copy, lane/fixation names, or repeated list content. Do not create image-based wordmarks, duplicate accessible text for glow, animate glow, or imitate esports, cyberpunk, or synthwave branding.

## Secondary editorial display

Josefin Sans 300/400, self-hosted as `--font-editorial-display`, provides thin geometric uppercase display type. Use it selectively for `PERSONAL ARCHIVE`, section openings, Current Phase, Fixation or Listening Mode titles, lane names, and occasional labels such as `BY NIGHT`.

Default tracking is 0.18em and reduces to 0.14em on narrow screens. Subtitle uses 0.20em and reduces to 0.16em. Variants are `section`, `phase`, `subtitle`, and `extruded`. Extrusion is an optional faint pseudo-layer, never duplicated accessible DOM, never a bevel, and removed in forced-colors and print.

## Functional boundary

`--font-ui` remains the existing Avenir Next/system sans stack for body copy, navigation, controls, common headings, and UI. `--font-meta` remains the system mono stack for metadata, timestamps, status labels, and numeric details. This foundation does not globally restyle headings, anchors, controls, or body type.

## Accessibility and responsive rules

Display text remains semantic, selectable, readable without bloom, and safe under text zoom. No meaning relies on amber/cyan edges. Decorative layers use CSS pseudo-elements and never enter the accessibility tree. Wrapping uses real spaces; tracking reduces before crowding. The header subtitle hides below 360px. Focus behavior and reading order remain owned by the surrounding semantic link or heading.

## Performance and deferred work

Fonts are self-hosted through Next with `display: swap`; no font package, remote runtime request, base64 embedding, client typography boundary, canvas, SVG text path, animation loop, or repeated shadow list is allowed. Broader page-heading conversion, environmental typography, and lane/fixation/listening title convergence remain later visual work after PWA foundation.
