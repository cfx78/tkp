import dynamicImport from 'next/dynamic';

export const dynamic = 'force-static';

const StudioClient = dynamicImport(() => import('@/src/components/studio-client'), { ssr: false });

export default function StudioPage() {
  return <StudioClient />;
}
