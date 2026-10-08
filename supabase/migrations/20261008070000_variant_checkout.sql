BEGIN;
CREATE OR REPLACE FUNCTION public.create_merchandise_variant_order(
 p_customer_name text,p_customer_email text,p_customer_phone text,p_product_slug text,
 p_quantity integer DEFAULT 1,p_idempotency_key text DEFAULT NULL,p_variant_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE p public.products%ROWTYPE; v public.product_variants%ROWTYPE; o public.orders%ROWTYPE; unit integer;
BEGIN
 IF length(trim(coalesce(p_customer_name,''))) NOT BETWEEN 2 AND 120 OR lower(trim(coalesce(p_customer_email,''))) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(trim(coalesce(p_customer_phone,''))) NOT BETWEEN 7 AND 40 THEN RAISE EXCEPTION 'Datos de contacto inválidos'; END IF;
 IF p_quantity IS NULL OR p_quantity NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
 IF p_idempotency_key IS NULL OR length(p_idempotency_key) NOT BETWEEN 16 AND 100 THEN RAISE EXCEPTION 'Identificador de pedido inválido'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,0));
 SELECT * INTO o FROM public.orders WHERE idempotency_key=p_idempotency_key;
 IF FOUND THEN
  IF o.customer_email<>lower(trim(p_customer_email)) OR NOT EXISTS(SELECT 1 FROM public.order_items i JOIN public.products existing_product ON existing_product.id=i.product_id WHERE i.order_id=o.id AND existing_product.slug=lower(trim(p_product_slug)) AND i.quantity=p_quantity AND i.variant_id IS NOT DISTINCT FROM p_variant_id) THEN RAISE EXCEPTION 'El identificador pertenece a otro pedido'; END IF;
  RETURN jsonb_build_object('id',o.id,'order_number',o.order_number,'status',o.status);
 END IF;
 SELECT * INTO p FROM public.products WHERE slug=lower(trim(p_product_slug)) AND is_active AND NOT is_proposal AND currency='USD' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Producto no disponible para compra'; END IF;
 unit:=p.price_cents;
 IF p_variant_id IS NOT NULL THEN
  SELECT * INTO v FROM public.product_variants WHERE id=p_variant_id AND product_id=p.id AND is_active FOR UPDATE;
  IF NOT FOUND OR v.inventory<p_quantity THEN RAISE EXCEPTION 'La variante no tiene existencias suficientes'; END IF;
  unit:=unit+v.price_delta_cents;
 ELSE
  IF EXISTS(SELECT 1 FROM public.product_variants WHERE product_id=p.id) THEN RAISE EXCEPTION 'Selecciona una variante'; END IF;
  IF p.inventory<p_quantity THEN RAISE EXCEPTION 'Existencias insuficientes'; END IF;
 END IF;
 IF unit<=0 THEN RAISE EXCEPTION 'Precio inválido'; END IF;
 INSERT INTO public.orders(customer_name,customer_email,customer_phone,status,currency,total_cents,idempotency_key) VALUES(trim(p_customer_name),lower(trim(p_customer_email)),trim(p_customer_phone),'pending','USD',unit*p_quantity,p_idempotency_key) RETURNING * INTO o;
 INSERT INTO public.order_items(order_id,product_id,variant_id,product_name_snapshot,variant_label_snapshot,unit_price_cents,quantity) VALUES(o.id,p.id,p_variant_id,p.name,CASE WHEN p_variant_id IS NOT NULL THEN v.label ELSE NULL END,unit,p_quantity);
 IF p_variant_id IS NOT NULL THEN UPDATE public.product_variants SET inventory=inventory-p_quantity WHERE id=v.id;
 ELSE UPDATE public.products SET inventory=inventory-p_quantity,updated_at=now() WHERE id=p.id; END IF;
 RETURN jsonb_build_object('id',o.id,'order_number',o.order_number,'status',o.status);
END $$;
REVOKE ALL ON FUNCTION public.create_merchandise_variant_order(text,text,text,text,integer,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_merchandise_variant_order(text,text,text,text,integer,text,uuid) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.create_merchandise_order(p_customer_name text,p_customer_email text,p_customer_phone text,p_product_slug text,p_quantity integer DEFAULT 1,p_idempotency_key text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,extensions AS $$ SELECT public.create_merchandise_variant_order(p_customer_name,p_customer_email,p_customer_phone,p_product_slug,p_quantity,p_idempotency_key,NULL); $$;
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('20261008070000','variant_checkout',ARRAY['Atomic variant inventory and order snapshots']) ON CONFLICT(version) DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;
