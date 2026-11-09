BEGIN;

ALTER TABLE public.community_help_requests
  ADD COLUMN referred_resource_id UUID REFERENCES public.community_resources(id) ON DELETE RESTRICT;
ALTER TABLE public.adoption_followup_events
  ADD COLUMN referred_resource_id UUID REFERENCES public.community_resources(id) ON DELETE RESTRICT;

CREATE INDEX community_help_requests_referred_resource_idx
  ON public.community_help_requests (referred_resource_id) WHERE referred_resource_id IS NOT NULL;
CREATE INDEX adoption_followup_events_referred_resource_idx
  ON public.adoption_followup_events (referred_resource_id) WHERE referred_resource_id IS NOT NULL;
GRANT UPDATE (referred_resource_id) ON public.community_help_requests TO authenticated;
GRANT UPDATE (referred_resource_id) ON public.adoption_followup_events TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_community_help_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'referred' THEN
    IF TG_OP = 'INSERT' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.community_resources AS resource
        WHERE resource.id = NEW.referred_resource_id
          AND resource.is_published
          AND resource.verified_at IS NOT NULL
          AND resource.verified_by IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Selecciona un recurso publicado y verificado para registrar la derivación.'
          USING ERRCODE = '23514';
      END IF;
    ELSIF OLD.status IS DISTINCT FROM NEW.status
       OR OLD.referred_resource_id IS DISTINCT FROM NEW.referred_resource_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.community_resources AS resource
        WHERE resource.id = NEW.referred_resource_id
          AND resource.is_published
          AND resource.verified_at IS NOT NULL
          AND resource.verified_by IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Selecciona un recurso publicado y verificado para registrar la derivación.'
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_community_help_referral() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS community_help_referral_verified_only ON public.community_help_requests;
CREATE TRIGGER community_help_referral_verified_only
  BEFORE INSERT OR UPDATE OF status, referred_resource_id ON public.community_help_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_community_help_referral();

CREATE OR REPLACE FUNCTION public.validate_adoption_followup_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.event_type = 'referral' THEN
    IF TG_OP = 'INSERT' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.community_resources AS resource
        WHERE resource.id = NEW.referred_resource_id
          AND resource.is_published
          AND resource.verified_at IS NOT NULL
          AND resource.verified_by IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Selecciona un recurso publicado y verificado para registrar la derivación.'
          USING ERRCODE = '23514';
      END IF;
    ELSIF OLD.event_type IS DISTINCT FROM NEW.event_type
       OR OLD.referred_resource_id IS DISTINCT FROM NEW.referred_resource_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.community_resources AS resource
        WHERE resource.id = NEW.referred_resource_id
          AND resource.is_published
          AND resource.verified_at IS NOT NULL
          AND resource.verified_by IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Selecciona un recurso publicado y verificado para registrar la derivación.'
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  IF NEW.event_type <> 'referral' THEN
    NEW.referred_resource_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_adoption_followup_referral() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS adoption_followup_referral_verified_only ON public.adoption_followup_events;
CREATE TRIGGER adoption_followup_referral_verified_only
  BEFORE INSERT OR UPDATE OF event_type, referred_resource_id ON public.adoption_followup_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_adoption_followup_referral();

NOTIFY pgrst, 'reload schema';
COMMIT;
