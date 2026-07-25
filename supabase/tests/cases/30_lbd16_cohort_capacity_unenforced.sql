-- TEST: LBD-16 -- cohort capacity is advisory only, never enforced at write time
--
-- verify_cohort_code() checks count(*) < max_students, but signup then performs
-- user creation and cohort assignment in separate later statements. Nothing at
-- the data layer prevents assignment beyond capacity, so concurrent signups
-- that all pass the check can all be admitted.
--
-- Concurrency itself is not simulated here. What this case establishes is the
-- precondition that makes the race exploitable: there is no constraint to lose
-- the race against.

SELECT t.act_as_admin();

INSERT INTO public.cohorts (name, access_code, start_date, is_active, max_students)
VALUES ('Tiny Cohort', 'LBD-TEST-FULL', current_date, true, 2);

DO $$
DECLARE
  v_cohort bigint;
  v_a uuid;
  v_b uuid;
  v_c uuid;
  v_enrolled integer;
BEGIN
  v_cohort := (SELECT id FROM public.cohorts WHERE access_code = 'LBD-TEST-FULL');

  v_a := auth.test_create_user('cap_a@example.com');
  v_b := auth.test_create_user('cap_b@example.com');
  v_c := auth.test_create_user('cap_c@example.com');

  -- Fill the cohort to its stated maximum of 2.
  UPDATE public.profiles SET cohort_id = v_cohort WHERE id IN (v_a, v_b);

  -- The advisory gate now correctly reports the cohort as full.
  PERFORM t.assert_eq(
    public.verify_cohort_code('LBD-TEST-FULL'), false,
    'verify_cohort_code should report a full cohort as invalid'
  );

  -- But the assignment that signup performs afterwards is unguarded, and a
  -- third student can still be enrolled.
  UPDATE public.profiles SET cohort_id = v_cohort WHERE id = v_c;

  SELECT count(*)::integer INTO v_enrolled
  FROM public.profiles WHERE cohort_id = v_cohort;

  PERFORM t.assert_eq(
    v_enrolled, 3,
    'LBD-16 CONFIRMED: cohort holds 3 students against max_students = 2; '
    || 'capacity is never enforced at assignment time'
  );

  -- The over-filled cohort still grants active enrollment to the extra student.
  EXECUTE format('SET LOCAL request.jwt.claim.sub = %L', v_c::text);
  EXECUTE 'SET LOCAL ROLE authenticated';

  PERFORM t.assert_eq(
    public.is_active_enrollment(), true,
    'the over-capacity student is treated as actively enrolled'
  );
END $$;
