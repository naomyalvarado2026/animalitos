-- AdoptaME / Antigravity — normaliza acceso por rol

-- Corrige perfiles antiguos que tienen role='admin' pero conservaron el nivel 1
-- creado por el trigger inicial. No reduce niveles asignados manualmente.
UPDATE public.profiles
SET access_level = CASE role
  WHEN 'super_admin' THEN GREATEST(access_level, 10)
  WHEN 'admin' THEN GREATEST(access_level, 7)
  WHEN 'editor' THEN GREATEST(access_level, 4)
  ELSE access_level
END,
updated_at = now()
WHERE role IN ('super_admin', 'admin', 'editor');

CREATE OR REPLACE FUNCTION public.has_access_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_active = true
      AND CASE role
        WHEN 'super_admin' THEN GREATEST(access_level, 10)
        WHEN 'admin' THEN GREATEST(access_level, 7)
        WHEN 'editor' THEN GREATEST(access_level, 4)
        ELSE access_level
      END >= required_level
  );
$$;

REVOKE ALL ON FUNCTION public.has_access_level(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_access_level(INTEGER) TO authenticated;
