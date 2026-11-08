-- AdoptaME: confirmed volunteer bookings, foster/community support, and
-- campaign finance reports based only on verified non-demo ledger entries.
BEGIN;

-- Volunteer activities are no longer shown merely because a template exists.
ALTER TABLE public.volunteer_activities
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Preserve the public visibility of real activities already scheduled in Admin.
UPDATE public.volunteer_activities
SET is_published = true
WHERE status IN ('scheduled', 'in_progress')
  AND activity_date >= CURRENT_DATE;

DROP POLICY IF EXISTS activities_public_read ON public.volunteer_activities;
CREATE POLICY activities_public_read
  ON public.volunteer_activities FOR SELECT TO anon, authenticated
  USING (
    is_published = true
    AND status = 'scheduled'
    AND activity_date >= CURRENT_DATE
  );
REVOKE SELECT ON public.volunteer_activities FROM PUBLIC, anon;
GRANT SELECT (id, title, description, category, activity_date, end_date, event_type,
  recurrence_pattern, start_time, end_time, location, max_volunteers, current_volunteers,
  coordinator_name, requirements, status, is_published, created_at, updated_at)
  ON public.volunteer_activities TO anon, authenticated;
CREATE VIEW public.public_volunteer_activities WITH (security_invoker = true) AS
SELECT id, title, description, category, activity_date, end_date, event_type,
  recurrence_pattern, start_time, end_time, location, max_volunteers, current_volunteers,
  coordinator_name, requirements, status
FROM public.volunteer_activities
WHERE is_published = true AND status = 'scheduled' AND activity_date >= CURRENT_DATE;
GRANT SELECT ON public.public_volunteer_activities TO anon, authenticated;

-- A registration has a real seat or an explicit waitlist state. Public callers
-- receive only the registration id and state, never the volunteer roster.
ALTER TABLE public.activity_registrations
  ADD COLUMN IF NOT EXISTS attendance_status TEXT NOT NULL DEFAULT 'registered';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'activity_registrations_attendance_status_check'
      AND conrelid = 'public.activity_registrations'::regclass
  ) THEN
    ALTER TABLE public.activity_registrations
      ADD CONSTRAINT activity_registrations_attendance_status_check
      CHECK (attendance_status IN ('registered', 'waitlisted', 'attended', 'no_show', 'cancelled'));
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS activity_registrations_active_email_idx
  ON public.activity_registrations (activity_id, lower(volunteer_email))
  WHERE attendance_status IN ('registered', 'waitlisted', 'attended', 'no_show');

DROP POLICY IF EXISTS registration_public_self ON public.activity_registrations;

REVOKE ALL ON public.activity_registrations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_registrations TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_activity_registration_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  activity_row public.volunteer_activities%ROWTYPE;
  confirmed_count INTEGER;
BEGIN
  SELECT * INTO activity_row
  FROM public.volunteer_activities
  WHERE id = NEW.activity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La jornada ya no está disponible.' USING ERRCODE = '23503';
  END IF;

  IF activity_row.status <> 'scheduled'
     OR activity_row.activity_date < CURRENT_DATE
     OR (NOT COALESCE(NEW.assigned_by_admin, false) AND NOT activity_row.is_published) THEN
    RAISE EXCEPTION 'La jornada no acepta nuevas inscripciones.' USING ERRCODE = '23514';
  END IF;

  IF NEW.consent_at IS NULL THEN
    RAISE EXCEPTION 'Se requiere consentimiento para registrar la inscripción.' USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO confirmed_count
  FROM public.activity_registrations
  WHERE activity_id = NEW.activity_id
    AND attendance_status = 'registered';

  NEW.attendance_status := CASE
    WHEN confirmed_count < activity_row.max_volunteers THEN 'registered'
    ELSE 'waitlisted'
  END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_activity_registration_queue() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_activity_registration_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_activity UUID;
  promoted_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_activity := OLD.activity_id;
  ELSE
    target_activity := NEW.activity_id;
  END IF;

  UPDATE public.volunteer_activities AS activity
  SET current_volunteers = (
        SELECT count(*)::INTEGER
        FROM public.activity_registrations AS registration
        WHERE registration.activity_id = target_activity
          AND registration.attendance_status = 'registered'
      ),
      updated_at = now()
  WHERE activity.id = target_activity;

  IF (TG_OP = 'DELETE' AND OLD.attendance_status = 'registered')
     OR (TG_OP = 'UPDATE' AND OLD.attendance_status = 'registered' AND NEW.attendance_status = 'cancelled') THEN
    SELECT id INTO promoted_id
    FROM public.activity_registrations
    WHERE activity_id = target_activity
      AND attendance_status = 'waitlisted'
    ORDER BY created_at, id
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF promoted_id IS NOT NULL THEN
      UPDATE public.activity_registrations
      SET attendance_status = 'registered'
      WHERE id = promoted_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_activity_registration_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS activity_registration_assign_queue ON public.activity_registrations;
