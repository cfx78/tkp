import dynamic from 'next/dynamic';

export { metadata, viewport } from 'next-sanity/studio';

const StudioClient = dynamic(() => import('@/src/components/studio-client'), { ssr: false });

export default function StudioPage() {
  return <StudioClient />;
}
