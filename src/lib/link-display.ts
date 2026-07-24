export function externalDestinationLabel(value: string | undefined, fallback = 'External link') {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
    return url.hostname.replace(/^www\./i, '') || fallback;
  } catch {
    return fallback;
  }
}
