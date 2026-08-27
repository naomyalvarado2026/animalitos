-- AdoptaME / Antigravity — permisos administrativos del catálogo

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products
FOR ALL TO authenticated
USING (public.has_access_level(4))
WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS "variants_admin_write" ON public.product_variants;
CREATE POLICY "variants_admin_write" ON public.product_variants
FOR ALL TO authenticated
USING (public.has_access_level(4))
WITH CHECK (public.has_access_level(4));

CREATE INDEX IF NOT EXISTS products_active_created_at_idx
ON public.products (is_active, created_at DESC);
