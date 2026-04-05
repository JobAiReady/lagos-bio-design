-- Update verify_cohort_code to check cohorts table instead of hardcoded value
CREATE OR REPLACE FUNCTION verify_cohort_code(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.cohorts c
    WHERE c.access_code = code
    AND c.is_active = true
    AND (SELECT count(*) FROM public.profiles WHERE cohort_id = c.id) < c.max_students
  );
END;
$$;
