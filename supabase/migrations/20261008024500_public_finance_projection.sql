BEGIN;
CREATE OR REPLACE VIEW public.public_donors AS SELECT id,name,total_donated_usd,is_featured,is_anonymous,logo_url,message,created_at,type FROM public.donors WHERE NOT is_anonymous;
CREATE OR REPLACE VIEW public.public_income_records AS SELECT r.id,r.category,r.description,r.amount_usd,r.date,r.event_name,r.is_public,r.created_at, CASE WHEN d.id IS NOT NULL AND NOT d.is_anonymous THEN jsonb_build_object('name',d.name,'is_anonymous',false,'type',d.type) ELSE NULL END AS donor FROM public.income_records r LEFT JOIN public.donors d ON d.id=r.donor_id WHERE r.is_public;
INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('20261008024500','public_finance_projection',ARRAY['Publish only approved finance fields and non-anonymous donor names']) ON CONFLICT(version) DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;
