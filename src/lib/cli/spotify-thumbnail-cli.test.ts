import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
// @ts-expect-error Node 24 executes TypeScript tests directly and requires extensions.
import {buildSpotifyThumbnailCandidates, errorMessage, normalizeDocumentId, parseDocumentArgument, runSpotifyThumbnailCli, validateCliContext, type CliLinkDocument, type SpotifyThumbnailCliDependencies} from './spotify-thumbnail-cli.ts'

const track = 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'
const album = 'https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX'
const automatic = {provider:'spotify',sourceCanonicalUrl:track,fetchedAt:'2026-07-16T12:00:00.000Z',assetRef:'image-auto-10x10-webp',sha256:'a'.repeat(64),method:'spotify-oembed-v1'}

function link(overrides: Partial<CliLinkDocument> = {}): CliLinkDocument { return {_id:'link1',_rev:'rev1',_type:'link',_updatedAt:'2026-07-16T12:00:00Z',title:'Example',url:track,...overrides} }
function success() { return {ok:true as const,documentId:'drafts.link1',assetId:'image-new-10x10-webp',sha256:'b'.repeat(64),width:600,height:600,byteLength:1234} }

function harness(options: {documents?: CliLinkDocument[]; args?: string[]; answers?: string[]; config?: SpotifyThumbnailCliDependencies['config']} = {}) {
  const documents = options.documents ?? [link({_id:'drafts.link1'})]
  const store = new Map(documents.map((document) => [document._id, structuredClone(document)]))
  const output: string[] = []; const prompts: string[] = []; const generated: Parameters<SpotifyThumbnailCliDependencies['generate']>[0][] = []; const creates: Record<string, unknown>[] = []
  const answers = [...(options.answers ?? ['y'])]
  const dependencies: SpotifyThumbnailCliDependencies = {
    config: options.config ?? {projectId:'c6w1fv0f',dataset:'tkp-v2',token:'secret-token'},
    args: options.args ?? [],
    client: {
      fetch: async <T,>() => [...store.values()].map((value) => structuredClone(value)) as T,
      getDocument: async <T,>(id:string) => structuredClone(store.get(id)) as T | undefined,
      createIfNotExists: async <T extends Record<string, unknown>>(document:T) => { creates.push(structuredClone(document)); if(!store.has(String(document._id))) store.set(String(document._id), {...document,_rev:'draft-rev',_createdAt:'2026-07-16T12:00:00Z',_updatedAt:'2026-07-16T12:00:00Z'} as unknown as CliLinkDocument); return document },
    },
    prompt: async (question) => { prompts.push(question); return answers.shift() ?? '' },
    write: (message) => output.push(message),
    generate: async (command) => { generated.push(command); return success() },
  }
  return {dependencies,store,output,prompts,generated,creates}
}

test('configuration and authentication guards fail before any query or provider work', async (t) => {
  assert.deepEqual(validateCliContext({projectId:'c6w1fv0f',dataset:'tkp-v2',token:'x'}),{ok:true})
  for (const [config,reason] of [[{dataset:'tkp-v2',token:'x'},'missing-project'],[{projectId:'wrong',dataset:'tkp-v2',token:'x'},'wrong-project'],[{projectId:'c6w1fv0f',token:'x'},'missing-dataset'],[{projectId:'c6w1fv0f',dataset:'wrong',token:'x'},'wrong-dataset'],[{projectId:'c6w1fv0f',dataset:'tkp-v2'},'not-authenticated']] as const) {
    await t.test(reason, async () => { const h=harness({config}); let queries=0; h.dependencies.client.fetch=async<T,>()=>{queries++;return [] as T}; const result=await runSpotifyThumbnailCli(h.dependencies); assert.deepEqual(result,{ok:false,reason}); assert.equal(queries,0); assert.equal(h.generated.length,0); assert.equal(h.output.join('\n').includes('secret-token'),false) })
  }
})

test('candidate discovery strictly parses, deduplicates, prefers drafts, sorts, and labels state', () => {
  const documents = [
    link({_id:'newer',title:'Zulu',_updatedAt:'2026-07-17T00:00:00Z',url:album}),
    link({_id:'link1',title:'Published'}), link({_id:'drafts.link1',title:'Draft',_rev:'draftrev'}),
    link({_id:'drafts.onlydraft',title:'  ',url:album}),
    link({_id:'playlist',url:'https://open.spotify.com/playlist/4uLU6hMCjMI75M1A2tKUQC'}),
    link({_id:'artist',url:'https://open.spotify.com/artist/4uLU6hMCjMI75M1A2tKUQC'}), link({_id:'website',url:'https://example.com'}), link({_id:'bad',url:'not a url'}), link({_id:'missing',url:undefined}),
  ]
  const candidates=buildSpotifyThumbnailCandidates(documents)
  assert.equal(candidates.length,3); assert.equal(candidates[0].canonicalId,'newer'); assert.equal(candidates[0].entityType,'album'); assert.equal(candidates[0].documentState,'published-only')
  assert.equal(candidates[1].title,'Draft'); assert.equal(candidates[1].document._rev,'draftrev'); assert.equal(candidates[1].documentState,'draft')
  assert.equal(candidates[2].title,'Untitled Link'); assert.equal(candidates[2].documentState,'draft-only')
  const states=buildSpotifyThumbnailCandidates([link(),link({_id:'manual',thumbnail:{asset:{_ref:'image-manual-10x10-webp'}}}),link({_id:'auto',thumbnail:{asset:{_ref:automatic.assetRef}},thumbnailAutomation:automatic}),link({_id:'stale',thumbnail:{asset:{_ref:automatic.assetRef}},thumbnailAutomation:{...automatic,sourceCanonicalUrl:album}})])
  assert.deepEqual(Object.fromEntries(states.map((item)=>[item.canonicalId,item.thumbnailState])),{link1:'none',manual:'manual',auto:'automatic',stale:'stale'})
})

