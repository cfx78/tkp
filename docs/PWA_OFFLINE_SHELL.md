# PWA Installability and Offline Shell

## Manifest and installed metadata

`src/app/manifest.ts` uses the Next.js App Router manifest convention and emits `/manifest.webmanifest`. It declares the root start URL and scope, standalone display, English language, music/entertainment categories, the shared near-black theme/background, and the approved 192px/512px standard and maskable PNGs.

Root metadata references the manifest, 16px/32px favicons, and 180px Apple touch icon. Apple standalone capability, application title, black-translucent status bar, theme color, and `viewport-fit=cover` are enabled. Existing page titles, descriptions, icon routes, typography, NSFW metadata behavior, and route behavior remain unchanged.

## Offline route

`/offline` is force-static and contains only local brand identity, a concise connection explanation, an explicit statement that music is unavailable offline, a Retry button, and a Home link. It performs no Sanity request and includes no remote artwork, iframe, audio, signed URL, archive data, or normal bottom navigation.

## Worker and registration

`public/sw.js` is a first-party root-scoped worker. `PwaRegistration` registers it only in production, after load or during an idle period, and skips registration when initially rendered under `/studio`. Registration failure is silent and cannot break rendering.

The worker owns caches prefixed `tkp-shell-`; the current cache is `tkp-shell-v1`. Install precaches only:

- `/offline`
- `/brand/kitsune-mark.svg`
- `/brand/icon-192.png`

No unstable Next.js hashed filenames are hard-coded. During activation, the worker removes only obsolete caches with its own prefix. It does not call `skipWaiting`, claim clients, reload a page, or show update UI. An installed update therefore waits until the old controlled clients close, then becomes active naturally.

## Runtime strategy and explicit bypasses

Same-origin navigations are network-first and are never written to Cache Storage. A genuine network failure receives the cached `/offline` document. This prevents a previously approved or sensitive page document from becoming a later generic fallback.

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
