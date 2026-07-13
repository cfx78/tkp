const SPOTIFY_HOST = 'open.spotify.com';

export function getSpotifyPlaylistEmbedUrl(spotifyUrl?: string, spotifyEmbedUrl?: string): string | null {
  const explicitEmbed = parseSpotifyPlaylistUrl(spotifyEmbedUrl, true);
  if (explicitEmbed) return `https://${SPOTIFY_HOST}/embed/playlist/${explicitEmbed.id}`;

  const playlist = parseSpotifyPlaylistUrl(spotifyUrl, false);
  if (!playlist) return null;

  return `https://${SPOTIFY_HOST}/embed/playlist/${playlist.id}`;
}

function parseSpotifyPlaylistUrl(value: string | undefined, requireEmbed: boolean) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== SPOTIFY_HOST) return null;

    const parts = url.pathname.split('/').filter(Boolean);
    const offset = parts[0] === 'embed' ? 1 : 0;
    if (requireEmbed && offset !== 1) return null;
    if (parts[offset] !== 'playlist' || !parts[offset + 1]) return null;

    return { id: parts[offset + 1] };
  } catch {
    return null;
  }
}
