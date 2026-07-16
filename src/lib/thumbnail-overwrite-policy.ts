export type ThumbnailAutomationProvenance = {
  provider?: string;
  sourceCanonicalUrl?: string;
  fetchedAt?: string;
  assetRef?: string;
  sha256?: string;
  method?: string;
};

export type ThumbnailProvenanceState =
  | 'absent'
  | 'valid-current-automatic'
  | 'stale-source'
  | 'asset-replaced'
  | 'malformed';

export type ThumbnailOverwriteInput = {
  currentThumbnailAssetRef?: string;
  currentSourceUrl?: string;
  provenance?: ThumbnailAutomationProvenance | null;
  replacementConfirmed?: boolean;
};

const SHA256 = /^[a-f0-9]{64}$/;
const SANITY_IMAGE_ASSET = /^image-[A-Za-z0-9]+-\d+x\d+-[A-Za-z0-9]+$/;
const PROVIDER = /^[a-z][a-zA-Z0-9]{1,31}$/;
const METHOD = /^[a-z][a-z0-9-]{1,63}$/;

export function classifyThumbnailProvenance(input: ThumbnailOverwriteInput): ThumbnailProvenanceState {
  if (!input.provenance) return 'absent';
  if (!isValidProvenance(input.provenance)) return 'malformed';
  if (!sameCanonicalUrl(input.currentSourceUrl, input.provenance.sourceCanonicalUrl)) return 'stale-source';
  if (!input.currentThumbnailAssetRef || input.currentThumbnailAssetRef !== input.provenance.assetRef) return 'asset-replaced';
  return 'valid-current-automatic';
}

export function decideThumbnailOverwrite(input: ThumbnailOverwriteInput) {
  const state = classifyThumbnailProvenance(input);
  if (!input.currentThumbnailAssetRef) {
    return { allowed: true, requiresConfirmation: false, state, reason: 'no-current-thumbnail' as const };
  }
  if (input.replacementConfirmed === true) {
    return { allowed: true, requiresConfirmation: false, state, reason: 'replacement-confirmed' as const };
  }
  return {
    allowed: false,
    requiresConfirmation: true,
    state,
    reason: state === 'valid-current-automatic' ? 'automatic-refresh-needs-confirmation' as const : 'protected-thumbnail' as const,
  };
}

export function isValidProvenance(value: ThumbnailAutomationProvenance): value is Required<ThumbnailAutomationProvenance> {
  return Boolean(
    value.provider && PROVIDER.test(value.provider)
    && value.method && METHOD.test(value.method)
    && value.assetRef && SANITY_IMAGE_ASSET.test(value.assetRef)
    && value.sha256 && SHA256.test(value.sha256)
    && validHttpsUrl(value.sourceCanonicalUrl)
    && validTimestamp(value.fetchedAt),
  );
}

function sameCanonicalUrl(current?: string, fetched?: string) {
  if (!current || !fetched) return false;
  try {
    const currentUrl = new URL(current);
    const fetchedUrl = new URL(fetched);
    currentUrl.hash = '';
    fetchedUrl.hash = '';
    return currentUrl.protocol === 'https:' && currentUrl.toString() === fetchedUrl.toString();
  } catch {
    return false;
  }
}

function validHttpsUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

function validTimestamp(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value)));
}
