import type { ContentWarningType } from './content-warning.ts';

export type RevealIdentity = { id?: string; type: ContentWarningType; nsfw?: boolean };

export function canRevealSensitiveValue(identity: RevealIdentity, approved: boolean) {
  return identity.nsfw !== true || Boolean(identity.id && approved);
}

export function revealedValue<T>(identity: RevealIdentity, approved: boolean, value: T) {
  return canRevealSensitiveValue(identity, approved) ? value : undefined;
}

export function revealIdentityKey(identity: RevealIdentity) {
  return identity.id ? `${identity.type}:${identity.id.replace(/^drafts\./, '')}` : undefined;
}
