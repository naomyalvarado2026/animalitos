import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { normalizeProductImageUrls, type MerchandiseProduct } from '@/lib/merchandise';

/** The store and each dog's collection share the same published catalogue. */
export function useStoreProducts() {
  return useQuery({
    queryKey: ['public-store-products'],
    staleTime: 60_000,
    queryFn: async (): Promise<MerchandiseProduct[]> => {
      const { data, error } = await supabase.from('products')
        .select('slug, name, description, dog_slugs, price_cents, image_url, gallery_urls, inventory, is_proposal, category, characteristics, created_at, product_variants(id, label, size_label, color_hex, image_url, is_active, inventory, price_delta_cents)')
        .eq('is_active', true).eq('currency', 'USD').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((product) => {
        const galleryImages = normalizeProductImageUrls([...(product.gallery_urls ?? []), product.image_url]).map(assetUrl);
        const variants = (product.product_variants ?? []).filter((variant) => variant.is_active).map((variant) => ({
          id: variant.id, name: variant.label, sizeLabel: variant.size_label,
          hex: variant.color_hex || '#e0beff', image: variant.image_url ? assetUrl(variant.image_url) : '',
          inventory: variant.inventory, priceDelta: variant.price_delta_cents,
        }));
        return {
          slug: product.slug, name: product.name, dogSlugs: product.dog_slugs ?? [],
          category: product.category || 'Catálogo', description: product.description || '',
          details: product.characteristics ?? [], galleryImages, image: galleryImages[0] ?? '',
          isLive: !product.is_proposal, priceCents: product.price_cents ?? 0,
          price: `$${((product.price_cents ?? 0) / 100).toFixed(2)} USD`,
          inventory: variants.length ? variants.reduce((total, variant) => total + variant.inventory, 0) : product.inventory ?? 0,
          variants,
        };
      });
    },
  });
}
