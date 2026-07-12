# The Kitsune Protocol Modernization Baseline

Stage: Modernization Stage 0 — current working baseline
Recorded: 2026-07-12
Branch: `modernize/00-baseline`

## Baseline status

The repository was clean before Stage 0 began. `git status --short --branch` showed only:

```text
## modernize/00-baseline...origin/modernize/00-baseline
```

There were no unrelated tracked or untracked changes before this task.

Stage 0 did not install, update, remove, or modify dependencies. It did not modify application source, configuration, environment files, routes, UI, Sanity, playback, R2, history, or Media Session behavior.

## Runtime

| Item | Current value | Result |
|---|---:|---|
| Branch | `modernize/00-baseline` | Recorded |
| Node.js | `v26.1.0` | Command completed |
| npm | `11.16.0` | Command completed |
| Package manager/lockfile | npm / `package-lock.json` | Unchanged |

Commands:

```text
node --version
npm --version
```

## Direct installed dependencies

Recorded from `npm list --depth=0` without changing the installation.

### Runtime dependencies

| Package | Installed version |
|---|---:|
| `@aws-sdk/client-s3` | `3.1085.0` |
| `@aws-sdk/s3-request-presigner` | `3.1085.0` |
| `@radix-ui/react-slot` | `1.3.0` |
| `@sanity/client` | `7.23.0` |
| `@sanity/image-url` | `1.2.0` |
| `@sanity/vision` | `3.99.0` |
| `class-variance-authority` | `0.7.1` |
| `clsx` | `2.1.1` |
| `lucide-react` | `0.468.0` |
| `next` | `14.2.15` |
| `next-sanity` | `9.12.3` |
| `react` | `18.3.1` |
| `react-dom` | `18.3.1` |
| `sanity` | `3.99.0` |
| `tailwind-merge` | `2.6.1` |

### Development dependencies

| Package | Installed version |
|---|---:|
| `@types/node` | `20.19.43` |
| `@types/react` | `18.3.31` |
| `@types/react-dom` | `18.3.7` |
| `autoprefixer` | `10.5.2` |
| `eslint` | `8.57.1` |
| `eslint-config-next` | `14.2.15` |
| `postcss` | `8.5.16` |
| `tailwindcss` | `3.4.19` |
| `typescript` | `5.9.3` |

## TypeScript baseline

Command:

```text
npx tsc --noEmit
```

Result: **PASS**

- Exit code: `0`
- Compiler output: none
- No TypeScript failure was reported.

## Production-build baseline

Command:

```text
npm run build
```

Result: **PASS**

- Next.js: `14.2.15`
- Optimized production compilation completed successfully.
- Type validity checking completed successfully.
- Page data collection completed.
- All 9 generated static-page units completed.
- Build traces were collected.

## Routes reported by the successful build

| Rendering | Route | Route size | First-load JavaScript |
|---|---|---:|---:|
| Dynamic | `/` | `726 B` | `160 kB` |
| Static | `/_not-found` | `880 B` | `88.9 kB` |
| Dynamic | `/api/playback` | `0 B` | `0 B` |
| Dynamic | `/api/playback-history/resolve` | `0 B` | `0 B` |
| Dynamic | `/fixations` | `201 B` | `148 kB` |
| Dynamic | `/logs` | `201 B` | `148 kB` |
| Dynamic | `/player` | `5.18 kB` | `165 kB` |
| Dynamic | `/player/beats/[slug]` | `2.04 kB` | `161 kB` |
| Static | `/player/now-playing` | `6.17 kB` | `106 kB` |
| Dynamic | `/search` | `201 B` | `148 kB` |
| Dynamic | `/studio/[[...index]]` | `1.43 MB` | `1.58 MB` |

Shared first-load JavaScript: `88 kB`.

## Existing nonfatal warnings

### Node build-only localStorage warning

During page-data collection and static-page generation, Node emitted this warning from multiple build workers:

```text
ExperimentalWarning: localStorage is not available because --localstorage-file was not provided.
```

Classification: **known, build-only, and nonfatal**. The build completed successfully. Stage 0 did not attempt to fix or suppress it.

### Local npm installation warnings

`npm list --depth=0` reported these existing extraneous local folders:

```text
@aws-sdk/@aws-sdk@ extraneous
@radix-ui/@radix-ui@ extraneous
@sanity/@sanity@ extraneous
```

These are not declared direct dependencies and are not represented as package-file changes. Classification: **existing local-install warning, nonfatal for the Stage 0 type-check and build**. Stage 0 did not modify or clean `node_modules`.

## Protected functionality for future stages

Future modernization stages must protect and regression-test:

- homepage
- bottom navigation
- private R2 playback
- Main Beat playback
- Context playback
- NSFW Context locking
- shared HTMLAudioElement
- MiniPlayer persistence
- queue order
- release order
- shuffle
- repeat
- playback history
- Continue Listening resume
- Media Session
- Beat Files
- Now Playing
- Listening Mode
- Sanity Studio
- public scrollbar behavior

## Simple manual baseline checks

The user completed all five manual baseline checks successfully.

1. Open `/`. Press Play on Latest Beat. Confirm music starts and the
   MiniPlayer appears. **Result: PASS**
2. Press Player in the bottom navigation. Confirm the music continues
   without restarting. **Result: PASS**
3. Open a Beat File with Context. Press a playable Context entry. Confirm
   its title becomes the current item. **Result: PASS**
4. Open Now Playing, then Listening Mode. Close Listening Mode. Confirm
   music continues at the same position. **Result: PASS**
5. Open `/studio`. Confirm Studio loads without the public bottom
   navigation. **Result: PASS**

## Package and repository integrity

- Pre-task working tree: clean.
- `package.json`: unchanged.
- `package-lock.json`: unchanged.
- Dependencies: none installed, updated, removed, or cleaned.
- Application source: unchanged.
- Configuration: unchanged.
- Environment files: unchanged.
- Generated build output: not tracked or committed.
- Stage 0 file change: only `MODERNIZATION_BASELINE.md` was created.

## Modernization rollback point

Current rollback commit:

```text
fb58536dc3db2d782eaab7f0773a12518e421638
```

Branch checkpoint: `modernize/00-baseline` before any dependency modernization.

This commit plus the recorded package-lock state is the rollback reference for Stage 1. The five manual checks should be completed and marked before Stage 1 begins so the visible playback baseline is independently confirmed.
