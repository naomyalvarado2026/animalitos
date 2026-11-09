BEGIN;

-- More useful, structured intake for lost/found cases and family support.
ALTER TABLE public.community_help_requests
  ADD COLUMN IF NOT EXISTS incident_date DATE,
  ADD COLUMN IF NOT EXISTS animal_species TEXT CHECK (animal_species IS NULL OR animal_species IN ('dog', 'cat', 'other')),
  ADD COLUMN IF NOT EXISTS collar_description TEXT CHECK (collar_description IS NULL OR length(collar_description) <= 300),
  ADD COLUMN IF NOT EXISTS microchip_status TEXT CHECK (microchip_status IS NULL OR microchip_status IN ('yes', 'no', 'unknown')),
  ADD COLUMN IF NOT EXISTS support_needs TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photo_path TEXT,
  ADD COLUMN IF NOT EXISTS case_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS case_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.community_help_requests
  ADD CONSTRAINT community_help_support_needs_allowed
    CHECK (support_needs <@ ARRAY['food', 'veterinary', 'behavior', 'housing', 'temporary_foster', 'guidance']::TEXT[]),
  ADD CONSTRAINT community_help_photo_path_matches_case
    CHECK (photo_path IS NULL OR photo_path ~ ('^' || id::TEXT || '/photo[.](jpg|jpeg|png|webp)$'));

CREATE INDEX IF NOT EXISTS community_help_case_verifier_idx
  ON public.community_help_requests (case_verified_by) WHERE case_verified_by IS NOT NULL;

-- Public users may submit a single private photo for an open lost/found case.
-- The helper stays in a non-API schema and only answers a narrowly scoped RLS question.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.community_case_photo_upload_allowed(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  case_id UUID;
BEGIN
  IF object_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/photo[.](jpg|jpeg|png|webp)$' THEN
    RETURN FALSE;
  END IF;

  case_id := split_part(object_name, '/', 1)::UUID;
  RETURN EXISTS (
    SELECT 1
    FROM public.community_help_requests AS request
    WHERE request.id = case_id
      AND request.request_type IN ('lost_pet', 'found_pet')
      AND request.status = 'pending'
      AND request.photo_path = object_name
  );
END;
$$;
REVOKE ALL ON FUNCTION private.community_case_photo_upload_allowed(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.community_case_photo_upload_allowed(TEXT) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-case-photos',
  'community-case-photos',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = FALSE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS community_case_photos_public_upload ON storage.objects;
CREATE POLICY community_case_photos_public_upload
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'community-case-photos'
    AND private.community_case_photo_upload_allowed(name)
  );

DROP POLICY IF EXISTS community_case_photos_admin_read ON storage.objects;
CREATE POLICY community_case_photos_admin_read
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-case-photos' AND public.has_access_level(4));

DROP POLICY IF EXISTS community_case_photos_admin_delete ON storage.objects;
CREATE POLICY community_case_photos_admin_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-case-photos' AND public.has_access_level(4));

DROP POLICY IF EXISTS community_help_public_submit ON public.community_help_requests;
CREATE POLICY community_help_public_submit
  ON public.community_help_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND next_contact_at IS NULL
    AND admin_notes IS NULL
    AND reviewed_by IS NULL
    AND case_verified_at IS NULL
    AND case_verified_by IS NULL
    AND (
      request_type NOT IN ('lost_pet', 'found_pet')
      OR (incident_date IS NOT NULL AND animal_species IS NOT NULL)
    )
    AND (
      photo_path IS NULL
      OR (request_type IN ('lost_pet', 'found_pet') AND photo_path ~ ('^' || id::TEXT || '/photo[.](jpg|jpeg|png|webp)$'))
    )
  );

GRANT INSERT (id, request_type, contact_name, contact_email, contact_phone, city, area,
  animal_name, animal_description, consent_at, incident_date, animal_species,
  collar_description, microchip_status, support_needs, photo_path)
  ON public.community_help_requests TO anon, authenticated;

-- Explicit, optional consent for post-adoption check-ins. Applications for local
-- refuge profiles use contact_messages, so both intake routes need the same fields.
ALTER TABLE public.adoption_applications
  ADD COLUMN IF NOT EXISTS post_adoption_follow_up_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS post_adoption_follow_up_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS animal_slug TEXT CHECK (animal_slug IS NULL OR length(animal_slug) <= 160);

GRANT INSERT (post_adoption_follow_up_consent)
  ON public.adoption_applications TO anon, authenticated;
GRANT INSERT (post_adoption_follow_up_consent, animal_slug)
  ON public.contact_messages TO anon, authenticated;

-- Daily rounds record observable care needs without presenting them as diagnoses.
CREATE TABLE IF NOT EXISTS public.animal_daily_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  observed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  location_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  appetite TEXT NOT NULL CHECK (appetite IN ('normal', 'reduced', 'none', 'not_observed')),
  water TEXT NOT NULL CHECK (water IN ('normal', 'reduced', 'none', 'not_observed')),
  behavior TEXT NOT NULL CHECK (behavior IN ('usual', 'changed', 'concerning', 'not_observed')),
  enrichment_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_summary TEXT CHECK (follow_up_summary IS NULL OR length(follow_up_summary) <= 1000),
  checked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (animal_id, observed_on),
  CHECK (NOT follow_up_required OR length(btrim(COALESCE(follow_up_summary, ''))) BETWEEN 3 AND 1000)
);

