import {createInterface} from 'node:readline/promises'
import {stdin, stdout} from 'node:process'
import {getCliClient} from 'sanity/cli'
// @ts-expect-error Sanity exec runs TypeScript directly and requires extensions.
import {runSpotifyThumbnailCli, type CliSanityClient} from '../src/lib/cli/spotify-thumbnail-cli.ts'
// @ts-expect-error Sanity exec runs TypeScript directly and requires extensions.
import {generateSpotifyThumbnail} from '../src/lib/server/generate-spotify-thumbnail.ts'

async function main() {
  const client = getCliClient({apiVersion: '2024-01-01', useCdn: false})
  const config = client.config()
  const readline = createInterface({input: stdin, output: stdout})
  try {
    const result = await runSpotifyThumbnailCli({
      config: {projectId: config.projectId, dataset: config.dataset, token: config.token},
      client: client as unknown as CliSanityClient,
      args: process.argv.slice(2),
      prompt: (question) => readline.question(question),
      write: (message) => console.log(message),
      generate: (command) => generateSpotifyThumbnail(command, {
        client,
        onProgress: (stage) => console.log({metadata: 'Requesting Spotify metadata…', download: 'Downloading artwork…', sanitize: 'Sanitizing image…', upload: 'Uploading to Sanity…', patch: 'Updating draft…'}[stage]),
      }),
    })
    if (!result.ok) process.exitCode = 1
  } catch {
    console.error('The thumbnail operation failed unexpectedly. No changes should be assumed; rerun the command to inspect the draft.')
    process.exitCode = 1
  } finally {
    readline.close()
  }
}

void main()
