-- Phase 0 containment and compatibility fixes for existing databases.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure every Auth user has a profile, including users created before the
-- baseline migration was introduced.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT
  id,
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.protein_gallery
  ADD COLUMN IF NOT EXISTS metrics jsonb;

-- RLS controls which rows may be changed; column grants prevent users from
-- promoting their own plan, assigning their own cohort, or featuring designs.
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

REVOKE INSERT ON public.protein_gallery FROM PUBLIC, anon, authenticated;
GRANT INSERT (
  user_id,
  run_id,
  title,
  description,
  tags,
  pdb_url,
  thumbnail_url,
  is_public
) ON public.protein_gallery TO authenticated;

REVOKE UPDATE ON public.protein_gallery FROM PUBLIC, anon, authenticated;
GRANT UPDATE (
  title,
  description,
  tags,
  pdb_url,
  thumbnail_url,
  is_public
) ON public.protein_gallery TO authenticated;

-- Rotate the credential that was previously committed. Matching by digest
-- prevents the compromised plaintext credential from remaining in this tree.
UPDATE public.cohorts
SET access_code = 'LBD-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4))
  || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4))
WHERE encode(digest(access_code, 'sha256'), 'hex') =
  'cbff2ae54d097b42f30eb2cc2f5868a4f5aa294bcd32bd15b881ad260b17dd08';

-- Serialize rate-limit updates so concurrent requests share one durable count.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_calls integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_call_count integer;
BEGIN
  IF p_identifier IS NULL OR length(p_identifier) = 0
     OR p_action_type IS NULL OR length(p_action_type) = 0
     OR p_max_calls < 1 OR p_window_minutes < 1 THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  INSERT INTO public.rate_limits (identifier, action_type, call_count, window_start)
  VALUES (p_identifier, p_action_type, 1, now())
  ON CONFLICT (identifier, action_type) DO UPDATE
  SET call_count = CASE
        WHEN public.rate_limits.window_start < now() - make_interval(mins => p_window_minutes)
          THEN 1
        ELSE public.rate_limits.call_count + 1
      END,
      window_start = CASE
        WHEN public.rate_limits.window_start < now() - make_interval(mins => p_window_minutes)
          THEN now()
        ELSE public.rate_limits.window_start
      END
  RETURNING call_count INTO v_call_count;

  RETURN v_call_count <= p_max_calls;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;

-- Central enrollment predicate used by restrictive RLS policies.
CREATE OR REPLACE FUNCTION public.is_active_enrollment()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.cohorts c ON c.id = p.cohort_id
    WHERE p.id = auth.uid()
      AND c.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_enrollment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_enrollment() TO authenticated, service_role;

DROP POLICY IF EXISTS "Active enrollment required for progress" ON public.user_progress;
CREATE POLICY "Active enrollment required for progress" ON public.user_progress
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_active_enrollment())
  WITH CHECK (public.is_active_enrollment());

DROP POLICY IF EXISTS "Active enrollment required for lab runs" ON public.lab_runs;
CREATE POLICY "Active enrollment required for lab runs" ON public.lab_runs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_active_enrollment())
  WITH CHECK (public.is_active_enrollment());

DROP POLICY IF EXISTS "Active enrollment required to publish" ON public.protein_gallery;
CREATE POLICY "Active enrollment required to publish" ON public.protein_gallery
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_active_enrollment());

DROP POLICY IF EXISTS "Active enrollment required to update designs" ON public.protein_gallery;
CREATE POLICY "Active enrollment required to update designs" ON public.protein_gallery
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.is_active_enrollment())
  WITH CHECK (public.is_active_enrollment());

DROP POLICY IF EXISTS "Active enrollment required to delete designs" ON public.protein_gallery;
CREATE POLICY "Active enrollment required to delete designs" ON public.protein_gallery
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_active_enrollment());

DROP POLICY IF EXISTS "Active enrollment required for analytics" ON public.analytics_events;
CREATE POLICY "Active enrollment required for analytics" ON public.analytics_events
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_active_enrollment());

DROP POLICY IF EXISTS "Active enrollment required to like" ON public.gallery_likes;
CREATE POLICY "Active enrollment required to like" ON public.gallery_likes
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_active_enrollment());

DROP POLICY IF EXISTS "Active enrollment required to unlike" ON public.gallery_likes;
CREATE POLICY "Active enrollment required to unlike" ON public.gallery_likes
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_active_enrollment());

-- Certificate issuance now checks the exact curriculum modules and required
-- step indexes. This remains a completion credential, not an assessed grade.
CREATE OR REPLACE FUNCTION public.issue_certificate()
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_count integer;
  v_certificate public.certificates;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_active_enrollment() THEN
    RAISE EXCEPTION 'Active cohort enrollment required';
  END IF;

  WITH requirements(module_id, required_steps) AS (
    VALUES
      ('Module 1: The New Paradigm – From Yaba to Stockholm', ARRAY[0, 1, 2]::integer[]),
      ('Module 2: The Engineer''s Toolkit (T1-T7)', ARRAY[0, 1, 2]::integer[]),
      ('Module 3: Generative AI – Hallucination as a Feature', ARRAY[0, 1, 2]::integer[]),
      ('Module 4: Solving African Challenges (Local Context)', ARRAY[0, 1, 2]::integer[]),
      ('Module 5: Biosecurity, Ethics, & The Future', ARRAY[0, 1, 2]::integer[])
  )
  SELECT count(*) INTO v_completed_count
  FROM requirements r
  JOIN public.user_progress up
    ON up.user_id = auth.uid()
   AND up.module_id = r.module_id
   AND up.completed_steps @> r.required_steps;

  IF v_completed_count <> 5 THEN
    RAISE EXCEPTION 'All required module steps must be completed';
  END IF;

  INSERT INTO public.certificates (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
  RETURNING * INTO v_certificate;

  RETURN v_certificate;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_certificate() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_certificate() TO authenticated;

-- Anonymous verification goes through a narrow function rather than broad
-- SELECT access to the certificates table.
DROP POLICY IF EXISTS "Anyone can verify by code" ON public.certificates;
REVOKE SELECT ON public.certificates FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.verify_certificate(p_code text)
RETURNS TABLE (
  verification_code text,
  issued_at timestamptz,
  recipient_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.verification_code,
    c.issued_at,
    COALESCE(NULLIF(p.full_name, ''), 'Student') AS recipient_name
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  WHERE c.verification_code = p_code
    AND length(p_code) = 32
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- Harden older SECURITY DEFINER functions without changing their API.
ALTER FUNCTION public.check_admin_role() SET search_path = public;
ALTER FUNCTION public.verify_cohort_code(text) SET search_path = public;
ALTER FUNCTION public.get_user_progress_summary(uuid) SET search_path = public;

REVOKE ALL ON FUNCTION public.check_admin_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_admin_role() TO authenticated;

REVOKE ALL ON FUNCTION public.verify_cohort_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_cohort_code(text) TO service_role;

-- This legacy helper accepts an arbitrary user id and is not used by the app.
-- Keep it available only to trusted server-side maintenance code.
REVOKE ALL ON FUNCTION public.get_user_progress_summary(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_progress_summary(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_progress_summary(uuid) TO service_role;
