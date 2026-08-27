-- AdoptaME / Antigravity — solicitudes sin duplicados

CREATE UNIQUE INDEX IF NOT EXISTS adoption_one_active_request_idx
  ON public.adoption_applications (animal_id, lower(applicant_email))
  WHERE status IN ('pending', 'under_review', 'approved');

CREATE OR REPLACE FUNCTION public.submit_adoption_application(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE new_id UUID;
BEGIN
  IF length(trim(COALESCE(payload->>'applicant_name', ''))) NOT BETWEEN 2 AND 120
     OR length(trim(COALESCE(payload->>'applicant_email', ''))) NOT BETWEEN 5 AND 254
     OR length(trim(COALESCE(payload->>'applicant_phone', ''))) NOT BETWEEN 7 AND 40 THEN
    RAISE EXCEPTION 'Datos de contacto inválidos';
  END IF;

  INSERT INTO public.adoption_applications (
    animal_id, applicant_name, applicant_email, applicant_phone,
    applicant_address, city, housing_type, has_yard, has_other_pets,
    has_children, other_pets_desc, housing_notes, reason, consent_at
  ) VALUES (
    (payload->>'animal_id')::UUID,
    trim(payload->>'applicant_name'), lower(trim(payload->>'applicant_email')),
    trim(payload->>'applicant_phone'), NULLIF(trim(payload->>'applicant_address'), ''),
    NULLIF(trim(payload->>'city'), ''), payload->>'housing_type',
    COALESCE((payload->>'has_yard')::BOOLEAN, false),
    COALESCE((payload->>'has_other_pets')::BOOLEAN, false),
    COALESCE((payload->>'has_children')::BOOLEAN, false),
    NULLIF(trim(payload->>'other_pets_desc'), ''),
    NULLIF(trim(payload->>'housing_notes'), ''), trim(payload->>'reason'), now()
  ) RETURNING id INTO new_id;
  RETURN new_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Ya existe una solicitud activa para este perro y correo';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_adoption_application(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_adoption_application(JSONB) TO anon, authenticated;
