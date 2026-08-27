-- AdoptaME / Antigravity — superficie pública mínima

DROP POLICY IF EXISTS "animals_public_read" ON public.animals;
CREATE POLICY "animals_public_read_published" ON public.animals
  FOR SELECT TO anon, authenticated
  USING (status IN ('available', 'medical_care'));

DROP POLICY IF EXISTS "success_stories_public_read" ON public.success_stories;
CREATE POLICY "success_stories_public_read_published" ON public.success_stories
  FOR SELECT TO anon, authenticated
  USING (is_featured = true);

DROP POLICY IF EXISTS "donors_public_read" ON public.donors;
DROP POLICY IF EXISTS "income_public_read" ON public.income_records;
DROP POLICY IF EXISTS "expense_public_read" ON public.expense_records;
DROP POLICY IF EXISTS "settings_public_read" ON public.site_settings;

CREATE OR REPLACE VIEW public.public_animals
WITH (security_invoker = true) AS
SELECT id, name, breed, age_months, gender, size, status, description, story,
       health_status, is_vaccinated, is_neutered, is_special_needs,
       special_needs_desc, main_image_url, gallery_urls, rescue_date, location,
       created_at, updated_at
FROM public.animals
WHERE status IN ('available', 'medical_care');

CREATE OR REPLACE VIEW public.public_success_stories
WITH (security_invoker = true) AS
SELECT id, animal_name, title, story, before_image_url, after_image_url,
       adoption_date, is_featured, created_at
FROM public.success_stories
WHERE is_featured = true;

CREATE OR REPLACE VIEW public.public_donors
WITH (security_invoker = true) AS
SELECT id, name, total_donated_usd, is_featured, is_anonymous, logo_url, message, created_at
FROM public.donors
WHERE is_anonymous = false;

CREATE OR REPLACE VIEW public.public_income_records
WITH (security_invoker = true) AS
SELECT id, category, description, amount_usd, date, event_name, is_public, created_at
FROM public.income_records
WHERE is_public = true;

CREATE OR REPLACE VIEW public.public_expense_records
WITH (security_invoker = true) AS
SELECT id, category, description, amount_usd, date, vendor, is_public, created_at
FROM public.expense_records
WHERE is_public = true;

GRANT SELECT ON public.public_animals, public.public_success_stories,
  public.public_donors, public.public_income_records,
  public.public_expense_records TO anon, authenticated;
