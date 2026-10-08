-- Reconciliation against live Centro Integral schema, 2026-10-07.
-- No seeds, no record deletion. Execute atomically.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK(role IN ('super_admin','admin','editor','viewer','volunteer','user'));
-- AdoptaME / Antigravity — seguridad base
-- Ejecutar después de 001–008.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, access_level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'viewer',
    1
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_access_level(required_level INTEGER)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_active = true
      AND access_level >= required_level
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_authenticated_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_access_level(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_authenticated_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_access_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
-- AdoptaME / Antigravity — normaliza acceso por rol

-- Corrige perfiles antiguos que tienen role='admin' pero conservaron el nivel 1
-- creado por el trigger inicial. No reduce niveles asignados manualmente.
UPDATE public.profiles
SET access_level = CASE role
  WHEN 'super_admin' THEN GREATEST(access_level, 10)
  WHEN 'admin' THEN GREATEST(access_level, 7)
  WHEN 'editor' THEN GREATEST(access_level, 4)
  ELSE access_level
END,
updated_at = now()
WHERE role IN ('super_admin', 'admin', 'editor');

CREATE OR REPLACE FUNCTION public.has_access_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_active = true
      AND CASE role
        WHEN 'super_admin' THEN GREATEST(access_level, 10)
        WHEN 'admin' THEN GREATEST(access_level, 7)
        WHEN 'editor' THEN GREATEST(access_level, 4)
        ELSE access_level
      END >= required_level
  );
$$;

REVOKE ALL ON FUNCTION public.has_access_level(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_access_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_access_level(integer) TO anon;
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

ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS good_with_children boolean, ADD COLUMN IF NOT EXISTS apartment_friendly boolean;
ALTER TABLE public.animals ALTER COLUMN good_with_dogs DROP DEFAULT, ALTER COLUMN good_with_cats DROP DEFAULT, ALTER COLUMN good_with_kids DROP DEFAULT;
UPDATE public.animals SET main_image_url=COALESCE(main_image_url,image_urls[1]), gallery_urls=CASE WHEN cardinality(gallery_urls)=0 THEN image_urls ELSE gallery_urls END;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS logo_url text, ADD COLUMN IF NOT EXISTS first_donation_date date, ADD COLUMN IF NOT EXISTS last_donation_date date;
ALTER TABLE public.donors ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS receipt_url text, ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.expense_records ALTER COLUMN amount DROP NOT NULL;
ALTER TABLE public.income_records ALTER COLUMN amount DROP NOT NULL;
ALTER TABLE public.expense_records ALTER COLUMN is_public SET DEFAULT false;
ALTER TABLE public.income_records ALTER COLUMN is_public SET DEFAULT false;
UPDATE public.expense_records SET is_public=false WHERE amount_usd IS NULL;
UPDATE public.income_records SET is_public=false WHERE amount_usd IS NULL;
ALTER TABLE public.donors DROP CONSTRAINT IF EXISTS donors_type_check;
ALTER TABLE public.donors ADD CONSTRAINT donors_type_check CHECK(type IN ('individual','corporate','company','organization'));
ALTER TABLE public.expense_records DROP CONSTRAINT IF EXISTS expense_records_category_check;
ALTER TABLE public.expense_records ADD CONSTRAINT expense_records_category_check CHECK(category IN ('veterinary','food','supplies','infrastructure','services','marketing','other','medical','salary','utilities'));
ALTER TABLE public.adoption_applications ADD COLUMN IF NOT EXISTS applicant_address text, ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS has_children boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS housing_notes text, ADD COLUMN IF NOT EXISTS other_pets_desc text, ADD COLUMN IF NOT EXISTS reason text, ADD COLUMN IF NOT EXISTS admin_notes text, ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id), ADD COLUMN IF NOT EXISTS consent_at timestamptz;
ALTER TABLE public.adoption_applications ALTER COLUMN address DROP NOT NULL;
-- =====================================================================
-- 010_animal_operations_and_stories.sql
-- Animalitos — Ficha operativa, tareas, movimientos y perfiles narrativos
-- =====================================================================

