import { REFUGE_DOG_PROFILES, type RefugeDogSeed } from '../data/refugeDogProfiles.ts';
import type { Animal } from '../types/index.ts';

const LOCAL_PROFILE_PREFIX = 'refuge-profile:';
const CONTENT_BASELINE_DATE = '2026-09-02T00:00:00.000Z';

function seedToAnimal(profile: RefugeDogSeed): Animal {
  return {
    ...profile,
    id: `${LOCAL_PROFILE_PREFIX}${profile.adoption_slug}`,
    rescue_date: '',
    created_at: CONTENT_BASELINE_DATE,
    updated_at: CONTENT_BASELINE_DATE,
  };
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function mergeProfile(local: Animal, remote: Animal): Animal {
  const isEditorialProfile = hasText(remote.adoption_slug)
    && hasText(remote.personality_summary)
    && typeof remote.sort_order === 'number';

  if (!isEditorialProfile) {
    return {
      ...remote,
      ...local,
      id: remote.id,
      created_at: remote.created_at || local.created_at,
      updated_at: remote.updated_at || local.updated_at,
    };
  }

  return {
    ...local,
    ...remote,
    description: hasText(remote.description) ? remote.description : local.description,
    story: hasText(remote.story) ? remote.story : local.story,
    health_status: hasText(remote.health_status) ? remote.health_status : local.health_status,
    personality_summary: hasText(remote.personality_summary) ? remote.personality_summary : local.personality_summary,
    ideal_home: hasText(remote.ideal_home) ? remote.ideal_home : local.ideal_home,
    compatibility_notes: hasText(remote.compatibility_notes) ? remote.compatibility_notes : local.compatibility_notes,
    main_image_url: hasText(remote.main_image_url) ? remote.main_image_url : local.main_image_url,
    gallery_urls: remote.gallery_urls?.length ? remote.gallery_urls : local.gallery_urls,
    adoption_slug: hasText(remote.adoption_slug) ? remote.adoption_slug : local.adoption_slug,
    brand_message: hasText(remote.brand_message) ? remote.brand_message : local.brand_message,
  };
}

function profileKey(animal: Pick<Animal, 'name' | 'adoption_slug'>): string {
  return (animal.adoption_slug || animal.name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}

export const LOCAL_REFUGE_DOGS: Animal[] = REFUGE_DOG_PROFILES.map(seedToAnimal);

/**
 * Keeps verified refuge stories visible even when Supabase is unavailable.
 * A database profile with the same slug always wins and becomes fully actionable.
 */
export function mergeRefugeDogs(remoteAnimals: Animal[] = []): Animal[] {
  const remoteByKey = new Map(remoteAnimals.map((animal) => [profileKey(animal), animal]));
  const localKeys = new Set<string>();
  const knownProfiles = LOCAL_REFUGE_DOGS.map((local) => {
    const key = profileKey(local);
    localKeys.add(key);
    const remote = remoteByKey.get(key);
    return remote ? mergeProfile(local, remote) : local;
  });
  const remoteOnly = remoteAnimals.filter((animal) =>
    !localKeys.has(profileKey(animal))
    && animal.is_published === true
    && hasText(animal.personality_summary),
  );

  return [...knownProfiles, ...remoteOnly].sort((a, b) => {
    const orderDelta = (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER);
    return orderDelta || a.name.localeCompare(b.name, 'es');
  });
}

export function isLocalRefugeDog(animal: Pick<Animal, 'id'>): boolean {
  return animal.id.startsWith(LOCAL_PROFILE_PREFIX);
}
