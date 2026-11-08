-- AdoptaME: product galleries, structured variant sizes, and protected uploads.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE public.products
SET gallery_urls = ARRAY[image_url]
WHERE cardinality(gallery_urls) = 0
  AND image_url IS NOT NULL
  AND btrim(image_url) <> '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_gallery_urls_limit_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_gallery_urls_limit_check
      CHECK (cardinality(gallery_urls) <= 8);
  END IF;
END;
$$;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS size_label TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_variants_size_label_check'
      AND conrelid = 'public.product_variants'::regclass
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_size_label_check
      CHECK (size_label IS NULL OR length(btrim(size_label)) BETWEEN 1 AND 40);
  END IF;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchandise-product-photos',
  'merchandise-product-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS merchandise_product_photos_admin_insert ON storage.objects;
CREATE POLICY merchandise_product_photos_admin_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'merchandise-product-photos' AND public.has_access_level(4));

DROP POLICY IF EXISTS merchandise_product_photos_admin_update ON storage.objects;
CREATE POLICY merchandise_product_photos_admin_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'merchandise-product-photos' AND public.has_access_level(4))
  WITH CHECK (bucket_id = 'merchandise-product-photos' AND public.has_access_level(4));

DROP POLICY IF EXISTS merchandise_product_photos_admin_delete ON storage.objects;
CREATE POLICY merchandise_product_photos_admin_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'merchandise-product-photos' AND public.has_access_level(4));

NOTIFY pgrst, 'reload schema';
