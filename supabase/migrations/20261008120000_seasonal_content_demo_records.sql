BEGIN;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.income_records ADD CONSTRAINT income_demo_private CHECK (NOT is_demo OR NOT is_public);
ALTER TABLE public.expense_records ADD CONSTRAINT expense_demo_private CHECK (NOT is_demo OR NOT is_public);
CREATE OR REPLACE VIEW public.public_income_records AS SELECT r.id,r.category,r.description,r.amount_usd,r.date,r.event_name,r.is_public,r.created_at, CASE WHEN d.id IS NOT NULL AND NOT d.is_anonymous THEN jsonb_build_object('name',d.name,'is_anonymous',false,'type',d.type) ELSE NULL END AS donor FROM public.income_records r LEFT JOIN public.donors d ON d.id=r.donor_id WHERE r.is_public AND NOT r.is_demo;
CREATE OR REPLACE VIEW public.public_expense_records AS SELECT id,category,description,amount_usd,date,vendor,is_public,created_at FROM public.expense_records WHERE is_public AND NOT is_demo;
CREATE TABLE public.seasonal_campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL,
 title text NOT NULL, season text NOT NULL, description text NOT NULL,
 starts_on date NOT NULL, ends_on date NOT NULL, image_url text NOT NULL,
 actions text[] NOT NULL DEFAULT '{}', is_active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK (ends_on >= starts_on)
);
ALTER TABLE public.seasonal_campaigns ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.seasonal_campaigns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seasonal_campaigns TO authenticated;
CREATE POLICY campaigns_public ON public.seasonal_campaigns FOR SELECT TO anon,authenticated USING (is_active);
CREATE POLICY campaigns_admin ON public.seasonal_campaigns FOR ALL TO authenticated USING (public.has_access_level(4)) WITH CHECK (public.has_access_level(4));
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES ('20261008120000','seasonal_content_demo_records',ARRAY['Separate demonstration transactions and publish seasonal campaign plans']) ON CONFLICT(version) DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;
