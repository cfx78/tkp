'use client';

import type { SanityImageSource } from '@sanity/image-url';
import { urlFor } from '@/src/sanity/lib/image';
import { MediaArtwork } from './presentation-primitives';
import { useSensitiveAction, type SensitiveIdentity } from './content-warning-action';

export function SensitiveSanityArtwork({ identity, source, fallbackUrl, size = 'feature', className }: { identity: SensitiveIdentity; source?: SanityImageSource; fallbackUrl?: string; size?: 'compact' | 'row' | 'feature'; className?: string }) {
  const { approved } = useSensitiveAction(identity, 'reveal this artwork');
  const src = approved && source ? urlFor(source).width(1200).height(1200).fit('crop').auto('format').url() : identity.nsfw ? undefined : fallbackUrl;
  return <MediaArtwork src={src} alt="" size={size} className={className} />;
}
