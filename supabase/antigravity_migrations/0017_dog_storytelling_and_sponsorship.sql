-- Editorial storytelling, reusable media and responsible sponsorship inquiries.
-- The frontend can use a versioned local fallback until this migration is deployed.

CREATE TABLE IF NOT EXISTS public.dog_editorial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  voice_line TEXT NOT NULL DEFAULT '',
  social_caption TEXT NOT NULL DEFAULT '',
  sponsor_focus TEXT NOT NULL DEFAULT '',
  accent_color TEXT NOT NULL DEFAULT '#f0644a',
  cover_image_url TEXT NOT NULL DEFAULT '',
  gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery_urls) = 'array'),
  focal_x SMALLINT NOT NULL DEFAULT 50 CHECK (focal_x BETWEEN 0 AND 100),
  focal_y SMALLINT NOT NULL DEFAULT 50 CHECK (focal_y BETWEEN 0 AND 100),
  featured BOOLEAN NOT NULL DEFAULT false,
  appearances TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dog_story_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.dog_editorial_profiles(id) ON DELETE CASCADE,
  eyebrow TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.animal_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE,
  dog_slug TEXT,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'gallery' CHECK (kind IN ('cover', 'gallery', 'social', 'cutout', 'video')),
  focal_x SMALLINT NOT NULL DEFAULT 50 CHECK (focal_x BETWEEN 0 AND 100),
  focal_y SMALLINT NOT NULL DEFAULT 50 CHECK (focal_y BETWEEN 0 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sponsorship_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  dog_slug TEXT NOT NULL,
  supporter_name TEXT NOT NULL,
  supporter_email TEXT NOT NULL,
  supporter_phone TEXT NOT NULL,
  amount_usd NUMERIC(10,2) CHECK (amount_usd IS NULL OR amount_usd > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'monthly')),
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dog_story_milestones_profile_sort_idx ON public.dog_story_milestones(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS animal_media_animal_sort_idx ON public.animal_media(animal_id, sort_order);
CREATE INDEX IF NOT EXISTS sponsorship_inquiries_status_created_idx ON public.sponsorship_inquiries(status, created_at DESC);

ALTER TABLE public.dog_editorial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_story_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dog_editorial_public_read" ON public.dog_editorial_profiles
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "dog_editorial_admin_all" ON public.dog_editorial_profiles
  FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

CREATE POLICY "dog_milestones_public_read" ON public.dog_story_milestones
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.dog_editorial_profiles profile WHERE profile.id = profile_id AND profile.is_published = true)
  );
CREATE POLICY "dog_milestones_admin_all" ON public.dog_story_milestones
  FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

CREATE POLICY "animal_media_public_read" ON public.animal_media
  FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "animal_media_admin_all" ON public.animal_media
  FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

CREATE POLICY "sponsorship_admin_all" ON public.sponsorship_inquiries
  FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

CREATE OR REPLACE FUNCTION public.create_sponsorship_inquiry(
  p_dog_slug TEXT,
  p_supporter_name TEXT,
  p_supporter_email TEXT,
  p_supporter_phone TEXT,
  p_amount_usd NUMERIC DEFAULT NULL,
  p_frequency TEXT DEFAULT 'monthly',
  p_message TEXT DEFAULT ''
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_id UUID;
  matched_animal_id UUID;
BEGIN
  IF length(trim(p_dog_slug)) < 2 OR length(trim(p_supporter_name)) < 2
    OR position('@' IN p_supporter_email) < 2 OR length(trim(p_supporter_phone)) < 7
    OR p_frequency NOT IN ('once', 'monthly') OR (p_amount_usd IS NOT NULL AND p_amount_usd <= 0)
    OR length(p_message) > 500 THEN
    RAISE EXCEPTION 'Invalid sponsorship inquiry';
  END IF;

  SELECT id INTO matched_animal_id FROM public.animals WHERE adoption_slug = trim(p_dog_slug) LIMIT 1;
  INSERT INTO public.sponsorship_inquiries (
    animal_id, dog_slug, supporter_name, supporter_email, supporter_phone,
    amount_usd, frequency, message
  ) VALUES (
    matched_animal_id, trim(p_dog_slug), trim(p_supporter_name), lower(trim(p_supporter_email)),
    trim(p_supporter_phone), p_amount_usd, p_frequency, trim(p_message)
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sponsorship_inquiry(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sponsorship_inquiry(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated;

COMMENT ON TABLE public.animal_media IS 'Reusable media library. kind=cutout is reserved for future transparent full-body assets and layered/3D experiences.';
COMMENT ON TABLE public.sponsorship_inquiries IS 'Non-payment contact intents. Payment instructions are confirmed separately by the refuge team.';
