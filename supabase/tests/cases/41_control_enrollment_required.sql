-- TEST: CONTROL -- RESTRICTIVE policies require an active cohort for writes
--
-- Regression test for the layered policy design in the hardening migration:
-- permissive ownership policies AND restrictive enrollment policies. A user
-- whose cohort has been deactivated must lose write access even though they
-- still own their rows.
--
-- This is also the server-side behaviour that src/contexts/AuthContext.jsx now
-- mirrors via the is_active_enrollment() RPC (LBD-17).

SELECT t.act_as_admin();

INSERT INTO public.cohorts (name, access_code, start_date, is_active, max_students)
VALUES ('Closing Cohort', 'LBD-TEST-CLOSE', current_date, true, 50);

DO $$
DECLARE
  v_user uuid;
  v_cohort bigint;
BEGIN
  v_cohort := (SELECT id FROM public.cohorts WHERE access_code = 'LBD-TEST-CLOSE');
  v_user := auth.test_create_user('enrolled@example.com', 'Dara');
  UPDATE public.profiles SET cohort_id = v_cohort WHERE id = v_user;

  EXECUTE format('SET LOCAL request.jwt.claim.sub = %L', v_user::text);
  EXECUTE 'SET LOCAL ROLE authenticated';

  PERFORM t.assert_eq(
    public.is_active_enrollment(), true,
    'active cohort member should be actively enrolled'
  );

  -- While the cohort is active, publishing and progress writes succeed.
  INSERT INTO public.protein_gallery (user_id, title, tags, is_public)
  VALUES (v_user, 'Allowed Design', ARRAY['t'], true);

  INSERT INTO public.user_progress (user_id, module_id, completed_steps)
  VALUES (v_user, 'Module 1: The New Paradigm – From Yaba to Stockholm', ARRAY[0]);

  -- The cohort closes.
  EXECUTE 'RESET ROLE';
  UPDATE public.cohorts SET is_active = false WHERE id = v_cohort;
  EXECUTE format('SET LOCAL request.jwt.claim.sub = %L', v_user::text);
  EXECUTE 'SET LOCAL ROLE authenticated';

  PERFORM t.assert_eq(
    public.is_active_enrollment(), false,
    'member of a deactivated cohort must not be actively enrolled'
  );

  -- Writes are now refused by the RESTRICTIVE policies.
  PERFORM t.assert_raises(
    format('INSERT INTO public.protein_gallery (user_id, title, tags, is_public) '
           || 'VALUES (%L, ''Blocked Design'', ARRAY[''t''], true)', v_user),
    'publishing must be blocked once the cohort is inactive'
  );

  PERFORM t.assert_raises(
    format('INSERT INTO public.user_progress (user_id, module_id, completed_steps) '
           || 'VALUES (%L, ''Module 2: The Engineer''''s Toolkit (T1-T7)'', ARRAY[0])',
           v_user),
    'progress writes must be blocked once the cohort is inactive'
  );

  -- And certificate issuance is refused.
  PERFORM t.assert_raises(
    'SELECT public.issue_certificate()',
    'certificate issuance must be blocked once the cohort is inactive'
  );
END $$;
