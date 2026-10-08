-- Run after 20261008070000. All test records are rolled back.
BEGIN;
DO $$
DECLARE pid uuid; vid uuid; receipt jsonb; again jsonb; key text:=gen_random_uuid()::text;
BEGIN
 INSERT INTO public.products(slug,name,price_cents,inventory,is_active,is_proposal) VALUES('qa-'||key,'QA transactional product',1000,0,true,false) RETURNING id INTO pid;
 INSERT INTO public.product_variants(product_id,label,inventory,price_delta_cents) VALUES(pid,'Morado · M',1,200) RETURNING id INTO vid;
 receipt:=public.create_merchandise_variant_order('QA Test','qa@example.com','0999999999','qa-'||key,1,key,vid);
 again:=public.create_merchandise_variant_order('QA Test','qa@example.com','0999999999','qa-'||key,1,key,vid);
 IF receipt<>again OR (SELECT inventory FROM public.product_variants WHERE id=vid)<>0 OR (SELECT total_cents FROM public.orders WHERE id=(receipt->>'id')::uuid)<>1200 OR (SELECT variant_label_snapshot FROM public.order_items WHERE order_id=(receipt->>'id')::uuid)<>'Morado · M' THEN RAISE EXCEPTION 'QA failed'; END IF;
 BEGIN
  PERFORM public.create_merchandise_variant_order('QA Test','qa@example.com','0999999999','qa-'||key,1,gen_random_uuid()::text,vid);
  RAISE EXCEPTION 'QA accepted depleted variant' USING ERRCODE='23514';
 EXCEPTION WHEN raise_exception THEN NULL;
 END;
END $$;
ROLLBACK;
SELECT 'variant_checkout_passed_no_test_rows_retained' AS validation;
