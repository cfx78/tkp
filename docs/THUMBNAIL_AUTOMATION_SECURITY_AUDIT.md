# Thumbnail Automation Security Audit

Status: Phase 3A architecture proposal only  
Date: 2026-07-16  
Implementation status: no network fetching, asset upload, Studio action, schema change, or public-rendering change exists in this phase.

## 1. Executive recommendation

Build thumbnail discovery as an explicit, authenticated Studio command backed by small provider-specific server fetchers. The server must re-parse the stored canonical Link URL, choose its own fixed metadata endpoint and approved image hosts, validate and re-encode the downloaded image, and only then upload it to Sanity. Opening, editing, publishing, or publicly rendering a document must never start a fetch.

The first useful implementation should support only Spotify tracks and albums through Spotify's documented unauthenticated oEmbed endpoint. Do not include Spotify playlists until Spotify documents them as accepted oEmbed inputs. Add YouTube videos and playlists only after a YouTube Data API key and quota policy are approved. Add Apple Music catalog songs, albums, and playlists only after Apple Developer Program/MusicKit credentials and canonical identifier parsing are approved. Everything else remains deferred or manual-only.

The existing `thumbnail` image remains authoritative. An automatic result is a proposed replacement that the user reviews before publishing. Existing assets and documents require no migration. Missing provenance must be treated as manual/unknown and protected from automatic overwrite.

Go decision for Phase 3B1: **conditional go** for Spotify track and album only, subject to approval of the protected execution/authentication design and an image-decoding dependency. No-go for a generic Open Graph crawler.

## 2. Current repository audit

### Link schema

| Field | Checked-in type and behavior |
|---|---|
| `title` | Optional `string` |
| `url` | Required `url`; custom `LinkSourceInput`; accepts a public URL or supported copied embed, stores only `parseLinkSource().canonicalUrl` |
| `platformAuto` | Read-only `string`, populated by the custom source input |
| `platformOverride` | Optional `string` from the supported platform list |
| `note` | Optional `text` |
| `thumbnail` | Optional Sanity `image` reference |
| Alt text | No separate field and no image subfield |
| `embedUrl` | Optional `url`; legacy/public preview consumers independently validate it before embedding |
| Relationships | Arrays of references: `relatedFixations`, `relatedBeats`, `relatedReleases`, `relatedPlaylists`, `relatedQuotes`, and `tags`; Rabbit Hole category/reference fields also exist |
| Publication | Optional `publishedAt` datetime |
| NSFW | `nsfw` boolean and conditionally visible `nsfwReason` string |

`thumbnail` is a Sanity image asset reference, not a remote URL field. The schema does not enable `hotspot`, so the image value may carry normal crop metadata when authored but hotspot selection is not enabled. There is no separate alt-text value. Manual uploads are the only current population mechanism and are therefore authoritative.

Public projections dereference the asset to a Sanity CDN URL or retain the Sanity image value and use `@sanity/image-url`. Logs, Rabbit Hole, Fixation detail, and Search tolerate an absent thumbnail. Logs and Fixation detail omit the image region; Rabbit Hole shows an icon/provider fallback; Search uses the shared artwork fallback. Homepage Latest Link currently does not project or render a thumbnail. No migration is required.

Current Link images use native lazy `<img>` elements rather than `next/image`. Rabbit Hole and Fixation detail use Sanity transformations (`width`, `fit('max')`, `auto('format')`); Logs and Search consume projected Sanity CDN URLs. `next.config.ts` has no remote-image allowlist because Next Image is not used. No public component fetches a provider image directly.

### Sanity and execution boundaries

