-- ═══════════════════════════════════════════════════════════════════
-- 005_extended_features.sql
-- Módulo de Animales en Adopción, Solicitudes, Historias de Éxito y Voluntariado
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabla: animals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.animals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  species          TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  breed            TEXT,
  age_months       INTEGER NOT NULL CHECK (age_months >= 0),
  gender           TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  size             TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  status           TEXT NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available', 'pending', 'adopted', 'medical_care')),
  description      TEXT NOT NULL,
  story            TEXT,
  health_status    TEXT NOT NULL DEFAULT 'healthy',
  is_vaccinated    BOOLEAN NOT NULL DEFAULT true,
  is_neutered      BOOLEAN NOT NULL DEFAULT true,
  is_special_needs BOOLEAN NOT NULL DEFAULT false,
  special_needs_desc TEXT,
  main_image_url   TEXT NOT NULL,
  gallery_urls     TEXT[] DEFAULT '{}',
  rescue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  location         TEXT DEFAULT 'Refugio Principal',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_animals_species ON public.animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(status);

COMMENT ON TABLE public.animals IS 'Animales del refugio disponibles para adopción o en proceso.';

-- ── Tabla: adoption_applications ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.adoption_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id         UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  applicant_name    TEXT NOT NULL,
  applicant_email   TEXT NOT NULL,
  applicant_phone   TEXT NOT NULL,
  applicant_address TEXT NOT NULL,
  housing_type      TEXT NOT NULL CHECK (housing_type IN ('house', 'apartment', 'farm')),
  has_yard          BOOLEAN NOT NULL DEFAULT false,
  has_other_pets    BOOLEAN NOT NULL DEFAULT false,
  other_pets_desc   TEXT,
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.adoption_applications IS 'Solicitudes de adopción enviadas por interesados.';

-- ── Tabla: volunteer_applications ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  area_of_interest  TEXT NOT NULL CHECK (area_of_interest IN ('dog_walking', 'medical_support', 'events', 'social_media', 'shelter_maintenance', 'foster')),
  availability      TEXT NOT NULL,
  experience        TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'active', 'archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabla: success_stories ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.success_stories (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_name        TEXT NOT NULL,
  adopter_name       TEXT NOT NULL,
  title              TEXT NOT NULL,
  story              TEXT NOT NULL,
  before_image_url   TEXT,
  after_image_url    TEXT NOT NULL,
  adoption_date      DATE NOT NULL,
  is_featured        BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS for new tables ───────────────────────────────────────────
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Animals: Public read, Admin write
CREATE POLICY "animals_public_read" ON public.animals FOR SELECT USING (true);
CREATE POLICY "animals_admin_write" ON public.animals FOR ALL USING (public.has_access_level(4));

-- Adoption applications: Anyone insert, Admin read/write
CREATE POLICY "adoption_public_insert" ON public.adoption_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "adoption_admin_read" ON public.adoption_applications FOR SELECT USING (public.has_access_level(4));
CREATE POLICY "adoption_admin_update" ON public.adoption_applications FOR UPDATE USING (public.has_access_level(4));

-- Volunteer applications: Anyone insert, Admin read/write
CREATE POLICY "volunteer_public_insert" ON public.volunteer_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "volunteer_admin_read" ON public.volunteer_applications FOR SELECT USING (public.has_access_level(4));
CREATE POLICY "volunteer_admin_update" ON public.volunteer_applications FOR UPDATE USING (public.has_access_level(4));

-- Success stories: Public read, Admin write
CREATE POLICY "success_stories_public_read" ON public.success_stories FOR SELECT USING (true);
CREATE POLICY "success_stories_admin_write" ON public.success_stories FOR ALL USING (public.has_access_level(4));
