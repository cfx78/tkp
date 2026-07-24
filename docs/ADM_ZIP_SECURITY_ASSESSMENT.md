# ADM-ZIP Security Assessment

Assessment date: 2026-07-17  
Branch: `security/01-adm-zip-advisory-assessment`  
Scope: read-only dependency and reachability assessment; no remediation applied

## 1. Executive summary

TKP installs two transitive copies of `adm-zip`: `0.5.10` under `@module-federation/dts-plugin@2.6.0` and hoisted `0.5.18` for `@sanity/runtime-cli@17.1.0`. The current GitHub-reviewed advisory, [GHSA-xcpc-8h2w-3j85 / CVE-2026-39244](https://github.com/advisories/GHSA-xcpc-8h2w-3j85), classifies all versions `<0.6.0` as affected and `0.6.0` as patched. Therefore both installed copies are currently audit-vulnerable.

The ten high-severity npm findings are ten affected dependency nodes propagated from one underlying `adm-zip` advisory, not ten independent high-severity vulnerabilities. Both full and `--omit=dev` audits report the same nodes because `sanity`, `@sanity/vision`, and `next-sanity` are declared production dependencies; npm environment classification does not prove public-runtime reachability.

No TKP-owned source imports `adm-zip`, accepts ZIP uploads, extracts archives, or passes public input to the affected packages. The public Next APIs accept JSON only and perform playback/history work. The embedded Studio loads `next-sanity/studio`; it does not import the Sanity CLI/workbench CLI. The vulnerable module-federation path is installed CLI/build tooling and contains a real network ZIP download followed by `extractAllTo`, but TKP has no module-federation configuration or remote-type URL. The runtime CLI copy is used by installed code to create ZIPs from local paths for Sanity Blueprints/Functions; TKP does not use those commands.

Decision: **CONTINUE_FEATURE_WORK / DEPLOYMENT CONDITIONALLY ALLOWED**. Deployment is not blocked by a demonstrated public request path, but release approval should require an unchanged route/build boundary, no untrusted ZIP/archive processing, and a tracked remediation branch. Local/CI Sanity CLI use should be limited to the known `sanity exec` thumbnail workflow and normal Studio tasks; do not use workbench/module-federation remote types, Blueprints/Functions archive commands, or untrusted archives until remediation is validated.

## 2. Audit baseline change

The documented 2026-07-12 baseline was 14 moderate, 0 high, and 0 critical vulnerability nodes. On 2026-07-17 both current audits report 10 moderate, 10 high, and 0 critical across 1,390 dependency nodes.

This count changed because GitHub published the reviewed `adm-zip` denial-of-service advisory on July 10 and updated/reviewed it on July 17. npm expands the one leaf advisory through every affected parent/effect node. This is a vulnerability-node count, not an advisory count.

Verified current high nodes:

1. `adm-zip`
2. `@module-federation/dts-plugin`
3. `@module-federation/vite`
4. `@sanity/workbench-cli`
5. `@sanity/cli-build`
6. `@sanity/runtime-cli`
7. `@sanity/cli`
8. `sanity`
9. `@sanity/vision`
10. `next-sanity`

All ten ultimately refer to GHSA-xcpc-8h2w-3j85. The remaining ten moderate nodes are the previously known PostCSS, UUID, YAML, and TOML groups.

## 3. Advisory identity and fixed range

| Field | Verified fact |
|---|---|
| Advisory | GHSA-xcpc-8h2w-3j85 |
| CVE | CVE-2026-39244 |
| Title | `adm-zip: Crafted ZIP file triggers 4GB memory allocation` |
| Severity | High; CVSS 7.5 |
| Weaknesses | CWE-400 and CWE-789 |
| Current affected range | `<0.6.0` |
| Current patched version | `0.6.0` |
| Impact | Availability denial of service/process crash through excessive allocation |
| Required input | A crafted ZIP parsed/read/tested/extracted by `adm-zip` |

The advisory page contains a material inconsistency: its description says “before 0.5.18,” while its structured affected/patched fields say `<0.6.0` and `0.6.0`. npm audit uses the structured `<0.6.0` range. This assessment conservatively treats both `0.5.10` and `0.5.18` as affected until GitHub corrects the range or upstream publishes contrary verified evidence. npm currently lists `adm-zip@0.6.0` as the latest version.

The vulnerable allocation happens before CRC validation when a read/extraction method trusts the ZIP central-directory uncompressed-size value. The advisory identifies `readFile`, `readAsText`, `extractEntryTo`, `extractAllTo`, `extractAllToAsync`, `test`, and `entry.getData`. It does not describe file overwrite or code execution; the direct security impact is availability. Malicious artifacts can still create supply-chain/build availability risk.

## 4. Installed versions

| Installed node | Version | Placement | Parent request | Audit status |
|---|---:|---|---|---|
| `node_modules/adm-zip` | 0.5.18 | Hoisted | `@sanity/runtime-cli@17.1.0` requests `^0.5.17` | Affected by current `<0.6.0` range |
| `node_modules/@module-federation/dts-plugin/node_modules/adm-zip` | 0.5.10 | Nested, not deduplicated | `@module-federation/dts-plugin@2.6.0` pins exact `0.5.10` | Affected |

No safe `adm-zip@0.6.0` copy is installed. Neither copy is optional and neither is marked development-only in the lockfile. Both arrive transitively through direct `sanity@6.4.0`, which is in `dependencies`.

## 5. Complete dependency-path matrix

| Path | Version | Dependency role | Duplicate/hoist facts |
|---|---:|---|---|
| `tkp -> sanity@6.4.0 -> @sanity/cli@7.7.1 -> @sanity/runtime-cli@17.1.0 -> adm-zip@0.5.18` | 0.5.18 | Sanity Runtime CLI for Blueprints/Functions | Hoisted because the parent permits `^0.5.17` |
| `tkp -> sanity@6.4.0 -> @sanity/cli@7.7.1 -> @sanity/workbench-cli@1.2.0 -> @module-federation/vite@1.16.11 -> @module-federation/dts-plugin@2.6.0 -> adm-zip@0.5.10` | 0.5.10 | Workbench/module-federation type archive tooling | Nested because the DTS plugin pins exact `0.5.10` |
| `tkp -> sanity@6.4.0 -> @sanity/cli@7.7.1 -> @sanity/cli-build@3.0.0 -> @sanity/workbench-cli@1.2.0 -> ... -> adm-zip@0.5.10` | 0.5.10 | Second logical parent path to the same physical nested node | npm audit propagates through `@sanity/cli-build` |
| `tkp -> @sanity/vision@6.4.0 -> sanity@6.4.0 -> ...` | both | Vision peer/effect propagation | Not a second installation |
| `tkp -> next-sanity@13.1.1 -> sanity@6.4.0 -> ...` | both | next-sanity peer/effect propagation | Not a second installation |

`npm explain adm-zip`, `npm ls adm-zip --all`, `npm query '#adm-zip'`, package manifests, and lockfile entries agree on these two physical copies. npm's suggested fix is a breaking downgrade to `sanity@3.84.0` (and related historical direct-package changes); it is not a valid fix for the coordinated Sanity 6 stack and was not applied.

## 6. Direct TKP code-use search

Verified searches covered tracked source, scripts, configuration, schemas, documentation, and package files for `adm-zip`, `AdmZip`, ZIP/archive extraction, uploads, module federation, Sanity runtime/workbench use, and extraction method names.

TKP-owned code:

- does not import or call `adm-zip`;
- does not accept `.zip` or archive uploads;
- does not open, read, test, or extract ZIP archives;
- does not configure module federation, remotes, or remote type archives;
- does not call Sanity Blueprints or Functions archive commands;
- has no API route accepting binary/archive bodies;
- does not use ZIP processing in thumbnail automation, playback, history, schemas, or Studio configuration.

The thumbnail command is `sanity exec scripts/generate-spotify-thumbnail.ts --with-user-token`. Its TKP path fetches Spotify metadata/artwork, bounds and sanitizes image bytes with Sharp, uploads a Sanity image, and patches a draft. It does not invoke archive code. Because the outer command starts the Sanity CLI, installed CLI modules remain a local toolchain concern even though the task code does not call ZIP APIs.

Absence of direct TKP use does not mean the transitive package is absent: installed module-federation code imports `adm-zip`, downloads a configured remote `@mf-types.zip`, constructs `AdmZip` from the response, and calls `extractAllTo`. Installed runtime CLI code imports `adm-zip` and creates ZIP buffers from trusted local paths for Blueprints/Functions.

## 7. Runtime/build/CLI reachability matrix

| Surface/path | Classification | Repository/package evidence | Conclusion |
|---|---|---|---|
| Public browser routes | Unreachable/unused | No client import, module-federation config, ZIP input, or ZIP UI | No demonstrated browser execution |
| Public Next server runtime | Unreachable/unused | Only `/api/playback` and `/api/playback-history/resolve`; both parse JSON and access Sanity/R2 | No public ZIP-processing request path |
| Embedded `/studio` browser | Unreachable based on current configuration | Route dynamically imports `next-sanity/studio`; config uses Structure and Vision only, not `@sanity/workbench-cli` | CLI package presence is not evidence it is bundled/executed in Studio browser |
| Normal `next build` | Installed but not observed executing | Next build does not configure module federation or Sanity CLI workbench | Treat as dependency/CI exposure, not a demonstrated ZIP parse path |
| `sanity exec` thumbnail CLI | Local CLI; affected package installed, vulnerable operation not called by TKP script | Script imports `getCliClient` and TKP thumbnail modules only | Restrict to trusted repo/configuration; no ZIP input |
| Sanity Runtime CLI Blueprints/Functions | Local CLI, currently unused | Installed `assets.js` imports `adm-zip`; current visible operations create ZIPs from local paths | Package reachable if these commands are adopted; no current extraction of attacker ZIP shown |
| Sanity workbench/module-federation remote types | CLI/build-time, currently unconfigured | Installed DTS plugin downloads a remote types ZIP and calls `extractAllTo` | Real vulnerable sink if configured remote/archive is attacker-controlled |
| Tests | Not used by TKP tests | No test imports or ZIP fixture path | No current test reachability |

The dependency is classified by npm as production because its ancestor is a production dependency. Operationally, the vulnerable sinks are CLI/build tooling in this repository, not public application request handlers. This conclusion depends on keeping module federation, remote workbench types, ZIP upload endpoints, and archive-consuming Studio plugins absent.

## 8. Exploit prerequisites

An attacker must get a crafted ZIP into an affected read/test/extraction method. A very small archive can declare an extremely large uncompressed entry size, producing excessive memory allocation before validation and crashing or exhausting the process.

- **Public visitor:** no identified delivery path. Public requests cannot upload archives or select module-federation type URLs.
- **Studio user:** the embedded Studio currently offers content editing, Structure, and Vision. No ZIP import/extract feature backed by these packages was found. A future plugin or CLI command could change this.
- **Developer:** risk exists if a developer configures/uses remote module-federation type archives or processes an untrusted ZIP with Sanity tooling.
- **CI/build:** risk exists if build configuration begins fetching attacker-controlled remote type archives, or a compromised trusted upstream/artifact supplies a crafted ZIP to an executed tool path.
- **Supply chain:** a malicious dependency artifact or compromised configured remote could cause build availability loss if it reaches extraction. The advisory itself does not establish arbitrary code execution, confidentiality loss, or file-write integrity compromise.

Theoretical package vulnerability is confirmed. Current public-project reachability is not. Local and CI availability exposure remains real and must not be dismissed.

## 9. Public deployment risk

No evidence shows either `adm-zip` copy in the public browser/server execution graph or a deployed route that supplies ZIP bytes to it. The embedded Studio browser is separate from CLI/workbench CLI execution and does not expose an archive input in current configuration. Therefore this advisory alone does not establish a remotely triggerable production denial of service.

Deployment is conditionally allowed only if:

- deployed routes/configuration remain unchanged with no archive upload/import feature;
- module federation/workbench remote types remain unconfigured;
- production Studio adds no archive-consuming plugin or command surface;
- CI does not accept untrusted remote ZIP/type artifacts;
- the separate existing launch gates in `FINAL_BUILD_REBASELINE.md` are still satisfied;
- the remediation is tracked and re-evaluated before adopting new Sanity CLI features.

Immediate deployment blocking becomes necessary if a public or authenticated deployed path is found to invoke an affected read/test/extraction method on attacker-influenced bytes.

## 10. Local development and CI risk

Local and CI risk is higher than public-runtime risk because the vulnerable packages are installed and the module-federation DTS plugin contains a confirmed network-download/extract sink. Until remediation:

- do not enable module federation or workbench remote-type consumption;
- do not run Sanity Blueprints/Functions archive workflows for untrusted projects or paths;
- do not process user-supplied ZIPs with any Sanity CLI command;
- pin CI inputs and trusted package sources; do not let pull-request input control remote archive URLs;
- continue only the existing reviewed `sanity exec` thumbnail workflow and normal Studio/build commands;
- stop and reassess if CLI/build logs show `@mf-types.zip`, remote type downloads, archive extraction, Blueprints, or Functions packaging.

## 11. Remediation options

### Option A — parent-package patch/update

This is preferred in principle, but no current compatible parent chain removes the vulnerable leaf. Read-only npm metadata on 2026-07-17 showed:

- latest `sanity@6.5.0` requests `@sanity/cli ^7.8.0`;
- latest `@sanity/cli@7.10.0` requests workbench CLI `^1.5.0` and runtime CLI `^17.1.0`;
- latest workbench CLI `1.5.0` requests module-federation Vite `1.17.1`;
- latest module-federation Vite ultimately uses DTS plugin `2.8.0`;
- latest DTS plugin `2.8.0` still pins `adm-zip 0.5.10`;
- latest runtime CLI `17.1.0` still requests `adm-zip ^0.5.17`.

A coordinated Sanity patch/minor update alone therefore does not currently produce `adm-zip@0.6.0`. It would change the lockfile and require full Studio/CLI/build compatibility verification without removing the finding.

### Option B — direct transitive override

An override to `adm-zip@0.6.0` would not satisfy either declared parent range:

- exact `0.5.10` rejects `0.6.0`;
- `^0.5.17` for a `0.x` package is bounded below `0.6.0`.

Forcing it would intentionally violate upstream semver declarations and could leave multiple copies depending on override shape. Compatibility cannot be inferred from API similarity. Required validation would include DTS archive creation/download/extraction, Sanity workbench dev/build, Runtime CLI Blueprints/Functions packaging, Studio dev/build, thumbnail `sanity exec`, full application tests, and a clean production build. Do not apply this casually.

### Option C — wait for upstream

This is the safest current production-tree action. Required upstream changes are DTS plugin and Runtime CLI releases that declare and test `adm-zip@0.6.0`, followed by compatible module-federation/workbench/Sanity CLI/Sanity releases. Monitor the GitHub advisory for range corrections and npm metadata for parent releases. Operational restrictions above reduce exposure while waiting.

### Option D — remove an unused dependency path

The vulnerable packages enter through direct `sanity`, which supplies the embedded Studio and required CLI workflow. Removing `sanity`, `@sanity/vision`, or `next-sanity` would break approved project functionality. Workbench/runtime CLI packages are transitive and cannot be independently removed from the lockfile without unsupported package surgery. No safe unused direct dependency removal was identified.

## 12. Recommended remediation

Wait for upstream parent releases, then perform a coordinated patch/minor update only when both physical dependency paths resolve to `adm-zip@0.6.0` or later and the Sanity 6/next-sanity 13 peer matrix remains valid. Re-run authoritative web/registry verification at implementation time because the advisory and packages changed within days of this assessment.

If launch timing requires earlier removal, create a separate validation branch to test a narrowly scoped override; do not ship that override unless upstream API compatibility and every CLI/workbench scenario are proven. The current evidence favors waiting over violating two parent ranges.

## 13. Feature-work and deployment decision

**CONTINUE_FEATURE_WORK / DEPLOYMENT CONDITIONALLY ALLOWED**

Visual and feature branches do not exercise archive tooling and may continue. This advisory does not independently block deployment because no deployed public ZIP-processing path was found. Deployment remains conditional on the restrictions in Sections 9 and 10 and on all unrelated launch gates.

Remediation belongs on the security critical path before enabling any remote-type, archive import, Blueprint, or Function workflow. It becomes immediate if public/Studio/CI attacker-controlled bytes can reach `AdmZip` read, test, or extraction methods.

Evidence sufficient to downgrade project reachability (not package severity) is: confirmed production bundle/route absence, unchanged API inventory, no module federation, no archive-consuming Studio plugin, and CI configuration proving no untrusted archive URL/input. Evidence requiring escalation is any deployed bundle/import or runtime trace reaching the vulnerable methods, any ZIP upload/import surface, attacker-controlled remote type URL, or a build/Studio crash reproducible with the crafted archive.

## 14. Exact proposed remediation branch

Proposed next branch: `security/02-adm-zip-upstream-parent-update`

Create it only after compatible upstream releases exist. Intended changes:

- update `sanity`/`@sanity/vision` within the current major and associated locked Sanity CLI/workbench/runtime parents as a coordinated set;
- retain Next, React, next-sanity major compatibility;
- verify every resolved `adm-zip` node is `>=0.6.0`;
- change only `package.json` declarations genuinely required by the compatible parent update and the resulting `package-lock.json`.

Required automated checks: `npm ls adm-zip --all`, both audits, invalid/extraneous queries, full tests, lint, TypeScript, clean Next build, route manifest, no extra audio element, and package/lockfile diff review.

Required manual checks: `/studio` loads Structure and Vision; create/edit a draft without publishing; run the authenticated Spotify thumbnail CLI through cancellation and a controlled draft generation; run only applicable upstream workbench/runtime archive smoke tests in isolated fixtures; verify Home, Search, playback, and Studio isolation.

Rollback condition: any peer invalidity, Studio/CLI regression, route/bundle change, lockfile contamination, unresolved `<0.6.0` copy, or audit high node remaining. Web verification of GitHub advisory state and current official npm parent metadata is required immediately before implementation.

## 15. Verification results

Assessment evidence collected before writing:

- branch and clean starting tree confirmed;
- Node `v24.18.0`; npm `11.16.0`;
- `npm ls adm-zip --all`, `npm explain adm-zip`, and `npm query '#adm-zip'` agree on two copies;
- lockfile and installed manifests agree on versions and parent ranges;
- current full and production audits both report 10 moderate, 10 high, 0 critical;
- tracked-code and installed-package reachability searches completed;
- authoritative GitHub advisory and current npm package metadata reviewed;
- no install, update, override, resolution, fix, deployment, or dependency mutation performed.

Final verification:

- lint passed with 0 errors and the established 16 warnings;
- `npx tsc --noEmit` passed with no diagnostics;
- no TKP development/build process was active;
- only the verified workspace `.next` was removed before the clean build;
- Next 16.2.10 production build passed and emitted the unchanged 15-route inventory plus four existing `@sanity/image-url` deprecation notices;
- full tests passed: 176 passed, 0 failed/skipped/cancelled/todo;
- `git diff --check` passed apart from the existing line-ending notice;
- `npm ls` passed; invalid and extraneous queries returned `[]`;
- final production and full audits both remained 10 moderate, 10 high, 0 critical;
- `next-env.d.ts` was restored to its exact pre-build content;
- package files, lockfile, source, schemas, and environment files are content-unchanged;
- the only intended repository content change is this assessment document.

## 16. Remaining uncertainty

- GitHub's structured range (`<0.6.0`) conflicts with the advisory prose (“before 0.5.18”). The structured range and npm audit are treated as authoritative pending correction.
- Static inspection cannot prove that a dependency is never dynamically imported under every undocumented Sanity CLI command. Current configured workflows and visible sinks were assessed.
- The production build can show route/bundle success but does not constitute exploit testing.
- No crafted exploit ZIP was executed; doing so is unnecessary and could intentionally exhaust memory.
- Future Sanity, module-federation, or advisory metadata may change quickly and must be rechecked.

## 17. Go/no-go checklist

- [x] One high-severity advisory identified; ten propagated high nodes mapped.
- [x] Both installed versions and both physical paths identified.
- [x] No TKP-owned `adm-zip` use or ZIP upload/extraction path found.
- [x] Public API and embedded Studio boundaries inspected.
- [x] Real module-federation network extraction sink documented.
- [x] Local/CI restrictions defined.
- [x] No compatible current parent update found.
- [x] Override incompatibility with both parent ranges documented.
- [x] Feature work may continue.
- [x] Deployment conditionally allowed for the current non-ZIP surface.
- [ ] Upstream parents resolve all copies to `adm-zip >=0.6.0`.
- [ ] Separate remediation branch completes compatibility testing.
- [ ] Reassess immediately if any archive input or remote-type workflow is added.
