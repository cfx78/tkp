import { sanityClient } from './client';

export async function fetchSanity<T>(query: string, fallback: T): Promise<T> {
  try {
    return await sanityClient.fetch<T>(query, {}, { next: { revalidate: 60 } });
  } catch {
    console.warn('Sanity content unavailable; rendering the configured fallback.');
    return fallback;
  }
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
