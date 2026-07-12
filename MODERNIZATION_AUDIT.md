# The Kitsune Protocol Modernization Audit

Audit date: 2026-07-12
Branch: `modernization-audit`
Scope: read-only application audit; no modernization work was performed.

## 1. Executive summary

The application is small, coherent, and already uses the App Router, Server Components, strict TypeScript, modular AWS SDK v3, current Sanity schema APIs, and a single persistent `HTMLAudioElement`. Its modernization problem is primarily version support, not architecture.

The most urgent issue is `next@14.2.15`. Next.js 14 is outside the current Next.js support policy, and `14.2.15` is explicitly marked deprecated in this lockfile because it predates required security fixes. The official December 2025 advisory identifies `14.2.35` as the fixed 14.x release for a high-severity App Router denial-of-service vulnerability. This project uses the App Router, so the issue is relevant. Patch Next to `14.2.35` as an isolated emergency checkpoint before any major upgrade.

The second urgent issue is the unsupported toolchain/runtime combination. ESLint 8 is end-of-life, the repository has no completed ESLint configuration, and `next lint` is removed in Next 16. Local Node is `26.1.0`, a Current release, while Vercel and production should use an LTS line. Node 24 LTS is the recommended common runtime. Node 20 is already end-of-life as of 2026-03-24 and should not be selected merely because several packages list it as their minimum.

The recommended end state is Node 24 LTS, Next 16.2.x, exactly matched React/React DOM 19.2.x, `next-sanity` 13.x, Sanity Studio and Vision 6.x, `@sanity/client` compatible 7.x, `@sanity/image-url` compatible 2.x, styled-components 6.1.x, TypeScript 5.9.x, ESLint 10 with flat configuration, and Tailwind 3.4.19/tailwind-merge 2.6.1 retained. TypeScript 6 and Tailwind 4 are separate optional later decisions.

No upgrade should combine unrelated toolchain and visual transitions. However, peer constraints require two coordinated ecosystem checkpoints: Next 15 must move with React, React DOM, and both React type packages; later, Next 16, next-sanity 13, Sanity/Vision 6, styled-components 6.1, and the compatible Sanity client/image packages must move together. The plan below uses nine checkpointed stages, one of which is optional.

## 2. Current stack snapshot

| Area | Current state | Finding |
|---|---|---|
| Runtime | Node `26.1.0`; npm `11.16.0` | Node 26 is Current, not LTS yet. Standardize development and Vercel on Node 24 LTS in a stage separate from the Next security patch. |
| Package manager | npm lockfile v3; no `packageManager` field | npm is authoritative. Do not introduce pnpm/yarn without a separate decision. |
| Framework | Next `14.2.15` App Router | Unsupported major and vulnerable patch. Immediate patch, then staged 15 -> 16. |
| UI runtime | React/React DOM `18.3.1` | Deliberately useful bridge release for React 19 warnings; retain until Next 15 is stable. |
| CMS | Sanity `3.99.0`, Vision `3.99.0`, next-sanity `9.12.3` | Internally aligned and a valid bridge through Next 15 + React 19; final Next 16 target requires next-sanity 13 and Sanity/Vision 6 together. |
| Content client | `@sanity/client` `7.23.0`, image-url `1.2.0` | Client is current; image-url has a v2 migration available. |
| Language | TypeScript `5.9.3`, strict, target ES5 | Compiler is current 5.x. ES5 target is deprecated in TypeScript 6. |
| Lint | ESLint `8.57.1`, eslint-config-next `14.2.15`, no config | ESLint 8 is EOL; standalone lint currently prompts for setup. |
| CSS | Tailwind `3.4.19`, PostCSS `8.5.16`, Autoprefixer `10.5.2` | Current maintained Tailwind 3 LTS line and current PostCSS pipeline. |
| Storage | Private Cloudflare R2 through AWS SDK v3 | Modern modular SDK; server-only boundary is explicit. |
| Deployment | Vercel intended; no `vercel.json` | Runtime is not pinned in-repo. Vercel Node setting is an external unknown. |
| PWA | Metadata description only | No manifest, icons, service worker, or offline shell exists yet. |
| Tests | Build/type checking only; no test framework or CI visible | Establish regression checks before major upgrades. |