CREATE TRIGGER activity_registration_assign_queue
  BEFORE INSERT ON public.activity_registrations
  FOR EACH ROW EXECUTE FUNCTION public.assign_activity_registration_queue();

CREATE OR REPLACE FUNCTION public.enforce_activity_registration_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  capacity INTEGER;
  confirmed_count INTEGER;
BEGIN
  IF NEW.attendance_status = 'registered' AND OLD.attendance_status <> 'registered' THEN
    SELECT max_volunteers INTO capacity
    FROM public.volunteer_activities
    WHERE id = NEW.activity_id
    FOR UPDATE;

    SELECT count(*) INTO confirmed_count
    FROM public.activity_registrations
    WHERE activity_id = NEW.activity_id
      AND id <> NEW.id
      AND attendance_status = 'registered';

    IF confirmed_count >= capacity THEN
      NEW.attendance_status := 'waitlisted';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_activity_registration_capacity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS activity_registration_enforce_capacity ON public.activity_registrations;
CREATE TRIGGER activity_registration_enforce_capacity
  BEFORE UPDATE OF attendance_status ON public.activity_registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_activity_registration_capacity();

DROP TRIGGER IF EXISTS activity_registration_sync_count ON public.activity_registrations;
CREATE TRIGGER activity_registration_sync_count
  AFTER INSERT OR UPDATE OR DELETE ON public.activity_registrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_activity_registration_count();

UPDATE public.volunteer_activities AS activity
SET current_volunteers = (
  SELECT count(*)::INTEGER
  FROM public.activity_registrations AS registration
  WHERE registration.activity_id = activity.id
    AND registration.attendance_status = 'registered'
);

