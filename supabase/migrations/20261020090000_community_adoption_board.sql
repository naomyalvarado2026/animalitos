BEGIN;

CREATE TABLE IF NOT EXISTS public.community_adoption_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  slug TEXT NOT NULL UNIQUE,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat')),
  breed TEXT,
  age_label TEXT NOT NULL DEFAULT 'Edad por confirmar',
  gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('female', 'male', 'unknown')),
  size TEXT NOT NULL DEFAULT 'unknown' CHECK (size IN ('small', 'medium', 'large', 'unknown')),
  city TEXT NOT NULL DEFAULT 'Milagro',
  province TEXT NOT NULL DEFAULT 'Guayas',
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 5 AND 3000),
  main_image_url TEXT NOT NULL,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  vaccination_status TEXT NOT NULL DEFAULT 'unknown' CHECK (vaccination_status IN ('unknown', 'up_to_date', 'pending')),
  sterilized BOOLEAN,
  is_special_needs BOOLEAN NOT NULL DEFAULT false,
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'adopted', 'archived')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_adoption_listings_public_idx
  ON public.community_adoption_listings (status, expires_at, created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_adoption_listing_contacts (
  listing_id UUID PRIMARY KEY REFERENCES public.community_adoption_listings(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL CHECK (length(trim(contact_name)) BETWEEN 2 AND 120),
  whatsapp_number TEXT NOT NULL CHECK (length(regexp_replace(whatsapp_number, '[^0-9]', '', 'g')) BETWEEN 9 AND 15),
  share_whatsapp BOOLEAN NOT NULL DEFAULT false,
  whatsapp_consent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_adoption_contact_consent_check CHECK (NOT share_whatsapp OR whatsapp_consent_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS community_adoption_contacts_share_idx
  ON public.community_adoption_listing_contacts (listing_id)
  WHERE share_whatsapp = true;

ALTER TABLE public.community_adoption_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_adoption_listing_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_listings_public_read ON public.community_adoption_listings;
CREATE POLICY community_listings_public_read
  ON public.community_adoption_listings FOR SELECT TO anon, authenticated
  USING (status = 'published' AND expires_at > now());

DROP POLICY IF EXISTS community_listings_admin_all ON public.community_adoption_listings;
CREATE POLICY community_listings_admin_all
  ON public.community_adoption_listings FOR ALL TO authenticated
  USING (public.has_access_level(4))
  WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS community_listing_contacts_admin_all ON public.community_adoption_listing_contacts;
CREATE POLICY community_listing_contacts_admin_all
  ON public.community_adoption_listing_contacts FOR ALL TO authenticated
  USING (public.has_access_level(4))
  WITH CHECK (public.has_access_level(4));

-- Explicit grants make the tables available through the Data API and remain ready
-- for projects that do not expose new public-schema tables automatically.
REVOKE ALL ON public.community_adoption_listings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.community_adoption_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_adoption_listings TO authenticated;

REVOKE ALL ON public.community_adoption_listing_contacts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.community_adoption_listing_contacts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_adoption_listing_contacts TO authenticated;

CREATE OR REPLACE FUNCTION public.save_community_adoption_listing(p_listing JSONB, p_contact JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  listing_id UUID;
  share_phone BOOLEAN;
  listing_status TEXT;
BEGIN
  IF NOT COALESCE(public.has_access_level(4), false) THEN
    RAISE EXCEPTION 'No tienes permisos para administrar publicaciones comunitarias.'
      USING ERRCODE = '42501';
  END IF;

  listing_id := COALESCE(NULLIF(p_listing->>'id', '')::UUID, gen_random_uuid());
  share_phone := COALESCE((p_contact->>'share_whatsapp')::BOOLEAN, false);
  listing_status := COALESCE(NULLIF(p_listing->>'status', ''), 'draft');

  IF listing_status = 'published' AND NOT share_phone THEN
    RAISE EXCEPTION 'Se necesita autorización para publicar el WhatsApp de contacto.'
      USING ERRCODE = '23514';
  END IF;

  IF length(regexp_replace(COALESCE(p_contact->>'whatsapp_number', ''), '[^0-9]', '', 'g')) NOT BETWEEN 9 AND 15 THEN
    RAISE EXCEPTION 'El número de WhatsApp no es válido.'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.community_adoption_listings (
    id, name, slug, species, breed, age_label, gender, size,
    city, province, description, main_image_url, gallery_urls,
    vaccination_status, sterilized, is_special_needs, special_notes,
    status, expires_at, updated_at
  )
  VALUES (
    listing_id,
    trim(p_listing->>'name'),
    trim(p_listing->>'slug'),
    p_listing->>'species',
    NULLIF(trim(COALESCE(p_listing->>'breed', '')), ''),
    COALESCE(NULLIF(trim(COALESCE(p_listing->>'age_label', '')), ''), 'Edad por confirmar'),
    COALESCE(NULLIF(p_listing->>'gender', ''), 'unknown'),
    COALESCE(NULLIF(p_listing->>'size', ''), 'unknown'),
    COALESCE(NULLIF(trim(COALESCE(p_listing->>'city', '')), ''), 'Milagro'),
    COALESCE(NULLIF(trim(COALESCE(p_listing->>'province', '')), ''), 'Guayas'),
    trim(p_listing->>'description'),
    p_listing->>'main_image_url',
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_listing->'gallery_urls', '[]'::JSONB))), ARRAY[p_listing->>'main_image_url']),
    COALESCE(NULLIF(p_listing->>'vaccination_status', ''), 'unknown'),
    CASE WHEN p_listing->>'sterilized' IN ('true', 'false') THEN (p_listing->>'sterilized')::BOOLEAN ELSE NULL END,
    COALESCE((p_listing->>'is_special_needs')::BOOLEAN, false),
    NULLIF(trim(COALESCE(p_listing->>'special_notes', '')), ''),
    listing_status,
    COALESCE(NULLIF(p_listing->>'expires_at', '')::TIMESTAMPTZ, now() + interval '30 days'),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    species = EXCLUDED.species,
    breed = EXCLUDED.breed,
    age_label = EXCLUDED.age_label,
    gender = EXCLUDED.gender,
    size = EXCLUDED.size,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    description = EXCLUDED.description,
    main_image_url = EXCLUDED.main_image_url,
    gallery_urls = EXCLUDED.gallery_urls,
    vaccination_status = EXCLUDED.vaccination_status,
    sterilized = EXCLUDED.sterilized,
    is_special_needs = EXCLUDED.is_special_needs,
    special_notes = EXCLUDED.special_notes,
    status = EXCLUDED.status,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO listing_id;

  INSERT INTO public.community_adoption_listing_contacts (
    listing_id, contact_name, whatsapp_number, share_whatsapp, whatsapp_consent_at, updated_at
  )
  VALUES (
    listing_id,
    trim(p_contact->>'contact_name'),
    regexp_replace(p_contact->>'whatsapp_number', '[^0-9]', '', 'g'),
    share_phone,
    CASE WHEN share_phone THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (listing_id) DO UPDATE SET
    contact_name = EXCLUDED.contact_name,
    whatsapp_number = EXCLUDED.whatsapp_number,
    share_whatsapp = EXCLUDED.share_whatsapp,
    whatsapp_consent_at = EXCLUDED.whatsapp_consent_at,
    updated_at = now();

  RETURN listing_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_community_adoption_listing(JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_community_adoption_listing(JSONB, JSONB) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-animal-photos',
  'community-animal-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS community_animal_photos_admin_insert ON storage.objects;
CREATE POLICY community_animal_photos_admin_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-animal-photos' AND public.has_access_level(4));

DROP POLICY IF EXISTS community_animal_photos_admin_update ON storage.objects;
CREATE POLICY community_animal_photos_admin_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'community-animal-photos' AND public.has_access_level(4))
  WITH CHECK (bucket_id = 'community-animal-photos' AND public.has_access_level(4));

DROP POLICY IF EXISTS community_animal_photos_admin_delete ON storage.objects;
CREATE POLICY community_animal_photos_admin_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-animal-photos' AND public.has_access_level(4));

COMMIT;
