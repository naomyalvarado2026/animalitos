export const PRODUCT_GALLERY_LIMIT = 8;
export const PRODUCT_IMAGE_BUCKET = 'merchandise-product-photos';

export type MerchandiseVariantOption = {
  id: string;
  name: string;
  sizeLabel?: string | null;
  hex: string;
  image: string;
  inventory: number;
  priceDelta: number;
};

export type MerchandiseColorOption = {
  key: string;
  name: string;
  hex: string;
  variants: MerchandiseVariantOption[];
};

export type MerchandiseProduct = {
  slug: string;
  name: string;
  category: string;
  description: string;
  details: readonly string[];
  galleryImages: string[];
  image: string;
  isLive: boolean;
  priceCents: number;
  price: string;
  inventory: number;
  variants: MerchandiseVariantOption[];
};

export function isSupportedProductImageUrl(value: string) {
  return /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//'));
}

export function parseProductImageUrls(value: string) {
  return [...new Set(value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
}

export function normalizeProductImageUrls(values: readonly (string | null | undefined)[]) {
  return [...new Set(values.map((value) => value?.trim() ?? '').filter(isSupportedProductImageUrl))]
    .slice(0, PRODUCT_GALLERY_LIMIT);
}

export function splitVariantLabel(variant: Pick<MerchandiseVariantOption, 'name' | 'sizeLabel'>) {
  const name = variant.name.trim();
  const sizeLabel = variant.sizeLabel?.trim();
  if (sizeLabel) {
    const suffix = `· ${sizeLabel}`;
    return { colorName: name.endsWith(suffix) ? name.slice(0, -suffix.length).trim() || name : name, sizeLabel };
  }

  const separator = name.lastIndexOf(' · ');
  if (separator > 0 && separator < name.length - 3) {
    return { colorName: name.slice(0, separator).trim(), sizeLabel: name.slice(separator + 3).trim() || null };
  }
  return { colorName: name, sizeLabel: null };
}

export function getVariantColorKey(variant: MerchandiseVariantOption) {
  const { colorName } = splitVariantLabel(variant);
  return `${colorName.toLocaleLowerCase('es')}|${variant.hex.toLowerCase()}`;
}

export function getColorOptions(variants: readonly MerchandiseVariantOption[]): MerchandiseColorOption[] {
  const options = new Map<string, MerchandiseColorOption>();
  for (const variant of variants) {
    const { colorName } = splitVariantLabel(variant);
    const key = getVariantColorKey(variant);
    const existing = options.get(key);
    if (existing) existing.variants.push(variant);
    else options.set(key, { key, name: colorName, hex: variant.hex, variants: [variant] });
  }
  return [...options.values()];
}

export function buildVariantLabel(colorName: string, sizeLabel: string) {
  return [colorName.trim(), sizeLabel.trim()].filter(Boolean).join(' · ');
}

export function normalizeCatalogSearch(value: string) {
  return value.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
