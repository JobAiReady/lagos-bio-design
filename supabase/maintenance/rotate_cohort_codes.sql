-- ===========================================================================
-- ROTATE COHORT ACCESS CODES  (LBD-12)
-- ===========================================================================
--
-- Why: a cohort access code was committed to git in ec4c6b0, in a repository
-- that was public. Access codes are the only gate on registration, so that code
-- must be treated as known to anyone who looked. The phase-0 migration rotates
-- by digest match, but that only fires if the database still holds the exact
-- committed plaintext -- and only if phase 0 was ever deployed.
--
-- This script rotates unconditionally, which is the safe assumption.
--
-- WHAT ROTATION DOES AND DOES NOT DO
--   Does:     invalidates the old code for any FUTURE signup.
--   Does not: un-enrol existing students. Enrollment lives in
--             profiles.cohort_id, which is untouched here.
--   Side effect: a student mid-signup with the old code will get
--             "Invalid Access Code" and will need the new one.
--
-- Run STEP 1 first and read it. Only then run STEP 2.
-- Supabase Dashboard -> SQL Editor. Run each step as a separate query.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- STEP 1 -- PREVIEW. Read only. Shows what would change and what is at risk.
-- ---------------------------------------------------------------------------

SELECT
    c.id,
    c.name,
    c.is_active,
    c.start_date,
    c.max_students,
    (SELECT count(*) FROM public.profiles p WHERE p.cohort_id = c.id) AS enrolled,
    -- Does this cohort still carry the code that was committed to git?
    (encode(sha256(convert_to(c.access_code, 'utf8')), 'hex')
     = 'cbff2ae54d097b42f30eb2cc2f5868a4f5aa294bcd32bd15b881ad260b17dd08')
        AS uses_leaked_code,
    -- Last 4 characters only, so the console output is not itself a credential
    -- leak into logs, screenshots or clipboard history.
    '...' || right(c.access_code, 4) AS code_tail
FROM public.cohorts c
ORDER BY c.is_active DESC, c.id;


-- ---------------------------------------------------------------------------
-- STEP 2 -- ROTATE active cohorts, and return the new codes.
--
-- Scoped to is_active on purpose: closed cohorts cannot be signed up to
-- anyway, so rotating them only creates noise. Remove the WHERE clause if you
-- want everything rotated.
--
-- Uses the same generator as the phase-0 migration. If pgcrypto is not
-- installed, swap gen_random_bytes(4) for the md5 fallback noted below.
-- ---------------------------------------------------------------------------

UPDATE public.cohorts
SET access_code =
        'LBD-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4))
             || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4))
WHERE is_active
RETURNING id, name, access_code AS new_code;

-- pgcrypto-free fallback for STEP 2, if gen_random_bytes is unavailable:
--
-- UPDATE public.cohorts
-- SET access_code =
--         'LBD-' || upper(substr(md5(random()::text || id::text
--                                    || clock_timestamp()::text), 1, 4))
--              || '-' || upper(substr(md5(random()::text || id::text
--                                    || clock_timestamp()::text), 5, 4))
-- WHERE is_active
-- RETURNING id, name, access_code AS new_code;


-- ---------------------------------------------------------------------------
-- STEP 3 -- VERIFY. Read only. Expect uses_leaked_code = false everywhere.
-- ---------------------------------------------------------------------------

SELECT
    count(*) AS total_cohorts,
    count(*) FILTER (WHERE is_active) AS active_cohorts,
    count(*) FILTER (
        WHERE encode(sha256(convert_to(access_code, 'utf8')), 'hex')
              = 'cbff2ae54d097b42f30eb2cc2f5868a4f5aa294bcd32bd15b881ad260b17dd08'
    ) AS still_using_leaked_code
FROM public.cohorts;


-- ---------------------------------------------------------------------------
-- AFTER ROTATING
--   1. Distribute the new code to current students through whatever channel
--      you already use. They only need it to sign up, not to keep studying.
--   2. Do NOT paste new codes into git, issues, or commit messages. That is
--      how the first one leaked.
--   3. Codes are created through the admin UI (CohortManager). There is no
--      need to hardcode one anywhere.
-- ---------------------------------------------------------------------------
