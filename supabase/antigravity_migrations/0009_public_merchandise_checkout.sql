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
