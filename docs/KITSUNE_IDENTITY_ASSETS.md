# Kitsune Identity Assets

Authority order: `MASTER_DOC.md` defines product behavior; `UI_AESTHETIC_BRIEF.md` and `docs/VISUAL_DIRECTION_ADDENDUM.md` define presentation; `docs/TYPOGRAPHY_SYSTEM.md` defines display type; this document defines the identity asset pipeline.

## Approved mask

`public/brand/kitsune-mark.svg` is the canonical approved mask. Its 655×655 square viewBox and all internal geometry must not be redrawn. It is a transparent, fill-based `currentColor` SVG with no script, events, raster data, fonts, gradients, filters, or external references.

`src/components/kitsune-mark.tsx` repeats the exact five approved paths for server-safe React use. It accepts standard SVG props, is decorative by default, and accepts `label` for a mark-only accessible name. It uses no generated IDs or runtime parsing.

## Compact rendering

The 16px and 32px files rasterize the full approved geometry. No compact derivative is currently used: no detail, line, proportion, or feature is changed. Any later 16px/32px simplification must be explicitly approved and documented here.

## Lockup

The public header pairs one decorative mask with the compact real-text wordmark `THE KITSUNE PROTOCOL`. `PERSONAL ARCHIVE` is the secondary line and hides below 360px to protect the unchanged header height and 44px Home target. Mark-only placements must supply a label.

## Raster generation and route conventions

`scripts/generate-kitsune-icons.mjs` deterministically rasterizes the canonical SVG with Sharp onto `#05070B`. Standard assets use a 72–82% mark scale; maskable assets use 58% for safe area. It writes `public/brand/`, then copies the 512px and 180px outputs to `src/app/icon.png` and `src/app/apple-icon.png`, producing `/icon.png` and `/apple-icon.png` through App Router.

Run `node scripts/generate-kitsune-icons.mjs` after an approved master change. Do not hand-edit PNGs. PWA manifest, service worker, offline shell, install behavior, and additional PWA wiring remain deferred.
