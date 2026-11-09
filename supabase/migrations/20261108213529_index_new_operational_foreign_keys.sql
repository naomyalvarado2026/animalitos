BEGIN;

CREATE INDEX IF NOT EXISTS animal_daily_rounds_checked_by_idx
  ON public.animal_daily_rounds (checked_by);
CREATE INDEX IF NOT EXISTS adoption_followups_created_by_idx
  ON public.adoption_followups (created_by);
CREATE INDEX IF NOT EXISTS adoption_followup_events_created_by_idx
  ON public.adoption_followup_events (created_by);

COMMIT;
