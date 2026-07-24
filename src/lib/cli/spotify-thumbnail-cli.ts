// @ts-expect-error Node 24/Sanity exec runs TypeScript directly and requires extensions.
import {parseSpotifyThumbnailSource} from '../spotify-thumbnail-source.ts'
// @ts-expect-error Node 24/Sanity exec runs TypeScript directly and requires extensions.
import {classifyThumbnailProvenance, type ThumbnailAutomationProvenance} from '../thumbnail-overwrite-policy.ts'
import type {GenerateSpotifyThumbnailResult} from '../server/generate-spotify-thumbnail.ts'

export const EXPECTED_PROJECT_ID = 'c6w1fv0f'
export const EXPECTED_DATASET = 'tkp-v2'
const DOCUMENT_ID = /^(?:drafts\.)?[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/

export type CliLinkDocument = {
  _id: string
  _rev: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
  title?: string
  url?: string
  thumbnail?: {asset?: {_ref?: string}}
  thumbnailAutomation?: ThumbnailAutomationProvenance
  [key: string]: unknown
}

export type CliSanityClient = {
  fetch<T>(query: string): Promise<T>
  getDocument<T>(id: string): Promise<T | undefined>
  createIfNotExists<T extends Record<string, unknown>>(document: T): Promise<T>
}

export type SpotifyThumbnailCandidate = {
  canonicalId: string
  document: CliLinkDocument
  title: string
  entityType: 'track' | 'album'
  canonicalUrl: string
  thumbnailState: 'none' | 'automatic' | 'manual' | 'stale'
  documentState: 'draft' | 'published-only' | 'draft-only'
}

export type SpotifyThumbnailCliDependencies = {
  config: {projectId?: string; dataset?: string; token?: string}
  client: CliSanityClient
  args: string[]
  prompt: (question: string) => Promise<string>
  write: (message: string) => void
  generate: (command: {documentId: string; expectedRevision: string; sourceCanonicalUrl: string; replacementConfirmed: boolean}) => Promise<GenerateSpotifyThumbnailResult>
}

export type SpotifyThumbnailCliResult = {ok: true} | {ok: false; reason: string}

const CANDIDATE_QUERY = `*[_type == "link"] | order(_updatedAt desc, title asc){_id,_rev,_type,_createdAt,_updatedAt,title,url,thumbnail,thumbnailAutomation}`

export function validateCliContext(config: SpotifyThumbnailCliDependencies['config']): SpotifyThumbnailCliResult {
  if (!config.token) return failure('not-authenticated')
  if (!config.projectId) return failure('missing-project')
  if (config.projectId !== EXPECTED_PROJECT_ID) return failure('wrong-project')
  if (!config.dataset) return failure('missing-dataset')
  if (config.dataset !== EXPECTED_DATASET) return failure('wrong-dataset')
  return {ok: true}
}

export function parseDocumentArgument(args: string[]): {ok: true; canonicalId?: string} | {ok: false} {
  if (args.length === 0) return {ok: true}
  if (args.length !== 2 || args[0] !== '--document-id') return {ok: false}
  const canonicalId = normalizeDocumentId(args[1])
  return canonicalId ? {ok: true, canonicalId} : {ok: false}
}

export function normalizeDocumentId(value: string | undefined) {
  if (!value || value.length > 256 || !DOCUMENT_ID.test(value)) return null
  const canonical = value.startsWith('drafts.') ? value.slice(7) : value
  return canonical && !canonical.startsWith('drafts.') ? canonical : null
}

export function buildSpotifyThumbnailCandidates(documents: CliLinkDocument[]): SpotifyThumbnailCandidate[] {
  const grouped = new Map<string, {draft?: CliLinkDocument; published?: CliLinkDocument}>()
  for (const document of documents) {
    if (document._type !== 'link') continue
    const canonicalId = normalizeDocumentId(document._id)
    if (!canonicalId) continue
    const pair = grouped.get(canonicalId) ?? {}
    if (document._id.startsWith('drafts.')) pair.draft = document
    else pair.published = document
    grouped.set(canonicalId, pair)
  }
  return [...grouped.entries()].flatMap(([canonicalId, pair]) => {
    const document = pair.draft ?? pair.published
    if (!document) return []
    const source = parseSpotifyThumbnailSource(document.url)
    if (!source.ok || source.canonicalUrl !== document.url) return []
    const provenance = classifyThumbnailProvenance({currentThumbnailAssetRef: document.thumbnail?.asset?._ref, currentSourceUrl: document.url, provenance: document.thumbnailAutomation})
    const thumbnailState: SpotifyThumbnailCandidate['thumbnailState'] = !document.thumbnail?.asset?._ref ? 'none' : provenance === 'valid-current-automatic' ? 'automatic' : provenance === 'absent' ? 'manual' : 'stale'
    const documentState: SpotifyThumbnailCandidate['documentState'] = pair.draft ? (pair.published ? 'draft' : 'draft-only') : 'published-only'
    return [{canonicalId, document, title: safeTitle(document.title), entityType: source.entityType, canonicalUrl: source.canonicalUrl, thumbnailState, documentState}]
  }).sort((a, b) => (Date.parse(b.document._updatedAt ?? '') || 0) - (Date.parse(a.document._updatedAt ?? '') || 0) || a.title.localeCompare(b.title) || a.canonicalId.localeCompare(b.canonicalId))
}

export async function runSpotifyThumbnailCli(dependencies: SpotifyThumbnailCliDependencies): Promise<SpotifyThumbnailCliResult> {
  const guarded = validateCliContext(dependencies.config)
  if (!guarded.ok) return report(dependencies, guarded.reason)
  const argument = parseDocumentArgument(dependencies.args)
  if (!argument.ok) return report(dependencies, 'invalid-document-argument')

  let documents: CliLinkDocument[]
  try { documents = await dependencies.client.fetch<CliLinkDocument[]>(CANDIDATE_QUERY) } catch { return report(dependencies, 'sanity-query-failed') }
  const candidates = buildSpotifyThumbnailCandidates(documents)

  let selected: SpotifyThumbnailCandidate | undefined
  if (argument.canonicalId) {
    selected = candidates.find((candidate) => candidate.canonicalId === argument.canonicalId)
    if (!selected) {
      const matching = documents.filter((document) => normalizeDocumentId(document._id) === argument.canonicalId && document._type === 'link').sort((a) => a._id.startsWith('drafts.') ? -1 : 1)[0]
      if (!matching) return report(dependencies, 'document-not-found')
      if (/^https:\/\/open\.spotify\.com\/(?:embed\/)?playlist\//.test(matching.url ?? '')) return report(dependencies, 'spotify-playlist-unsupported')
      return report(dependencies, 'unsupported-source')
    }
  }
  else {
    if (!candidates.length) return report(dependencies, 'no-eligible-links')
    dependencies.write('\nEligible Spotify thumbnails\n')
    candidates.forEach((candidate, index) => dependencies.write(`${index + 1}. [${labelType(candidate.entityType)}] ${candidate.title} — ${labelThumbnail(candidate.thumbnailState)}; ${labelDocument(candidate.documentState)}`))
    const answer = await safePrompt(dependencies, '\nEnter a number, or Q to cancel: ')
    if (answer == null || answer === '' || /^q$/i.test(answer)) return report(dependencies, 'cancelled')
    if (!/^\d+$/.test(answer)) return report(dependencies, 'invalid-selection')
    const index = Number(answer) - 1
    if (!Number.isSafeInteger(index) || index < 0 || index >= candidates.length) return report(dependencies, 'invalid-selection')
    selected = candidates[index]
  }
  if (!selected) return report(dependencies, 'document-not-found')

  dependencies.write('\nGenerate a Spotify thumbnail for:\n')
  dependencies.write(`Title: ${selected.title}`)
  dependencies.write(`Type: ${labelType(selected.entityType)}`)
  dependencies.write(`Source: ${selected.canonicalUrl}`)
  const confirmation = await requestConfirmation(dependencies, selected.thumbnailState)
  if (!confirmation) return report(dependencies, 'replacement-cancelled')

  dependencies.write('\nChecking document…')
  const draft = await obtainDraft(dependencies.client, selected)
  if (!draft.ok) return report(dependencies, draft.reason)
  if (!sameReviewedDocument(selected.document, draft.document, selected.documentState === 'published-only')) return report(dependencies, 'document-changed')
  const source = parseSpotifyThumbnailSource(draft.document.url)
  if (!source.ok) return report(dependencies, source.reason === 'unsupported-entity' && /\/playlist\//.test(draft.document.url ?? '') ? 'spotify-playlist-unsupported' : 'unsupported-source')
  if (source.canonicalUrl !== selected.canonicalUrl || source.canonicalUrl !== draft.document.url) return report(dependencies, 'document-changed')

  const latest = await dependencies.client.getDocument<CliLinkDocument>(draft.document._id)
  if (!latest || !sameReviewedDocument(draft.document, latest, false)) return report(dependencies, 'document-changed')
  const result = await dependencies.generate({documentId: latest._id, expectedRevision: latest._rev, sourceCanonicalUrl: source.canonicalUrl, replacementConfirmed: selected.thumbnailState !== 'none'})
  if (!result.ok) return report(dependencies, result.reason)
  dependencies.write('\nThumbnail added to the draft.\n')
  dependencies.write(`Title: ${selected.title}`)
  dependencies.write('Provider: Spotify')
  dependencies.write(`Type: ${labelType(selected.entityType)}`)
  dependencies.write('Output: WebP')
  dependencies.write(`Dimensions: ${result.width} × ${result.height}`)
  dependencies.write('Open the Link in Sanity Studio to review and publish it.')
  return {ok: true}
}

async function requestConfirmation(dependencies: SpotifyThumbnailCliDependencies, state: SpotifyThumbnailCandidate['thumbnailState']) {
  if (state === 'none') return /^(?:y|yes)$/i.test(await safePrompt(dependencies, '\nContinue? [y/N] ') ?? '')
  if (state === 'automatic') {
    dependencies.write('\nThe existing automatic thumbnail will be refreshed.')
    return await safePrompt(dependencies, 'Type REFRESH to continue: ', false) === 'REFRESH'
  }
  dependencies.write(state === 'stale' ? '\nThe thumbnail is protected because its source or asset no longer matches its automation record.' : '\nThe existing thumbnail is treated as manual and protected.')
  return await safePrompt(dependencies, 'Type REPLACE to continue: ', false) === 'REPLACE'
}

async function obtainDraft(client: CliSanityClient, candidate: SpotifyThumbnailCandidate): Promise<{ok: true; document: CliLinkDocument} | {ok: false; reason: string}> {
  const draftId = `drafts.${candidate.canonicalId}`
  const existing = await client.getDocument<CliLinkDocument>(draftId)
  if (existing) return existing._type === 'link' ? {ok: true, document: existing} : {ok: false, reason: 'wrong-document-type'}
  const published = await client.getDocument<CliLinkDocument>(candidate.canonicalId)
  if (!published) return {ok: false, reason: 'document-not-found'}
  if (published._type !== 'link') return {ok: false, reason: 'wrong-document-type'}
  const {_id: ignoredId, _rev: ignoredRev, _createdAt: ignoredCreated, _updatedAt: ignoredUpdated, ...content} = published
  void ignoredId; void ignoredRev; void ignoredCreated; void ignoredUpdated
  try { await client.createIfNotExists({...content, _id: draftId, _type: 'link'}) } catch { return {ok: false, reason: 'draft-creation-failed'} }
  const created = await client.getDocument<CliLinkDocument>(draftId)
  return created?.['_type'] === 'link' ? {ok: true, document: created} : {ok: false, reason: 'document-not-found'}
}

function sameReviewedDocument(reviewed: CliLinkDocument, current: CliLinkDocument, allowRevisionChange: boolean) {
  return current._type === 'link' && (allowRevisionChange || current._rev === reviewed._rev) && current.url === reviewed.url && current.thumbnail?.asset?._ref === reviewed.thumbnail?.asset?._ref && JSON.stringify(current.thumbnailAutomation ?? null) === JSON.stringify(reviewed.thumbnailAutomation ?? null)
}

async function safePrompt(dependencies: SpotifyThumbnailCliDependencies, question: string, trim = true) {
  try { const answer = await dependencies.prompt(question); return trim ? answer.trim() : answer } catch { return null }
}

function safeTitle(value: string | undefined) { const title = value?.trim(); return title ? title.slice(0, 200) : 'Untitled Link' }
function labelType(type: 'track' | 'album') { return type === 'track' ? 'Track' : 'Album' }
function labelThumbnail(state: SpotifyThumbnailCandidate['thumbnailState']) { return state === 'none' ? 'No thumbnail' : state === 'automatic' ? 'Automatic thumbnail available for refresh' : state === 'manual' ? 'Manual thumbnail protected' : 'Stale or changed thumbnail protected' }
function labelDocument(state: SpotifyThumbnailCandidate['documentState']) { return state === 'draft' ? 'Draft exists' : state === 'draft-only' ? 'Unpublished draft' : 'Published only; draft will be created' }
function failure(reason: string): SpotifyThumbnailCliResult { return {ok: false, reason} }
function report(dependencies: SpotifyThumbnailCliDependencies, reason: string): SpotifyThumbnailCliResult { dependencies.write(errorMessage(reason)); return failure(reason) }

export function errorMessage(reason: string) {
  const messages: Record<string, string> = {
    'not-authenticated': 'Sanity CLI authentication is required. Run the normal Sanity CLI login flow and try again.',
    'missing-project': 'The Sanity CLI project configuration is missing. No changes were made.',
    'wrong-project': 'This command is configured for a different Sanity project. No changes were made.',
    'missing-dataset': 'The Sanity CLI dataset configuration is missing. No changes were made.',
    'wrong-dataset': 'This command is configured for a different Sanity dataset. No changes were made.',
    'invalid-document-argument': 'Use at most one exact --document-id value. No batch or query input is accepted.',
    'no-eligible-links': 'No eligible Spotify track or album Links were found.',
    'invalid-selection': 'That selection is invalid. No changes were made.',
    cancelled: 'Cancelled. No changes were made.',
    'replacement-cancelled': 'Thumbnail generation was cancelled. The existing document is unchanged.',
    'document-not-found': 'The selected Link could not be found.',
    'wrong-document-type': 'The selected document is not a Link.',
    'document-changed': 'The Link changed during review. Reopen or rerun the command.',
    'unsupported-source': 'The Link does not contain a supported canonical Spotify track or album source.',
    'spotify-playlist-unsupported': 'Spotify playlists are not supported by this thumbnail command.',
    'provider-not-found': 'Spotify could not find this content.',
    'provider-rate-limited': 'Spotify is temporarily limiting requests. Try again later.',
    'provider-timeout': 'Spotify did not respond in time. Try again deliberately.',
    'provider-unavailable': 'Spotify content is temporarily unavailable.',
    'unsafe-provider-response': 'Spotify returned metadata that could not be accepted safely.',
    'no-thumbnail': 'Spotify did not provide artwork for this content.',
    'unsafe-thumbnail-url': 'Spotify returned an artwork location that could not be accepted safely.',
    'thumbnail-download-failed': 'The artwork download failed safely.',
    'thumbnail-too-large': 'The artwork was too large to import safely.',
    'thumbnail-invalid': 'The artwork was invalid or unsupported.',
    'thumbnail-processing-failed': 'The artwork could not be processed safely.',
    'sanity-upload-failed': 'The sanitized thumbnail could not be uploaded to Sanity.',
    'document-conflict': 'The Link changed during the operation. Reopen or rerun the command.',
    'document-patch-failed': 'Sanity could not update the draft. The published document was not changed.',
    'draft-creation-failed': 'Sanity could not prepare an editable draft.',
    'sanity-query-failed': 'Sanity could not load eligible Links.',
  }
  return messages[reason] ?? 'The thumbnail operation failed safely. No sensitive details were printed.'
}
