-- =====================================================================
-- COMPLETE FINAL MIGRATIONS FOR ADOPTAME (IDEMPOTENT & SAFE)
-- Includes: Products, Orders, Audit Logs, Status History, Memorials
-- =====================================================================

-- ── 1. Catálogo de Productos y Variantes ──────────────────────────────
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

-- ── 2. Pedidos y Transacciones de Merchandising ───────────────────────
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

-- ── 3. Auditoría e Historial de Adopciones ────────────────────────────
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

CREATE TABLE IF NOT EXISTS public.adoption_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.adoption_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Memorial / En Memoria ──────────────────────────────────────────
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

-- ── 5. Seguridad y Políticas RLS ──────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_memorials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read_active" ON public.products;
CREATE POLICY "products_public_read_active" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS "variants_public_read_active" ON public.product_variants;
CREATE POLICY "variants_public_read_active" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "variants_admin_write" ON public.product_variants;
CREATE POLICY "variants_admin_write" ON public.product_variants FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

DROP POLICY IF EXISTS "orders_admin_read" ON public.orders;
CREATE POLICY "orders_admin_read" ON public.orders FOR SELECT TO authenticated USING (public.has_access_level(4));

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.has_access_level(4));

DROP POLICY IF EXISTS "order_items_admin_read" ON public.order_items;
CREATE POLICY "order_items_admin_read" ON public.order_items FOR SELECT TO authenticated USING (public.has_access_level(4));

DROP POLICY IF EXISTS "order_history_admin_read" ON public.order_status_history;
CREATE POLICY "order_history_admin_read" ON public.order_status_history FOR SELECT TO authenticated USING (public.has_access_level(4));

DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_log;
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT TO authenticated USING (public.has_access_level(7));

DROP POLICY IF EXISTS "adoption_history_admin_read" ON public.adoption_status_history;
CREATE POLICY "adoption_history_admin_read" ON public.adoption_status_history FOR SELECT TO authenticated USING (public.has_access_level(4));

DROP POLICY IF EXISTS "memory_public_read_published" ON public.memory_memorials;
CREATE POLICY "memory_public_read_published" ON public.memory_memorials FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "memory_admin_read" ON public.memory_memorials;
CREATE POLICY "memory_admin_read" ON public.memory_memorials FOR SELECT TO authenticated USING (public.has_access_level(4));

DROP POLICY IF EXISTS "memory_admin_write" ON public.memory_memorials;
CREATE POLICY "memory_admin_write" ON public.memory_memorials FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));

-- ── 6. Función Checkout de Merchandising ──────────────────────────────
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

GRANT EXECUTE ON FUNCTION public.create_merchandise_order(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;

-- ── 7. Catálogo Inicial de Merchandising ──────────────────────────────
INSERT INTO public.products (slug, name, description, price_cents, currency, image_url, inventory, is_active)
VALUES
  ('camiseta-adoptame', 'Camiseta AdoptaME', 'Una prenda para llevar la conversación sobre adopción a todas partes.', 2500, 'USD', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', 20, true),
  ('panuelo-me-eligieron', 'Pañuelo “ME eligieron”', 'Un detalle especial para celebrar la conexión que cambia dos vidas.', 1200, 'USD', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800', 35, true),
  ('tote-bag-adoptame', 'Tote bag AdoptaME', 'Tu aliado cotidiano para que la causa viaje contigo cada día.', 1800, 'USD', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 15, true)
ON CONFLICT (slug) DO NOTHING;
