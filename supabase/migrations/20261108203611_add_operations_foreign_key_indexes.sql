-- Index foreign-key columns introduced by the community operations migration.
CREATE INDEX IF NOT EXISTS campaign_financial_reports_verified_by_idx
  ON public.campaign_financial_reports (verified_by);
CREATE INDEX IF NOT EXISTS community_help_requests_reviewed_by_idx
  ON public.community_help_requests (reviewed_by);
CREATE INDEX IF NOT EXISTS community_resources_verified_by_idx
  ON public.community_resources (verified_by);
CREATE INDEX IF NOT EXISTS foster_applications_reviewed_by_idx
  ON public.foster_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS foster_placements_assigned_by_idx
  ON public.foster_placements (assigned_by);
