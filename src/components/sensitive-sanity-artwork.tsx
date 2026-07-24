'use client';

import type { SanityImageSource } from '@sanity/image-url';
import { urlFor } from '@/src/sanity/lib/image';
import { MediaArtwork } from './presentation-primitives';
import { useSensitiveAction, type SensitiveIdentity } from './content-warning-action';

export function SensitiveSanityArtwork({ identity, source, fallbackUrl, size = 'feature', fit = 'cover', className }: { identity: SensitiveIdentity; source?: SanityImageSource; fallbackUrl?: string; size?: 'compact' | 'row' | 'feature'; fit?: 'cover' | 'contain'; className?: string }) {
  const { approved } = useSensitiveAction(identity, 'reveal this artwork');
  const image = approved && source ? urlFor(source).width(1200) : undefined;
  const src = image ? (fit === 'contain' ? image.fit('max') : image.height(1200).fit('crop')).auto('format').url() : identity.nsfw ? undefined : fallbackUrl;
  return <MediaArtwork src={src} alt="" size={size} fit={fit} className={className} />;
}
