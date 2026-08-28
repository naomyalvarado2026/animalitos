-- =====================================================================
-- 009_complete_unified_migration.sql
-- Animalitos — Refugio de Animales
-- Schema update: Merchandising, Memorials, Site Settings, Hardening
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

-- ── 2. Profiles extension ────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── 3. Security Helper ───────────────────────────────────────────────
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

-- ── 4. Animals extension ─────────────────────────────────────────────
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

-- ── 5. Donors extension ──────────────────────────────────────────────
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS total_donated_usd DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- ── 6. Income & Expense extension ────────────────────────────────────
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(12,2);
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'donation';
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(12,2);
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'food';
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS vendor TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- ── 7. Memorials ─────────────────────────────────────────────────────
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

-- ── 8. Products & Merchandising ──────────────────────────────────────
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

-- ── 9. Orders & Order Items ──────────────────────────────────────────
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

-- ── 10. Contact messages ─────────────────────────────────────────────
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
