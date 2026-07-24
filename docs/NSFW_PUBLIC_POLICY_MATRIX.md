# NSFW public-consumer policy matrix

Phase 16B audit, 2026-07-18. `MASTER_DOC.md` is authoritative. All queries remain published-only; drafts are never public.

| Content | Policy | Current public handling | Identity/media/navigation |
|---|---|---|---|
| Beat | `VISIBLE_WITH_WARNING` | Phase 16A playback and artwork gate | Beat document ID; canonical Sanity image reference; R2 signing remains server-gated |
| Context/version | `PERMANENTLY_INACCESSIBLE` pending server-safe design | UI marks NSFW Context locked; playback API returns 403 | Version identity exists, but localStorage is not server authorization |
| Release | `VISIBLE_WITH_WARNING` | Player/Search expose safe title/type; cover and page content reveal only after exact Release approval | Release document ID; Beat playback remains separately gated by Beat identity |
| Lane | `NON_SENSITIVE_ONLY` | Lane schema has no top-level NSFW fields | Sensitive child Beats use Beat identity and Phase 16A gate |
| Log | `VISIBLE_WITH_WARNING` | Listed with safe type/date/title; body/bullets reveal through exact Log approval | Log document ID; reader opens once after approval |
| Link | `VISIBLE_WITH_WARNING` | Safe title/provider metadata; note/thumbnail/destination/preview gated | Link document ID shared across Logs and Rabbit Hole appearances |
| Playlist | `VISIBLE_WITH_WARNING` | Provider selection is inert; iframe and external actions gated | Playlist document ID; no iframe/autoplay before approval |
| Quote | `VISIBLE_WITH_WARNING` | Quote text/attribution hidden until exact Quote approval | Quote document ID; source navigation belongs to same Quote action |
| Fixation | `VISIBLE_WITH_WARNING` | Index exposes safe title/status; artwork, description, detail, and Rabbit Hole parent reveal after exact Fixation approval | Fixation document ID; child approval never inherits parent approval |
| Rabbit Hole entry | `VISIBLE_WITH_WARNING` | Sensitive Link entries retain ordering/categories but gate note, thumbnail, iframe, and external action | Canonical Link document ID, including duplicate pinned/feed appearances |
| Search | `VISIBLE_WITH_WARNING` for searchable major documents | Sensitive rows expose safe type/title/date only; artwork/body is omitted and activation is gated | Exact result document ID; sensitive external href is withheld from markup |
| Home automatic modules | `SERVER_EXCLUDED` | Latest Beat/Link/Playlist/Thought retain `nsfw != true` exactly as required | No warning because sensitive candidates are not selected |
| Home featured Fixations / release announcement | `SERVER_EXCLUDED` | Existing safe filtering/projection preserved | Prevents sensitive curated artwork/description leakage |
| Relationship rows | `SERVER_EXCLUDED` where no narrow client reader exists | Existing Beat File and Fixation relationship exclusions are preserved; Rabbit Hole Link appearances are gated | Child document identity is authoritative; parent approval never approves child |

## Context follow-up

`src/app/api/playback/route.ts` returns 403 when `beat.version.nsfw === true`. The Master Doc expects a warning before consuming NSFW content, but the current anonymous MVP has no server-verifiable proof of browser approval. A future `feature/16c-nsfw-context-playback` would need a narrowly scoped, short-lived server-signed authorization token bound to the public Beat ID and version key, issued only through a separately reviewed server flow. An authenticated session or server preference could also work but conflicts with the no-auth MVP. Until then, Context remains permanently inaccessible; localStorage must never bypass the API check.

## Metadata limitation

Server-rendered Open Graph metadata cannot trust localStorage. Sensitive artwork remains omitted from metadata even after local approval.
