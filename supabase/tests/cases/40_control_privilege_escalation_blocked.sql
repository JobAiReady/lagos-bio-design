-- TEST: CONTROL -- phase-0 column grants block plan and cohort self-promotion
--
-- These are regression tests for the hardening migration's strongest work.
-- They must keep passing: if a future migration re-grants UPDATE on profiles
-- broadly, users regain the ability to promote themselves to the Pro plan or
-- assign themselves into an active cohort.

SELECT t.act_as_admin();

INSERT INTO public.cohorts (name, access_code, start_date, is_active, max_students)
VALUES ('Control Cohort', 'LBD-TEST-CTRL', current_date, true, 50);

DO $$
DECLARE
  v_user uuid;
  v_cohort bigint;
BEGIN
  v_cohort := (SELECT id FROM public.cohorts WHERE access_code = 'LBD-TEST-CTRL');
  v_user := auth.test_create_user('control@example.com', 'Cleo');
  UPDATE public.profiles SET cohort_id = v_cohort WHERE id = v_user;

  EXECUTE format('SET LOCAL request.jwt.claim.sub = %L', v_user::text);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- Permitted: editing one's own display fields.
  UPDATE public.profiles SET full_name = 'Cleo Renamed' WHERE id = v_user;
  PERFORM t.assert_eq(
    (SELECT full_name FROM public.profiles WHERE id = v_user),
    'Cleo Renamed'::text,
    'user should be able to edit own full_name'
  );

  -- Blocked by column-level GRANT: self-promotion to the paid plan.
  PERFORM t.assert_raises(
    format('UPDATE public.profiles SET plan = ''pro'' WHERE id = %L', v_user),
    'user must not be able to promote their own plan'
  );

  -- Blocked by column-level GRANT: self-assigning enrollment.
  PERFORM t.assert_raises(
    format('UPDATE public.profiles SET cohort_id = %s WHERE id = %L',
           v_cohort, v_user),
    'user must not be able to assign their own cohort'
  );

  -- Blocked: the rate limiter is service_role only, so a client cannot
  -- exhaust or manipulate another identifier's quota.
  PERFORM t.assert_raises(
    'SELECT public.check_rate_limit(''x'', ''ai-chat'', 1, 1)',
    'check_rate_limit must not be executable by authenticated'
  );
END $$;