Configuration present: `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `sanity.config.ts`, `.env.example`. No `next.config.*`, ESLint configuration, Vercel configuration, `.nvmrc`, `.node-version`, manifest, `public/` directory, or workflow files were found.

## 3. Dependency inventory

“Latest” values are stable releases observed from official npm metadata/docs on the audit date. npm registry access from the local CLI was blocked, and a few npm pages were cached at slightly different publication times. Where that prevented a trustworthy exact number, the table says “verify” rather than inventing precision. Preview, beta, release-candidate, canary, insiders, and TypeScript native-preview builds are not targets.

| Package | Type | Declared | Installed | Latest patch in installed major | Latest stable | Role | Support / deprecation | Peers; Node | Action | Risk and reason |
|---|---|---:|---:|---:|---:|---|---|---|---|---|
| `@aws-sdk/client-s3` | prod | `^3.1085.0` | `3.1085.0` | `3.1085.0` observed | `3.1085.0` observed | R2-compatible S3 client | Supported; not deprecated | No peers; Node `>=20` | retain/patch with paired presigner | Low: modular v3 API is correct; keep AWS packages synchronized. |
| `@aws-sdk/s3-request-presigner` | prod | `^3.1085.0` | `3.1085.0` | `3.1085.0` observed | `3.1085.0` observed | Signed R2 GET URLs | Supported; not deprecated | No peers; Node `>=20` | retain/patch with client | Medium: playback signing is security-critical despite low API churn. |
| `@radix-ui/react-slot` | prod | `^1.1.0` | `1.3.0` | `1.3.0` | `1.3.0` | selective composition primitive | Supported | React 16.8-19; no explicit Node floor | retain | Low: current and React 19-compatible. Confirm it is actually imported before any later removal. |
| `@sanity/client` | prod | `^7.0.0` | `7.23.0` | `7.23.0` | `7.23.0` | Sanity Content Lake client | Supported | No peers; Node `>=20` | retain/patch | Low: current; preserve API version and public dataset behavior. |
| `@sanity/image-url` | prod | `^1.0.0` | `1.2.0` | `1.2.0` | `2.1.1` | Sanity image transformations | v1 works but v2 is current | No relevant peers; installed Node `>=10` | staged major update | Medium: one wrapper file is affected; type the `source` parameter at the same time. |
| `@sanity/vision` | prod | `^3.0.0` | `3.99.0` | `3.99.0` | `6.4.0` | Studio GROQ tool | v3 is old but paired with Studio v3 | React 18/19 and styled-components 6 in installed package | update with `sanity` to matching 6.x in coordinated target | Medium: official Studio plugin must match Studio major. |
| `class-variance-authority` | prod | `^0.7.0` | `0.7.1` | `0.7.1` | `0.7.1` | variant helper | Supported | No peers | investigate usage; retain meanwhile | Low: source search found no direct import; removal requires confirmation after a clean install. |
| `clsx` | prod | `^2.1.0` | `2.1.1` | `2.1.1` | `2.1.1` | conditional class names | Supported | No peers; Node `>=6` | retain | Low: directly used. |
| `lucide-react` | prod | `^0.468.0` | `0.468.0` | `0.468.0` in declared line | `1.8.0` observed | icons | Installed line works; many releases behind | Installed peers React 16.5-19 RC | staged major update/investigate icons | Medium: visual regressions or renamed icons are possible; upgrade separately. |
| `next` | prod | exact `14.2.15` | `14.2.15` | `14.2.35` | `16.2.10` | framework/runtime | 14.x unsupported; installed release deprecated and insecure | Installed peers React/DOM `^18.2`; Node `>=18.17` | patch immediately, then staged 15 and 16 | High: App Router security and broad runtime behavior. |
| `next-sanity` | prod | `^9.0.0` | `9.12.3` | `9.12.3` | `13.1.1` | Sanity/Next client, GROQ, embedded Studio | v9 supports Next 14/15, not Next 16 | Installed peers Next `^14.2 || ^15`, React/DOM 18.3/19, Sanity `^3.99`, styled-components `^6.1`; Node `>=18.18` | retain through Next 15 + React 19 bridge; then coordinate v13 with Next 16 and Sanity 6 | High: v13 requires Next 16, React/DOM `^19.2.3`, Sanity `^5.29 || ^6`, client `^7.23`, styled-components `^6.1`, and modern Node. Never force peers. |
| `react` | prod | `^18.3.1` | `18.3.1` | `18.3.1` | `19.2.7` | UI runtime | 18.3 is the Next 14 preparation bridge; Next 15 App Router minimum is React 19 | Node metadata permissive | upgrade with Next 15, React DOM, and both type packages | High: playback effects and Studio integration require regression tests. |
| `react-dom` | prod | `^18.3.1` | `18.3.1` | `18.3.1` | `19.2.7` | DOM renderer | Same as React | Must exactly match React | upgrade with Next 15/React/types | High: never create a committed Next 15 + React 18 checkpoint. |
| `sanity` | prod | `^3.0.0` | `3.99.0` | `3.99.0` | `6.4.0` | embedded Studio | v3 is a valid next-sanity 9 bridge; v5 requires React 19.2; final v6 is required by the selected target | Installed peers React/DOM 18/19; installed Node `>=18` | retain 3.99 through Next 15, then coordinate directly to verified 6.x with Vision/next-sanity 13 | High: do not use Sanity 4 with next-sanity 13. An intermediate v4 is permitted only if exact peers are re-verified. |
| `tailwind-merge` | prod | `^2.4.0` | `2.6.1` | `2.6.1` | `3.6.0` | Tailwind class conflict resolution | v2.6 is the recommended line for Tailwind 3 | No peers | retain on v2 with Tailwind 3; v3 only with Tailwind 4 | Low now; Medium if coupled to Tailwind 4. |
| `@types/node` | dev | `^20.16.0` | `20.19.43` | `20.19.43` | current matching line: verify at execution | Node types | Supported, but mismatched to intended Node 24 | No peers | update to Node 24 types after runtime pin | Medium: types can expose API differences; do not use Node 26 types for an LTS production target. |
| `@types/react` | dev | `^18.3.3` | `18.3.31` | `18.3.31` | `19.2.x` (verify exact patch) | React types | Supported matching React 18 | No peers | update only with React 19 | High if upgraded alone due breaking type changes. |
| `@types/react-dom` | dev | `^18.3.1` | `18.3.7` | `18.3.7` | `19.2.x` (verify exact patch) | React DOM types | Supported matching React DOM 18 | Peer `@types/react ^18` installed | update only with React 19 | High if upgraded alone. |
| `autoprefixer` | dev | `^10.4.20` | `10.5.2` | `10.5.2` | `10.5.2` | PostCSS prefixing | Supported | PostCSS `^8.1`; Node `^10 || ^12 || >=14` | retain with Tailwind 3; remove only in optional Tailwind 4 stage | Low. |
| `eslint` | dev | `^8.57.0` | `8.57.1` | `8.57.1` | `10.6.0` | lint engine | v8 EOL since 2024-10-05; package marked deprecated | ESLint 10 requires Node `^20.19 || ^22.13 || >=24` | staged major to 10 after flat config preparation | Medium: new recommended rules may surface debt; avoid bulk formatting. |
| `eslint-config-next` | dev | exact `14.2.15` | `14.2.15` | `14.2.35` | `16.2.10` | Next/React lint rules | Must track Next major; installed version old | Installed supports ESLint 7/8 and TS >=3.3 | update with each Next stage | Medium: Next 16 uses ESLint CLI/flat config. |
| `postcss` | dev | `^8.4.49` | `8.5.16` | `8.5.16` | `8.5.16` | CSS transformation | Supported | Node `^10 || ^12 || >=14` | retain | Low. |
| `tailwindcss` | dev | `^3.4.13` | `3.4.19` | `3.4.19` | `4.3.2`; v3 LTS `3.4.19` | utility CSS compiler | 3.4.19 is maintained `v3-lts` | Installed Node `>=14` | retain; optional isolated v4 migration | High visual risk for v4 despite supported status. |
| `typescript` | dev | `^5.7.3` | `5.9.3` | `5.9.3` | `7.0.2`; stable 6.0 also available | type checker | 5.9 supported; ES5 target becomes deprecated in TS6 | Installed Node `>=14.17` | retain 5.9 through framework work; evaluate 6 later; do not target 7 yet | Medium: TS6 flags ES5; TS7 is a new native compiler generation and unnecessary now. |

Direct dependency usage findings:

- Confirmed direct imports: AWS S3 packages, `@sanity/image-url`, Vision, `clsx`, `lucide-react`, `next-sanity`, `react`, `sanity`, and `tailwind-merge`.
- `@sanity/client` is not imported directly, but it is an explicit peer of `next-sanity` and therefore appropriate as a direct dependency.
- `@radix-ui/react-slot` and `class-variance-authority` were not found in source imports. They may be remnants of selective shadcn setup. Investigate on a dedicated cleanup branch; do not remove during framework upgrades.
- `postcss`, Tailwind, and Autoprefixer are configuration/build dependencies, not source imports.

## 4. Runtime and platform findings

### Runtime standardization

- Local Node: `26.1.0`; npm: `11.16.0`.
- Node 26 is Current until October 2026, not LTS on the audit date. Production applications should use Active or Maintenance LTS.
- Node 24 is Active LTS, supported through April 2028, supported by Next 16, ESLint 10, Sanity 4+, the AWS SDK, and Vercel. It is the best common baseline.
- Node 22 remains LTS but has a shorter remaining runway. Node 20 is EOL and must not be the target.
- Vercel supports Node 24 for builds/functions and uses 24 for new projects. Existing project settings remain an external unknown.

Recommended future pins (not performed):

- `.nvmrc`: `24`
- `.node-version`: `24`
- `package.json`: `"engines": { "node": "24.x", "npm": "11.x" }`
- optional `packageManager`: exact npm version after the team chooses whether Corepack/package-manager enforcement is desired
- Vercel Project Settings: Node `24.x`

All four should agree. Treat the Vercel setting as authoritative deployment configuration and verify it explicitly.

### Lockfile and package-manager consistency

`package-lock.json` uses lockfile version 3 and records npm-style package layout. No yarn or pnpm lockfile exists. Use `npm ci` for reproducible CI and deployment validation. Do not migrate package managers during modernization.

The current local `node_modules` reports three extraneous nested scope directories (`@aws-sdk/@aws-sdk`, `@radix-ui/@radix-ui`, `@sanity/@sanity`). They are not represented in Git or the lockfile and are local-install contamination, not project dependencies. A future baseline stage should validate from a clean `npm ci` workspace rather than treating this local tree as authoritative.

### Browser baseline

Next 16 officially targets Chrome/Edge 111+, Firefox 111+, and Safari 16.4+. Tailwind 4 officially targets Chrome 111+, Safari 16.4+, and Firefox 128+. If TKP must support older iPhones/iPads, retain Tailwind 3.4 even after Next 16.

## 5. Compatibility matrix

| Combination | Officially compatible | Audit recommendation |
|---|---|---|
| Node 24 + Next 14.2.35 | Yes by Next minimum, though Next 14 itself is unsupported | Emergency-only bridge; do not remain here. |
| Node 24 + Next 15 + React/DOM 19 | Yes; Next 15 App Router minimum is React 19 | Use as the intermediate framework stage, upgrading both runtimes and both React type packages together. |
| Node 24 + Next 16.2.x | Yes; Next requires Node >=20.9 | Recommended target. |
| Next 14 + React 18.3 | Yes | Current bridge after security patch. |
| Next 15 + React 18.3 | **No for this App Router application**; React 18 compatibility is Pages Router-only | Never create this checkpoint. React 18.3 remains only while preparing on Next 14. |
| Next 15 + exactly matched React/DOM 19 + matching types | Yes | Required intermediate checkpoint. |
| Next 16 + React 19.2 | Yes and expected | Recommended target. Do not adopt React canary directly. |
| next-sanity 9 + Next 14/15 + React 18.3/19 + Sanity 3.99 | Matches installed peers | Current bridge only. |
| next-sanity 13 + Next 16.2 + React/DOM >=19.2.3 + Sanity 6 + client >=7.23 + styled-components 6.1 | Matches official v13 peers | Recommended coordinated target. This app does not use SanityLive, so the known live-prefetch overage issue is not currently reachable. |
| Sanity 3.99 + React 18/19 | Supported | Safe bridge. |
| Sanity 4 + React 18/19 + Node >=20.19 | Sanity itself supports this, but compatibility with any chosen next-sanity bridge must be verified separately | Do not pair with next-sanity 13. Use only if an exact intermediate next-sanity peer set is verified at execution. |
| Sanity 5 >=5.29 or Sanity 6 + React >=19.2.3 | Compatible with next-sanity 13; Sanity 5 makes React 19.2 its baseline | Select Sanity 6 for the final coordinated target. |
| Next 16 + TypeScript 5.9 | Yes; minimum TS 5.1 | Recommended during framework migration. |
| Next 16 + TypeScript 6 | Needs project and ecosystem validation | Later optional language stage. Change ES5 target first. |
| ESLint 8 + eslint-config-next 14 | Compatible but ESLint 8 EOL | Temporary only. |
| ESLint 10 + Next 16 flat config | Intended modern configuration | Recommended after Next 16; Node 24 satisfies runtime floor. |
| Tailwind 3.4 + tailwind-merge 2.6 + PostCSS 8 + Autoprefixer 10 | Yes | Recommended conservative target. |
| Tailwind 4.3 + tailwind-merge 3.6 + `@tailwindcss/postcss` | Yes | Optional isolated migration. Remove Autoprefixer only then. |

### Exact next-sanity stable-major peer matrix

Package manifests are authoritative. `catalog:` placeholders in repository tags were resolved only where the installed lockfile or a published manifest supplied the concrete range. Exact published metadata for stable majors 10–12 could not be retrieved under the audit’s network restrictions; those rows are deliberately unknown and are not used as bridges.

| next-sanity major (examined version) | Next | React / React DOM | Sanity | `@sanity/client` | styled-components | Node | Compatibility conclusion |
|---|---|---|---|---|---|---|---|
| 9 (`9.12.3`) | `^14.2 || ^15.0.0-0` | `^18.3 || ^19.0.0-0` | `^3.99.0` | `^7.6.0` | `^6.1` | `>=18.18` | Next 14/15; React 18.3/19; Sanity 3 only. Rejects Next 16 and Sanity 4/5/6. This is the verified Next 15 + React 19 bridge. |
| 10 | **Unknown** | **Unknown** | **Unknown** | **Unknown** | **Unknown** | **Unknown** | Do not infer compatibility or use as a planned bridge until the exact stable manifest is retrieved. |
| 11 | **Unknown** | **Unknown** | **Unknown** | **Unknown** | **Unknown** | **Unknown** | Same. |
| 12 | **Unknown** | **Unknown** | **Unknown** | **Unknown** | **Unknown** | **Unknown** | Same. |
| 13 (`13.1.1`) | `^16.0.0-0` | `^19.2.3` | `^5.29.0 || ^6.0.0` | `^7.23.0` | `^6.1` | `>=20.19 <22 || >=22.12` | Next 16 only; React/DOM 19.2.3+; Sanity 5.29+ or 6. The selected final combination uses Sanity 6. |

Coverage against requested versions:

- Next 14: verified only with next-sanity 9.
- Next 15: verified only with next-sanity 9; for this App Router project it must use React 19.
- Next 16: verified with next-sanity 13; v9 rejects it; 10–12 unknown.
- React 18.3: verified only with next-sanity 9 and only while on Next 14 in this plan.
- React 19.2: accepted by next-sanity 9 and required at >=19.2.3 by v13.
- Sanity 3: verified with v9. Sanity 4/5/6 are rejected by v9’s `^3.99.0` peer.
- Sanity 4: no verified next-sanity bridge in this audit; never pair it with v13.
- Sanity 5.29+ and 6: verified with v13; final target selects 6.

Unsafe independent upgrades:

- React without React DOM and both type packages.
- Next without `eslint-config-next`, route-prop migration, and `next-sanity` peer validation.
- `next-sanity` without checking Next, React, Sanity, `@sanity/client`, and styled-components peers.
- Sanity without Vision and official Studio plugin compatibility.
- Tailwind without PostCSS plugin/config/import changes and `tailwind-merge`.
- ESLint without a flat configuration and replacing the `next lint` script.

## 6. Next.js findings

### Affected files

| File | Pattern | Why affected | Stage | Expected migration | Risk |
|---|---|---|---|---|---|
| `src/app/player/beats/[slug]/page.tsx` | `type Props = { params: { slug: string } }`; synchronous `params.slug` in page and `generateMetadata` | Next 15 makes route props asynchronous with temporary compatibility; Next 16 removes synchronous access | Stage 2 before Next 15/16 | Type `params` as `Promise<{slug:string}>`; `const {slug}=await params` in both functions | Medium: incorrect change can break Beat File rendering/404/metadata. |
| `package.json` | `"lint": "next lint"` | `next lint` is removed in Next 16; Next 16 builds no longer lint | Stage 2/7 | Replace with ESLint CLI only after flat config exists | Medium. |
| `src/sanity/lib/content.ts` | detects internal digest string `DYNAMIC_SERVER_USAGE` | Internal Next error identifiers are fragile across cache/dynamic rendering changes | Stage 2/3 | Re-test on Next 15; prefer an official error helper/pattern if available in target, or narrow fallback behavior without swallowing framework control-flow errors | High because swallowed control flow can alter rendering/caching. |
| `src/sanity/lib/content.ts` and all server pages | `sanityClient.fetch(...,{cache:'no-store'})` | Next 15 changes fetch and GET Route Handler caching defaults; this code explicitly opts out | Stage 3 | Preserve `no-store`; verify Recently Added and homepage remain server-fresh | Low/Medium. |
| `src/app/api/playback/route.ts` | POST route, `dynamic='force-dynamic'`, no-store response | Route behavior is already explicit; security-sensitive | Every framework stage | No conceptual migration; contract tests required | High regression impact, low expected code churn. |
| `src/app/api/playback-history/resolve/route.ts` | POST route, dynamic/no-store | Same | Every framework stage | Preserve request validation, filtering, order, and no-store headers | High regression impact. |
| `src/app/(site)/studio/[[...index]]/page.tsx` | `dynamic(...,{ssr:false})`; re-export Studio metadata/viewport | Dependent on next-sanity’s embedded Studio API and Next client/server boundaries | next-sanity stage | Follow each next-sanity migration guide; preserve route and Studio isolation | High. |
| `src/app/layout.tsx` | root provider wraps public app and Studio, while AppShell branches by path | React/Next remount behavior can affect persistent Audio; Studio remains under provider even though shell UI is bypassed | Every framework stage | Do not restructure during upgrade; verify route navigation does not remount provider/audio | High. |
| `src/app/globals.css` | global scroll behavior and `:has(.public-app-shell)` | Next 16 changes smooth-scroll override only if global smooth scrolling exists; it does not here | Stage 5 | No required change; verify navigation and Studio scrollbar | Low. |

No uses were found of `cookies()`, `headers()`, `draftMode()`, middleware, `serverRuntimeConfig`, `publicRuntimeConfig`, AMP, legacy Pages Router APIs, `next/image` configuration, experimental PPR, or webpack customization. No `next.config.*` exists. Turbopack-by-default in Next 16 should therefore be low configuration risk, but CSS output and Studio bundling still require build/browser validation.

Next 15 changes default caching of `fetch` and GET Route Handlers. TKP’s important reads explicitly use `cache: 'no-store'`, and both API handlers are POST, so behavior should remain stable. Do not opportunistically enable Cache Components, React Compiler, SanityLive, or other experimental/optional features during the framework upgrade.

## 7. React findings

No removed React 19 APIs were found: no `ReactDOM.render`, `hydrate`, string refs, `createFactory`, module-pattern components, `findDOMNode`, or `react-dom/test-utils`. Next already supplies the modern JSX transform.

Project-specific considerations:

- `PlayerProvider` creates one `Audio` object inside a mount effect and performs complete cleanup. React Strict Mode development remount checks can create/tear down a development-only first instance, but only one live instance should remain. This must be tested rather than “modernized” into a rewrite.
- The provider effect depends on memoized `loadIndex` and `saveCurrentHistory`. React 19 does not require changing this architecture. Watch for accidental provider remounts across App Router transitions.
- Media Session usage is fully feature-detected and action registration is wrapped in `try/catch`; this is sound.
- `pagehide` is stable and bfcache-compatible but unreliable for mobile app termination. Periodic/pause/seek writes already reduce dependence on it. Adding `visibilitychange` may be considered later, separately from framework migration.
- Playback history guards server rendering with `typeof window`, validates parsed data, and catches storage failures. This is hydration-safe.
- Listening Mode uses document-level keyboard handling plus `inert`/`aria-hidden` on the normal page. React 19 type changes and focus timing should be verified. The fixed layer’s focus containment is lightweight and should not be replaced merely for modernization.
- No portals exist. No custom form actions exist. No direct DOM mutation beyond focus and browser APIs exists.
- `requestAnimationFrame` focus restoration in Now Playing should be regression-tested under React 19 concurrent scheduling.

Recommended React transition: keep `18.3.1` only while preparing code on Next 14 and resolve all warnings there. Then upgrade Next 15, exactly matching React and React DOM 19, `@types/react` 19, and `@types/react-dom` 19 in one checkpoint. Do not commit or force-install Next 15 with React 18, and do not introduce the React Compiler at the same time.

## 8. Sanity findings

The Studio is embedded conventionally at `/studio` through `NextStudio`, with `ssr:false`, and exports the package’s metadata/viewport. Schemas use modern `defineType`/`defineField` patterns (inspection found no legacy v2 schema APIs). `structureTool()` and `visionTool()` are current APIs for the installed Studio.

Findings:

- `sanity@3.99.0`, `@sanity/vision@3.99.0`, and next-sanity’s installed peer requirements align.
- Sanity v4’s principal breaking requirement is Node >=20.19; Node 24 satisfies it. However, next-sanity 13 rejects Sanity 4, so v4 is not part of the selected final combination and may be used only if an exact intermediate next-sanity manifest is verified first.
- Sanity v5 requires React 19.2; Sanity recommends 19.2.3 or later. The selected final target uses Sanity 6, which is accepted by next-sanity 13.
- Current `next-sanity@9` does not support Next 16 but does provide a verified Next 15 + React 19 + Sanity 3.99 bridge. `next-sanity@13` is the verified Next 16 line and requires Sanity >=5.29 or 6. Because exact stable v10–v12 peers were unavailable, the plan does not invent an intermediate bridge.
- Moving from v9/Sanity 3.99 to v13/Sanity 6 requires reviewing every official migration guide (9->10->11->12->13 and Sanity per-major notes) even though dependency peer validity requires one coordinated target checkpoint.
- The app uses `createClient`, `groq`, and embedded Studio, but not `defineLive`, `<SanityLive>`, Visual Editing, Draft Mode, or Presentation Tool. Therefore the documented Next 16/SanityLive request amplification is not currently reachable. Do not add live content as part of modernization.
- `useCdn:false` and `cache:'no-store'` are deliberate freshness choices. Preserve them unless product caching is separately approved.
- Preserve project ID, dataset `tkp-v2`, API version, public dataset model, queries, publication semantics, `/studio`, and schema definitions.
- `.env.example` specifies API version `2026-07-10`, while the client fallback is `2024-01-01`. The deployed value should be verified. Do not casually advance API version; pinning a date is correct practice.
- `urlFor(source: any)` is the only explicit `any`; use the exported Sanity image source type when `@sanity/image-url` v2 is adopted.
- PostCSS CommonJS does not imply Sanity ESM trouble. `sanity.config.ts` is ESM-style. Future ESM-only plugin requirements should be reviewed per plugin.

## 9. TypeScript findings

Current compiler: `5.9.3`. Configuration is strict, no-emit, bundler resolution, ESNext modules, preserved JSX, isolated modules, incremental compilation, Next plugin, and `@/*` path alias. These are appropriate for Next.

| Finding | Classification | Recommendation |
|---|---|---|
| `target: "es5"` | Required before TypeScript 6 | Move to at least ES2017/ES2020, ideally aligned with Next 16 browser output; TypeScript 6 deprecates ES5 and TS7 removes legacy assumptions. Test older target requirements separately. |
| `allowJs: true` with only `postcss.config.js` JavaScript | Optional cleanup | Keep until config modernization; not harmful. Do not mix with framework stage. |
| `skipLibCheck: true` | Optional cleanup / migration aid | Keep during ecosystem major upgrades; consider disabling only after dependencies stabilize. |
| `strict: true` | Retain | Strong baseline. |
| `moduleResolution: "bundler"`, `module:"esnext"` | Retain | Correct for Next bundling and modern packages. |
| `lib: dom, dom.iterable, esnext` | Retain | Required for browser/player APIs. |
| `src/sanity/lib/image.ts: source:any` | Recommended type-safety | Replace with Sanity image source type during image-url v2 stage. |
| resolver request body cast to `unknown[]` | Recommended type-safety | Add a small type guard/schema-free validator in a later hardening stage, not framework migration. |
| no `@ts-ignore`/`@ts-expect-error` found | Retain | Good. |
| no notable non-null assertions found | Retain | Good. |

Safest route: remain on TypeScript 5.9 through Next/React/Sanity modernization. Prepare the target change, then optionally adopt TypeScript 6 in its own branch. TypeScript 7.0.2 is stable on the audit date, but it is a native compiler generation with no project need; do not target it until Next, Sanity, and ESLint officially validate the desired combination. No TypeScript preview should be used.

## 10. ESLint findings

The project has ESLint `8.57.1` and eslint-config-next `14.2.15`, but no ESLint configuration. `npm run lint` therefore launches Next’s interactive initializer instead of providing a reproducible check. ESLint 8 is EOL. Next 16 removes `next lint`, and `next build` no longer runs lint.

Future setup:

1. On Node 24, add `eslint.config.mjs` using ESLint flat config.
2. Match `eslint-config-next` to Next 16 and use the documented flat-config export.
3. Change `lint` to `eslint .` and add a non-writing CI command; do not use `--fix` in baseline runs.
4. Start with correctness and Next Core Web Vitals rules. Record baseline findings before enforcing new warnings as errors.

Rule groups:

- Correctness: ESLint recommended, no unreachable code, no accidental globals, hook correctness, exhaustive dependencies reviewed carefully around audio effects.
- Accessibility: JSX accessibility rules supplied through the Next stack; prioritize names, focus, keyboard access, images, and semantic controls.
- React: hooks and React compiler-independent correctness only. Do not require stylistic component rewrites.
- Next: Core Web Vitals and App Router rules, including image/link guidance assessed case-by-case because Sanity image URLs are intentional.
- Stylistic: minimal. Do not introduce Prettier or formatting rules as part of this audit plan. Preserve existing compact files until explicitly reformatted.

ESLint 10 is recommended after Next 16 because it is current and Node 24-compatible. ESLint 9 is a valid short-lived bridge if eslint-config-next compatibility blocks 10, but should not become a separate long-term target.

## 11. Tailwind and CSS findings

Current setup is internally consistent:

- Tailwind 3.4.19 (`v3-lts`) scans `src/**/*.{js,ts,jsx,tsx,mdx}`.
- A TypeScript config extends semantic colors and compatibility aliases.
- Global CSS uses `@tailwind base/components/utilities`, semantic CSS variables, `@layer components`, safe-area variables, reduced-motion rules, range-input focus treatment, and scoped public scrollbar hiding through `:has()`.
- PostCSS uses CommonJS with `tailwindcss` and `autoprefixer` plugins.
- No third-party Tailwind plugins are configured.
- No removed v4 utilities identified by the official list were found in the source scan, but shadow/blur scale semantics and transition behavior require visual comparison.

### Conservative option: stay on Tailwind 3

Retain Tailwind `3.4.19`, PostCSS `8.5.16`, Autoprefixer `10.5.2`, and tailwind-merge `2.6.1`. This line is explicitly tagged `v3-lts` and supports a wider browser range. Effort: negligible. Visual regression risk: low. This is recommended.

### Optional Tailwind 4 migration

Target Tailwind `4.3.x`, `@tailwindcss/postcss` matching that release, PostCSS 8.5.x, and tailwind-merge 3.6.x. Expected work:

- replace PostCSS `tailwindcss` plugin with `@tailwindcss/postcss`;
- remove Autoprefixer because Tailwind 4 handles imports/prefixing;
- replace three `@tailwind` directives with `@import "tailwindcss"`;
- migrate or explicitly load the TypeScript/JavaScript configuration, preferably translating tokens to CSS-first configuration;
- preserve all existing semantic CSS variables and Phase 0 aliases;
- compare Preflight, focus rings, buttons, shadows, blur, transitions, arbitrary values, safe areas, range inputs, Studio isolation, and every responsive page;
- confirm the product accepts Safari 16.4+/Firefox 128+ as the styling baseline.

Effort: medium (roughly one focused branch plus visual review). Visual regression risk: high because the application’s identity relies on exact glow, blur, shadow, typography, and control treatment. Tailwind 4’s performance benefits do not currently outweigh that risk.

## 12. Security and dependency health

`npm audit --json` was attempted read-only and failed because the sandbox could not reach the npm audit endpoint. No fix command was run. Therefore a complete transitive vulnerability count is an unknown and must be rerun in an approved networked CI/workstation.

Confirmed issue:

| Severity | Package | Direct/transitive | Reachability | Safe fix | Stage |
|---|---|---|---|---|---|
| High DoS; related medium source exposure advisory family | `next@14.2.15` | Direct | App Router is used. The 14.x table specifically identifies DoS exposure and fixes it in 14.2.35. Server Functions/source exposure applicability is narrower because this app has no Server Actions, but patching is mandatory. | Upgrade to `14.2.35`; no workaround | Emergency Stage 1 |
| Unsupported/EOL toolchain, not itself a CVE | `eslint@8.57.1` | Direct dev | Development/CI only | Flat config + current ESLint | Stage 7 |

The lockfile’s Next entry and ESLint entry are explicitly marked deprecated. No other direct package carries a `deprecated` field in the lock metadata.

Health observations:

- AWS SDK v3 is the correct maintained SDK; the deprecated monolithic AWS SDK v2 is not present.
- No abandoned direct runtime package was identified.
- Sanity and next-sanity are actively maintained but significantly behind current majors.
- Next and Sanity dominate install size; both are required. Vision is Studio-only but intentionally configured.
- No package can be safely replaced by a Node built-in without removing required functionality.
- Before each upgrade branch, run a clean `npm ci`, `npm audit --omit=dev --json`, and full `npm audit --json`; distinguish production reachability from development-only tooling findings.
- Do not remove Radix Slot or CVA until a clean source/import and component-generation audit confirms they are unused.

## 13. PWA and browser findings

| Capability/API | Current state | Classification | Recommendation |
|---|---|---|---|
| Web app manifest | Absent | Required product gap | Add only in a later PWA feature phase, not modernization. |
| Install icons | No `public/` icons found | Required product gap | Create approved assets later; do not generate during dependency work. |
| Viewport/theme color | Default Next viewport; Studio exports its own | Stable but incomplete | Add explicit public viewport/theme metadata in PWA phase; preserve Studio metadata. |
| Service worker/offline shell | Absent | Required MVP gap | Implement basic shell later without offline audio and without forcing a PWA library. |
| `HTMLAudioElement` | One shared programmatic element | Stable/broad | Preserve architecture. Autoplay remains user initiated. |
| Media Session | Feature-detected metadata/actions | Limited availability as a full API | Keep graceful fallback; test Chrome/Android and Safari/iOS behavior. |
| localStorage | Guarded/caught, per-browser history | Stable/broad | Keep; test private/storage-disabled modes. |
| `pagehide` | Used to save history | Stable/broad but unreliable on mobile termination | Keep as secondary signal; periodic writes already protect data. Consider `visibilitychange` later. |
| `inert` | Used for Listening Mode background | Baseline widely available since 2023 | Keep; test assistive technology and older embedded webviews if supported. |
| CSS `:has()` | Public-shell scrollbar scope | Broad in target modern browsers | Keep; on older browsers only scrollbar hiding is lost, a safe degradation. |
| safe-area `env()` | Bottom nav/listening mode | Stable on modern mobile browsers | Keep and test installed iOS PWA. |
| reduced motion | Global media query plus listening fallback | Stable | Preserve. |

## 14. Project-specific regression risks

| System | Likely upgrade risk / packages | Required tests after relevant stage | Rollback point |
|---|---|---|---|
| Private R2 signed playback | AWS SDK/Node/Next route runtime; credential and URL leakage risk | POST main/context requests, 15-minute expiry metadata, invalid key rejection, no secret/client exposure | AWS/Next stage commit |
| Playback API | Next route semantics and Sanity client | valid main/context, draft/contextOnly rejection, 400/404/503 mapping, no-store headers | each Next stage tag |
| Shared `HTMLAudioElement` / PlayerProvider | React effect lifecycle, provider remount, Next navigation | assert one Audio instance, uninterrupted route navigation, cleanup only on root unmount | React-stage commit |
| Main Beat playback | Next/React/AWS/Sanity | play/pause/seek/previous/next, artwork/lane fallback | each framework stage |
| Context playback and NSFW locking | Same plus local approval logic | warning per item, approval isolation, parent artwork/title, no main insertion into context queue | each framework/Sanity stage |
| Queue contexts/manual order | React state and GROQ projections | Main Library, release, context queues; release order unchanged | Next/Sanity stage commit |
| Shuffle/repeat/completion | React reducer/effects | all modes, last-track behavior, Replay Queue/Shuffle Again | React-stage commit |
| History/Continue Listening | React effects, localStorage, resolver route | progress threshold, pause/seek/pagehide writes, resume position, complete filtering, clear | React/Next-stage commit |
| Media Session | React effect cleanup/browser API | metadata for main/context, play/pause/seek/stop handlers, no stale handlers | React-stage commit |
| MiniPlayer persistence | App Router/React root lifecycle | remains through navigation, hidden on Now Playing, no duplicate player | Next/React-stage commit |
| Now Playing | React/types/CSS | identity, controls, queue, progress, error/completion | React/Tailwind stage |
| Listening Mode | React focus timing, `inert`, CSS | entry disabled empty, Escape, focus return, playback uninterrupted, reduced motion | React/Tailwind stage |
| Embedded Studio | Next/React/next-sanity/Sanity | `/studio` loads, edits/publishes, public shell/nav absent, schemas intact | next-sanity/Sanity commit |
| Server Recently Added | Next fetch/cache + GROQ | newest published playable order and freshness | Next/Sanity commit |
| Beat File routes | async params + metadata | valid slug, draft/contextOnly 404, Context visibility, metadata | Next 15 preparation commit |
| Public scrollbar | Tailwind/CSS/browser | public scrollbar hidden as intended, Studio scrollbar available | Tailwind/Next stage |
| Responsive layouts | React/Tailwind/Preflight | 320/360/390/430 widths, landscape, desktop; safe areas and touch targets | every UI-affecting stage |
| Vercel deployment | Node/Next/Sanity/AWS env | preview build, server functions, Studio, R2 playback with production-like env | every required stage’s preview deployment |

## 15. Staged upgrade plan

### Stage 0 — Minimal baseline record

- Branch: `modernize/00-minimal-baseline`
- Packages: none.
- Recorded result: TypeScript validation and the production build pass on the current source; standalone `next lint` is not reproducible because it opens the initial configuration prompt.
- Changes: record the current type-check/build results and the five-step visible playback test in Section 16. Do not delay the security patch for a large test framework or broad CI project.
- Must not change: schemas, queries, queue semantics, UI, audio lifecycle, R2 contract.
- Automated: `npx tsc --noEmit`; `npm run build`; record that standalone lint is not reproducible until configured.
- Manual: run the five-step script in Section 16.
- Rollback: baseline tag before any dependency change.
- Risk: Low. Required.

### Stage 1 — Isolated Next 14 security patch

- Branch: `modernize/01-next14-security`
- Packages: change only Next `14.2.15` -> `14.2.35` and eslint-config-next `14.2.15` -> `14.2.35` if required to keep them matched; accept only lockfile changes from that exact update.
- Runtime/config: no changes.
- Changes: no Node, React, Sanity, next-sanity, AWS SDK, ESLint-major, TypeScript, source, or UI changes.
- Must not change: request payloads, signing TTL, queries, UI.
- Automated: clean dependency resolution, typecheck, build, read-only audits, and available route/security checks.
- Manual: run the five-step script.
- Rollback: Stage 0 tag and Vercel deployment.
- Risk: Medium and urgent. Required immediately.

### Stage 2 — Node 24 runtime standardization

- Branch: `modernize/02-node24`
- Packages: matching `@types/node` 24.x only; no application-framework updates.
- Changes: local Node 24, `.nvmrc` and/or `.node-version`, package engines, Vercel Node 24 setting, and clean npm install verification.
- Must not change: Next, React, Sanity, next-sanity, AWS SDK, or application code.
- Automated: verify `node --version` and `npm --version`; clean `npm ci`; `npm ls`; typecheck; build; read-only audits.
- Manual: run the five-step script.
- Rollback: Stage 1 checkpoint plus the previous Vercel runtime selection.
- Risk: Medium. Required.

### Stage 3 — Prepare async Next APIs while still on Next 14

- Branch: `modernize/03-next-async-prep`
- Packages: none.
- Changes: make Beat File page and metadata `params` promise-based/awaited; investigate replacing fragile `DYNAMIC_SERVER_USAGE` digest matching with the official target-version control-flow rethrow mechanism when available; preserve explicit `no-store` fetching.
- Must not change: slug/404 semantics, metadata content, fallback behavior, query freshness.
- Automated: typecheck, build, valid/missing/draft/contextOnly route tests.
- Manual: open published Beat File; open nonexistent slug and confirm 404; open Player; play Context; open Studio.
- Rollback: Stage 2 checkpoint.
- Risk: Medium. Required.

### Stage 4 — Coordinated Next 15 and React 19 checkpoint

- Branch: `modernize/04-next15-react19`
- Packages: latest supported stable Next 15 maintenance patch at execution; matching eslint-config-next 15; exactly matched React and React DOM 19.2.x; matching `@types/react` 19 and `@types/react-dom` 19. Retain next-sanity `9.12.3`, Sanity/Vision `3.99.0`, compatible client 7.x, and styled-components 6.1.x.
- Why coordinated: Next 15 App Router requires React/DOM 19. next-sanity 9 officially accepts Next 15, React 19, and Sanity 3.99, making this the verified bridge. Never use force or legacy-peer flags.
- Changes: React 19 type/behavior fixes and Next 15 caching validation only; no Cache Components or compiler.
- Must not change: no-store intent, routes, payloads, PlayerProvider architecture, single Audio, queue/history/Media Session, schemas, or queries.
- Automated: clean install, peer check (`npm ls`), typecheck, build, tests, audits.
- Manual: Home newest content; Beat File metadata/404; playback across navigation; history resume; Studio.
- Rollback: Stage 3 checkpoint/deployment.
- Risk: High. Required as a controlled intermediate.

### Stage 5 — Coordinated Next 16 / next-sanity 13 / Sanity 6 ecosystem target

- Branch: `modernize/05-next16-sanity6`
- Packages: Next `16.2.x`; matching eslint-config-next 16; exactly matched React/DOM `19.2.x` at >=19.2.3; next-sanity `13.x`; matching Sanity/Vision `6.x`; `@sanity/client` compatible 7.x at >=7.23; `@sanity/image-url` compatible 2.x; styled-components compatible 6.1.x. Keep TypeScript 5.9 and Tailwind 3.4.19.
- Why coordinated: next-sanity 9 rejects Next 16 and Sanity 6; next-sanity 13 requires Next 16 and rejects Sanity below 5.29. Exact v10–v12 bridges are unknown, so splitting this checkpoint would knowingly create invalid peers.
- Changes: review every intermediate next-sanity and Sanity migration guide; migrate embedded Studio only as required; update image typing; remove `next lint`; validate Turbopack. Do not add Cache Components, SanityLive, Visual Editing, React Compiler, or experimental flags.
- Must not change: project ID, dataset, API version, schemas/content, publication, GROQ results, `/studio`, caching intent, or playback/R2 APIs.
- Automated: `npm ci`, `npm ls`, typecheck, `next build`, separate ESLint when configured, audits, route tests.
- Manual: Home; Beat File/404; full playback/navigation; responsive Now Playing/Listening Mode; Studio.
- Rollback: Stage 4 checkpoint/deployment; do not deploy schemas in this stage.
- Risk: High. Required.

### Stage 6 — ESLint and TypeScript configuration modernization

- Branch: `modernize/06-lint-types-config`
- Packages: retain TypeScript `5.9.x`; ESLint `10.6.x`; matching eslint-config-next 16.2.x and required flat-config dependencies.
- Changes: flat config, `eslint .` script, minimal correctness/a11y/React/Next rules; move TS target from ES5 to a modern target. A separate sub-branch may evaluate TypeScript 6 stable only after all checks pass.
- Must not change: formatting wholesale or application behavior.
- Automated: `tsc --noEmit`, `eslint . --max-warnings=0` only after baseline triage, build, tests.
- Manual: Home; Player; Beat File; Listening Mode; Studio.
- Rollback: Stage 5 checkpoint.
- Risk: Medium. ESLint modernization required; TypeScript 6 optional/later.

### Stage 7 — Optional Tailwind 4

- Branch: `modernize/07-tailwind4`
- Packages: Tailwind `4.3.x`, matching `@tailwindcss/postcss`, tailwind-merge `3.6.x`, PostCSS `8.5.x`; remove Autoprefixer only after equivalent output is verified.
- Changes: CSS import/config/PostCSS migration and only required utility adjustments.
- Must not change: tokens, palette, typography, spacing, glow, focus, safe areas, scrollbars, reduced motion.
- Automated: build, CSS warnings check, visual snapshots at defined viewports, accessibility checks.
- Manual: Home at mobile; Player/Now Playing; Listening Mode/reduced motion; short-height landscape; Studio scrollbar.
- Rollback: Stage 6 checkpoint.
- Risk: High visual risk. Optional and not currently recommended.

### Stage 8 — Security cleanup and deployment validation

- Branch: `modernize/08-security-deploy`
- Packages: only safe patches identified by fresh audits; investigate unused Radix/CVA in a separate commit.
- Changes: no forced fixes; resolve reachable findings individually; confirm Vercel Node 24 and environment configuration.
- Must not change: product scope or protected systems.
- Automated: clean install, production/dev audits, typecheck, lint, tests, build, dependency tree, secret scan.
- Manual: Home; full Main/Context playback; history resume; Listening Mode; Studio publish.
- Rollback: one commit per remediation, Stage 6 if optional Stage 7 was skipped, and prior production deployment.
- Risk: Medium. Required.

## 16. Testing plan

The stage sections above contain the stage-specific commands and at most five checks. The reusable non-developer regression script is:

1. Open `/`. Press Play on Latest Beat. Confirm music starts and the MiniPlayer appears.
2. Press Player in bottom navigation. Confirm music continues without restarting.
3. Open a Beat File with Context. Press a Context play control. Confirm the Context title plays and any NSFW warning applies only to that item.
4. Open Now Playing, then Listening Mode. Press Escape. Confirm Listening Mode closes and music continues at the same position.
5. Open `/studio`. Confirm Studio loads without the public bottom navigation and can display the existing document types.

Codex should additionally automate assertions that cannot be safely confirmed visually: signed URL responses never expose credentials/object keys, route status codes, queue ordering, exact progress persistence, single Audio construction, and build/dependency/audit state.

## 17. Option A, B, and C comparison

### Option A — Minimum safe modernization

- Final stack: Node 24 LTS; Next 15 maintenance LTS; exactly matched React/React DOM 19.2.x and matching React 19 type packages; next-sanity 9.12.3; Sanity/Vision 3.99.0; compatible client 7.x and styled-components 6.1.x; TypeScript 5.9; ESLint 10 flat config; Tailwind 3.4.19. The earlier Next 14.2.35 state is only an unsupported emergency bridge, never the final supported outcome.
- Stages: 6 (Stages 0–4 plus lint/security validation).
- Risk: Medium.
- Benefits: closes known Next vulnerability, replaces EOL runtime/tooling, gains a supported Next line with limited code churn.
- Intentionally unchanged: player architecture, Sanity major, Tailwind, PWA scope, schemas/data.

### Option B — Recommended modernization

- Final stack: Node 24 LTS; Next 16.2.x; exactly matched React/React DOM 19.2.x at >=19.2.3; next-sanity 13.x; matching Sanity/Vision 6.x; `@sanity/client` compatible 7.x at >=7.23; `@sanity/image-url` compatible 2.x; styled-components compatible 6.1.x; TypeScript 5.9.x; ESLint 10 flat config; Tailwind 3.4.19; tailwind-merge 2.6.1.
- Stages: 9 total (0–8), with Tailwind Stage 7 optional.
- Risk: Medium-high, controlled by the combined Next 15/React checkpoint and coordinated final ecosystem checkpoint.
- Benefits: supported framework/runtime/integration stack, modern lint, minimal visual risk, clear rollback points.
- Intentionally unchanged: product architecture, R2/audio/player/history, content model/queries, routes, visual system, no SanityLive or experimental Next features.

### Option C — Maximum modernization

- Final stack: Option B plus TypeScript 6, Tailwind 4.3.x/tailwind-merge 3.6.x, and stricter type/lint cleanup. Sanity 6 is already required by Option B.
- Stages: 10–11 because TypeScript 6 and Tailwind require separate optional checkpoints.
- Risk: High.
- Benefits: newest tooling, CSS performance, longer theoretical runway.
- Intentionally unchanged: schemas/data, playback architecture, route model, PWA product scope.

## 18. Recommended path

Choose Option B. It addresses every actual support/security concern while deferring TypeScript 6 and Tailwind 4. First record the minimal baseline, then apply only the isolated Next 14.2.35 security patch. Standardize Node 24 separately. Prepare async route props on Next 14, move Next 15 and the complete React 19 runtime/type set together while retaining the verified next-sanity 9/Sanity 3.99 bridge, then make the coordinated Next 16.2/next-sanity 13/Sanity 6 ecosystem move. Keep TypeScript 5.9 and Tailwind 3.4.19 throughout framework/CMS migration.

## 19. Unknowns and blockers

- `npm audit --json` could not reach the official audit endpoint, so the full production/dev vulnerability inventory is unavailable.
- Local `npm outdated --json` returned no usable data under restricted network access. Official npm pages/registry metadata were used instead, but some pages were cached hours/days apart; exact patch targets must be re-queried immediately before each branch.
- Vercel’s current project-level Node selection and environment variables are external and were not available.
- There is no CI/test suite, so behavioral confidence currently depends on build/type checks and manual testing.
- Browser support requirements, especially older iOS/Safari, are not explicitly documented. This blocks a responsible Tailwind 4 decision.
- No deployed Sanity Studio/plugin inventory was available beyond this repository.
- The deployed `NEXT_PUBLIC_SANITY_API_VERSION` must be confirmed because `.env.example` and client fallback differ.
- No approved PWA icon assets or service-worker design exist. That is a product phase, not a dependency modernization blocker.
- Latest exact `@types/react`, `@types/react-dom`, and `@types/node` patches should be resolved from official npm metadata at execution time and must match chosen runtime majors.

## 20. Sources

Official primary references used:

- Next.js support policy: https://nextjs.org/support-policy
- Next.js December 2025 security update and fixed versions: https://nextjs.org/blog/security-update-2025-12-11
- Next.js 15 upgrade guide: https://nextjs.org/docs/15/app/guides/upgrading/version-15
- Next.js 15 React 19 minimum (current guide): https://nextjs.org/docs/app/guides/upgrading/version-15#react-19
- Next.js 16 upgrade guide, runtime/browser floors, async APIs, Turbopack, and removals: https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js ESLint configuration/removal history: https://nextjs.org/docs/app/api-reference/config/eslint
- React 19 stable announcement: https://react.dev/blog/2024/12/05/react-19
- React 19 upgrade guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- React stable versions: https://react.dev/versions
- Node release status and LTS schedule: https://nodejs.org/en/about/previous-releases
- Node EOL policy/status: https://nodejs.org/en/about/eol
- Vercel Node 24 builds/functions: https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions
- Sanity Studio installation/runtime requirement: https://www.sanity.io/docs/studio/installation
- Sanity Studio v3-to-v4: https://www.sanity.io/docs/help/v3-to-v4
- Sanity Studio v5 React 19.2 requirement: https://www.sanity.io/blog/sanity-studio-v5
- Sanity React/version compatibility: https://www.sanity.io/docs/help/upgrade-packages
- Sanity v4 announcement: https://www.sanity.io/docs/changelog/8946d096-c4f6-44af-999f-63d0f62e6e2d
- Sanity Next.js integration: https://www.sanity.io/docs/nextjs/introduction
- Sanity Next 16/next-sanity compatibility status: https://www.sanity.io/docs/help/nextjs-16-sanitylive-status
- next-sanity repository and migration guide index: https://github.com/sanity-io/next-sanity
- Published next-sanity 9.12.3 package manifest and peers: https://raw.githubusercontent.com/sanity-io/next-sanity/next-sanity-v9.12.3/packages/next-sanity/package.json
- Published next-sanity 13.1.1 package manifest and peers: https://raw.githubusercontent.com/sanity-io/next-sanity/next-sanity%4013.1.1/packages/next-sanity/package.json
- TypeScript 6 release notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- ESLint version support: https://eslint.org/version-support/
- ESLint 10 migration: https://eslint.org/docs/latest/use/migrate-to-10.0.0
- Tailwind v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Tailwind PostCSS setup: https://tailwindcss.com/docs/installation/using-postcss
- npm package metadata: https://www.npmjs.com/ and https://registry.npmjs.org/
- Media Session support: https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
- `inert` support: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert
- `pagehide` lifecycle notes: https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event

## Audit integrity statement

Only this report was created. No application source, configuration, environment file, dependency manifest, lockfile, schema, query, generated build output, or workflow was changed. No dependency was installed or removed; no codemod, upgrade command, package-manager migration, audit fix, development server, or write-mode formatter was run.
