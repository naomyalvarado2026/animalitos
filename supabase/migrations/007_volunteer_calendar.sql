-- ═══════════════════════════════════════════════════════════════════
-- 007_volunteer_calendar.sql
-- Módulo de Calendario de Actividades, Tareas y Disponibilidad de Voluntarios
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabla: volunteer_activities ──────────────────────────────────
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
  coordinator_name   TEXT NOT NULL DEFAULT 'Equipo Animalitos',
  coordinator_phone  TEXT,
  requirements       TEXT[] DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_date ON public.volunteer_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.volunteer_activities(category);

COMMENT ON TABLE public.volunteer_activities IS 'Actividades y tareas programadas del refugio para participación de voluntarios.';

-- ── Tabla: activity_registrations ────────────────────────────────
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

COMMENT ON TABLE public.activity_registrations IS 'Registro individual de inscripciones de voluntarios por actividad.';

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE public.volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_public_read" ON public.volunteer_activities FOR SELECT USING (true);
CREATE POLICY "activities_admin_write" ON public.volunteer_activities FOR ALL USING (public.has_access_level(4));

CREATE POLICY "registrations_public_insert" ON public.activity_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "registrations_admin_read" ON public.activity_registrations FOR SELECT USING (public.has_access_level(4));

-- ── Trigger: actualizar contador de voluntarios ─────────────────
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

CREATE TRIGGER on_registration_change
  AFTER INSERT OR DELETE ON public.activity_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_activity_volunteer_count();

-- ── Datos semilla para pruebas de calendario ─────────────────────
INSERT INTO public.volunteer_activities (
  title, description, category, activity_date, start_time, end_time, location, max_volunteers, current_volunteers, coordinator_name, requirements
) VALUES
(
  'Jornada de Paseo y Socialización 🐕',
  'Paseo matutino, ejercitación y juego al aire libre con los perritos del área B.',
  'dog_walking', CURRENT_DATE + INTERVAL '2 days', '09:00', '12:00', 'Parque Central & Refugio', 8, 4, 'Carlos Gómez',
  ARRAY['Traer botella de agua', 'Calzado cómodo']
),
(
  'Campaña de Sanidad y Desparasitación 🏥',
  'Apoyo al equipo veterinario en pesaje, cepillado y aplicación de tratamientos a gatitos rescatados.',
  'medical', CURRENT_DATE + INTERVAL '5 days', '10:00', '13:00', 'Área Médica Refugio', 4, 2, 'Dra. María Elena',
  ARRAY['Uso de mascarilla', 'Guantes de látex']
),
(
  'Bazar Solidario & Colecta 🎟️',
  'Atención en stand de donaciones y venta de artículos promocionales para recaudar fondos.',
  'events', CURRENT_DATE + INTERVAL '8 days', '11:00', '17:00', 'Plaza Principal', 6, 3, 'Laura Méndez',
  ARRAY['Camiseta institucional']
),
(
  'Mantenimiento de Caniles & Pintura 🛠️',
  'Reparación de cercas, impermeabilización y embellecimiento de áreas habitables de los peluditos.',
  'maintenance', CURRENT_DATE + INTERVAL '12 days', '08:30', '14:00', 'Refugio Principal', 10, 5, 'Ing. Roberto Ramos',
  ARRAY['Ropa para trabajo pesado', 'Guantes de trabajo']
)
ON CONFLICT DO NOTHING;
