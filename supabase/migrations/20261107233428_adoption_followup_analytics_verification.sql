BEGIN;

-- Keep first contact light; the refuge can gather these details in conversation.
ALTER TABLE public.adoption_applications
  ALTER COLUMN housing_type DROP NOT NULL,
  ALTER COLUMN has_yard DROP NOT NULL,
  ALTER COLUMN has_other_pets DROP NOT NULL,
  ALTER COLUMN has_children DROP NOT NULL;

ALTER TABLE public.adoption_applications
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS next_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_contact_window TEXT;

ALTER TABLE public.adoption_applications
  DROP CONSTRAINT IF EXISTS adoption_applications_next_action_length_check,
  ADD CONSTRAINT adoption_applications_next_action_length_check
    CHECK (next_action IS NULL OR length(trim(next_action)) <= 500),
  DROP CONSTRAINT IF EXISTS adoption_applications_preferred_contact_window_check,
  ADD CONSTRAINT adoption_applications_preferred_contact_window_check
    CHECK (preferred_contact_window IS NULL OR preferred_contact_window IN ('morning', 'afternoon', 'evening', 'flexible'));

CREATE INDEX IF NOT EXISTS adoption_applications_follow_up_idx
  ON public.adoption_applications (next_contact_at)
  WHERE next_contact_at IS NOT NULL AND status NOT IN ('approved', 'rejected');

-- Public applicants may submit an initial request, never assign staff or set
-- an administrative follow-up state themselves.
DROP POLICY IF EXISTS adoption_public_pending ON public.adoption_applications;
CREATE POLICY adoption_public_pending
  ON public.adoption_applications FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND reviewed_by IS NULL
    AND admin_notes IS NULL
    AND assigned_to IS NULL
    AND next_action IS NULL
    AND next_contact_at IS NULL
    AND last_contacted_at IS NULL
    AND length(trim(applicant_name)) BETWEEN 2 AND 120
    AND applicant_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND length(trim(applicant_phone)) BETWEEN 7 AND 40
  );

CREATE TABLE IF NOT EXISTS public.adoption_contact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.adoption_applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('call', 'whatsapp', 'email', 'visit', 'note')),
  summary TEXT NOT NULL CHECK (length(trim(summary)) BETWEEN 1 AND 1500),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS adoption_contact_events_application_idx
  ON public.adoption_contact_events (application_id, occurred_at DESC);

ALTER TABLE public.adoption_contact_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.adoption_contact_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.adoption_contact_events TO authenticated;

CREATE POLICY adoption_contact_events_admin_read
  ON public.adoption_contact_events FOR SELECT TO authenticated
  USING (public.has_access_level(4));
CREATE POLICY adoption_contact_events_admin_insert
  ON public.adoption_contact_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_access_level(4)
    AND created_by = (SELECT auth.uid())
  );

CREATE OR REPLACE FUNCTION public.sync_adoption_last_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.adoption_applications
  SET last_contacted_at = NEW.occurred_at,
      updated_at = now()
  WHERE id = NEW.application_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS adoption_contact_last_contact_sync ON public.adoption_contact_events;
CREATE TRIGGER adoption_contact_last_contact_sync
  AFTER INSERT ON public.adoption_contact_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_adoption_last_contact();
REVOKE ALL ON FUNCTION public.sync_adoption_last_contact() FROM PUBLIC;

-- Timestamp is public; the reviewer identity remains in the admin-only log.
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS profile_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.animal_profile_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewer_name TEXT NOT NULL DEFAULT 'Miembro del equipo',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS animal_profile_reviews_animal_idx
  ON public.animal_profile_reviews (animal_id, verified_at DESC);

ALTER TABLE public.animal_profile_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.animal_profile_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.animal_profile_reviews TO authenticated;

CREATE POLICY animal_profile_reviews_admin_read
  ON public.animal_profile_reviews FOR SELECT TO authenticated
  USING (public.has_access_level(4));
CREATE POLICY animal_profile_reviews_admin_insert
  ON public.animal_profile_reviews FOR INSERT TO authenticated
  WITH CHECK (public.has_access_level(4) AND verified_by = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.invalidate_stale_animal_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['profile_verified_at', 'updated_at', 'created_at', 'sort_order'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['profile_verified_at', 'updated_at', 'created_at', 'sort_order']) THEN
    NEW.profile_verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS animal_profile_verification_invalidate ON public.animals;
CREATE TRIGGER animal_profile_verification_invalidate
  BEFORE UPDATE ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.invalidate_stale_animal_profile_verification();

CREATE OR REPLACE FUNCTION public.record_animal_profile_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.profile_verified_at IS DISTINCT FROM NEW.profile_verified_at
     AND NEW.profile_verified_at IS NOT NULL THEN
    INSERT INTO public.animal_profile_reviews (animal_id, verified_by, reviewer_name, verified_at)
    VALUES (
      NEW.id,
      (SELECT auth.uid()),
      COALESCE(
        (SELECT profile.full_name FROM public.profiles AS profile WHERE profile.id = (SELECT auth.uid())),
        'Miembro del equipo'
      ),
      NEW.profile_verified_at
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS animal_profile_review_history ON public.animals;
CREATE TRIGGER animal_profile_review_history
  AFTER UPDATE OF profile_verified_at ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.record_animal_profile_review();

REVOKE ALL ON FUNCTION public.invalidate_stale_animal_profile_verification() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_animal_profile_review() FROM PUBLIC;

CREATE TABLE IF NOT EXISTS public.site_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'adoption_submit')),
  animal_slug TEXT NOT NULL CHECK (animal_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(animal_slug) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_analytics_events_created_slug_idx
  ON public.site_analytics_events (created_at DESC, animal_slug, event_type);

ALTER TABLE public.site_analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_analytics_events FROM PUBLIC, anon, authenticated;
GRANT INSERT (event_type, animal_slug) ON public.site_analytics_events TO anon, authenticated;
GRANT SELECT ON public.site_analytics_events TO authenticated;

CREATE POLICY site_analytics_public_insert
  ON public.site_analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    event_type IN ('profile_view', 'adoption_submit')
    AND animal_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND length(animal_slug) <= 100
  );
CREATE POLICY site_analytics_admin_read
  ON public.site_analytics_events FOR SELECT TO authenticated
  USING (public.has_access_level(4));

CREATE OR REPLACE FUNCTION public.adoption_form_supports_optional_details()
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT TRUE $$;
REVOKE ALL ON FUNCTION public.adoption_form_supports_optional_details() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adoption_form_supports_optional_details() TO anon, authenticated;

-- Only grouped counts are exposed to the admin report; raw events stay in the
-- RLS-protected table and no visitor identifiers are stored.
CREATE OR REPLACE VIEW public.site_analytics_summary_30d
WITH (security_invoker = true)
AS
SELECT animal_slug, event_type, count(*)::BIGINT AS event_count
FROM public.site_analytics_events
WHERE created_at >= now() - interval '30 days'
GROUP BY animal_slug, event_type;

REVOKE ALL ON public.site_analytics_summary_30d FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.site_analytics_summary_30d TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
