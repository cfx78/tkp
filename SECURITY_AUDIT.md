# TKP Dependency and Security Audit

Audit date: 2026-07-12  
Branch: `modernize/07-security-audit`  
Scope: Modernization Stage 7A, audit only

## 1. Executive summary

The current dependency tree is valid and the application builds on Node 24.18.0 with Next 16.2.10, React 19.2.7, next-sanity 13.1.1, and Sanity 6.4.0. `npm audit` reports 14 moderate vulnerability nodes and no low, high, or critical nodes. `npm audit --omit=dev` reports the same totals because Next, Sanity, Vision, and next-sanity are production dependencies, even though several vulnerable leaves are exercised only by build, CLI, Studio, or currently unused Visual Editing paths.

The 14 nodes reduce to five underlying advisory/remediation paths: Next's pinned PostCSS, two parser advisories in Sanity CLI's Vercel Frameworks dependency, and two old UUID copies reached through Sanity tooling. No safe parent-package release currently removes these findings. npm's proposed fixes are major downgrades to incompatible historical versions and must not be used. There is no confirmed remotely exploitable application request path in the current TKP source, but the Next/PostCSS build path is the most urgent reachable finding and should be monitored for a patched Next 16 release. The separate direct PostCSS dependency is already on the latest stable release, 8.5.16, is not affected by GHSA-qx2v-qp2m-jg93, and cannot remediate Next's nested copy.

No package was installed, removed, updated, deduplicated, pruned, or fixed during this audit.

## 2. Current dependency snapshot

| Component | Installed | Role |
|---|---:|---|
| Node | 24.18.0 | Runtime/build |
| npm | 11.16.0 | Package manager |
| Next | 16.2.10 | Production framework |
| React / React DOM | 19.2.7 / 19.2.7 | Production UI |
| next-sanity | 13.1.1 | Production Sanity/Next integration and embedded Studio |
| Sanity / Vision | 6.4.0 / 6.4.0 | Embedded Studio and Studio CLI |
| @sanity/client | 7.23.0 | Required next-sanity peer; client API is exposed through next-sanity |
| @sanity/image-url | 2.1.1 | Sanity image URL builder |
| styled-components | 6.4.3 | Required next-sanity/Sanity peer |
| TypeScript | 5.9.3 | Build/type tooling |
| ESLint / eslint-config-next | 9.39.5 / 16.2.10 | Lint tooling |
| Tailwind CSS / tailwind-merge | 3.4.19 / 2.6.1 | CSS build/runtime class composition |

`npm ls` and `npm query ':invalid'` report no invalid packages. `npm query ':extraneous'` reports none.

## 3. Audit totals

| Audit | Info | Low | Moderate | High | Critical | Total |
|---|---:|---:|---:|---:|---:|---:|
| Full tree | 0 | 0 | 14 | 0 | 0 | 14 |
| `--omit=dev` | 0 | 0 | 14 | 0 | 0 | 14 |
| Development-only difference | 0 | 0 | 0 | 0 | 0 | 0 |

The count is npm vulnerability-node count, not 14 distinct advisories. There are five distinct advisory/remediation groups below.

## 4. Production vulnerability findings

### A. Next 16.2.10 pins vulnerable PostCSS 8.4.31

| Field | Detail |
|---|---|
| Identifier | GHSA-qx2v-qp2m-jg93 |
| Severity | Moderate, CVSS 6.1 |
| Dependency path | `tkp -> next@16.2.10 -> postcss@8.4.31` |
| Direct/transitive | Next is direct; PostCSS copy is transitive |
| npm environment | Production |
| Vulnerable range | PostCSS `<8.5.10` |
| First patched version | PostCSS 8.5.10 |
| npm proposed fix | Downgrade Next to 9.3.3 |
| Direct dependency change | Yes, Next |
| Force required | npm reports a semver-major fix; `audit fix --force` would be required |
| Reachability | Build-time reachable; currently not shown reachable from a visitor request |
| Recommendation | Wait for a stable Next 16 release that updates its pinned PostCSS; do not override or downgrade Next without upstream validation |
| Stage / remediation risk | Stage 7C; medium risk because Next and its bundled compiler/CSS stack must remain coordinated |