test('document argument and ID normalization accept one exact ID only', () => {
  assert.deepEqual(parseDocumentArgument([]),{ok:true}); assert.deepEqual(parseDocumentArgument(['--document-id','drafts.link1']),{ok:true,canonicalId:'link1'})
  for(const args of [['--document-id'],['--document-id','a','--document-id','b'],['--document-id','a*'],['--document-id','a?x'],['--source-url',track],['a']]) assert.deepEqual(parseDocumentArgument(args),{ok:false})
  assert.equal(normalizeDocumentId('link.abc-1'),'link.abc-1'); assert.equal(normalizeDocumentId('drafts.link.abc-1'),'link.abc-1'); assert.equal(normalizeDocumentId('drafts.drafts.bad'),null)
})

test('interactive selection cancels or rejects without generation', async () => {
  for(const answer of ['', 'q', 'Q', '0', '2', '1,2', 'all', '1-2']) { const h=harness({answers:[answer]}); const result=await runSpotifyThumbnailCli(h.dependencies); assert.equal(result.ok,false); assert.equal(h.generated.length,0) }
  const h=harness({answers:['1','n']}); await runSpotifyThumbnailCli(h.dependencies); assert.equal(h.generated.length,0); assert.equal(h.creates.length,0)
})

test('exact document argument selects one and still requires confirmation', async () => {
  const h=harness({documents:[link({_id:'drafts.link1'}),link({_id:'drafts.link2',title:'Two'})],args:['--document-id','link2'],answers:['y']})
  const result=await runSpotifyThumbnailCli(h.dependencies); assert.equal(result.ok,true); assert.equal(h.generated.length,1); assert.equal(h.generated[0].documentId,'drafts.link2'); assert.equal(h.output.join('\n').includes('Two'),true)
  const missing=harness({args:['--document-id','missing'],answers:['y']}); assert.deepEqual(await runSpotifyThumbnailCli(missing.dependencies),{ok:false,reason:'document-not-found'}); assert.equal(missing.generated.length,0)
  const playlist=harness({documents:[link({_id:'playlist',url:'https://open.spotify.com/playlist/4uLU6hMCjMI75M1A2tKUQC'})],args:['--document-id','playlist']}); assert.deepEqual(await runSpotifyThumbnailCli(playlist.dependencies),{ok:false,reason:'spotify-playlist-unsupported'}); assert.equal(playlist.generated.length,0)
})

test('confirmation and overwrite protection require exact words before provider work', async () => {
  const cases: Array<[CliLinkDocument,string,boolean,boolean]> = [
    [link({_id:'drafts.link1'}),'y',true,false], [link({_id:'drafts.link1'}),'Yes',true,false], [link({_id:'drafts.link1'}),'Y',true,false], [link({_id:'drafts.link1'}),'',false,false],
    [link({_id:'drafts.link1',thumbnail:{asset:{_ref:'image-manual-10x10-webp'}}}),'REPLACE',true,true], [link({_id:'drafts.link1',thumbnail:{asset:{_ref:'image-manual-10x10-webp'}}}),'replace',false,false],
    [link({_id:'drafts.link1',thumbnail:{asset:{_ref:'image-manual-10x10-webp'}}}),' REPLACE ',false,false],
    [link({_id:'drafts.link1',thumbnail:{asset:{_ref:automatic.assetRef}},thumbnailAutomation:automatic}),'REFRESH',true,true], [link({_id:'drafts.link1',thumbnail:{asset:{_ref:automatic.assetRef}},thumbnailAutomation:automatic}),'yes',false,false],
    [link({_id:'drafts.link1',thumbnail:{asset:{_ref:automatic.assetRef}},thumbnailAutomation:automatic}),' REFRESH ',false,false],
    [link({_id:'drafts.link1',thumbnail:{asset:{_ref:automatic.assetRef}},thumbnailAutomation:{...automatic,sourceCanonicalUrl:album}}),'REPLACE',true,true],
    [link({_id:'drafts.link1',thumbnail:{asset:{_ref:'image-other-10x10-webp'}},thumbnailAutomation:automatic}),'REPLACE',true,true],
  ]
  for(const [document,answer,runs,replacementConfirmed] of cases){const h=harness({documents:[document],answers:['1',answer]});await runSpotifyThumbnailCli(h.dependencies);assert.equal(h.generated.length,runs?1:0);if(runs)assert.equal(h.generated[0].replacementConfirmed,replacementConfirmed)}
})

