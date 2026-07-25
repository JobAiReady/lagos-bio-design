-- Assertion and impersonation helpers for the SQL test cases.
--
-- These are FUNCTIONS, not procedures, deliberately. Two reasons:
--
--   1. CALL does not permit subqueries in its arguments, so procedure-based
--      asserts force every value into a temp variable first.
--   2. More importantly, arguments to CALL are not evaluated under the role and
--      GUC context the surrounding plpgsql block has established. A
--      SECURITY DEFINER function such as is_active_enrollment() evaluates
--      correctly when read into a variable, but returns the wrong result when
--      passed directly as a CALL argument. Functions invoked via PERFORM do not
--      have this problem.
--
-- Use PERFORM t.assert_*(...) inside DO blocks.

CREATE SCHEMA IF NOT EXISTS t;

-- ---------------------------------------------------------------------------
-- Impersonation. Mirrors what PostgREST does per request.
-- ---------------------------------------------------------------------------

-- Act as an authenticated user for the remainder of the transaction.
CREATE OR REPLACE FUNCTION t.act_as(p_user uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('SET LOCAL request.jwt.claim.sub = %L', p_user::text);
  EXECUTE 'SET LOCAL ROLE authenticated';
END;
$$;

-- Act as an unauthenticated visitor.
CREATE OR REPLACE FUNCTION t.act_as_anon() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'SET LOCAL request.jwt.claim.sub = ''''';
  EXECUTE 'SET LOCAL ROLE anon';
END;
$$;

-- Return to the owning role (bypasses RLS) for test setup.
CREATE OR REPLACE FUNCTION t.act_as_admin() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'RESET ROLE';
  EXECUTE 'SET LOCAL request.jwt.claim.sub = ''''';
END;
$$;

-- ---------------------------------------------------------------------------
-- Assertions. Each raises on failure; the runner reports the message.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION t.assert(p_condition boolean, p_message text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_condition IS NOT TRUE THEN
    RAISE EXCEPTION 'ASSERTION FAILED: %', p_message;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION t.assert_eq(p_actual anyelement, p_expected anyelement, p_message text)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'ASSERTION FAILED: % (expected %, got %)',
      p_message, p_expected, p_actual;
  END IF;
END;
$$;

-- Assert a statement is rejected. Essential for RLS work: a suite that only
-- exercises happy paths proves nothing about what a policy blocks.
CREATE OR REPLACE FUNCTION t.assert_raises(p_sql text, p_message text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    RETURN;  -- expected
  END;
  RAISE EXCEPTION 'ASSERTION FAILED: % (statement unexpectedly succeeded: %)',
    p_message, p_sql;
END;
$$;

GRANT USAGE ON SCHEMA t TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA t TO anon, authenticated, service_role;
