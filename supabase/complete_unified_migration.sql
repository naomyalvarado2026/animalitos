-- =====================================================================
-- ADOPTAME COMPLETE UNIFIED MIGRATION (100% IDEMPOTENT & COMPATIBLE)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Tabla: site_settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Allow public read site_settings') THEN
    CREATE POLICY "Allow public read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Allow service_role full site_settings') THEN
    CREATE POLICY "Allow service_role full site_settings" ON public.site_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 2. Tabla: profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  access_level INTEGER NOT NULL DEFAULT 1 CHECK (access_level BETWEEN 0 AND 10),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  phone        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── 3. Función de Seguridad: has_access_level ────────────────────────
CREATE OR REPLACE FUNCTION public.has_access_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND (
        role = 'super_admin'
        OR (role = 'admin' AND required_level <= 7)
        OR (role = 'editor' AND required_level <= 4)
        OR COALESCE(access_level, 1) >= required_level
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_access_level(INTEGER) TO authenticated, anon;

-- ── 4. Tabla: animals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.animals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  species            TEXT NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'other')),
  breed              TEXT,
  age_months         INTEGER,
  gender             TEXT NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
  size               TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'giant')),
  status             TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'adopted', 'foster', 'medical', 'sanctuary')),
  description        TEXT,
  medical_history    TEXT,
  requirements       TEXT[] DEFAULT '{}',
  image_urls         TEXT[] DEFAULT '{}',
  main_image_url     TEXT,
  gallery_urls       TEXT[] DEFAULT '{}',
  personality_traits TEXT[] DEFAULT '{}',
  energy_level       INTEGER DEFAULT 3,
  good_with_dogs     BOOLEAN DEFAULT true,
  good_with_cats     BOOLEAN DEFAULT true,
  good_with_kids     BOOLEAN DEFAULT true,
  urgency            TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  is_featured        BOOLEAN NOT NULL DEFAULT false,
  rescue_date        DATE,
  location           TEXT NOT NULL DEFAULT 'Refugio Principal',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS main_image_url TEXT;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS personality_traits TEXT[] DEFAULT '{}';
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS energy_level INTEGER DEFAULT 3;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS good_with_dogs BOOLEAN DEFAULT true;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS good_with_cats BOOLEAN DEFAULT true;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS good_with_kids BOOLEAN DEFAULT true;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS rescue_date DATE;
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Refugio Principal';

ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animals' AND policyname = 'Allow public read animals') THEN
    CREATE POLICY "Allow public read animals" ON public.animals FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animals' AND policyname = 'Allow service_role full animals') THEN
    CREATE POLICY "Allow service_role full animals" ON public.animals FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 5. Tabla: donors ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.donors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'company', 'organization')),
  email             TEXT,
  phone             TEXT,
  total_donated_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  message           TEXT,
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  is_anonymous      BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS total_donated_usd DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Sync columns if full_name / total_donated exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donors' AND column_name = 'full_name') THEN
    UPDATE public.donors SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donors' AND column_name = 'total_donated') THEN
    UPDATE public.donors SET total_donated_usd = total_donated WHERE total_donated_usd = 0 AND total_donated IS NOT NULL;
  END IF;
END $$;

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donors' AND policyname = 'Allow public read donors') THEN
    CREATE POLICY "Allow public read donors" ON public.donors FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donors' AND policyname = 'Allow service_role full donors') THEN
    CREATE POLICY "Allow service_role full donors" ON public.donors FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 6. Tabla: income_records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.income_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount_usd  DECIMAL(12,2) NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT NOT NULL DEFAULT 'donation' CHECK (category IN ('donation', 'event', 'other')),
  donor_id    UUID REFERENCES public.donors(id) ON DELETE SET NULL,
  event_name  TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(12,2);
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'donation';
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Sync columns if amount exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_records' AND column_name = 'amount') THEN
    UPDATE public.income_records SET amount_usd = amount WHERE amount_usd IS NULL AND amount IS NOT NULL;
  END IF;
END $$;

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'income_records' AND policyname = 'Allow public read income') THEN
    CREATE POLICY "Allow public read income" ON public.income_records FOR SELECT TO anon, authenticated USING (is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'income_records' AND policyname = 'Allow service_role full income') THEN
    CREATE POLICY "Allow service_role full income" ON public.income_records FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 7. Tabla: expense_records ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount_usd  DECIMAL(12,2) NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT NOT NULL CHECK (category IN ('food', 'medical', 'infrastructure', 'salary', 'utilities', 'supplies', 'other')),
  vendor      TEXT,
  receipt_url TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(12,2);
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'food';
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS vendor TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expense_records' AND column_name = 'amount') THEN
    UPDATE public.expense_records SET amount_usd = amount WHERE amount_usd IS NULL AND amount IS NOT NULL;
  END IF;
END $$;

ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_records' AND policyname = 'Allow public read expenses') THEN
    CREATE POLICY "Allow public read expenses" ON public.expense_records FOR SELECT TO anon, authenticated USING (is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_records' AND policyname = 'Allow service_role full expenses') THEN
    CREATE POLICY "Allow service_role full expenses" ON public.expense_records FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 8. Tabla: volunteer_activities ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.volunteer_activities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  category           TEXT NOT NULL CHECK (category IN ('dog_walking', 'medical', 'events', 'maintenance', 'cleaning', 'foster')),
  event_type         TEXT NOT NULL DEFAULT 'single_day' CHECK (event_type IN ('single_day', 'multi_day')),
  activity_date      DATE NOT NULL,
  end_date           DATE,
  recurrence_pattern TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'weekly', 'monthly', 'yearly')),
  start_time         TIME NOT NULL DEFAULT '09:00',
  end_time           TIME NOT NULL DEFAULT '12:00',
  location           TEXT NOT NULL DEFAULT 'Refugio Principal',
  max_volunteers     INTEGER NOT NULL DEFAULT 5 CHECK (max_volunteers > 0),
  current_volunteers INTEGER NOT NULL DEFAULT 0 CHECK (current_volunteers >= 0),
  coordinator_name   TEXT NOT NULL DEFAULT 'Equipo AdoptaME',
  coordinator_phone  TEXT,
  requirements       TEXT[] DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.volunteer_activities ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'single_day';
