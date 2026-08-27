-- AdoptaME / Antigravity — validación de formularios públicos

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS honeypot TEXT,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

ALTER TABLE public.volunteer_applications
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

ALTER TABLE public.activity_registrations
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_length_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_length_check CHECK (
  length(trim(name)) BETWEEN 2 AND 120 AND
  length(trim(email)) BETWEEN 5 AND 254 AND
  length(trim(subject)) BETWEEN 2 AND 160 AND
  length(trim(message)) BETWEEN 5 AND 5000 AND
  COALESCE(length(honeypot), 0) = 0
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS volunteer_applications_created_at_idx ON public.volunteer_applications (created_at DESC);