test('draft handling reuses drafts and creates published-only draft without publishing', async () => {
  const existing=harness({answers:['1','y']}); await runSpotifyThumbnailCli(existing.dependencies); assert.equal(existing.creates.length,0); assert.equal(existing.generated[0].documentId,'drafts.link1')
  const published=link({note:'preserved',publishedAt:'2026-01-01T00:00:00Z'}); const h=harness({documents:[published],answers:['1','y']}); const original=structuredClone(h.store.get('link1')); await runSpotifyThumbnailCli(h.dependencies)
  assert.equal(h.creates.length,1); assert.equal(h.creates[0]._id,'drafts.link1'); assert.equal(h.creates[0]._rev,undefined); assert.equal(h.creates[0]._createdAt,undefined); assert.equal(h.creates[0]._updatedAt,undefined); assert.equal(h.creates[0].note,'preserved'); assert.equal(h.creates[0].publishedAt,'2026-01-01T00:00:00Z')
  assert.deepEqual(h.store.get('link1'),original); assert.equal(h.store.has('drafts.link1'),true); assert.equal(h.generated[0].documentId,'drafts.link1')
})

test('concurrent draft creation is idempotent and selected document is re-read', async () => {
  const h=harness({documents:[link()],answers:['1','y']}); let draftReads=0; const originalGet=h.dependencies.client.getDocument.bind(h.dependencies.client)
  h.dependencies.client.getDocument=async<T,>(id:string)=>{if(id==='drafts.link1'&&++draftReads===1)return undefined;return originalGet<T>(id)}
  assert.equal((await runSpotifyThumbnailCli(h.dependencies)).ok,true); assert.equal(h.creates.length,1); assert.equal(h.generated.length,1); assert.ok(draftReads>=3)
})

test('revision, source, thumbnail, and provenance changes stop before generation', async () => {
  for(const change of ['revision','source','thumbnail','provenance']) { const h=harness({answers:['1','y']}); let reads=0; const original=h.dependencies.client.getDocument.bind(h.dependencies.client); h.dependencies.client.getDocument=async<T,>(id:string)=>{const doc=await original<CliLinkDocument>(id);if(doc&&++reads>=1){if(change==='revision')doc._rev='changed';if(change==='source')doc.url=album;if(change==='thumbnail')doc.thumbnail={asset:{_ref:'image-other-10x10-webp'}};if(change==='provenance')doc.thumbnailAutomation=automatic}return doc as T}; const result=await runSpotifyThumbnailCli(h.dependencies); assert.equal(result.ok,false); assert.equal(h.generated.length,0) }
})

test('orchestration receives one current draft and success output gives review instruction', async () => {
  const h=harness({documents:[link({_id:'drafts.album1',url:album,title:'Album'})],answers:['1','y']}); const result=await runSpotifyThumbnailCli(h.dependencies)
  assert.equal(result.ok,true); assert.equal(h.generated.length,1); assert.equal(h.generated[0].expectedRevision,'rev1'); assert.equal(h.generated[0].sourceCanonicalUrl,album); assert.equal(h.output.join('\n').includes('Dimensions: 600 × 600'),true); assert.equal(h.output.join('\n').includes('review and publish'),true); assert.equal(h.output.join('\n').includes('secret-token'),false)
})

test('provider, upload, conflict, and unexpected failures map to redacted output', async () => {
  for(const reason of ['provider-not-found','provider-rate-limited','provider-timeout','no-thumbnail','unsafe-provider-response','thumbnail-download-failed','thumbnail-too-large','thumbnail-processing-failed','sanity-upload-failed','document-conflict','document-patch-failed'] as const){const h=harness({answers:['1','y']});h.dependencies.generate=async()=>({ok:false,reason});const result=await runSpotifyThumbnailCli(h.dependencies);assert.deepEqual(result,{ok:false,reason});assert.equal(h.output.join('\n').includes('secret-token'),false);assert.equal(errorMessage(reason).includes('Error:'),false)}
  assert.equal(errorMessage('unexpected-secret-value').includes('unexpected-secret-value'),false)
})

test('command composition uses authenticated Sanity exec without browser or endpoint additions', async () => {
  const packageJson=JSON.parse(await readFile('package.json','utf8')) as {scripts:Record<string,string>}
  assert.equal(packageJson.scripts['thumbnail:spotify'],'sanity exec scripts/generate-spotify-thumbnail.ts --with-user-token')
  const wrapper=await readFile('scripts/generate-spotify-thumbnail.ts','utf8'); assert.match(wrapper,/getCliClient/); assert.match(wrapper,/process\.exitCode = 1/); assert.doesNotMatch(wrapper,/SANITY_AUTH_TOKEN|process\.env|robot|Bearer/)
  const routes=await import('node:fs/promises').then(({readdir})=>readdir('src/app/api',{recursive:true})); assert.equal(routes.some((name)=>/spotify|thumbnail/i.test(String(name))),false)
})