-- ── 1. Columnas narrativas y operativas en animals ───────────────────
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS story TEXT,
  ADD COLUMN IF NOT EXISTS health_status TEXT,
  ADD COLUMN IF NOT EXISTS is_vaccinated BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_neutered BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_special_needs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_needs_desc TEXT,
  ADD COLUMN IF NOT EXISTS adoption_slug TEXT,
  ADD COLUMN IF NOT EXISTS age_is_estimated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vaccination_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (vaccination_status IN ('unknown', 'up_to_date', 'pending')),
  ADD COLUMN IF NOT EXISTS personality_summary TEXT,
  ADD COLUMN IF NOT EXISTS ideal_home TEXT,
  ADD COLUMN IF NOT EXISTS compatibility_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_brand_moment BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand_message TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.animals ALTER COLUMN age_months DROP NOT NULL;
ALTER TABLE public.animals ALTER COLUMN is_vaccinated DROP NOT NULL;

-- ── 2. Tablas operativas: Historial médico ────────────────────────────
CREATE TABLE IF NOT EXISTS public.animal_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('exam', 'vaccine', 'medication', 'procedure', 'lab', 'note')),
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  provider TEXT,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  next_due_on DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Tablas operativas: Tareas de cuidado ──────────────────────────
CREATE TABLE IF NOT EXISTS public.animal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_on DATE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Tablas operativas: Movimientos y traslados ────────────────────
CREATE TABLE IF NOT EXISTS public.animal_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('intake', 'foster', 'transfer', 'adoption', 'return', 'medical', 'quarantine', 'other')),
  from_location TEXT,
  to_location TEXT,
  moved_on DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. Índices y RLS ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS animal_medical_records_animal_idx ON public.animal_medical_records (animal_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS animal_tasks_open_idx ON public.animal_tasks (status, due_on);
CREATE INDEX IF NOT EXISTS animal_tasks_animal_idx ON public.animal_tasks (animal_id, due_on);
CREATE INDEX IF NOT EXISTS animal_movements_animal_idx ON public.animal_movements (animal_id, moved_on DESC);
CREATE INDEX IF NOT EXISTS animals_public_sort_idx ON public.animals (is_published, sort_order, created_at DESC);

ALTER TABLE public.animal_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_movements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animal_medical_records' AND policyname = 'animal_medical_records_admin') THEN
    DROP POLICY IF EXISTS "animal_medical_records_admin" ON public.animal_medical_records;
CREATE POLICY "animal_medical_records_admin" ON public.animal_medical_records FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animal_tasks' AND policyname = 'animal_tasks_admin') THEN
    DROP POLICY IF EXISTS "animal_tasks_admin" ON public.animal_tasks;
CREATE POLICY "animal_tasks_admin" ON public.animal_tasks FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'animal_movements' AND policyname = 'animal_movements_admin') THEN
    DROP POLICY IF EXISTS "animal_movements_admin" ON public.animal_movements;
CREATE POLICY "animal_movements_admin" ON public.animal_movements FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
  END IF;
END $$;
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_size_check;
ALTER TABLE public.animals ADD CONSTRAINT animals_size_check CHECK(size IN ('unknown','small','medium','large','xlarge','extra_large'));
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_status_check;
ALTER TABLE public.animals ADD CONSTRAINT animals_status_check CHECK(status IN ('available','pending','adopted','fostered','medical_hold','medical_care'));
CREATE UNIQUE INDEX IF NOT EXISTS animals_adoption_slug_unique ON public.animals(adoption_slug);
-- ═══════════════════════════════════════════════════════════════════
-- 008_recurring_events.sql
-- Módulo de Eventos Recurrentes, Multidía y Asignación Manual de Personas
-- ═══════════════════════════════════════════════════════════════════

-- ── Añadir columnas de recurrencia y multidía ─────────────────────
ALTER TABLE public.volunteer_activities
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'single_day' CHECK (event_type IN ('single_day', 'multi_day')),
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES public.volunteer_activities(id) ON DELETE CASCADE;

ALTER TABLE public.activity_registrations
  ADD COLUMN IF NOT EXISTS assigned_by_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.volunteer_activities.event_type IS 'Define si es evento de un día o de varios días seguidos.';
