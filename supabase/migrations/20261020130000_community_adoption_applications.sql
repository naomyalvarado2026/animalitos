BEGIN;

CREATE TABLE IF NOT EXISTS public.community_adoption_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.community_adoption_listings(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL CHECK (length(trim(applicant_name)) BETWEEN 2 AND 120),
  applicant_email TEXT CHECK (applicant_email IS NULL OR length(trim(applicant_email)) <= 200),
  applicant_phone TEXT NOT NULL CHECK (length(regexp_replace(applicant_phone, '[^0-9]', '', 'g')) BETWEEN 9 AND 15),
  city TEXT NOT NULL CHECK (length(trim(city)) BETWEEN 2 AND 120),
  housing_type TEXT NOT NULL CHECK (housing_type IN ('house', 'apartment', 'other')),
  has_yard BOOLEAN NOT NULL DEFAULT false,
  has_children BOOLEAN NOT NULL DEFAULT false,
  has_other_pets BOOLEAN NOT NULL DEFAULT false,
  other_pets_details TEXT CHECK (other_pets_details IS NULL OR length(trim(other_pets_details)) <= 500),
  reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 10 AND 1200),
  consent_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT CHECK (admin_notes IS NULL OR length(admin_notes) <= 2000),
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_adoption_applications_listing_created_idx
  ON public.community_adoption_applications (listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_adoption_applications_status_created_idx
  ON public.community_adoption_applications (status, created_at DESC);

ALTER TABLE public.community_adoption_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_adoption_applications_public_insert
  ON public.community_adoption_applications;
CREATE POLICY community_adoption_applications_public_insert
  ON public.community_adoption_applications FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND admin_notes IS NULL
    AND reviewed_by IS NULL
    AND EXISTS (
      SELECT 1 FROM public.community_adoption_listings AS listing
      WHERE listing.id = community_adoption_applications.listing_id
        AND listing.status = 'published'
        AND listing.expires_at > now()
    )
  );

DROP POLICY IF EXISTS community_adoption_applications_admin_read
  ON public.community_adoption_applications;
CREATE POLICY community_adoption_applications_admin_read
  ON public.community_adoption_applications FOR SELECT TO authenticated
  USING (public.has_access_level(4));

DROP POLICY IF EXISTS community_adoption_applications_admin_update
  ON public.community_adoption_applications;
CREATE POLICY community_adoption_applications_admin_update
  ON public.community_adoption_applications FOR UPDATE TO authenticated
  USING (public.has_access_level(4))
  WITH CHECK (public.has_access_level(4));

REVOKE ALL ON public.community_adoption_applications FROM PUBLIC, anon, authenticated;
GRANT INSERT (
  listing_id, applicant_name, applicant_email, applicant_phone, city,
  housing_type, has_yard, has_children, has_other_pets,
  other_pets_details, reason, consent_at
) ON public.community_adoption_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.community_adoption_applications TO authenticated;

COMMIT;
