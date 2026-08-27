-- ═══════════════════════════════════════════════════════════════════
-- 008_recurring_events.sql
-- Módulo de Eventos Recurrentes, Multidía y Asignación Manual de Personas
-- ═══════════════════════════════════════════════════════════════════

-- ── Añadir columnas de recurrencia y multidía ─────────────────────
ALTER TABLE public.volunteer_activities
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'single_day' CHECK (event_type IN ('single_day', 'multi_day')),
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES public.volunteer_activities(id) ON DELETE CASCADE;

ALTER TABLE public.activity_registrations
  ADD COLUMN IF NOT EXISTS assigned_by_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.volunteer_activities.event_type IS 'Define si es evento de un día o de varios días seguidos.';
COMMENT ON COLUMN public.volunteer_activities.recurrence_pattern IS 'Frecuencia de repetición: ninguna, semanal, mensual o anual.';
COMMENT ON COLUMN public.activity_registrations.assigned_by_admin IS 'Indica si la persona fue inscrita manualmente por un administrador.';

-- ── Seed data para evento multidía y recurrente ─────────────────
INSERT INTO public.volunteer_activities (
  title, description, category, activity_date, end_date, event_type, recurrence_pattern, start_time, end_time, location, max_volunteers, current_volunteers, coordinator_name
) VALUES
(
  'Gran Bazar & Colecta Anual (3 Días) 🎟️',
  'Macro evento de recaudación de fondos y adopciones. Se requieren voluntarios para distintos turnos.',
  'events', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '16 days', 'multi_day', 'none', '10:00', '18:00', 'Parque de la Exposición', 15, 6, 'Coordinación General'
),
(
  'Paseo Semanal de Canes (Sábados) 🐕',
  'Jornada recurrente cada sábado para dar paseo y amor a los perritos.',
  'dog_walking', CURRENT_DATE + INTERVAL '7 days', null, 'single_day', 'weekly', '09:00', '12:00', 'Refugio Principal', 8, 4, 'Carlos Gómez'
)
ON CONFLICT DO NOTHING;
