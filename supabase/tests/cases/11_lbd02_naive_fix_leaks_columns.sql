-- TEST: LBD-02 remediation -- a broad RLS policy leaks plan and cohort_id
--
-- Review v1 proposed fixing gallery attribution by adding a wider SELECT policy
-- on profiles. This case demonstrates why that fix is unsafe and why v2 changed
-- the recommendation to a narrow SECURITY DEFINER RPC.
--
-- RLS filters ROWS, not COLUMNS. Once a row is visible, every column the caller
-- holds table-level SELECT on is readable. Nothing restricts SELECT at column
-- level on profiles -- the hardening migration constrained UPDATE only.

SELECT t.act_as_admin();

INSERT INTO public.cohorts (name, access_code, start_date, is_active, max_students)
VALUES ('Leak Cohort', 'LBD-TEST-LEAK', current_date, true, 50);

DO $$
DECLARE
  v_author uuid;
  v_viewer uuid;
  v_cohort bigint;
  v_plan text;
BEGIN
  v_cohort := (SELECT id FROM public.cohorts WHERE access_code = 'LBD-TEST-LEAK');
  v_author := auth.test_create_user('leak_author@example.com', 'Ada');
  v_viewer := auth.test_create_user('leak_viewer@example.com', 'Bob');

  UPDATE public.profiles SET cohort_id = v_cohort WHERE id IN (v_author, v_viewer);
  UPDATE public.profiles SET plan = 'pro' WHERE id = v_author;

  INSERT INTO public.protein_gallery (user_id, title, tags, is_public)
  VALUES (v_author, 'Leak Design', ARRAY['t'], true);

  -- Apply the naive remediation: expose profiles of public gallery authors.
  CREATE POLICY "naive_gallery_author_visibility" ON public.profiles
    FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.protein_gallery g
      WHERE g.user_id = public.profiles.id AND g.is_public = true
    ));

  EXECUTE format('SET LOCAL request.jwt.claim.sub = %L', v_viewer::text);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- Attribution now works, which is what made this fix look correct...
  PERFORM t.assert_eq(
    (SELECT full_name FROM public.profiles WHERE id = v_author),
    'Ada'::text,
    'naive policy does make full_name visible'
  );

  -- ...but the same policy exposes billing and enrollment columns.
  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_author;

  PERFORM t.assert_eq(
    v_plan, 'pro'::text,
    'v1 REMEDIATION UNSAFE: the naive row policy also exposes profiles.plan'
  );

  PERFORM t.assert(
    (SELECT cohort_id FROM public.profiles WHERE id = v_author) IS NOT NULL,
    'v1 REMEDIATION UNSAFE: the naive row policy also exposes profiles.cohort_id'
  );
END $$;