The advisory concerns unsafe CSS stringification of `</style>`. TKP does not stringify user-supplied CSS in application code. However, this PostCSS copy is part of the production framework build and must not be called harmless merely because it is transitive. The direct PostCSS 8.5.16 used by Tailwind/Autoprefixer is not vulnerable.

### B. Sanity CLI Vercel Frameworks parsers

Dependency path: `tkp -> sanity@6.4.0 -> @sanity/cli@7.7.1 -> @vercel/frameworks@3.29.0`.

| Identifier | Leaf/version | Severity | Vulnerable range | First fully patched version | Reachability |
|---|---|---|---|---|---|
| GHSA-mh29-5h37-fv8m | js-yaml 3.13.1 | Moderate, CVSS 5.3 | `<3.14.2` | 3.14.2 for this advisory | Sanity CLI/build-time only |
| GHSA-h67p-54hq-rp68 | js-yaml 3.13.1 | Moderate, CVSS 5.3 | `<3.15.0` | 3.15.0 across both js-yaml advisories | Sanity CLI/build-time only |
| GHSA-v3rj-xjv7-4jmq | smol-toml 1.5.2 | Moderate, CVSS 5.3 | `<1.6.1` | 1.6.1 | Sanity CLI/build-time only |

npm represents these leaves through `@vercel/frameworks`, `@sanity/cli`, and `sanity` vulnerability nodes. It proposes downgrading Sanity to 5.14.1, a semver-major and peer-incompatible regression from the coordinated Sanity 6 stack. That proposal changes a direct dependency and would require force. Latest Sanity 6.4.0 and CLI 7.7.1 still use the affected path; latest Vercel Frameworks 3.30.6 still declares js-yaml 3.13.1 and smol-toml 1.5.2. Recommended action: monitor for upstream parent releases; do not process untrusted framework configuration or TOML/YAML through this CLI path. Stage 7C, low-to-medium remediation risk once upstream releases are available.

### C. Sanity CLI typeid UUID path

| Field | Detail |
|---|---|
| Identifier | GHSA-w5hq-g745-h8pq |
| Severity | Moderate (advisory CVSS 7.5) |
| Dependency path | `tkp -> sanity@6.4.0 -> @sanity/cli@7.7.1 -> typeid-js@1.2.0 -> uuid@10.0.0` |
| Direct/transitive | Transitive through direct Sanity |
| npm environment | Production classification; CLI/build-time reachability |
| Vulnerable range | UUID `<11.1.1` |
| First patched version | UUID 11.1.1 |
| npm proposed fix | Downgrade Sanity to 5.14.1 |
| Direct dependency / force | Changes direct Sanity across a major; force would be required |
| Likely reachability | Build/Studio CLI only; vulnerable buffer-output variants are not called by TKP source |
| Recommendation | Await Sanity CLI/typeid-js parent update; do not override UUID across typeid-js without upstream compatibility evidence |
| Stage / risk | Stage 7C; medium remediation risk |

### D. next-sanity preview UUID path

| Field | Detail |
|---|---|
| Identifier | GHSA-w5hq-g745-h8pq |
| Severity | Moderate (advisory CVSS 7.5) |
| Dependency path | `tkp -> next-sanity@13.1.1 -> @sanity/preview-url-secret@4.0.8 -> @sanity/uuid@3.0.2 -> uuid@8.3.2` |
| Direct/transitive | Transitive through direct next-sanity |
| npm environment | Production |
| Vulnerable range / patch | UUID `<11.1.1`; patched in 11.1.1 |
| npm proposed fix | Downgrade next-sanity to 9.5.6 (and related Sanity suggestions) |
| Direct dependency / force | Changes next-sanity across majors; force would be required |
| Likely reachability | Currently not reachable through TKP's public pages: no Draft Mode, Visual Editing, Presentation Tool, or preview-secret source usage. Embedded package code remains shipped/available. |
| Recommendation | Await a next-sanity/preview-url-secret release using @sanity/uuid 3.0.3+; do not downgrade or force an override |
| Stage / risk | Stage 7C; medium risk because next-sanity, Next, React, and Sanity peers are coordinated |

