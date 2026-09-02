-- =====================================================================
-- 010_animal_operations_and_stories.sql
-- Animalitos — Ficha operativa, tareas, movimientos y perfiles narrativos
-- =====================================================================

-- ── 1. Columnas narrativas y operativas en animals ───────────────────
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS story TEXT,
  ADD COLUMN IF NOT EXISTS health_status TEXT,
  ADD COLUMN IF NOT EXISTS is_vaccinated BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_neutered BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_special_needs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_needs_desc TEXT,
  ADD COLUMN IF NOT EXISTS adoption_slug TEXT,
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

-- ── 2. Tablas operativas: Historial médico ────────────────────────────
CREATE TABLE IF NOT EXISTS public.animal_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('exam', 'vaccine', 'medication', 'procedure', 'lab', 'note')),
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  provider TEXT,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  next_due_on DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Tablas operativas: Tareas de cuidado ──────────────────────────
CREATE TABLE IF NOT EXISTS public.animal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_on DATE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Tablas operativas: Movimientos y traslados ────────────────────
CREATE TABLE IF NOT EXISTS public.animal_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('intake', 'foster', 'transfer', 'adoption', 'return', 'medical', 'quarantine', 'other')),
  from_location TEXT,
  to_location TEXT,
  moved_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Índices y RLS ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS animal_medical_records_animal_idx ON public.animal_medical_records (animal_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS animal_tasks_open_idx ON public.animal_tasks (status, due_on);
CREATE INDEX IF NOT EXISTS animal_tasks_animal_idx ON public.animal_tasks (animal_id, due_on);
CREATE INDEX IF NOT EXISTS animal_movements_animal_idx ON public.animal_movements (animal_id, moved_on DESC);
CREATE INDEX IF NOT EXISTS animals_public_sort_idx ON public.animals (is_published, sort_order, created_at DESC);

ALTER TABLE public.animal_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_movements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animal_medical_records' AND policyname = 'animal_medical_records_admin') THEN
    CREATE POLICY "animal_medical_records_admin" ON public.animal_medical_records FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animal_tasks' AND policyname = 'animal_tasks_admin') THEN
    CREATE POLICY "animal_tasks_admin" ON public.animal_tasks FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animal_movements' AND policyname = 'animal_movements_admin') THEN
    CREATE POLICY "animal_movements_admin" ON public.animal_movements FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
  END IF;
END $$;