ALTER TABLE public.animal_daily_rounds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.animal_daily_rounds FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.animal_daily_rounds TO authenticated;
CREATE POLICY animal_daily_rounds_admin_read
  ON public.animal_daily_rounds FOR SELECT TO authenticated
  USING (public.has_access_level(4));
CREATE POLICY animal_daily_rounds_admin_insert
  ON public.animal_daily_rounds FOR INSERT TO authenticated
  WITH CHECK (public.has_access_level(4) AND checked_by = (SELECT auth.uid()));
CREATE POLICY animal_daily_rounds_admin_update
  ON public.animal_daily_rounds FOR UPDATE TO authenticated
  USING (public.has_access_level(4))
  WITH CHECK (public.has_access_level(4) AND checked_by = (SELECT auth.uid()));

-- Check-ins are planned only after explicit consent and staff confirmation of
-- the adoption date. The researched cadence is day 2, 10, 45, plus an optional 90.
CREATE TABLE IF NOT EXISTS public.adoption_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.adoption_applications(id) ON DELETE CASCADE,
  contact_message_id UUID REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  adopted_on DATE NOT NULL,
  stage_days INTEGER NOT NULL CHECK (stage_days IN (2, 10, 45, 90)),
  due_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((application_id IS NULL) <> (contact_message_id IS NULL)),
  CHECK (due_on = adopted_on + stage_days)
);

CREATE UNIQUE INDEX IF NOT EXISTS adoption_followups_application_stage_unique
  ON public.adoption_followups (application_id, stage_days) WHERE application_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS adoption_followups_contact_stage_unique
  ON public.adoption_followups (contact_message_id, stage_days) WHERE contact_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS adoption_followups_due_status_idx
  ON public.adoption_followups (status, due_on);

ALTER TABLE public.adoption_followups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.adoption_followups FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.adoption_followups TO authenticated;
CREATE POLICY adoption_followups_admin_read
  ON public.adoption_followups FOR SELECT TO authenticated
  USING (
    public.has_access_level(4)
    AND (
      EXISTS (SELECT 1 FROM public.adoption_applications AS application
        WHERE application.id = adoption_followups.application_id
          AND application.post_adoption_follow_up_consent)
      OR EXISTS (SELECT 1 FROM public.contact_messages AS message
        WHERE message.id = adoption_followups.contact_message_id
          AND message.post_adoption_follow_up_consent
          AND message.source = 'adoption_modal')
    )
  );
CREATE POLICY adoption_followups_admin_insert
  ON public.adoption_followups FOR INSERT TO authenticated
  WITH CHECK (
    public.has_access_level(4)
    AND created_by = (SELECT auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.adoption_applications AS application
        WHERE application.id = adoption_followups.application_id
          AND application.post_adoption_follow_up_consent
          AND application.status = 'approved')
      OR EXISTS (SELECT 1 FROM public.contact_messages AS message
        WHERE message.id = adoption_followups.contact_message_id
          AND message.post_adoption_follow_up_consent
          AND message.source = 'adoption_modal'
          AND message.type = 'support')
    )
  );
CREATE POLICY adoption_followups_admin_update
  ON public.adoption_followups FOR UPDATE TO authenticated
  USING (public.has_access_level(4))
  WITH CHECK (
    public.has_access_level(4)
    AND (
      EXISTS (SELECT 1 FROM public.adoption_applications AS application
        WHERE application.id = adoption_followups.application_id
          AND application.post_adoption_follow_up_consent)
      OR EXISTS (SELECT 1 FROM public.contact_messages AS message
        WHERE message.id = adoption_followups.contact_message_id
          AND message.post_adoption_follow_up_consent
          AND message.source = 'adoption_modal')
    )
  );

CREATE TABLE IF NOT EXISTS public.adoption_followup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id UUID NOT NULL REFERENCES public.adoption_followups(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('call', 'whatsapp', 'email', 'visit', 'note', 'referral')),
  summary TEXT NOT NULL CHECK (length(btrim(summary)) BETWEEN 2 AND 1500),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS adoption_followup_events_followup_idx
  ON public.adoption_followup_events (followup_id, occurred_at DESC);

ALTER TABLE public.adoption_followup_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.adoption_followup_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.adoption_followup_events TO authenticated;
CREATE POLICY adoption_followup_events_admin_read
  ON public.adoption_followup_events FOR SELECT TO authenticated
  USING (
    public.has_access_level(4)
    AND EXISTS (SELECT 1 FROM public.adoption_followups AS followup
      WHERE followup.id = adoption_followup_events.followup_id)
  );
CREATE POLICY adoption_followup_events_admin_insert
  ON public.adoption_followup_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_access_level(4)
    AND created_by = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.adoption_followups AS followup
      WHERE followup.id = adoption_followup_events.followup_id)
  );

NOTIFY pgrst, 'reload schema';
COMMIT;
