import StudioClient from '@/src/components/studio-client';

export { metadata, viewport } from 'next-sanity/studio';

export default function StudioPage() {
  return <StudioClient />;
}
