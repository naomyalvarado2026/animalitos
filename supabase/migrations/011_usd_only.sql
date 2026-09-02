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
