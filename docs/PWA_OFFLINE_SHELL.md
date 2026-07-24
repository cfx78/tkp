# PWA Installability and Offline Shell

## Manifest and installed metadata

`src/app/manifest.ts` uses the Next.js App Router manifest convention and emits `/manifest.webmanifest`. It explicitly declares same-origin `start_url: "/"` and `scope: "/"`, standalone display, English language, music/entertainment categories, the shared near-black theme/background, and the approved 192px/512px standard and maskable PNGs.

Root metadata references the manifest, 16px/32px favicons, and 180px Apple touch icon. Apple standalone capability, application title, black-translucent status bar, theme color, and `viewport-fit=cover` are enabled. Existing page titles, descriptions, icon routes, typography, NSFW metadata behavior, and route behavior remain unchanged.

## Offline route

`/offline` is force-static and contains only local brand identity, a concise connection explanation, an explicit statement that music is unavailable offline, and one native `Try Again` link to `/`. The native link performs a full document navigation without depending on hydration or the App Router: while offline the worker returns the TKP offline document again, and once connectivity returns the same action loads Home. The route performs no Sanity request and includes no remote artwork, iframe, audio, signed URL, archive data, or normal bottom navigation.

## Worker and registration

`public/sw.js` is a first-party root-scoped worker. `PwaRegistration` mounts from the root layout, registers `/sw.js` non-blockingly with scope `/` promptly after hydration, sets `updateViaCache: "none"`, and skips registration when initially rendered under `/studio`. It does not wait for browser idle time or the window `load` event.

The worker owns caches prefixed `tkp-shell-`; the corrected recovery-action cache is `tkp-shell-v3`. The version change ensures existing installations replace the previously cached offline HTML. `/offline` is the sole critical install asset: installation fetches it with `no-store`, verifies a successful response, and stores it under one deterministic request key before installation can succeed. The following local brand files are optional and are attempted independently, so either failure cannot reject installation:

- `/brand/kitsune-mark.svg`
- `/brand/icon-192.png`

No unstable Next.js hashed filenames are hard-coded, and Home or other dynamic documents are not precached. During activation, the worker removes only obsolete caches with its own prefix and calls `clients.claim()` so a newly activated first worker controls an already-open client without reloading it. It does not call `skipWaiting`, force a reload, or show update UI. An updated worker still waits naturally while an older worker controls active clients; after activation it claims eligible open clients.

### Confirmed cold-launch correction

The original mobile build installed successfully but could cold-launch to the browser/OS network error in airplane mode. The failure path combined delayed idle/load registration, an all-or-nothing install where an optional brand response could reject `/offline` caching, no activation claim for the first uncontrolled client, and `Response.error()` when the expected fallback was absent. The correction removes the unbounded registration gate, makes only `/offline` install-critical, claims clients on activation, and guarantees an HTML response for failed eligible navigations.

## Runtime strategy and explicit bypasses

Same-origin requests with `request.mode === "navigate"` are handled before generic static-resource logic, after security exclusions. They are network-first and are never written to Cache Storage. A thrown network failure receives the cached `/offline` document using a query-insensitive match. If that critical entry is unexpectedly absent, the worker returns a self-contained emergency offline document with HTTP 200 and `Content-Type: text/html; charset=utf-8`. Both documents state that music is unavailable offline. This prevents a previously approved or sensitive page document from becoming a later generic fallback.

Successful, non-redirected same-origin `/_next/static/*` and `/brand/*` responses use cache-first behavior unless marked `private` or `no-store`. Everything else uses normal browser networking.

The fetch handler returns without interception for:

- non-GET requests
- cross-origin requests and provider iframes/thumbnails
- requests with `Authorization` or `Range`
- every `/api/*` request, including `/api/playback`
- every `/studio*` request
- audio and video destinations
- Sanity images and arbitrary same-origin images

Consequently signed R2 URLs, audio bodies, API responses, private data, provider responses, drafts, Studio resources, and sensitive remote artwork never enter worker-owned caches. Approval remains exact-item localStorage state; no approval key, NSFW reason, or sensitive-content metadata is stored in Cache Storage.

## Playback and Studio

The existing single `Audio` element, no-store playback request, 15-minute server-signed URL, queue, history, and errors are unchanged. Already-buffered browser playback is not forcibly interrupted, but the worker cannot provide a new Beat offline and never claims that it can.

The root scope can observe Studio fetch events, but the first-party handler bypasses `/studio` before any cache lookup or network wrapping. Studio retains its own metadata, client boundary, scripts, data access, and online-only behavior.

## Browser and deployment limitations

Browsers decide whether and when to expose installation UI and when a waiting worker activates. Private/incognito modes, iOS versions, storage pressure, and enterprise policy can change PWA behavior. Deployment verification must confirm HTTPS, final domain/scope, manifest MIME type, icon presentation, Apple installed mode, production security headers, worker update behavior, and real-device safe areas.

For local production testing, build and start the app, visit it once online, then inspect Application > Service Workers/Cache Storage. To clear development state, unregister `/sw.js` in browser developer tools and delete only caches whose names begin with `tkp-shell-`. Development mode does not register the worker.

## Verified HTTPS iPhone recovery

The `tkp-shell-v3` correction was manually validated on an installed iPhone PWA running iOS 18.7 against an HTTPS Vercel Preview origin. The v3 worker and cache activated successfully, and no obsolete TKP shell caches remained.

With airplane mode enabled, a cold launch displayed TKP's custom offline page. Selecting the single native `Try Again` link while still offline performed a full-document navigation to `/`; the worker returned the cached offline document, so the app remained within TKP's branded offline experience instead of exposing iOS's generic network-error page. After connectivity was restored without closing the app, selecting the same action loaded Home.

This confirms the installed-app recovery path for that device, OS, and HTTPS origin. Music remains online-only, eligible navigations remain network-first and are not cached, and all API, Studio, Authorization, Range, audio/video, Sanity/media, provider, and signed R2 exclusions remain unchanged. Revalidate on a real installed device whenever worker scope, lifecycle, cache version, or hosting behavior changes.
