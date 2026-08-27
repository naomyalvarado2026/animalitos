-- AdoptaME / Antigravity — métricas públicas agregadas

CREATE OR REPLACE VIEW public.public_impact_metrics
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM public.animals WHERE status = 'adopted')::INTEGER AS adopted_dogs,
  (SELECT count(*) FROM public.animals WHERE status IN ('available', 'medical_care'))::INTEGER AS dogs_in_care,
  (SELECT count(*) FROM public.success_stories WHERE is_featured = true)::INTEGER AS published_stories,
  (SELECT count(*) FROM public.volunteer_applications WHERE status = 'active')::INTEGER AS active_volunteers;

GRANT SELECT ON public.public_impact_metrics TO anon, authenticated;

COMMENT ON VIEW public.public_impact_metrics IS
  'Indicadores agregados de impacto; no expone datos personales ni registros financieros.';