npm expands this root cause into `@sanity/uuid`, `@sanity/preview-url-secret`, `@sanity/visual-editing`, and `next-sanity` nodes. These are not separate advisories.

### E. Direct packages marked vulnerable only through affected parents

`sanity`, `@sanity/vision`, `next-sanity`, and `next` are direct nodes in npm's report because they include or propagate the vulnerable leaves above. No separate advisory was returned for their own application code. npm's suggested downgrades (`sanity@5.14.1`, `@sanity/vision@5.31.1`, `next-sanity@9.5.6`, `next@9.3.3`) are unsafe and incompatible with the current peer matrix.

## 5. Development/tooling findings

No finding disappears under `npm audit --omit=dev`, so npm reports zero exclusively development-only vulnerability nodes. Reachability analysis still classifies the Sanity CLI parser/typeid paths as build/CLI tooling rather than visitor-facing runtime paths. ESLint 9.39.5, eslint-config-next 16.2.10, TypeScript 5.9.3, and their installed lint dependencies are not audit findings.

The full tree also contains non-vulnerable js-yaml 4.3.0 under ESLint and non-vulnerable direct PostCSS 8.5.16. These do not remediate the separate nested copies.

## 6. Reachability analysis

| Area | Classification | Evidence |
|---|---|---|
| Next nested PostCSS 8.4.31 | Build-time only; likely reachable during production compilation | Direct Next dependency; no runtime import or untrusted CSS stringification in TKP source |
| Sanity CLI parser findings | Build-time/CLI only | Path is under `@sanity/cli`; application routes do not import CLI or Vercel Frameworks |
| Sanity CLI typeid UUID | Build-time/CLI only | Path is under `@sanity/cli`; no TKP typeid/UUID calls |
| next-sanity preview UUID | Currently not reachable in configured features; Studio/optional integration path | No SanityLive, Visual Editing, Draft Mode, Presentation Tool, or preview URL secret imports |
| Embedded Sanity Studio generally | Studio-only | `/studio` dynamically loads `NextStudio`; Vision is configured only in `sanity.config.ts` |
| AWS SDK S3/presigner | Confirmed production reachable, no audit finding | Server-side R2 signing imports both direct AWS packages |
| React/React DOM | Confirmed production reachable, no audit finding | Application UI and provider tree |
| styled-components | Studio-only peer, no audit finding | No direct source import; required peer of Sanity/next-sanity |
| sharp | Build/runtime image processing capability, no audit finding | Optional Next dependency; no direct source import |
| ESLint/plugins | Lint-time only, no audit finding | `npm run lint` and flat configuration |
| Tailwind/PostCSS direct tree | Build-time only, no affected installed direct PostCSS | Direct PostCSS is 8.5.16 |

## 7. Fix-path validation

| Finding group | Safe patch now? | Validated state | Safest path |
|---|---|---|---|
| Next/PostCSS | No | Latest stable Next is 16.2.10 and still pins 8.4.31 | Wait for patched stable Next 16; coordinated direct update |
| Vercel Frameworks/js-yaml/smol-toml | No | Latest parent still declares affected leaves | Upstream transitive fix through Sanity CLI/Vercel Frameworks |
| Sanity CLI/typeid UUID | No | Latest CLI remains 7.7.1 with typeid-js `^1.2.0`, resolved to affected 1.2.0 | Upstream typeid/CLI/Sanity update |
| next-sanity preview UUID | No | Latest next-sanity 13.1.1 and preview-url-secret 4.0.8 retain @sanity/uuid 3.0.2 | Upstream next-sanity/preview package update |
| Direct PostCSS currency | No update available or necessary | 8.5.16 installed and verified as the latest stable release; this direct copy is not affected | Keep unchanged; changing it would not remediate Next's separately nested PostCSS 8.4.31 |

No safe fix requires package replacement today. No recommendation uses forced peer resolution, preview builds, or downgrades. Overrides are not recommended because the affected parents pin or may rely on major-specific leaf APIs.

## 8. Direct dependency health

