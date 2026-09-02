import { DEFAULT_DOG_EDITORIAL_PROFILES, getDefaultDogEditorial, type DogEditorialProfile } from '../data/dogEditorialProfiles.ts';

const STORAGE_KEY = 'animalitos_dog_editorial_v1';
const SPONSORSHIP_KEY = 'animalitos_sponsorship_intents_v1';
export const DOG_EDITORIAL_EVENT = 'animalitos_dog_editorial_updated';

export type SponsorshipIntent = {
  id: string;
  dog_slug: string;
  dog_name: string;
  supporter_name: string;
  supporter_email: string;
  supporter_phone: string;
  amount_usd: number | null;
  frequency: 'once' | 'monthly';
  message: string;
  created_at: string;
};

function readOverrides(): Record<string, Partial<DogEditorialProfile>> {
  if (typeof window === 'undefined') return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, Partial<DogEditorialProfile>> : {};
  } catch {
    return {};
  }
}

export function getDogEditorial(slug: string): DogEditorialProfile | undefined {
  const base = getDefaultDogEditorial(slug);
  if (!base) return undefined;
  const override = readOverrides()[slug];
  return override ? { ...base, ...override, slug, timeline: override.timeline?.length ? override.timeline : base.timeline, gallery_urls: override.gallery_urls?.length ? override.gallery_urls : base.gallery_urls } : base;
}

export function getAllDogEditorial(): DogEditorialProfile[] {
  return DEFAULT_DOG_EDITORIAL_PROFILES.map((profile) => getDogEditorial(profile.slug) || profile);
}

export function saveDogEditorial(profile: DogEditorialProfile): void {
  if (typeof window === 'undefined') return;
  const overrides = readOverrides();
  overrides[profile.slug] = profile;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(DOG_EDITORIAL_EVENT, { detail: { slug: profile.slug } }));
  window.dispatchEvent(new Event('animalitos_store_updated'));
}

export function resetDogEditorial(slug: string): void {
  if (typeof window === 'undefined') return;
  const overrides = readOverrides();
  delete overrides[slug];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(DOG_EDITORIAL_EVENT, { detail: { slug } }));
}

export function saveSponsorshipIntent(intent: SponsorshipIntent): void {
  if (typeof window === 'undefined') return;
  const existing = getSponsorshipIntents();
  window.localStorage.setItem(SPONSORSHIP_KEY, JSON.stringify([intent, ...existing].slice(0, 100)));
  window.dispatchEvent(new Event(DOG_EDITORIAL_EVENT));
}

export function getSponsorshipIntents(): SponsorshipIntent[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SPONSORSHIP_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is SponsorshipIntent => Boolean(item && typeof item === 'object' && 'id' in item)) : [];
  } catch {
    return [];
  }
}
