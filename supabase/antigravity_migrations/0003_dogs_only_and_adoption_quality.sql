-- AdoptaME / Antigravity — catálogo exclusivo de perros

DELETE FROM public.animals WHERE species <> 'dog';
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_species_check;
ALTER TABLE public.animals ADD CONSTRAINT animals_species_dog_only CHECK (species = 'dog');

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS good_with_dogs BOOLEAN,
  ADD COLUMN IF NOT EXISTS good_with_children BOOLEAN,
  ADD COLUMN IF NOT EXISTS apartment_friendly BOOLEAN,
  ADD COLUMN IF NOT EXISTS adoption_slug TEXT;

UPDATE public.animals
SET adoption_slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE adoption_slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS animals_adoption_slug_unique
  ON public.animals (adoption_slug) WHERE adoption_slug IS NOT NULL;

ALTER TABLE public.adoption_applications
  ALTER COLUMN applicant_address DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS has_children BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS housing_notes TEXT,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS adoption_applications_animal_status_idx
  ON public.adoption_applications (animal_id, status);