CREATE OR REPLACE FUNCTION public.register_for_volunteer_activity(
  p_activity_id UUID,
  p_volunteer_name TEXT,
  p_volunteer_email TEXT,
  p_volunteer_phone TEXT,
  p_consent BOOLEAN,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (registration_id UUID, attendance_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_row public.activity_registrations%ROWTYPE;
BEGIN
  IF length(btrim(COALESCE(p_volunteer_name, ''))) NOT BETWEEN 2 AND 120
     OR lower(btrim(COALESCE(p_volunteer_email, ''))) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR length(regexp_replace(COALESCE(p_volunteer_phone, ''), '[^0-9]', '', 'g')) NOT BETWEEN 7 AND 18
     OR p_consent IS NOT TRUE
     OR length(COALESCE(p_notes, '')) > 1500 THEN
    RAISE EXCEPTION 'Revisa nombre, correo, teléfono y observaciones.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.activity_registrations (
    activity_id, volunteer_name, volunteer_email, volunteer_phone, notes,
    consent_at, assigned_by_admin
  )
  VALUES (
    p_activity_id, btrim(p_volunteer_name), lower(btrim(p_volunteer_email)),
    btrim(p_volunteer_phone), NULLIF(btrim(COALESCE(p_notes, '')), ''), now(), false
  )
  RETURNING * INTO inserted_row;

  RETURN QUERY SELECT inserted_row.id, inserted_row.attendance_status;
END;
$$;
REVOKE ALL ON FUNCTION public.register_for_volunteer_activity(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_volunteer_activity(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO anon, authenticated;

-- Foster applications collect locality only, never a home address. Placements
-- remain staff-only operational records linked to an animal and application.
CREATE TABLE IF NOT EXISTS public.foster_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name TEXT NOT NULL CHECK (length(btrim(applicant_name)) BETWEEN 2 AND 120),
  applicant_email TEXT NOT NULL CHECK (applicant_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  applicant_phone TEXT NOT NULL CHECK (length(regexp_replace(applicant_phone, '[^0-9]', '', 'g')) BETWEEN 7 AND 18),
  city TEXT NOT NULL CHECK (length(btrim(city)) BETWEEN 2 AND 100),
  area TEXT CHECK (area IS NULL OR length(btrim(area)) <= 100),
  housing_type TEXT NOT NULL CHECK (housing_type IN ('house', 'apartment', 'other')),
  has_resident_pets BOOLEAN NOT NULL DEFAULT false,
  experience TEXT NOT NULL CHECK (length(btrim(experience)) BETWEEN 10 AND 1500),
  availability TEXT NOT NULL CHECK (length(btrim(availability)) BETWEEN 3 AND 300),
  animal_preferences TEXT CHECK (animal_preferences IS NULL OR length(animal_preferences) <= 500),
  consent_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'declined', 'inactive')),
  admin_notes TEXT CHECK (admin_notes IS NULL OR length(admin_notes) <= 2000),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS foster_applications_status_created_idx
  ON public.foster_applications (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.foster_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE RESTRICT,
  foster_application_id UUID NOT NULL REFERENCES public.foster_applications(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_home', 'returned', 'adopted', 'closed')),
  starts_on DATE,
  expected_review_on DATE,
  ended_on DATE,
  follow_up_due_on DATE,
  private_follow_up_notes TEXT CHECK (private_follow_up_notes IS NULL OR length(private_follow_up_notes) <= 3000),
  outcome_notes TEXT CHECK (outcome_notes IS NULL OR length(outcome_notes) <= 3000),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expected_review_on IS NULL OR starts_on IS NULL OR expected_review_on >= starts_on),
  CHECK (ended_on IS NULL OR starts_on IS NULL OR ended_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS foster_placements_follow_up_idx
  ON public.foster_placements (follow_up_due_on, status);
CREATE INDEX IF NOT EXISTS foster_placements_animal_idx ON public.foster_placements (animal_id);
CREATE INDEX IF NOT EXISTS foster_placements_application_idx ON public.foster_placements (foster_application_id);
CREATE UNIQUE INDEX IF NOT EXISTS foster_placements_one_active_per_animal_idx
  ON public.foster_placements (animal_id) WHERE status IN ('planned', 'in_home');

ALTER TABLE public.foster_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foster_placements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.foster_applications, public.foster_placements FROM PUBLIC, anon, authenticated;
GRANT INSERT (applicant_name, applicant_email, applicant_phone, city, area, housing_type,
  has_resident_pets, experience, availability, animal_preferences, consent_at)
  ON public.foster_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.foster_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.foster_placements TO authenticated;
CREATE POLICY foster_applications_public_submit
  ON public.foster_applications FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND admin_notes IS NULL AND reviewed_by IS NULL);
CREATE POLICY foster_applications_admin_read
  ON public.foster_applications FOR SELECT TO authenticated USING (public.has_access_level(4));
CREATE POLICY foster_applications_admin_update
  ON public.foster_applications FOR UPDATE TO authenticated
  USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
CREATE POLICY foster_placements_admin_all
  ON public.foster_placements FOR ALL TO authenticated
  USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

CREATE OR REPLACE FUNCTION public.sync_foster_placement_animal_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'in_home' THEN
    UPDATE public.animals
    SET status = 'fostered', updated_at = now()
    WHERE id = NEW.animal_id;
    UPDATE public.foster_applications
    SET status = 'approved', updated_at = now()
    WHERE id = NEW.foster_application_id;
  ELSIF NEW.status = 'adopted' THEN
    UPDATE public.animals
    SET status = 'adopted', adoption_date = COALESCE(NEW.ended_on, CURRENT_DATE), updated_at = now()
    WHERE id = NEW.animal_id;
  ELSIF NEW.status IN ('returned', 'closed') THEN
    IF TG_OP = 'UPDATE' AND OLD.status = 'in_home' THEN
      UPDATE public.animals
      SET status = 'available', updated_at = now()
      WHERE id = NEW.animal_id;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_foster_placement_animal_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS foster_placement_sync_animal ON public.foster_placements;
CREATE TRIGGER foster_placement_sync_animal
  BEFORE INSERT OR UPDATE ON public.foster_placements
  FOR EACH ROW EXECUTE FUNCTION public.sync_foster_placement_animal_status();

-- Public support requests feed three workflows: keeping a pet with their family,
-- lost/found reunification, and post-adoption care. Public sees no requests.
CREATE TABLE IF NOT EXISTS public.community_help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('keep_pet', 'lost_pet', 'found_pet', 'post_adoption')),
  contact_name TEXT NOT NULL CHECK (length(btrim(contact_name)) BETWEEN 2 AND 120),
  contact_email TEXT CHECK (contact_email IS NULL OR contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  contact_phone TEXT NOT NULL CHECK (length(regexp_replace(contact_phone, '[^0-9]', '', 'g')) BETWEEN 7 AND 18),
  city TEXT NOT NULL CHECK (length(btrim(city)) BETWEEN 2 AND 100),
  area TEXT CHECK (area IS NULL OR length(btrim(area)) <= 100),
  animal_name TEXT CHECK (animal_name IS NULL OR length(btrim(animal_name)) <= 100),
  animal_description TEXT NOT NULL CHECK (length(btrim(animal_description)) BETWEEN 10 AND 3000),
  consent_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'resolved', 'referred', 'closed')),
  next_contact_at TIMESTAMPTZ,
  admin_notes TEXT CHECK (admin_notes IS NULL OR length(admin_notes) <= 3000),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_help_requests_status_created_idx
  ON public.community_help_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS community_help_requests_follow_up_idx
  ON public.community_help_requests (next_contact_at) WHERE next_contact_at IS NOT NULL;
ALTER TABLE public.community_help_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_help_requests FROM PUBLIC, anon, authenticated;
GRANT INSERT (request_type, contact_name, contact_email, contact_phone, city, area,
  animal_name, animal_description, consent_at)
  ON public.community_help_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.community_help_requests TO authenticated;
CREATE POLICY community_help_public_submit
  ON public.community_help_requests FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND next_contact_at IS NULL AND admin_notes IS NULL AND reviewed_by IS NULL);
