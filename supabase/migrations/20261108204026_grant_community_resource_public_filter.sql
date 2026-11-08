-- The invoker-security public view filters on this column; grant only the
-- required filter column while keeping the rest of the admin table private.
GRANT SELECT (is_published)
  ON public.community_resources TO anon;
