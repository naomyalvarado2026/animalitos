-- =====================================================================
-- COMPLETE REMAINING MIGRATIONS (IDEMPOTENT & SAFE)
-- Refugio AdoptaME / Animalitos
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Asegurar funciones base de seguridad y nivel de acceso ────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_level INTEGER NOT NULL DEFAULT 1 CHECK (access_level BETWEEN 0 AND 10);

CREATE OR REPLACE FUNCTION public.has_access_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_active = true
      AND CASE role
        WHEN 'super_admin' THEN GREATEST(access_level, 10)
        WHEN 'admin' THEN GREATEST(access_level, 7)
        WHEN 'editor' THEN GREATEST(access_level, 4)
        ELSE access_level
      END >= required_level
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_access_level(INTEGER) TO authenticated, anon;

-- ── 2. Módulo de Voluntariado y Calendario ───────────────────────────
CREATE TABLE IF NOT EXISTS public.volunteer_activities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  category           TEXT NOT NULL CHECK (category IN ('dog_walking', 'medical', 'events', 'maintenance', 'cleaning', 'foster')),
  activity_date      DATE NOT NULL,
  start_time         TIME NOT NULL DEFAULT '09:00',
  end_time           TIME NOT NULL DEFAULT '12:00',
  location           TEXT NOT NULL DEFAULT 'Refugio Principal',
  max_volunteers     INTEGER NOT NULL DEFAULT 5 CHECK (max_volunteers > 0),
  current_volunteers INTEGER NOT NULL DEFAULT 0 CHECK (current_volunteers >= 0),
  coordinator_name   TEXT NOT NULL DEFAULT 'Equipo AdoptaME',
  coordinator_phone  TEXT,
  requirements       TEXT[] DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_registrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id      UUID NOT NULL REFERENCES public.volunteer_activities(id) ON DELETE CASCADE,
  volunteer_name   TEXT NOT NULL,
  volunteer_email  TEXT NOT NULL,
  volunteer_phone  TEXT NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, volunteer_email)
);

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

-- ── 3. Módulo de Historias de Éxito ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.success_stories (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_name        TEXT NOT NULL,
  adopter_name       TEXT NOT NULL,
  title              TEXT NOT NULL,
  story              TEXT NOT NULL,
  before_image_url   TEXT,
  after_image_url    TEXT NOT NULL,
  adoption_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  is_featured        BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Configuración del Sitio y Notificaciones ───────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Habilitar RLS y Políticas de Acceso ────────────────────────────
ALTER TABLE public.volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_public_read" ON public.volunteer_activities;
CREATE POLICY "activities_public_read" ON public.volunteer_activities FOR SELECT USING (true);

DROP POLICY IF EXISTS "activities_admin_write" ON public.volunteer_activities;
CREATE POLICY "activities_admin_write" ON public.volunteer_activities FOR ALL USING (public.has_access_level(4));

DROP POLICY IF EXISTS "registrations_public_insert" ON public.activity_registrations;
CREATE POLICY "registrations_public_insert" ON public.activity_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "registrations_admin_read" ON public.activity_registrations;
CREATE POLICY "registrations_admin_read" ON public.activity_registrations FOR SELECT USING (public.has_access_level(4));

DROP POLICY IF EXISTS "volunteer_public_insert" ON public.volunteer_applications;
CREATE POLICY "volunteer_public_insert" ON public.volunteer_applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "volunteer_admin_read" ON public.volunteer_applications;
CREATE POLICY "volunteer_admin_read" ON public.volunteer_applications FOR SELECT USING (public.has_access_level(4));

DROP POLICY IF EXISTS "success_stories_public_read" ON public.success_stories;
CREATE POLICY "success_stories_public_read" ON public.success_stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "success_stories_admin_write" ON public.success_stories;
CREATE POLICY "success_stories_admin_write" ON public.success_stories FOR ALL USING (public.has_access_level(4));

DROP POLICY IF EXISTS "settings_public_read" ON public.site_settings;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT USING (true);

-- ── 6. Trigger para contador dinámico de voluntarios ─────────────────
CREATE OR REPLACE FUNCTION public.update_activity_volunteer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.volunteer_activities
    SET current_volunteers = COALESCE((
      SELECT COUNT(*) FROM public.activity_registrations WHERE activity_id = OLD.activity_id
    ), 0)
    WHERE id = OLD.activity_id;
    RETURN OLD;
  ELSE
    UPDATE public.volunteer_activities
    SET current_volunteers = COALESCE((
      SELECT COUNT(*) FROM public.activity_registrations WHERE activity_id = NEW.activity_id
    ), 0)
    WHERE id = NEW.activity_id;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_registration_change ON public.activity_registrations;
CREATE TRIGGER on_registration_change
  AFTER INSERT OR DELETE ON public.activity_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_activity_volunteer_count();

-- ── 7. Datos Semilla (Seed Data) ──────────────────────────────────────
INSERT INTO public.volunteer_activities (
  title, description, category, activity_date, start_time, end_time, location, max_volunteers, current_volunteers, coordinator_name, requirements
) VALUES
(
  'Jornada de Paseo y Socialización 🐕',
  'Paseo matutino, ejercitación y juego al aire libre con los perritos del área B.',
  'dog_walking', CURRENT_DATE + INTERVAL '2 days', '09:00', '12:00', 'Parque Central & Refugio', 8, 3, 'Carlos Gómez',
  ARRAY['Traer botella de agua', 'Calzado cómodo']
),
(
  'Campaña de Sanidad y Desparasitación 🏥',
  'Apoyo al equipo veterinario en pesaje, cepillado y aplicación de tratamientos preventivos.',
  'medical', CURRENT_DATE + INTERVAL '5 days', '10:00', '13:00', 'Área Médica Refugio', 4, 1, 'Dra. María Elena',
  ARRAY['Uso de mascarilla', 'Guantes de látex']
),
(
  'Bazar Solidario & Colecta 🎟️',
  'Atención en stand de donaciones y venta de artículos promocionales para recaudar fondos.',
  'events', CURRENT_DATE + INTERVAL '8 days', '11:00', '17:00', 'Plaza Principal', 6, 2, 'Laura Méndez',
  ARRAY['Camiseta institucional']
)
ON CONFLICT DO NOTHING;

INSERT INTO public.success_stories (
  animal_name, adopter_name, title, story, before_image_url, after_image_url, adoption_date, is_featured
) VALUES
(
  'Rocky', 'Familia Fernández', 'De la calle a un hogar lleno de amor',
  'Rocky fue rescatado con desnutrición severa. Hoy corre feliz en su nuevo jardín junto a sus hermanos humanos.',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
  CURRENT_DATE - INTERVAL '60 days', true
),
(
  'Luna', 'Andrea Morales', 'Una segunda oportunidad para brillar',
  'Luna llegó con mucho temor a las personas. Gracias a la paciencia de Andrea, ahora es la perrita más cariñosa.',
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800',
  CURRENT_DATE - INTERVAL '30 days', true
)
ON CONFLICT DO NOTHING;
