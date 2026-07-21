# PWA Installability and Offline Shell

## Manifest and installed metadata

`src/app/manifest.ts` uses the Next.js App Router manifest convention and emits `/manifest.webmanifest`. It explicitly declares same-origin `start_url: "/"` and `scope: "/"`, standalone display, English language, music/entertainment categories, the shared near-black theme/background, and the approved 192px/512px standard and maskable PNGs.

Root metadata references the manifest, 16px/32px favicons, and 180px Apple touch icon. Apple standalone capability, application title, black-translucent status bar, theme color, and `viewport-fit=cover` are enabled. Existing page titles, descriptions, icon routes, typography, NSFW metadata behavior, and route behavior remain unchanged.

## Offline route

`/offline` is force-static and contains only local brand identity, a concise connection explanation, an explicit statement that music is unavailable offline, and one native `Try Again` link to `/`. The native link performs a full document navigation without depending on hydration or the App Router: while offline the worker returns the TKP offline document again, and once connectivity returns the same action loads Home. The route performs no Sanity request and includes no remote artwork, iframe, audio, signed URL, archive data, or normal bottom navigation.

## Worker and registration

`public/sw.js` is a first-party root-scoped worker. `PwaRegistration` mounts from the root layout, registers `/sw.js` non-blockingly with scope `/` promptly after hydration, sets `updateViaCache: "none"`, and skips registration when initially rendered under `/studio`. It does not wait for browser idle time or the window `load` event.

The worker owns caches prefixed `tkp-shell-`; the corrected recovery-action cache is `tkp-shell-v3`. The version change ensures existing installations replace the previously cached offline HTML. `/offline` is the critical install asset: installation fetches it with `no-store`, verifies a successful response, and stores it under one deterministic request key before installation can succeed. These local brand files are optional and are attempted independently, so either failure cannot reject installation:

- `/offline`
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

## Mobile cold-launch retest

1. Deploy the corrected build to the same HTTPS origin used for installation.
2. Remove the previously installed TKP app and clear that origin's site data where the browser permits it.
3. Visit the deployed site online, install TKP again, open the installed app online, and leave it open for at least 15 seconds.
4. Close the installed app completely, enable airplane mode, and launch it again.
5. Confirm the branded TKP offline page opens, returns an ordinary document rather than a browser network error, and explicitly says music is unavailable offline.
6. Select `Try Again` while still offline and confirm the branded TKP offline experience remains visible without an iOS network-error page.
7. Restore connectivity, select the same action, and confirm Home loads.
8. Confirm an uncached TKP deep link also falls back to the offline page and playback still requires the network.

## Temporary iOS Home Screen diagnostics

`/pwa-diagnostics` is a temporary, unlinked, `noindex`/`nofollow` route for diagnosing iOS Home Screen service-worker control. It is manually opened on the installed app's exact HTTPS origin and intentionally renders without the public header, MiniPlayer, or bottom navigation.

The route reports only local app context, reduced referrer origin, manifest metadata, registration/scope/worker states, bounded `serviceWorker.ready` and worker-handshake results, approved shell-cache state, `/offline` status/MIME/content markers, same-origin endpoint status/MIME, storage estimates, and a 30-entry local event timeline. The worker handshake returns only its diagnostic protocol version, cache version, script pathname, state, expected-cache presence, and the offline response's presence/status/content type.

It does not query Sanity, render media/provider content, request storage persistence, clear registrations or caches, reload, upload telemetry, or expose cookies, signed URLs, headers, private page content, full referrer paths, or query strings. Its classification ranges from missing support/registration/control/cache/version states through `READY FOR OFFLINE RETEST`; readiness requires a secure context, correct root scope, expected active and controlling worker, `tkp-shell-v3`, valid cached HTTP 200 HTML, and a successful handshake. Standalone/display-mode detection remains copied as useful launch-context metadata, but unreliable iOS reporting does not override an otherwise healthy worker classification.

Remove the route, panel, worker message handler, tests, shell exception, and this section after the iOS defect is identified and resolved.
