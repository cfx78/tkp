import { getSpotifyPlaylistEmbedUrl } from '@/src/lib/spotify';

type SpotifyPlaylistEmbedProps = {
  title: string;
  spotifyUrl?: string;
  spotifyEmbedUrl?: string;
};

export function SpotifyPlaylistEmbed({ title, spotifyUrl, spotifyEmbedUrl }: SpotifyPlaylistEmbedProps) {
  const embedUrl = getSpotifyPlaylistEmbedUrl(spotifyUrl, spotifyEmbedUrl);

  if (!embedUrl) {
    return <p className="mt-3 text-sm text-mist/50">Spotify preview unavailable.</p>;
  }

  return (
    <iframe
      className="mt-4 h-[152px] w-full rounded-xl border-0"
      src={embedUrl}
      title={`${title} on Spotify`}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  );
}
