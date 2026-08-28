-- AdoptaME / Antigravity — ficha operativa por animal

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

CREATE INDEX IF NOT EXISTS animal_medical_records_animal_idx ON public.animal_medical_records (animal_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS animal_tasks_open_idx ON public.animal_tasks (status, due_on);
CREATE INDEX IF NOT EXISTS animal_tasks_animal_idx ON public.animal_tasks (animal_id, due_on);
CREATE INDEX IF NOT EXISTS animal_movements_animal_idx ON public.animal_movements (animal_id, moved_on DESC);

ALTER TABLE public.animal_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "animal_medical_records_admin" ON public.animal_medical_records;
CREATE POLICY "animal_medical_records_admin" ON public.animal_medical_records FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
DROP POLICY IF EXISTS "animal_tasks_admin" ON public.animal_tasks;
CREATE POLICY "animal_tasks_admin" ON public.animal_tasks FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
DROP POLICY IF EXISTS "animal_movements_admin" ON public.animal_movements;
CREATE POLICY "animal_movements_admin" ON public.animal_movements FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
