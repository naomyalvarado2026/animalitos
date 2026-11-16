import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';

export function merchandiseDogName(slug: string) {
  return REFUGE_DOG_PROFILES.find((dog) => dog.adoption_slug === slug)?.name
    ?? slug.split('-').map((word) => word.charAt(0).toLocaleUpperCase('es') + word.slice(1)).join(' ');
}

export function dogProductUrl(dogSlug: string, productSlug?: string) {
  const params = new URLSearchParams({ perrito: dogSlug });
  if (productSlug) params.set('producto', productSlug);
  return `/tienda?${params.toString()}`;
}
