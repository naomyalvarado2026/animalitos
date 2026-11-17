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

export function productInquiryUrl(productName: string, dogSlugs: string[] = []) {
  const params = new URLSearchParams({ producto: productName.slice(0, 100) });
  const dogs = dogSlugs.map(merchandiseDogName).join(', ');
  if (dogs) params.set('perrito', dogs.slice(0, 160));
  return `/contacto?${params.toString()}`;
}