ALTER TABLE public.volunteer_activities ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.volunteer_activities ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.volunteer_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteer_activities' AND policyname = 'Allow public read volunteer_activities') THEN
    CREATE POLICY "Allow public read volunteer_activities" ON public.volunteer_activities FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteer_activities' AND policyname = 'Allow service_role full volunteer_activities') THEN
    CREATE POLICY "Allow service_role full volunteer_activities" ON public.volunteer_activities FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 9. Tabla: activity_registrations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id     UUID NOT NULL REFERENCES public.volunteer_activities(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  emergency_phone TEXT,
  experience      TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled', 'no_show')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, email)
);

ALTER TABLE public.activity_registrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_registrations' AND policyname = 'Allow public insert activity_registrations') THEN
    CREATE POLICY "Allow public insert activity_registrations" ON public.activity_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_registrations' AND policyname = 'Allow public read activity_registrations') THEN
    CREATE POLICY "Allow public read activity_registrations" ON public.activity_registrations FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_registrations' AND policyname = 'Allow service_role full activity_registrations') THEN
    CREATE POLICY "Allow service_role full activity_registrations" ON public.activity_registrations FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 10. Tabla: success_stories ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.success_stories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id        UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  animal_name      TEXT NOT NULL,
  adopter_name     TEXT,
  title            TEXT NOT NULL,
  story            TEXT NOT NULL,
  before_image_url TEXT,
  after_image_url  TEXT NOT NULL,
  adoption_date    DATE NOT NULL,
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'success_stories' AND policyname = 'Allow public read success_stories') THEN
    CREATE POLICY "Allow public read success_stories" ON public.success_stories FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'success_stories' AND policyname = 'Allow service_role full success_stories') THEN
    CREATE POLICY "Allow service_role full success_stories" ON public.success_stories FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 11. Tabla: memory_memorials ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_memorials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_name  TEXT NOT NULL,
  tribute      TEXT NOT NULL,
  image_url    TEXT,
  rescue_date  DATE,
  passing_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_memorials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memory_memorials' AND policyname = 'Allow public read memory_memorials') THEN
    CREATE POLICY "Allow public read memory_memorials" ON public.memory_memorials FOR SELECT TO anon, authenticated USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memory_memorials' AND policyname = 'Allow service_role full memory_memorials') THEN
    CREATE POLICY "Allow service_role full memory_memorials" ON public.memory_memorials FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 12. Tabla: products & merchandising ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  tagline        TEXT,
  description    TEXT NOT NULL,
  price_cents    INTEGER NOT NULL CHECK (price_cents >= 0),
  category       TEXT NOT NULL CHECK (category IN ('apparel', 'accessories', 'drinkware', 'home', 'stationery', 'all')),
  badge          TEXT,
  image_url      TEXT NOT NULL,
  gallery_urls   TEXT[] DEFAULT '{}',
  stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  impact_message TEXT,
  details        TEXT[] DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public read products') THEN
    CREATE POLICY "Allow public read products" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow service_role full products') THEN
    CREATE POLICY "Allow service_role full products" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 13. Tabla: orders & order_items ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      TEXT UNIQUE NOT NULL,
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT,
  shipping_address  JSONB,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled')),
  currency          TEXT NOT NULL DEFAULT 'USD',
  total_cents       INTEGER NOT NULL CHECK (total_cents >= 0),
  payment_reference TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id             UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot  TEXT NOT NULL,
  variant_label_snapshot TEXT,
  unit_price_cents       INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  quantity               INTEGER NOT NULL CHECK (quantity > 0),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow public insert orders') THEN
    CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow service_role full orders') THEN
    CREATE POLICY "Allow service_role full orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Allow public insert order_items') THEN
    CREATE POLICY "Allow public insert order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Allow service_role full order_items') THEN
    CREATE POLICY "Allow service_role full order_items" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 14. Tabla: contact_messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'support', 'donation', 'volunteer')),
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Allow public insert contact_messages') THEN
    CREATE POLICY "Allow public insert contact_messages" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Allow service_role full contact_messages') THEN
    CREATE POLICY "Allow service_role full contact_messages" ON public.contact_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 15. Tabla: adoption_applications ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.adoption_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  applicant_name  TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  housing_type    TEXT,
  has_yard        BOOLEAN DEFAULT false,
  has_other_pets  BOOLEAN DEFAULT false,
  experience      TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'interview_scheduled', 'approved', 'rejected', 'completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'adoption_applications' AND policyname = 'Allow public insert adoption_applications') THEN
    CREATE POLICY "Allow public insert adoption_applications" ON public.adoption_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'adoption_applications' AND policyname = 'Allow service_role full adoption_applications') THEN
    CREATE POLICY "Allow service_role full adoption_applications" ON public.adoption_applications FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 16. Tabla: volunteer_applications ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  area_of_interest TEXT NOT NULL,
  availability     TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'active', 'inactive')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteer_applications' AND policyname = 'Allow public insert volunteer_applications') THEN
    CREATE POLICY "Allow public insert volunteer_applications" ON public.volunteer_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteer_applications' AND policyname = 'Allow service_role full volunteer_applications') THEN
    CREATE POLICY "Allow service_role full volunteer_applications" ON public.volunteer_applications FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 17. Permisos globales para usuarios anon y authenticated ─────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