| Direct dependency group | Usage and health |
|---|---|
| Next, React, React DOM | Actively used production stack; current coordinated versions; Next carries the nested PostCSS finding |
| next-sanity, Sanity, Vision | Actively used for client queries and embedded Studio; coordinated peers; carry the Sanity/UUID findings |
| @sanity/client | No direct source import, but required direct peer of next-sanity; placement is justified |
| @sanity/image-url | Directly imported by `src/sanity/lib/image.ts` |
| styled-components | No direct source import, but required direct peer for embedded Sanity Studio; placement is justified |
| AWS S3 client and presigner | Directly imported by `src/lib/r2.ts`; confirmed server-route reachable; no finding |
| lucide-react, clsx, tailwind-merge | Directly used presentation utilities; no finding |
| Tailwind, PostCSS, Autoprefixer | Build tooling correctly placed in development dependencies; direct PostCSS safe at 8.5.16 |
| TypeScript, ESLint, eslint-config-next, type packages | Development tooling correctly placed; no finding |
| @radix-ui/react-slot | No source import found; candidate unused direct dependency for Stage 7D |
| class-variance-authority | No source import found; candidate unused direct dependency for Stage 7D |

Currency-only major updates reported by `npm outdated` are intentionally deferred: @types/node 26, ESLint 10, lucide-react 1, tailwind-merge 3, Tailwind 4, and TypeScript 7 are separate compatibility decisions, not audit fixes. Direct PostCSS is already on the latest stable 8.5.16; no direct PostCSS update is available or necessary. No direct dependency is marked deprecated in the lockfile.

## 9. Pending install-script review

npm does not expose a read-only pending-approval list comparable to package managers with an approval ledger. The lockfile marks four packages with install scripts; whether npm considers any script “pending approval” is unknown.

| Package | Path/role | Why script exists | Required/current operation | Security implication | Recommendation |
|---|---|---|---|---|---|
| esbuild 0.28.1 | Sanity CLI -> tsx/Vite | Selects/verifies native esbuild binary | CLI/build may use platform package or existing binary; current app already type-checks/builds without approval | Runs native-binary setup code | Keep deferred unless a reproducible Sanity CLI failure proves it necessary; verify provenance first |
| sharp 0.34.5 | Next | Selects native Sharp/libvips image binary | Current Next build passes; no direct `next/image` usage requiring a new install step was observed | Native binary acquisition/setup | Keep deferred while builds pass |
| unrs-resolver 1.12.2 | eslint-config-next -> TS resolver | Native resolver binary setup | Current lint passes; installed platform binding is functional | Native binary setup in lint tooling | Keep deferred while lint passes |
| fsevents 2.3.3 | Optional lockfile platform package | Native macOS filesystem watcher build/install | Not installed/reachable on Windows; optional | Native build on macOS only | Keep deferred/not applicable on this host |

No script was approved or run during Stage 7A.

## 10. Dependency-tree and lockfile health

- `npm ls` exits successfully; no invalid or extraneous packages were found.
- Unmet entries in the full tree are optional platform or optional peer packages (for example non-Windows native binaries, Sass/Stylus/Terser, canvas, React Native). They are not invalid peers.
- Multiple PostCSS and UUID versions are intentional parent-specific copies. Two old UUID copies are deprecated and vulnerable; newer safe UUID 11.1.1, 13.0.2, and 14.0.1 copies also coexist.
- Optional native packages for other operating systems remain in the lockfile as expected; this is not local contamination.
- The only lockfile deprecation messages are UUID 8.3.2 and UUID 10.0.0.
- package.json and package-lock.json direct declarations agree with installed top-level versions.
- No lockfile inconsistency or local-node_modules extraneous package was detected.

## 11. Recommended remediation stages

The former Stage 7B direct PostCSS patch stage has been removed because PostCSS 8.5.16 is the latest stable release. There are two remaining conditional or optional remediation stages.

### Stage 7C — Coordinated upstream remediation

