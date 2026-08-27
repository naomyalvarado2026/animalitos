-- AdoptaME — memorial público de perritos fallecidos
CREATE TABLE IF NOT EXISTS public.memory_memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_name TEXT NOT NULL CHECK (char_length(trim(animal_name)) BETWEEN 2 AND 120),
  tribute TEXT NOT NULL CHECK (char_length(trim(tribute)) BETWEEN 10 AND 5000),
  image_url TEXT,
  rescue_date DATE,
  passing_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_memorials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "memory_public_read_published" ON public.memory_memorials;
CREATE POLICY "memory_public_read_published" ON public.memory_memorials FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "memory_admin_read" ON public.memory_memorials;
CREATE POLICY "memory_admin_read" ON public.memory_memorials FOR SELECT TO authenticated USING (public.has_access_level(4));
DROP POLICY IF EXISTS "memory_admin_write" ON public.memory_memorials;
CREATE POLICY "memory_admin_write" ON public.memory_memorials FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
GRANT SELECT ON public.memory_memorials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.memory_memorials TO authenticated;
