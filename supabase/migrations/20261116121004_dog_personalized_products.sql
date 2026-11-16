-- Canonical public dog profiles use stable slugs (including local profiles
-- without an animals UUID). One product may celebrate several dogs, and each
-- dog's collection can contain any number of published products.
ALTER TABLE public.products
  ADD COLUMN dog_slugs text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.products ADD CONSTRAINT products_dog_slugs_valid CHECK (
  cardinality(dog_slugs) <= 50
  AND coalesce(array_ndims(dog_slugs), 1) = 1
  AND array_position(dog_slugs, NULL) IS NULL
  AND (cardinality(dog_slugs) = 0 OR (
    length(array_to_string(dog_slugs, ',')) <= 4000
    AND array_to_string(dog_slugs, ',') ~ '^[a-z0-9]+(-[a-z0-9]+)*(,[a-z0-9]+(-[a-z0-9]+)*)*$'
  ))
);

CREATE INDEX products_dog_slugs_gin_idx ON public.products USING gin (dog_slugs);
COMMENT ON COLUMN public.products.dog_slugs IS
  'Public canonical adoption profile slugs. Empty for general merchandise. Governed by existing product RLS.';