- The public read client uses `next-sanity`, `useCdn: false`, and only `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `NEXT_PUBLIC_SANITY_API_VERSION`. It has no write token.
- Studio is embedded client-side at `/studio`, with the standard structure and Vision tools. There is no custom Studio structure or document action.
- Existing route handlers are playback-specific. There are no server actions and no asset-upload calls.
- The dataset is public for reads; Studio authentication supplies authoring access. A future server upload requires a separate least-privilege secret or a design that performs the final upload with the authenticated Studio user's Sanity session.
- Existing server-only secrets are non-`NEXT_PUBLIC_` R2 variables. Thumbnail credentials must follow the same convention.
- The dependency tree contains Sharp only as an optional transitive dependency of Next. TKP does not directly depend on or import an image decoder/encoder; this is not a supported application dependency contract.

Compatibility rule: retain `thumbnail`; never store a remote image URL as the public thumbnail; treat an existing image with missing automation provenance as manual; never overwrite it without explicit confirmation.

## 3. Current source parsing audit

| Provider | Safe identification now | Stable data exposed | Gap for discovery |
|---|---|---|---|
| YouTube | Trusted YouTube, mobile, short, Music, and no-cookie forms | Canonical URL, video or playlist kind, validated ID, trusted embed | Sufficient for official API dispatch |
| Spotify | Exact `open.spotify.com`; supported entity kinds | Canonical URL, kind, validated ID, trusted embed | Sufficient for track/album; documented oEmbed coverage must control dispatch |
| Apple Music | Exact Music/Embed hosts | Canonical URL and inferred kind | Does not expose catalog ID/storefront consistently; parser is too permissive for API lookup |
| YouTube Music | Exact host | Canonical URL, video/playlist kind and ID | Sufficient for YouTube API lookup, but Music-specific catalog semantics are unresolved |
| TikTok | Exact/short provider hosts | Full video URLs expose numeric ID; short/share/generic forms may not | Share URLs are retained without resolving; only full video URLs are dispatchable |
| Instagram | Exact host | Post/Reel/TV shortcode for recognized paths | Identifier exists, but official metadata access requirements govern feasibility |
| X/Twitter | Exact X/Twitter hosts | Status ID and canonical URL for status paths | Identifier exists; documented thumbnail-bearing official method unresolved |
| Letterboxd | Exact host | Kind and canonical path | No Letterboxd LID; current parser is insufficient for its official API |
| Generic HTTP(S) | Any non-provider URL with a dotted hostname | Canonicalized URL only | Far too permissive for server fetching; no SSRF validation or trusted destination |

These parsers are content-entry parsers, not network-policy validators. They allow HTTP generic URLs, do not resolve DNS, and intentionally do not implement IP-range or redirect protection. Phase 3B must not reuse “parser accepted it” as authorization to connect.

## 4. Provider capability matrix

| Content | Classification | Proposed source | Required identifier | Network/auth | Image/result handling | Priority and principal failures |
|---|---|---|---|---|---|---|
| YouTube video | SAFE WITH AUTHENTICATED OFFICIAL API | YouTube Data API `videos.list(part=snippet)` | Video ID | Yes; API key or OAuth; list call quota documented as 1 unit | Select returned thumbnail URL, approved Google host only, validate/re-encode/copy to Sanity | 3B2; not found/private/quota/disabled image |
| YouTube playlist | SAFE WITH AUTHENTICATED OFFICIAL API | `playlists.list(part=snippet)` | Playlist ID | Yes; API key/OAuth | Same | 3B2; private playlist/quota/missing thumbnail |
| YouTube Music playlist | SAFE WITH AUTHENTICATED OFFICIAL API | YouTube Data API playlist resource | Playlist ID | Yes; API key/OAuth | Same; label remains YouTube Music based on source host | 3B2; Music-specific behavior unresolved until tested against official API |
| Spotify track | SAFE FOR FIRST IMPLEMENTATION | Spotify official oEmbed | Track canonical URL/ID | Yes; no auth documented | `thumbnail_url` from approved Spotify CDN, validate/re-encode/copy | 3B1; 404/null thumbnail/rate limiting not documented |
| Spotify album | SAFE FOR FIRST IMPLEMENTATION | Spotify official oEmbed | Album canonical URL/ID | Yes; no auth documented | Same | 3B1; same failures |
| Spotify playlist | DEFER | No documented accepted playlist input in current Spotify oEmbed reference | Playlist ID | Unresolved | Do not guess artwork URLs | Revisit only after official documentation/API approval |
| Apple Music song | SAFE WITH AUTHENTICATED OFFICIAL API | Apple Music catalog API | Storefront and catalog ID | Yes; signed developer token | Expand documented artwork template, validate Apple host, re-encode/copy | 3B2; parser lacks ID; token/429/storefront |
| Apple Music album | SAFE WITH AUTHENTICATED OFFICIAL API | Apple Music catalog API | Storefront and catalog ID | Yes; signed developer token | Same | 3B2 |
| Apple Music playlist | SAFE WITH AUTHENTICATED OFFICIAL API | Apple Music catalog playlist API | Storefront and catalog ID | Yes; signed developer token | Same | 3B2; library playlists may require a Music User Token and are excluded |
| TikTok post | DEFER | Official TikTok oEmbed | Full post URL/ID | Yes; no auth shown for oEmbed | Official response documents title/author/embed, but a thumbnail field was not verified | Revisit only with verified thumbnail contract |
| Instagram post | DEFER | Official Instagram oEmbed/API, if approved | Shortcode/media ID | Yes; access requirements/app review unresolved in this audit | Copy only a documented returned image | Do not implement until official access and fields are verified |
| Instagram Reel | DEFER | Same | Shortcode/media ID | Same | Same | Same |
| X/Twitter post | MANUAL ONLY | No verified official thumbnail-bearing endpoint | Status ID | Unresolved | None | Text posts often have no image; no guessing/scraping |
| Letterboxd page | MANUAL ONLY | Letterboxd API access is request-only and explicitly unavailable for private/personal projects | LID (not parsed) | Client credentials required if access granted | None in TKP | Manual upload; do not scrape posters |
| Generic website/article | MANUAL ONLY | None in Phase 3B | Canonical URL only | Would require arbitrary HTML and image fetches | None | Generic crawler risk exceeds current benefit |

Expected accepted output for the future pipeline is a single static JPEG, PNG, or WebP. GIF input, if ever received, must be decoded to its first frame and emitted as static output. SVG is rejected.

## 5. Official provider research

Research was limited to provider-operated documentation and endpoints, checked 2026-07-16.

- **Spotify:** [official oEmbed reference](https://developer.spotify.com/documentation/embeds/reference/oembed) documents `GET https://open.spotify.com/oembed?url=...`, JSON title and nullable `thumbnail_url`, and 200/404 responses without authentication. Its accepted URL description lists podcast show, episode, artist, album, and track—not playlist. The endpoint accepts a target URL parameter, so TKP must construct that parameter only from a re-parsed Spotify canonical URL. Rate limits and redirect behavior are not documented; use no retries and treat 429/redirect anomalies as controlled failure.
- **YouTube:** [Data API reference](https://developers.google.com/youtube/v3/docs), [video resource](https://developers.google.com/youtube/v3/docs/videos), and [videos.list](https://developers.google.com/youtube/v3/docs/videos/list) document JSON snippet title, channel title, thumbnail variants, API-key/OAuth authentication, and a one-unit `videos.list` quota cost. Playlist resources expose snippet thumbnails through the same API family. Use exact `www.googleapis.com/youtube/v3` endpoints; never use guessed `i.ytimg.com` paths as the metadata source.
- **Apple Music:** [Artwork object](https://developer.apple.com/documentation/applemusicapi/artwork) documents width, height, and a URL template. [Developer-token documentation](https://developer.apple.com/documentation/AppleMusicAPI/generating-developer-tokens) requires an Apple Developer Program MusicKit identifier/private key, ES256 JWT bearer token, and documents temporary 429 responses. Catalog operations can use a developer token; library content may require a user token and is excluded.
- **TikTok:** [official embedded-video/oEmbed documentation](https://developers.tiktok.com/doc/embed-videos/) documents a provider oEmbed endpoint, JSON title and author, and returned embed HTML. The reviewed official response does not establish a thumbnail field, so TKP must not infer one or parse the returned HTML for an image.
- **Instagram:** a current provider-operated thumbnail-bearing contract and its precise access requirements could not be verified from official documentation during this audit. Mark unresolved/deferred; do not rely on historical unauthenticated oEmbed behavior.
- **X/Twitter:** a current provider-operated endpoint returning a post thumbnail could not be verified. Even oEmbed-style tweet markup would not guarantee media artwork. Mark manual-only.
- **Letterboxd:** [official API documentation](https://api-docs.letterboxd.com/) documents OAuth2 client credentials and Letterboxd IDs. [API access policy](https://letterboxd.com/api-beta/access/) says access is request-only and is not currently granted for private or personal projects. This is unsuitable for TKP.
- **Sanity:** [JS client assets documentation](https://www.sanity.io/docs/apis-and-sdks/js-client-assets) supports server-side Buffer/stream upload followed by a document patch. The [Assets API](https://www.sanity.io/docs/http-reference/assets) requires authentication and supports filename and external-source metadata.

No provider secrets, tokens, unofficial endpoints, browser automation, or scraping services are proposed.

## 6. Threat model

### SSRF

Threats include loopback; RFC1918 private IPv4; link-local; carrier-grade NAT; multicast; unspecified, reserved, benchmark, and documentation ranges; IPv6 loopback, link-local, unique-local, multicast, unspecified and documentation ranges; IPv4-mapped IPv6; cloud metadata addresses; internal/search-suffix DNS; DNS rebinding; validation/connection resolution differences; decimal/hex/octal/mixed IP notation; trailing dots; Unicode/punycode confusion; embedded credentials; fragments/userinfo; and malicious ports.

Mitigation: Phase 3B provider metadata destinations are constants, not user destinations. Normalize input with WHATWG URL, cap length, reject credentials and non-default ports, ASCII-normalize through URL/punycode, remove one trailing dot before exact allowlist comparison, reject IP literals and ambiguous numeric hosts, resolve all A/AAAA records, reject the complete non-public set, and connect only to the validated resolved address while preserving TLS SNI/Host. Re-resolve/revalidate for every new connection and redirect. If the chosen runtime cannot pin the validated address without breaking TLS, use a controlled egress proxy or do not implement remote image download there. Never follow system proxy settings implicitly.

### Redirects

Threats include private-network targets, unapproved image hosts, loops, excessive redirects, HTTPS downgrade, cross-provider redirects, and DNS changes per hop. Disable automatic redirects. Metadata requests allow at most two redirects, each HTTPS and within that fetcher's exact metadata-host set. Image requests allow at most two redirects, each within that provider's approved image-host set. Reject cross-provider, cross-policy, scheme, port, credential, and private-IP changes; track normalized visited URLs; discard any partial body before processing a redirect.

### Response abuse

Threats include huge HTML/JSON/images, compression bombs, lying or absent `Content-Length`, endless chunking, slowloris streams, MIME mismatch/polyglots, script-bearing SVG, animated-image CPU/memory abuse, enormous dimensions, malformed headers, and redirects after partial data. Stream and count compressed bytes independent of headers; bound decompressed bytes and decoder pixels; use connection/header/body deadlines; abort on the first excess; magic-byte check then decode; reject SVG and unknown/polyglot input; re-encode to a new static raster; never upload original bytes.

### HTML and metadata

Hostile Open Graph values can contain duplicates, relative/protocol-relative/file/data/blob URLs, base-tag manipulation, entities, malformed markup, JavaScript-only values, or competing images. Phase 3B1/3B2 do not parse arbitrary HTML at all. Provider JSON fields are data only: cap strings, reject control characters for filenames, never render returned HTML, and accept only one provider-specific thumbnail field after URL validation. This eliminates the generic HTML threat class rather than trying to sanitize it.

### Authorization and abuse

An anonymous endpoint could become a proxy, exhaust provider quotas, or create unbounded Sanity assets. Require authenticated Studio identity and authorized project/dataset membership; validate Origin and CSRF token where applicable; accept only document ID, expected revision, provider enum, and canonical source—not an arbitrary destination; re-fetch the document server-side; enforce per-user and project rate limits; serialize one job per document; reject concurrent/double-click jobs; bound daily uploads; and log outcome categories. The public PWA cannot call the operation.

### Data integrity, safety, and rights

Wrong/stale/deleted/private content, source changes, manual overwrites, duplicates, licensing, and unexpected NSFW artwork remain possible. Bind each job to document `_rev` and canonical URL; recheck before patch; never overwrite an existing image of manual/unknown origin without explicit confirmation; show the proposed result; record minimal provenance; deduplicate by output checksum; do not auto-refresh; preserve source URL on failure; and require author review, especially for NSFW sources. Copying artwork into Sanity creates a stored copy, so provider terms/licensing approval is an explicit product responsibility.

## 7. Exact future network policy

### Common rules

- Input canonical URL: maximum 2,048 UTF-8 bytes; HTTPS only for supported automation; no userinfo, fragment, IP literal, non-ASCII ambiguity, or port other than 443.
- Host: WHATWG normalization to lowercase ASCII/punycode, remove one terminal dot, then exact allowlist match. Reject invalid IDNA, empty labels, embedded NUL/control characters, and hosts that merely suffix-match an allowed name.
- DNS/IP: resolve A and AAAA; all answers must be globally routable. Reject loopback, private, link-local, CGNAT `100.64.0.0/10`, multicast, unspecified, reserved, documentation, benchmarking, IPv6 ULA/link-local/multicast/documentation, IPv4-mapped disallowed addresses, and known metadata endpoints. Revalidate and pin before each connection.
- TLS: HTTPS with certificate verification and SNI for the approved hostname; no downgrade.
- Headers: fixed `User-Agent: TKP-ThumbnailFetcher/1.0 (+private CMS)`, `Accept` appropriate to stage, and `Accept-Encoding: identity` unless the client can enforce a decompressed-byte ceiling. Forward no cookies, authorization (except the fetcher's own provider credential), browser session, referrer, IP headers, or arbitrary client headers.
- Redirects: manual, maximum 2; provider-policy host set only; no method rewriting beyond a safe GET; revalidate URL/DNS/IP each hop.
- Timing: 3-second connect, 5-second response-header, 10-second total metadata body, 15-second total image body; abort immediately on limit. One retry only for an idempotent metadata GET after a transient connection reset, never for 4xx/429 and never image downloads.
- Cache: server cache successful metadata for 15 minutes by provider+canonical URL and negative not-found for 5 minutes; never cache authorization headers. Image bytes live only in bounded memory during validation and are discarded after upload.
- Rate limits: proposed 5 discovery attempts/user/10 minutes, 30/project/day, one active/document, and maximum 20 successful new assets/project/day. Make these configurable server-side, not client-controlled.
- Logs: request ID, actor identifier, provider/kind, category, duration, byte counts, redirects, and asset ID; redact secrets and destinations as described below.

### Provider metadata requests

Only fixed endpoints compiled into each fetcher. JSON maximum 256 KiB compressed and 1 MiB decompressed; maximum nesting/decode complexity where supported. Spotify metadata host: exact `open.spotify.com`; YouTube: exact `www.googleapis.com`; Apple Music: exact `api.music.apple.com`. Provider credentials are server-only and sent only to their exact metadata host. Never request or parse returned embed HTML.

### Remote image downloads

Each fetcher owns an explicit reviewed image-host set learned from official responses and fixtures; do not share a global “CDN” suffix rule. Maximum 8 MiB transferred and 16 MiB decompressed input. Maximum 16 megapixels and 8,192 pixels on either axis. Accept response MIME candidates `image/jpeg`, `image/png`, or `image/webp`; optionally accept GIF only to decode the first frame. Magic bytes and successful bounded decode must agree. Reject SVG, TIFF, BMP, ICO, AVIF until an approved decoder/output policy exists, and all unknown formats. Emit a new static sRGB JPEG (quality about 85) for opaque images or PNG/WebP for meaningful transparency, maximum 2,000×2,000, metadata stripped and orientation normalized. Output maximum 5 MiB.

SVG is rejected because XML may contain scripts, external references, entity-expansion payloads, and complex renderer behavior; Sanity accepting SVG does not make arbitrary SVG safe. Animated output is rejected to avoid frame-count/CPU abuse and unexpected motion.

### Generic website metadata

Disabled. No request to the submitted website and no `og:image` resolution occurs in Phase 3B. A future proposal would need a separately reviewed egress layer, HTML limit of at most 512 KiB compressed/2 MiB decompressed, no JavaScript, strict base/relative URL handling, and the same image pipeline. Coverage does not justify that attack surface today.

## 8. Host allowlisting architecture comparison

| Architecture | Attack surface | Coverage/reliability | Complexity/maintenance | Privacy/rate limits/testability | Decision |
|---|---|---|---|---|---|
| A. Provider-specific fetchers | Smallest: fixed metadata host and provider-owned image hosts | Narrow but predictable | More adapters, each simple and reviewable | Source disclosed only to its provider; quotas isolated; excellent fixture tests | **Use first** |
| B. Official generic oEmbed per provider | Moderate: endpoint takes a URL and returns another URL | Useful only where provider documents entity support | Still needs provider adapter and image allowlist | Provider sees its own canonical URL; endpoint/rate behavior varies | Use only inside A, e.g. Spotify track/album |
| C. Generic Open Graph crawler | Largest: arbitrary DNS, HTML, redirects, image hosts and formats | Broad but brittle; JS metadata unavailable | High continuous security burden | Leaks visits to arbitrary sites; easy proxy abuse; difficult exhaustive testing | **No-go / manual-only** |

“Generic oEmbed” must not mean accepting a client-supplied endpoint. The endpoint and accepted canonical provider/kinds remain hardcoded.

## 9. Execution-location comparison

| Location | Assessment |
|---|---|
| Public Next route handler | Technically capable in Node runtime, but creates an internet-facing attack surface. It would require Studio identity verification, CSRF/origin validation, rate limiting, server secrets, strict request schema, and controlled DNS/egress. Never expose an arbitrary URL proxy. |
| Next server action | Reduces API ergonomics but is still an externally invocable server endpoint. Embedded Studio authentication is not automatically equivalent to Next application authentication; deployment coupling and origin verification remain. Not preferable without a proven Studio identity bridge. |
| Studio input/action calling protected backend | Best authoring UX and clear explicit trigger. Backend performs provider/network validation. Browser must receive no provider secret or Sanity service token. Requires a verified way for the backend to authenticate the active Sanity user and authorize dataset access. |
| Sanity custom action/server-side integration | Potentially best identity alignment if an official server-side integration product is selected, but adds hosting/deployment configuration and must still obey outbound/network controls. Capability and cost need approval. |
| Local development-only script | Small external attack surface and easy secret containment, but poor mobile/Studio usability and still requires hardened network/image code. Sensible temporary fallback, not the target workflow. |

### Primary recommendation

Use a **Studio custom document action calling a protected Node.js backend command endpoint**. The endpoint is provider-command-specific, not URL-generic. Authenticate the Sanity user with a short-lived verifiable identity assertion, authorize membership for the exact project/dataset, require same-origin/CSRF protection, then server-read the document by ID/revision and re-parse its stored URL. Host it where DNS resolution and connection pinning/controlled egress can actually be enforced.

Before implementation, prototype and approve the Studio-to-backend identity mechanism. If Vercel's Node runtime cannot guarantee DNS/IP pinning for image downloads, place outbound fetching behind a narrowly configured egress service or use the local script interim. Do not silently weaken the SSRF policy.

For Sanity writes, prefer a server-side least-privilege robot token limited to the `tkp-v2` dataset and only the required asset/create/Link patch operations if Sanity supports the needed grant. If that granularity is unavailable, have the backend return only validated, re-encoded bytes and signed job metadata to Studio, and let the already-authenticated Studio client upload/patch under the user's permissions. This alternative avoids a browser service token but needs careful replay/integrity protection and a second source-revision check.

## 10. Studio workflow

1. User pastes/saves a source; existing parsing stores the canonical Link URL and platform.
2. `Find thumbnail` appears only for an explicitly supported provider+kind.
3. Unsupported sources show “Automatic thumbnail discovery is not available for this source. Upload an image manually.”
4. User clicks once. Disable the action, show “Finding thumbnail…”, and keep the document editable.
5. Send document ID, expected `_rev`, and intent; provider is a hint only. Do not send a destination URL for the backend to trust.
6. Backend reads and re-parses the document, dispatches a fixed fetcher, validates/re-encodes the image, deduplicates, uploads, and conditionally patches.
7. If a thumbnail already exists and is manual/unknown, stop before fetching or require explicit “Replace existing thumbnail” confirmation. Never infer consent from retry.
8. On success, show the Sanity image field normally so the user can inspect, crop, replace, or remove it before publishing.
9. On failure, preserve URL and thumbnail, show a safe category message, re-enable deliberate retry, and never auto-retry on blur/open/publish/render.

Prevent duplicate uploads with one client in-flight state plus server idempotency key `{documentId}:{revision}:{canonicalUrlHash}`. A source edit during the request produces a revision conflict rather than attaching stale art.

Alt text should remain manual. A returned provider title may be displayed as a non-persisted draft suggestion, but must never silently become alt text because a title describes content, not necessarily the image's purpose.

## 11. Sanity asset-ingestion design

1. Use a server-side authenticated `@sanity/client` with `useCdn: false`, non-public token, fixed project/dataset/API version, and minimum grants.
2. Re-fetch Link `_id`, `_rev`, `url`, `thumbnail`, and provenance before work. Reject drafts/documents outside the exact Link type and dataset.
3. Fetch provider metadata and image into bounded streams; validate and re-encode before Sanity sees it.
4. Compute SHA-256 of normalized output. Query a narrowly tagged/source-ID asset or maintain an idempotency record; Sanity also reports asset hashes, but do not assume upload deduplication is an application transaction.
5. Generate `link-{provider}-{kind}-{providerIdHash}-{sha256prefix}.jpg|png|webp`; never use a remote filename or user title. Upload a Buffer/stream with exact output media type.
6. Supply Sanity asset source metadata only when approved: `sourceName` as provider, `sourceId` as stable provider ID, and canonical public `sourceUrl`. Do not store signed/CDN query credentials. Avoid EXIF/location extraction.
7. Conditionally patch the draft/current document with `ifRevisionId(expectedRev)`, assigning `{_type:'image', asset:{_type:'reference', _ref: assetId}}` and provenance fields in one mutation.
8. Upload and document patch cannot be atomic. If patch fails, check whether the asset has other references; delete only a newly created, unreferenced asset owned by this request. Queue/record cleanup failures for bounded later cleanup; never delete a deduplicated/pre-existing asset.
9. Replacing an automatic image does not delete the old asset immediately because other documents may reference it. Use reference-aware manual/periodic cleanup. Preserve normal crop information when retaining an asset; a replacement starts with no crop/hotspot. Manual replacement sets origin to manual and clears automation provenance.

Directly uploading remote bytes is rejected. Re-encoding strips metadata, normalizes orientation, collapses animation, constrains dimensions, and provides a known static format.

## 12. Image-validation pipeline

1. Stream into a byte-counting sink; abort over 8 MiB even when `Content-Length` is absent or false.
2. Detect magic bytes independently of extension, filename, and MIME.
3. Decode with a bounded native image library that supports resource limits and fails closed on malformed input.
4. Read decoded dimensions before full allocation where possible; reject over 16 MP or either axis over 8,192.
5. Limit decoder memory/concurrency, decoded bytes, frames/pages, and execution time to prevent decompression bombs.
6. Auto-orient from EXIF, then discard all EXIF/XMP/ICC except a normalized safe sRGB profile if needed.
7. Reject SVG/unknown formats; decode GIF first frame only; accept JPEG/PNG/WebP input initially.
8. Resize within 2,000×2,000 without enlargement and re-encode to static JPEG, PNG, or WebP.
9. Verify output magic, decode, dimensions, and ≤5 MiB again; compute SHA-256.
10. Upload only the normalized output to Sanity.

Node/WHATWG APIs can bound streams and inspect headers but cannot safely decode pixels, enforce frame/page limits, normalize EXIF, or re-encode images. The current direct dependencies do not provide this pipeline. Phase 3B requires explicit approval of a narrow, actively maintained native raster processing dependency (Sharp/libvips category) as a direct dependency. Confirm Node 24, Windows development, Linux/Vercel native binaries, install scripts, memory controls, and the current security audit before selection. The transitive optional Sharp copy under Next must not be imported as if it were a declared dependency.

## 13. Minimal data-model recommendation

The image field alone cannot distinguish manual work from automation or detect a changed source. Keep it and add one optional companion object:

```text
thumbnailAutomation {
  origin: "automatic"
  provider: "spotify" | "youtube" | "youtubeMusic" | "appleMusic" | ...approved values
  sourceCanonicalUrl: url
  fetchedAt: datetime
}
```

Exact proposed field name: `thumbnailAutomation`, type `object`, hidden/read-only except to the custom thumbnail action/input. `origin` is a required literal `automatic` when the object exists; `provider`, `sourceCanonicalUrl`, and `fetchedAt` are required. Do not add remote image URL, source title, source author, checksum, job ID, or failure details to the Link document. Checksum/source identifiers belong on the asset metadata or server log.

Absence of `thumbnailAutomation` means manual/legacy/unknown and is protected. A manual replacement/removal clears the object. An automatic replacement updates it. Comparing current `url` to `sourceCanonicalUrl` reveals staleness. No migration is needed and no public GROQ projection should include this object. Canonical source URLs are already public content, but keeping provenance out of public projections minimizes exposure.

This design requires a custom wrapper around the thumbnail field/action to reliably clear provenance after manual changes; approve that Studio-only schema/input change in Phase 3B. If reliable origin tracking cannot be implemented, treat every existing thumbnail as manual and require confirmation every time.

## 14. Failure taxonomy and user messages

| Category | Safe Studio message |
|---|---|
| Unsupported provider | Automatic thumbnails are not available for this source. Upload one manually. |
| Invalid source URL | Save a valid supported provider URL before finding a thumbnail. |
| Not found | The provider could not find this content. It may have been removed. |
| Private | This content is private or unavailable to the configured provider access. |
| Metadata/embed disabled | The provider does not offer metadata for this content. |
| Authentication required | Thumbnail access for this provider is not configured. |
| Rate limited | The provider is temporarily limiting requests. Try again later. |
| Provider timeout | The provider did not respond in time. Try again deliberately. |
| Unsafe metadata | The provider returned metadata that could not be accepted safely. |
| No thumbnail | The provider did not return a thumbnail. Upload one manually. |
| Image host rejected | The provider returned an image from an unapproved location. |
| Too large | The provider image is too large to import safely. |
| Invalid type | The provider image format is not supported safely. |
| Unsafe dimensions | The provider image dimensions could not be processed safely. |
| Upload failed | The thumbnail was validated but could not be saved. Your existing thumbnail is unchanged. |
| Document changed | The Link changed while the thumbnail was being found. Review it and try again. |
| Manual protected | This Link already has a manually selected thumbnail. Confirm replacement first. |

Never expose internal IPs, DNS answers, stack traces, response bodies/headers, tokens, project internals, filesystem paths, or provider secrets. Associate detailed server diagnostics only with a request ID.

## 15. Logging and observability

Log structured events using the existing hosting logs; add no logging service in Phase 3B. Allowed fields: request ID, pseudonymous/authenticated Studio actor ID or role where appropriate, provider, normalized content kind, success/failure category, total and stage durations, metadata/image/output byte counts, redirect count, cache hit, deduplication result, and successful Sanity asset ID.

Never log access/write/developer tokens, authorization headers, cookies, arbitrary HTML/JSON bodies, signed URLs, raw iframe code, full arbitrary user URLs, provider secrets, Sanity write tokens, or private IP/DNS answers observed during blocked attacks. Hash canonical IDs/URLs where correlation is needed. Redact query strings by default. Retain operational logs for 30 days unless the host's shorter default applies; security/rate-limit aggregate counters may live 90 days. Restrict access to project administrators and avoid logging expected validation errors at error severity.

## 16. Phase 3B testing strategy

### Pure tests

Provider dispatch; kind and canonical revalidation; URL length; HTTPS; credential/fragment/port rejection; ASCII/punycode normalization; trailing dots; decimal/hex/octal/mixed hosts; IP literals; all private/reserved IPv4 and IPv6 families including mapped IPv4; DNS-result policy; redirect host/scheme/loop/count decisions; MIME/magic agreement; byte/decompressed/output limits; pixel/axis/frame limits; manual overwrite policy; source-staleness and revision decisions; idempotency keys and dedupe decisions.

### Mocked network tests

Valid metadata for every enabled provider; 404/private/429/timeout; malformed or oversized JSON; redirect to private IP, disallowed CDN, other provider, downgrade, loop, and DNS-rebound result; missing/malformed/multiple thumbnail fields; credentials/data/file/blob image URL; misleading `Content-Length`; chunked overflow; slow/endless/truncated image; MIME mismatch/polyglot/SVG; malformed decode; simulated decompression bomb; excessive pixels/frames; output overflow; Sanity upload failure; patch revision conflict; orphan cleanup; duplicate asset reuse. Tests must use a mock transport/DNS resolver and never contact the internet.

### Studio tests

If the existing test stack gains suitable component support: action enabled only for supported saved provider/kind; unsupported state; loading/progress; success/failure; double-click disabled; manual-thumbnail confirmation; source/revision change; no automatic request on mount, keystroke, blur, save, publish, or public rendering. Otherwise cover these manually and keep logic in pure tested helpers.

### Visible manual checks

1. Open a supported Link: no request or thumbnail change occurs.
2. Press `Find thumbnail`: progress appears once and the source remains editable.
3. Confirm the new Sanity image appears and can be cropped/replaced/removed before publishing.
4. Open an unsupported Link: manual upload remains available and the action explains the limitation.
5. Try a Link with an existing manual thumbnail: no replacement occurs before confirmation.
6. Change the URL while a request runs: stale artwork is not attached.
7. Trigger a provider failure: existing content remains intact and deliberate retry becomes available.
8. Visit Homepage, Logs, Rabbit Hole, Fixation, and Search: no thumbnail fetch occurs during public rendering.

## 17. Phased implementation plan

### Phase 3B0 — security foundations and authenticated command

- Providers: none live.
- Likely files: new server-only URL/DNS policy, image policy, provider registry, protected command handler/integration, pure tests, Studio action shell, and environment documentation.
- Prerequisites: approve identity bridge, hosting/egress behavior, direct image dependency, rate limits, Sanity write model, schema provenance object.
- Tests: all URL/IP/redirect/auth/manual-overwrite/idempotency foundations using mocks.
- Manual: unsupported state, authentication denial, no fetch on lifecycle events.
- Exclusions: no generic URLs and no real provider calls until security gates pass.

### Phase 3B1 — Spotify track and album

- Providers: exact canonical Spotify `track` and `album` only.
- Likely files: provider-specific Spotify metadata adapter, approved Spotify image hosts, fixtures, Studio action availability, server upload/patch path, Link schema provenance field.
- Prerequisites: confirm current Spotify oEmbed terms/hosts/rate behavior; image re-encoding; production secret/identity/rate controls.
- Tests: official-shaped 200/404/null thumbnail, bad host, redirect, oversized image, dedupe/upload/patch conflict.
- Manual: track, album, existing manual image, removed content, repeated click.
- Explicit exclusions: playlist, artist, episode/show unless separately approved; returned iframe HTML is ignored.

### Phase 3B2 — authenticated official metadata

- Providers: YouTube video/playlist/YouTube Music playlist after Google key/quota approval; Apple Music catalog song/album/playlist after MusicKit credentials and parser-ID enhancement approval.
- Likely files: exact API adapters, server-only credential configuration, provider host policies, parser tests/possibly parser changes in a separate reviewed step, fixtures and action availability.
- Prerequisites: credential provisioning/rotation, terms, quota budgets, Apple storefront/ID rules, approved parser changes.
- Tests/manual: provider-specific private/not-found/rate-limit/auth/storefront cases and host fixtures.
- Exclusions: private Apple library playlists; guessed YouTube image paths.

### Phase 3B3 — broader providers/web metadata

- TikTok/Instagram/X only after an official, currently documented, authorized thumbnail response is verified and terms approved.
- Letterboxd remains manual while personal API access is unavailable.
- Generic Open Graph remains no-go unless independently threat-modeled with controlled egress, extensive adversarial tests, privacy approval, and a demonstrated product need.

## 18. Explicitly deferred features

Generic Open Graph crawling; arbitrary remote URL fetching; browser/headless scraping; third-party metadata/proxy services; Spotify playlist artwork; TikTok/Instagram/X automation; Letterboxd artwork; automatic alt text; background refresh; fetch-on-open/blur/save/publish/render; public fetch routes; thumbnails for Playlist/Release/Lane/Fixation/Beat/user records; provider scripts; public rendering redesign; image migration; audio/PWA/Search/NSFW changes.

## 19. Open questions requiring user approval

1. Approve Phase 3B1 scope as Spotify track and album only, or wait until YouTube credentials are available for a broader first release?
2. Approve a direct raster decoder/encoder dependency after a separate package/security review?
3. Choose/approve the Studio-user-to-backend authentication mechanism and hosting location with enforceable DNS/egress controls.
4. Approve either a least-privilege server Sanity token or the signed-result/Studio-user upload alternative; confirm the available Sanity role granularity.
5. Approve the optional `thumbnailAutomation` object and a custom thumbnail input/action that clears it on manual replacement.
6. Approve server-only quotas (proposed 5/10 minutes/user, 30 attempts/day/project, 20 new assets/day/project) and 30-day logs.
7. Confirm that copying provider artwork into private Sanity assets is acceptable under the relevant provider terms and intended personal use.
8. For a later phase, approve and provision `YOUTUBE_API_KEY`; separately approve Apple Developer Program/MusicKit key material and rotation. Exact environment variable names should be chosen during implementation, never `NEXT_PUBLIC_`.
9. Decide whether a local-only import script is acceptable if production hosting cannot safely pin validated DNS connections.

No new dependency, environment variable, infrastructure, provider credential, or schema field is authorized by this document alone.

## 20. Go/no-go checklist for Phase 3B

- [ ] Provider and content-kind scope approved; undocumented kinds fail closed.
- [ ] Official endpoint, returned thumbnail field, terms, authentication, rate limits, and image hosts reverified.
- [ ] Studio identity is cryptographically verified and project/dataset authorization tested.
- [ ] No public anonymous or arbitrary-URL fetch capability exists.
- [ ] Runtime can validate and pin DNS/IP per connection and redirect, or controlled egress is deployed.
- [ ] HTTPS/port/hostname/IP/redirect/time/byte policies implemented as pure testable decisions.
- [ ] Direct image dependency approved and Node 24/deployment binary compatibility verified.
- [ ] Magic/decode/pixel/frame/re-encode/output limits pass hostile fixtures.
- [ ] Sanity token/permission model approved; no service credential reaches browser code.
- [ ] Revision guard, manual-image protection, provenance, idempotency, dedupe, and orphan cleanup tested.
- [ ] Studio action never runs on mount, edit, blur, save, publish, or public render.
- [ ] Safe error taxonomy, redacted logs, quotas, and retention configured.
- [ ] Existing documents require no migration and all public thumbnail fallbacks remain unchanged.
- [ ] Lint, TypeScript, mocked tests, clean production build, and visible Studio checks pass.

Until every applicable item is checked, implementation remains no-go beyond isolated pure helpers and mocks.