CREATE POLICY community_help_admin_read
  ON public.community_help_requests FOR SELECT TO authenticated USING (public.has_access_level(4));
CREATE POLICY community_help_admin_update
  ON public.community_help_requests FOR UPDATE TO authenticated
  USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

-- The directory is empty until a staff member verifies a real local resource.
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('food', 'veterinary', 'training', 'municipal', 'lost_found', 'other')),
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 160),
  city TEXT NOT NULL CHECK (length(btrim(city)) BETWEEN 2 AND 100),
  description TEXT NOT NULL CHECK (length(btrim(description)) BETWEEN 10 AND 1500),
  eligibility TEXT CHECK (eligibility IS NULL OR length(eligibility) <= 800),
  contact_label TEXT CHECK (contact_label IS NULL OR length(contact_label) <= 80),
  contact_value TEXT CHECK (contact_value IS NULL OR length(contact_value) <= 250),
  website_url TEXT CHECK (website_url IS NULL OR website_url ~ '^https://'),
  source_url TEXT CHECK (source_url IS NULL OR source_url ~ '^https://'),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT is_published OR (verified_at IS NOT NULL AND verified_by IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS community_resources_public_idx
  ON public.community_resources (city, category, name) WHERE is_published = true;
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_resources FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_resources TO authenticated;
CREATE POLICY community_resources_public_read
  ON public.community_resources FOR SELECT TO anon, authenticated
  USING (is_published = true AND verified_at IS NOT NULL);
CREATE POLICY community_resources_admin_all
  ON public.community_resources FOR ALL TO authenticated
  USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
CREATE VIEW public.public_community_resources WITH (security_invoker = true) AS
SELECT id, category, name, city, description, eligibility, contact_label, contact_value,
  website_url, source_url, verified_at
FROM public.community_resources
WHERE is_published = true AND verified_at IS NOT NULL;
GRANT SELECT (id, category, name, city, description, eligibility, contact_label,
  contact_value, website_url, source_url, verified_at)
  ON public.community_resources TO anon, authenticated;
GRANT SELECT ON public.public_community_resources TO anon, authenticated;

-- Finance admins explicitly reconcile a report. Totals are calculated from
-- actual non-demo ledger rows and are invalidated whenever those rows change.
ALTER TABLE public.income_records
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.seasonal_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.expense_records
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.seasonal_campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS income_records_campaign_date_idx ON public.income_records (campaign_id, date) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS expense_records_campaign_date_idx ON public.expense_records (campaign_id, date) WHERE campaign_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.campaign_financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.seasonal_campaigns(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  income_total_usd NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (income_total_usd >= 0),
  expense_total_usd NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (expense_total_usd >= 0),
  public_summary TEXT NOT NULL CHECK (length(btrim(public_summary)) BETWEEN 10 AND 2000),
  evidence_url TEXT CHECK (evidence_url IS NULL OR evidence_url ~ '^https://'),
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  CHECK (NOT is_published OR (is_reconciled AND verified_by IS NOT NULL AND verified_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS campaign_financial_reports_public_idx
  ON public.campaign_financial_reports (campaign_id, period_start, period_end)
  WHERE is_published = true AND is_reconciled = true;
CREATE UNIQUE INDEX IF NOT EXISTS campaign_financial_reports_period_unique_idx
  ON public.campaign_financial_reports (campaign_id, period_start, period_end);
ALTER TABLE public.campaign_financial_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_financial_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_financial_reports TO authenticated;
CREATE POLICY campaign_financial_reports_public_read
  ON public.campaign_financial_reports FOR SELECT TO anon, authenticated
  USING (is_published = true AND is_reconciled = true AND verified_at IS NOT NULL);
CREATE POLICY campaign_financial_reports_finance_admin_all
  ON public.campaign_financial_reports FOR ALL TO authenticated
  USING (public.has_access_level(7)) WITH CHECK (public.has_access_level(7));
CREATE VIEW public.public_campaign_financial_reports WITH (security_invoker = true) AS
SELECT report.id, report.campaign_id, campaign.slug AS campaign_slug, campaign.title AS campaign_title,
  report.period_start, report.period_end, report.income_total_usd, report.expense_total_usd,
  report.public_summary, report.evidence_url, report.verified_at
FROM public.campaign_financial_reports AS report
JOIN public.seasonal_campaigns AS campaign ON campaign.id = report.campaign_id
WHERE report.is_published = true AND report.is_reconciled = true AND report.verified_at IS NOT NULL
  AND campaign.is_active = true;
GRANT SELECT (id, campaign_id, period_start, period_end, income_total_usd, expense_total_usd,
  public_summary, evidence_url, verified_at, is_published, is_reconciled)
  ON public.campaign_financial_reports TO anon, authenticated;
GRANT SELECT (id, slug, title, is_active) ON public.seasonal_campaigns TO anon, authenticated;
GRANT SELECT ON public.public_campaign_financial_reports TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_campaign_financial_report_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  previous_campaign UUID;
  next_campaign UUID;
BEGIN
  IF TG_OP <> 'INSERT' THEN previous_campaign := OLD.campaign_id; END IF;
  IF TG_OP <> 'DELETE' THEN next_campaign := NEW.campaign_id; END IF;

  UPDATE public.campaign_financial_reports AS report
  SET income_total_usd = (
        SELECT COALESCE(sum(COALESCE(income.amount_usd, income.amount)), 0)::NUMERIC(12,2)
        FROM public.income_records AS income
        WHERE income.campaign_id = report.campaign_id
          AND income.is_demo = false
          AND income.status = 'completed'
          AND income.date::DATE BETWEEN report.period_start AND report.period_end
      ),
      expense_total_usd = (
        SELECT COALESCE(sum(COALESCE(expense.amount_usd, expense.amount)), 0)::NUMERIC(12,2)
        FROM public.expense_records AS expense
        WHERE expense.campaign_id = report.campaign_id
          AND expense.is_demo = false
          AND expense.date::DATE BETWEEN report.period_start AND report.period_end
      ),
      is_reconciled = false,
      verified_by = NULL,
      verified_at = NULL,
      is_published = false,
      updated_at = now()
  WHERE report.campaign_id IN (previous_campaign, next_campaign);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_campaign_financial_report_totals() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS income_campaign_report_refresh ON public.income_records;
CREATE TRIGGER income_campaign_report_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.income_records
  FOR EACH ROW EXECUTE FUNCTION public.refresh_campaign_financial_report_totals();
DROP TRIGGER IF EXISTS expense_campaign_report_refresh ON public.expense_records;
CREATE TRIGGER expense_campaign_report_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.expense_records
  FOR EACH ROW EXECUTE FUNCTION public.refresh_campaign_financial_report_totals();

CREATE OR REPLACE FUNCTION public.reconcile_campaign_financial_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_reconciled AND NOT OLD.is_reconciled THEN
    IF NOT COALESCE(public.has_access_level(7), false) THEN
      RAISE EXCEPTION 'Solo Finanzas puede conciliar una campaña.' USING ERRCODE = '42501';
    END IF;
    NEW.income_total_usd := (
      SELECT COALESCE(sum(COALESCE(income.amount_usd, income.amount)), 0)::NUMERIC(12,2)
      FROM public.income_records AS income
      WHERE income.campaign_id = NEW.campaign_id AND income.is_demo = false
        AND income.status = 'completed' AND income.date::DATE BETWEEN NEW.period_start AND NEW.period_end
    );
    NEW.expense_total_usd := (
      SELECT COALESCE(sum(COALESCE(expense.amount_usd, expense.amount)), 0)::NUMERIC(12,2)
      FROM public.expense_records AS expense
      WHERE expense.campaign_id = NEW.campaign_id AND expense.is_demo = false
        AND expense.date::DATE BETWEEN NEW.period_start AND NEW.period_end
    );
    NEW.verified_by := (SELECT auth.uid());
    NEW.verified_at := now();
  ELSIF NEW.public_summary IS DISTINCT FROM OLD.public_summary
     OR NEW.evidence_url IS DISTINCT FROM OLD.evidence_url
     OR NEW.period_start IS DISTINCT FROM OLD.period_start
     OR NEW.period_end IS DISTINCT FROM OLD.period_end
     OR NEW.campaign_id IS DISTINCT FROM OLD.campaign_id THEN
    NEW.is_reconciled := false;
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.is_published := false;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.reconcile_campaign_financial_report() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS campaign_financial_report_reconcile ON public.campaign_financial_reports;
CREATE TRIGGER campaign_financial_report_reconcile
  BEFORE UPDATE ON public.campaign_financial_reports
  FOR EACH ROW EXECUTE FUNCTION public.reconcile_campaign_financial_report();

NOTIFY pgrst, 'reload schema';
COMMIT;