COMMENT ON COLUMN public.volunteer_activities.recurrence_pattern IS 'Frecuencia de repetición: ninguna, semanal, mensual o anual.';
COMMENT ON COLUMN public.activity_registrations.assigned_by_admin IS 'Indica si la persona fue inscrita manualmente por un administrador.';

-- AdoptaME / Antigravity — solicitudes sin duplicados

CREATE UNIQUE INDEX IF NOT EXISTS adoption_one_active_request_idx
  ON public.adoption_applications (animal_id, lower(applicant_email))
  WHERE status IN ('pending', 'under_review', 'approved');

CREATE OR REPLACE FUNCTION public.submit_adoption_application(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE new_id UUID;
BEGIN
  IF length(trim(COALESCE(payload->>'applicant_name', ''))) NOT BETWEEN 2 AND 120
     OR length(trim(COALESCE(payload->>'applicant_email', ''))) NOT BETWEEN 5 AND 254
     OR length(trim(COALESCE(payload->>'applicant_phone', ''))) NOT BETWEEN 7 AND 40 THEN
    RAISE EXCEPTION 'Datos de contacto inválidos';
  END IF;

  INSERT INTO public.adoption_applications (
    animal_id, applicant_name, applicant_email, applicant_phone,
    applicant_address, city, housing_type, has_yard, has_other_pets,
    has_children, other_pets_desc, housing_notes, reason, consent_at
  ) VALUES (
    (payload->>'animal_id')::UUID,
    trim(payload->>'applicant_name'), lower(trim(payload->>'applicant_email')),
    trim(payload->>'applicant_phone'), NULLIF(trim(payload->>'applicant_address'), ''),
    NULLIF(trim(payload->>'city'), ''), payload->>'housing_type',
    COALESCE((payload->>'has_yard')::BOOLEAN, false),
    COALESCE((payload->>'has_other_pets')::BOOLEAN, false),
    COALESCE((payload->>'has_children')::BOOLEAN, false),
    NULLIF(trim(payload->>'other_pets_desc'), ''),
    NULLIF(trim(payload->>'housing_notes'), ''), trim(payload->>'reason'), now()
  ) RETURNING id INTO new_id;
  RETURN new_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Ya existe una solicitud activa para este perro y correo';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_adoption_application(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_adoption_application(JSONB) TO anon, authenticated;
-- AdoptaME / Antigravity — merchandising trazable

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  inventory INTEGER NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sku TEXT UNIQUE,
  price_delta_cents INTEGER NOT NULL DEFAULT 0,
  inventory INTEGER NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(product_id, label)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('AME-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10))),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'USD',
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  idempotency_key TEXT UNIQUE,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  product_name_snapshot TEXT NOT NULL,
  variant_label_snapshot TEXT,
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE(order_id, product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read_active" ON public.products;
CREATE POLICY "products_public_read_active" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "variants_public_read_active" ON public.product_variants;
CREATE POLICY "variants_public_read_active" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "orders_admin_read" ON public.orders;
CREATE POLICY "orders_admin_read" ON public.orders FOR SELECT TO authenticated USING (public.has_access_level(4));
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.has_access_level(4));
DROP POLICY IF EXISTS "order_items_admin_read" ON public.order_items;
CREATE POLICY "order_items_admin_read" ON public.order_items FOR SELECT TO authenticated USING (public.has_access_level(4));
DROP POLICY IF EXISTS "order_history_admin_read" ON public.order_status_history;
CREATE POLICY "order_history_admin_read" ON public.order_status_history FOR SELECT TO authenticated USING (public.has_access_level(4));
-- AdoptaME / Antigravity — permisos administrativos del catálogo

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products
FOR ALL TO authenticated
USING (public.has_access_level(4))
WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS "variants_admin_write" ON public.product_variants;
DROP POLICY IF EXISTS "variants_admin_write" ON public.product_variants;
CREATE POLICY "variants_admin_write" ON public.product_variants
FOR ALL TO authenticated
USING (public.has_access_level(4))
WITH CHECK (public.has_access_level(4));

CREATE INDEX IF NOT EXISTS products_active_created_at_idx
ON public.products (is_active, created_at DESC);
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

DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_log;
CREATE POLICY "audit_admin_read" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_access_level(7));
DROP POLICY IF EXISTS "adoption_history_admin_read" ON public.adoption_status_history;
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
-- AdoptaME / Antigravity — checkout público de merchandising en USD

CREATE OR REPLACE FUNCTION public.create_merchandise_order(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_product_slug TEXT,
  p_quantity INTEGER DEFAULT 1,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_quantity INTEGER := COALESCE(p_quantity, 1);
BEGIN
  IF length(trim(COALESCE(p_customer_name, ''))) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'El nombre no es válido';
  END IF;
  IF lower(trim(COALESCE(p_customer_email, ''))) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'El correo no es válido';
  END IF;
  IF length(trim(COALESCE(p_customer_phone, ''))) NOT BETWEEN 7 AND 40 THEN
    RAISE EXCEPTION 'El teléfono no es válido';
  END IF;
  IF v_quantity < 1 OR v_quantity > 20 THEN
    RAISE EXCEPTION 'La cantidad debe estar entre 1 y 20';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE slug = lower(trim(p_product_slug))
    AND is_active = true
    AND currency = 'USD'
    AND inventory >= v_quantity
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El producto no está disponible';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number, 'status', v_order.status);
    END IF;
  END IF;

  INSERT INTO public.orders (customer_name, customer_email, customer_phone, status, currency, total_cents, idempotency_key)
  VALUES (trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone), 'pending', 'USD', v_product.price_cents * v_quantity, p_idempotency_key)
  RETURNING * INTO v_order;

  INSERT INTO public.order_items (order_id, product_id, product_name_snapshot, unit_price_cents, quantity)
  VALUES (v_order.id, v_product.id, v_product.name, v_product.price_cents, v_quantity);

  UPDATE public.products
  SET inventory = inventory - v_quantity, updated_at = now()
  WHERE id = v_product.id;

  RETURN jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number, 'status', v_order.status);
