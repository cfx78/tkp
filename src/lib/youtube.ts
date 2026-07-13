const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const STANDARD_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const SHORT_HOST = 'youtu.be';
const PRIVATE_EMBED_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com']);

export function getYouTubeEmbedUrl(url?: string, embedUrl?: string): string | null {
  for (const candidate of [embedUrl, url]) {
    const videoId = parseYouTubeVideoId(candidate);
    if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  return null;
}

function parseYouTubeVideoId(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    let videoId: string | null = null;

    if (host === SHORT_HOST && parts.length === 1) videoId = parts[0];
    if (STANDARD_HOSTS.has(host)) {
      if (url.pathname === '/watch') videoId = url.searchParams.get('v');
      else if (parts.length === 2 && (parts[0] === 'shorts' || parts[0] === 'embed')) videoId = parts[1];
    }
    if (PRIVATE_EMBED_HOSTS.has(host) && parts.length === 2 && parts[0] === 'embed') videoId = parts[1];

    return videoId && YOUTUBE_VIDEO_ID.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}
