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

CREATE POLICY "products_public_read_active" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "variants_public_read_active" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "orders_admin_read" ON public.orders FOR SELECT TO authenticated USING (public.has_access_level(4));
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.has_access_level(4));
CREATE POLICY "order_items_admin_read" ON public.order_items FOR SELECT TO authenticated USING (public.has_access_level(4));
CREATE POLICY "order_history_admin_read" ON public.order_status_history FOR SELECT TO authenticated USING (public.has_access_level(4));