END;
$$;

REVOKE ALL ON FUNCTION public.create_merchandise_order(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_merchandise_order(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_status_history_trigger ON public.orders;
CREATE TRIGGER orders_status_history_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.record_order_status_change();
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
DROP POLICY IF EXISTS "memory_public_read_published" ON public.memory_memorials;
CREATE POLICY "memory_public_read_published" ON public.memory_memorials FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "memory_admin_read" ON public.memory_memorials;
DROP POLICY IF EXISTS "memory_admin_read" ON public.memory_memorials;
CREATE POLICY "memory_admin_read" ON public.memory_memorials FOR SELECT TO authenticated USING (public.has_access_level(4));
DROP POLICY IF EXISTS "memory_admin_write" ON public.memory_memorials;
DROP POLICY IF EXISTS "memory_admin_write" ON public.memory_memorials;
CREATE POLICY "memory_admin_write" ON public.memory_memorials FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
GRANT SELECT ON public.memory_memorials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.memory_memorials TO authenticated;
-- =====================================================================
-- 011_usd_only.sql
-- Animalitos — Moneda única operativa en USD para productos y pedidos
-- =====================================================================

UPDATE public.products
SET currency = 'USD', updated_at = now()
WHERE currency IS DISTINCT FROM 'USD';

UPDATE public.orders
SET currency = 'USD', updated_at = now()
WHERE currency IS DISTINCT FROM 'USD';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_currency_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_currency_check CHECK (currency = 'USD');

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_currency_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_currency_check CHECK (currency = 'USD');
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
    DROP POLICY IF EXISTS "Allow public insert contact_messages" ON public.contact_messages;
CREATE POLICY "Allow public insert contact_messages" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Allow service_role full contact_messages') THEN
    DROP POLICY IF EXISTS "Allow service_role full contact_messages" ON public.contact_messages;
CREATE POLICY "Allow service_role full contact_messages" ON public.contact_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
-- AdoptaME / Antigravity — validación de formularios públicos

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS honeypot TEXT,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

ALTER TABLE public.volunteer_applications
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

ALTER TABLE public.activity_registrations
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_length_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_length_check CHECK (
  length(trim(name)) BETWEEN 2 AND 120 AND
  length(trim(email)) BETWEEN 5 AND 254 AND
  length(trim(subject)) BETWEEN 2 AND 160 AND
  length(trim(message)) BETWEEN 5 AND 5000 AND
  COALESCE(length(honeypot), 0) = 0
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS volunteer_applications_created_at_idx ON public.volunteer_applications (created_at DESC);
-- Editorial storytelling, reusable media and responsible sponsorship inquiries.
-- The frontend can use a versioned local fallback until this migration is deployed.

CREATE TABLE IF NOT EXISTS public.dog_editorial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  voice_line TEXT NOT NULL DEFAULT '',
  social_caption TEXT NOT NULL DEFAULT '',
  sponsor_focus TEXT NOT NULL DEFAULT '',
  accent_color TEXT NOT NULL DEFAULT '#ff8069',
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

DROP POLICY IF EXISTS "dog_editorial_public_read" ON public.dog_editorial_profiles;
CREATE POLICY "dog_editorial_public_read" ON public.dog_editorial_profiles
  FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "dog_editorial_admin_all" ON public.dog_editorial_profiles;
CREATE POLICY "dog_editorial_admin_all" ON public.dog_editorial_profiles
  FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS "dog_milestones_public_read" ON public.dog_story_milestones;
CREATE POLICY "dog_milestones_public_read" ON public.dog_story_milestones
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.dog_editorial_profiles profile WHERE profile.id = profile_id AND profile.is_published = true)
  );
DROP POLICY IF EXISTS "dog_milestones_admin_all" ON public.dog_story_milestones;
CREATE POLICY "dog_milestones_admin_all" ON public.dog_story_milestones
  FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS "animal_media_public_read" ON public.animal_media;
CREATE POLICY "animal_media_public_read" ON public.animal_media
  FOR SELECT TO anon, authenticated USING (is_public = true);
DROP POLICY IF EXISTS "animal_media_admin_all" ON public.animal_media;
CREATE POLICY "animal_media_admin_all" ON public.animal_media
  FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS "sponsorship_admin_all" ON public.sponsorship_inquiries;
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
CREATE TABLE IF NOT EXISTS public.site_content(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), page_slug text NOT NULL, section_key text NOT NULL, content_type text NOT NULL DEFAULT 'text', content text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0, is_published boolean NOT NULL DEFAULT false, updated_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(page_slug,section_key));
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura pública de animales" ON public.animals;
DROP POLICY IF EXISTS animals_public_read_published ON public.animals;
CREATE POLICY animals_public_read_published ON public.animals FOR SELECT TO anon,authenticated USING(is_published AND status IN ('available','medical_care','medical_hold'));
DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid());
DROP POLICY IF EXISTS profiles_super_admin_all ON public.profiles;
CREATE POLICY profiles_super_admin_all ON public.profiles FOR ALL TO authenticated USING(public.is_super_admin()) WITH CHECK(public.is_super_admin());
DROP POLICY IF EXISTS site_content_public ON public.site_content;
CREATE POLICY site_content_public ON public.site_content FOR SELECT TO anon,authenticated USING(is_published);
DROP POLICY IF EXISTS reconcile_admin_all ON public.animals;
CREATE POLICY reconcile_admin_all ON public.animals FOR ALL TO authenticated USING(public.has_access_level(4)) WITH CHECK(public.has_access_level(4));
DROP POLICY IF EXISTS reconcile_admin_all ON public.adoption_applications;
CREATE POLICY reconcile_admin_all ON public.adoption_applications FOR ALL TO authenticated USING(public.has_access_level(4)) WITH CHECK(public.has_access_level(4));
DROP POLICY IF EXISTS reconcile_admin_all ON public.volunteer_applications;
CREATE POLICY reconcile_admin_all ON public.volunteer_applications FOR ALL TO authenticated USING(public.has_access_level(4)) WITH CHECK(public.has_access_level(4));
DROP POLICY IF EXISTS reconcile_admin_all ON public.activity_registrations;
CREATE POLICY reconcile_admin_all ON public.activity_registrations FOR ALL TO authenticated USING(public.has_access_level(4)) WITH CHECK(public.has_access_level(4));
DROP POLICY IF EXISTS reconcile_admin_all ON public.site_settings;
CREATE POLICY reconcile_admin_all ON public.site_settings FOR ALL TO authenticated USING(public.has_access_level(4)) WITH CHECK(public.has_access_level(4));
DROP POLICY IF EXISTS reconcile_admin_all ON public.site_content;
CREATE POLICY reconcile_admin_all ON public.site_content FOR ALL TO authenticated USING(public.has_access_level(4)) WITH CHECK(public.has_access_level(4));
DROP POLICY IF EXISTS reconcile_admin_all ON public.contact_messages;
CREATE POLICY reconcile_admin_all ON public.contact_messages FOR ALL TO authenticated USING(public.has_access_level(4)) WITH CHECK(public.has_access_level(4));
DROP POLICY IF EXISTS reconcile_finance_admin ON public.donors;
CREATE POLICY reconcile_finance_admin ON public.donors FOR ALL TO authenticated USING(public.has_access_level(7)) WITH CHECK(public.has_access_level(7));
DROP POLICY IF EXISTS reconcile_finance_admin ON public.income_records;
CREATE POLICY reconcile_finance_admin ON public.income_records FOR ALL TO authenticated USING(public.has_access_level(7)) WITH CHECK(public.has_access_level(7));
DROP POLICY IF EXISTS reconcile_finance_admin ON public.expense_records;
CREATE POLICY reconcile_finance_admin ON public.expense_records FOR ALL TO authenticated USING(public.has_access_level(7)) WITH CHECK(public.has_access_level(7));
CREATE OR REPLACE VIEW public.public_donors AS SELECT id,name,total_donated_usd,is_featured,is_anonymous,logo_url,message,created_at FROM public.donors WHERE NOT is_anonymous;
CREATE OR REPLACE VIEW public.public_income_records AS SELECT id,category,description,amount_usd,date,event_name,is_public,created_at FROM public.income_records WHERE is_public;
CREATE OR REPLACE VIEW public.public_expense_records AS SELECT id,category,description,amount_usd,date,vendor,is_public,created_at FROM public.expense_records WHERE is_public;
CREATE OR REPLACE VIEW public.public_impact_metrics AS SELECT (SELECT count(*) FROM public.animals WHERE species='dog' AND status='adopted')::integer AS adopted_dogs, (SELECT count(*) FROM public.animals WHERE species='dog' AND status IN ('available','medical_care','medical_hold'))::integer AS dogs_in_care, (SELECT count(*) FROM public.success_stories WHERE is_featured)::integer AS published_stories, (SELECT count(*) FROM public.volunteer_applications WHERE status='active')::integer AS active_volunteers;
GRANT SELECT ON public.public_donors,public.public_income_records,public.public_expense_records,public.public_impact_metrics TO anon,authenticated;
DO $$ DECLARE t record; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated,service_role',t.tablename); END LOOP; END $$;
GRANT SELECT ON public.animals,public.products,public.product_variants,public.success_stories,public.volunteer_activities,public.site_settings,public.memory_memorials,public.dog_editorial_profiles,public.dog_story_milestones,public.animal_media,public.site_content TO anon;
GRANT INSERT ON public.adoption_applications,public.volunteer_applications,public.activity_registrations,public.contact_messages TO anon;
REVOKE ALL ON public.profiles,public.donors,public.income_records,public.expense_records,public.orders,public.order_items,public.order_status_history,public.audit_log,public.adoption_status_history,public.animal_medical_records,public.animal_tasks,public.animal_movements,public.sponsorship_inquiries FROM anon;
REVOKE ALL ON FUNCTION public.record_order_status_change() FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations(version text PRIMARY KEY, statements text[], name text);
ALTER TABLE supabase_migrations.schema_migrations ENABLE ROW LEVEL SECURITY;
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('20261008023000','reconcile_adoptame_live_schema',ARRAY['Reconcile existing schema with public site and admin; no seeds or deletions']) ON CONFLICT(version) DO NOTHING;

ALTER TABLE public.income_records ALTER COLUMN payment_method DROP NOT NULL;
DO $settings$ BEGIN IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings' AND column_name='value' AND data_type='jsonb') THEN ALTER TABLE public.site_settings ALTER COLUMN value TYPE text USING CASE WHEN jsonb_typeof(value)='string' THEN value #>> '{}' ELSE value::text END; END IF; END $settings$;
NOTIFY pgrst, 'reload schema';
COMMIT;
