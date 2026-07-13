import { sanityClient } from './client';

export async function fetchSanity<T>(query: string, fallback: T, params: Record<string, unknown> = {}): Promise<T> {
  try {
    return await sanityClient.fetch<T>(query, params, { cache: 'no-store' });
  } catch (error) {
    if (isNextDynamicSignal(error)) throw error;
    console.error('Sanity content request failed; rendering the configured fallback.', error);
    return fallback;
  }
}

function isNextDynamicSignal(error: unknown): error is { digest: string } {
  return typeof error === 'object' && error !== null && 'digest' in error && error.digest === 'DYNAMIC_SERVER_USAGE';
}

export type ImageValue = {
  asset?: { url?: string };
};

export type FixationSummary = {
  _id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  status?: 'active' | 'sleeping' | 'archived';
  isCore?: boolean;
  coverImage?: ImageValue;
};

export type HomepageSettings = {
  currentPhaseText?: string;
  featuredFixations?: FixationSummary[];
  releaseAnnouncement?: {
    enabled?: boolean;
    headline?: string;
    startAt?: string;
    endAt?: string;
    release?: { _id: string; title: string; slug?: string };
  };
};
