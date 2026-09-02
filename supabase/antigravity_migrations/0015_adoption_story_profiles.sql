-- AdoptaME — perfiles narrativos verificables y administrables

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS age_is_estimated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vaccination_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (vaccination_status IN ('unknown', 'up_to_date', 'pending')),
  ADD COLUMN IF NOT EXISTS personality_summary TEXT,
  ADD COLUMN IF NOT EXISTS ideal_home TEXT,
  ADD COLUMN IF NOT EXISTS compatibility_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_brand_moment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand_message TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.animals ALTER COLUMN age_months DROP NOT NULL;
ALTER TABLE public.animals ALTER COLUMN is_vaccinated DROP NOT NULL;
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_size_check;
ALTER TABLE public.animals ADD CONSTRAINT animals_size_check
  CHECK (size IN ('unknown', 'small', 'medium', 'large', 'extra_large'));

-- El índice anterior era parcial; la sincronización administrativa necesita
-- un conflicto inferible por adoption_slug para ser idempotente.
DROP INDEX IF EXISTS public.animals_adoption_slug_unique;
CREATE UNIQUE INDEX animals_adoption_slug_unique ON public.animals (adoption_slug);

UPDATE public.animals SET vaccination_status = CASE
  WHEN is_vaccinated = true THEN 'up_to_date'
  WHEN is_vaccinated = false THEN 'pending'
  ELSE 'unknown'
END
WHERE vaccination_status = 'unknown';

CREATE INDEX IF NOT EXISTS animals_public_sort_idx
  ON public.animals (is_published, sort_order, created_at DESC);

DROP POLICY IF EXISTS "animals_public_read_published" ON public.animals;
CREATE POLICY "animals_public_read_published" ON public.animals
  FOR SELECT TO anon, authenticated
  USING (is_published = true AND status IN ('available', 'medical_care'));

CREATE OR REPLACE VIEW public.public_animals
WITH (security_invoker = true) AS
SELECT id, name, breed, age_months, gender, size, status, description, story,
       health_status, is_vaccinated, is_neutered, is_special_needs,
       special_needs_desc, main_image_url, gallery_urls, rescue_date, location,
       created_at, updated_at, age_is_estimated, vaccination_status,
       personality_summary, ideal_home, compatibility_notes, adoption_slug,
       is_published, show_brand_moment, brand_message, sort_order
FROM public.animals
WHERE is_published = true AND status IN ('available', 'medical_care');
