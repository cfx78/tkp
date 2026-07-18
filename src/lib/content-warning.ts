export const CONTENT_APPROVAL_VALUE = 'v1';
export const CONTENT_APPROVAL_EVENT = 'kp-content-approval-change';

export const contentWarningTypes = ['beat', 'version', 'release', 'link', 'playlist', 'log', 'quote', 'fixation', 'rabbit-hole-item', 'media-preview'] as const;
export type ContentWarningType = typeof contentWarningTypes[number];

export type ContentWarningRequest = {
  contentType: ContentWarningType;
  documentId: string;
  title?: string;
  reason?: string;
  intendedAction: string;
  rememberApproval?: boolean;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const allowedTypes = new Set<string>(contentWarningTypes);
const documentIdPattern = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;

export function normalizePublicDocumentId(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('drafts.') ? trimmed.slice(7) : trimmed;
  return normalized && normalized.length <= 256 && documentIdPattern.test(normalized) ? normalized : null;
}

export function contentApprovalKey(contentType: string, documentId: string) {
  const type = contentType.trim().toLowerCase();
  const id = normalizePublicDocumentId(documentId);
  return allowedTypes.has(type) && id ? `kp_nsfw_approved:${type}:${id}` : null;
}

export function isContentApprovalKey(value: string) {
  const match = /^kp_nsfw_approved:([^:]+):(.+)$/.exec(value);
  return Boolean(match && contentApprovalKey(match[1], match[2]) === value);
}

export function readContentApproval(contentType: string, documentId: string, storage = browserStorage()) {
  const key = contentApprovalKey(contentType, documentId);
  if (!key || !storage) return false;
  try { return storage.getItem(key) === CONTENT_APPROVAL_VALUE; } catch { return false; }
}

export function writeContentApproval(contentType: string, documentId: string, storage = browserStorage()) {
  const key = contentApprovalKey(contentType, documentId);
  if (!key || !storage) return false;
  try { storage.setItem(key, CONTENT_APPROVAL_VALUE); notifyContentApproval(key); return true; } catch { return false; }
}

export function clearContentApproval(contentType: string, documentId: string, storage = browserStorage()) {
  const key = contentApprovalKey(contentType, documentId);
  if (!key || !storage) return false;
  try { storage.removeItem(key); notifyContentApproval(key); return true; } catch { return false; }
}

export function subscribeContentApproval(contentType: string, documentId: string, listener: () => void) {
  const key = contentApprovalKey(contentType, documentId);
  if (!key || typeof window === 'undefined') return () => {};
  const sameTab = (event: Event) => { if (event instanceof CustomEvent && event.detail === key) listener(); };
  const otherTab = (event: StorageEvent) => { if (event.key === key) listener(); };
  window.addEventListener(CONTENT_APPROVAL_EVENT, sameTab);
  window.addEventListener('storage', otherTab);
  return () => { window.removeEventListener(CONTENT_APPROVAL_EVENT, sameTab); window.removeEventListener('storage', otherTab); };
}

export function warningLabel(type: ContentWarningType) {
  return ({ beat: 'Beat', version: 'Version', release: 'Release', link: 'Link', playlist: 'Playlist', log: 'Log', quote: 'Quote', fixation: 'Fixation', 'rabbit-hole-item': 'Rabbit Hole item', 'media-preview': 'Media preview' } as const)[type];
}

export async function runAfterContentApproval(requestApproval: () => boolean | Promise<boolean>, action: () => void | Promise<void>) {
  if (!await requestApproval()) return false;
  await action();
  return true;
}

function browserStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  try { return window.localStorage; } catch { return undefined; }
}

function notifyContentApproval(key: string) {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new CustomEvent(CONTENT_APPROVAL_EVENT, { detail: key })); } catch { /* Approval remains stored even if events are unavailable. */ }
}