- Branch: `modernize/07c-coordinated-security`
- Packages: stable patched Next 16, next-sanity 13, Sanity/Vision 6, and their affected parents when releases actually exist. Exact targets are currently unavailable and must be re-verified from official metadata before implementation. This stage is blocked until compatible stable upstream releases exist.
- Purpose: remove nested PostCSS, parser, and UUID findings without downgrading or overriding pinned internals.
- Expected lockfile changes: broad framework/Studio transitive updates.
- Source changes: none expected for patches; compatibility changes possible and must be minimal.
- Automated checks: peer matrix, full/production audit comparison, `npm ls --all`, lint, TypeScript, clean Turbopack build, route manifest, single-Audio search.
- Manual checks: (1) Open `/` and press Play. (2) Open `/search` and confirm it renders. (3) Open `/studio` and confirm document types appear.
- Rollback point: reviewed Stage 7A baseline.
- Risk: medium/high because Next and the Sanity ecosystem must remain peer-compatible.

### Stage 7D — Unused dependency cleanup

- Branch: `modernize/07d-unused-dependencies`
- Exact packages: remove `@radix-ui/react-slot@1.3.0` and `class-variance-authority@0.7.1` only after repeating source/build usage checks.
- Purpose: remove unused direct declarations and reduce maintenance surface.
- Expected lockfile changes: removal of their top-level dependency entries and packages no longer referenced elsewhere.
- Source changes: none expected.
- Automated checks: `rg` usage audit, `npm ls`, lint, TypeScript, clean build, diff check.
- Manual checks: (1) Open `/`. (2) Open Player. (3) Confirm controls and layout render normally.
- Rollback point: Stage 7A baseline.
- Risk: low, subject to confirming no generated/dynamic import.

## 12. Accepted and deferred risks

- Temporarily accept the five advisory groups because no safe current parent release exists and npm's proposed fixes are incompatible downgrades.
- Keep direct PostCSS at 8.5.16, the latest stable release. It is not affected by the reported advisory, and changing it would not affect Next's nested PostCSS 8.4.31.
- Monitor Next and Sanity ecosystem releases. Re-run both audit modes when any relevant stable patch ships.
- Accept build/CLI parser exposure only for trusted repository configuration; do not feed untrusted YAML/TOML into Sanity CLI tooling.
- Keep optional Visual Editing/live-preview features disabled, which leaves the preview UUID path currently unconfigured.
- Defer major currency upgrades (ESLint 10, Tailwind 4, TypeScript 7, lucide 1, @types/node 26) to dedicated compatibility stages rather than conflating them with security remediation.

## 13. Testing plan

Automated Stage 7A integrity checks:

- `npx tsc --noEmit`
- `npm run lint`
- clean default `npm run build`
- `npm ls`, audit comparisons, and diff integrity

Simple visible review after a future remediation:

1. Open `/`, press Play on Latest Beat, and confirm the MiniPlayer appears.
2. Open `/search` and confirm the archive filters page renders.
3. Open `/studio` and confirm existing document types appear without public navigation.

## 14. Unknowns and blockers

- npm cannot identify a pending install-script approval ledger with the available read-only commands; only lockfile `hasInstallScript` markers are known.
- Exact patched parent versions do not exist in current stable registry metadata.
- Audit reachability is based on source imports, configured features, and dependency paths; it is not dynamic exploit testing.
- npm's synthetic top-level vulnerability ranges and suggested downgrade fixes are misleading for the current modern peer matrix; leaf advisories and paths should drive decisions.

## 15. Sources

- Local `package.json`, `package-lock.json`, source imports, and configuration files.
- `npm audit --json` and `npm audit --omit=dev --json`, run 2026-07-12.
- `npm outdated --json`, `npm ls --all`, `npm query ':invalid'`, and `npm query ':extraneous'`.
- npm registry metadata for current Next, next-sanity, Sanity, Sanity CLI, Vercel Frameworks, preview-url-secret, Sanity UUID, PostCSS, js-yaml, smol-toml, and UUID.
- GitHub advisories: GHSA-qx2v-qp2m-jg93, GHSA-mh29-5h37-fv8m, GHSA-h67p-54hq-rp68, GHSA-v3rj-xjv7-4jmq, GHSA-w5hq-g745-h8pq.

## 16. Integrity statement

Stage 7A was read-only with respect to dependencies and application/configuration code. The only intended repository change is this `SECURITY_AUDIT.md` document. No install, update, removal, audit fix, dedupe, prune, codemod, formatter, ESLint fix, forced resolution, legacy peer resolution, or install-script approval was performed.
