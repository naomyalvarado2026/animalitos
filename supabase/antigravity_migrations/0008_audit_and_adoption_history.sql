-- AdoptaME / Antigravity — auditoría administrativa y seguimiento

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change', 'export')),
  before_data JSONB,
  after_data JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON public.audit_log (actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.adoption_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.adoption_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS adoption_status_history_application_idx
  ON public.adoption_status_history (application_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_read" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_access_level(7));
CREATE POLICY "adoption_history_admin_read" ON public.adoption_status_history
  FOR SELECT TO authenticated USING (public.has_access_level(4));

CREATE OR REPLACE FUNCTION public.record_adoption_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.adoption_status_history (application_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, (SELECT auth.uid()));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS adoption_status_history_trigger ON public.adoption_applications;
CREATE TRIGGER adoption_status_history_trigger
  AFTER UPDATE OF status ON public.adoption_applications
  FOR EACH ROW EXECUTE FUNCTION public.record_adoption_status_change();

REVOKE ALL ON FUNCTION public.record_adoption_status_change() FROM PUBLIC;
