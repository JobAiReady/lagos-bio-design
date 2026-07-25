-- ===========================================================================
-- PRODUCTION DRIFT CHECK  --  READ ONLY
-- ===========================================================================
--
-- Answers one question above all others: is the security hardening migration
-- actually deployed?
--
-- Context: 00000000000000_base_schema.sql and 20260710000000_security_hardening
-- _phase_0.sql were never committed to git until 2026-07-25. They almost
-- certainly were never deployed either. Everything the review concluded about
-- this database being "well hardened" describes files on a laptop, not
-- necessarily the running system. This script tells you which.
--
-- SAFETY: every statement is a SELECT. Nothing is created, altered, dropped or
-- written. It reads system catalogues plus one count from public.cohorts. Safe
-- to run against production.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste QUERY 1 -> Run.
--   Then repeat with QUERY 2. The editor only displays the last result set, so
--   the two must be run separately.
--
-- HOW TO READ
--   status = OK        expected hardened state
--   status = ATTENTION deviates from what the migrations define
--   status = INFO      context, no judgement
--
-- Send the full output of both queries back for interpretation.
-- ===========================================================================


-- ===========================================================================
-- QUERY 1 -- schema, policy, grant and function state
-- ===========================================================================

WITH fn AS (
    SELECT p.oid,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args,
           p.proacl,
           p.prosecdef,
           p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
),
fn_exposed AS (
    -- A NULL proacl means the default ACL is in force, which for functions is
    -- EXECUTE to PUBLIC. Treating NULL as "not granted" would hide real
    -- exposure, so it is treated as public here.
    SELECT f.proname,
           f.args,
           CASE
               WHEN f.proacl IS NULL THEN true
               ELSE EXISTS (
                   SELECT 1
                   FROM aclexplode(f.proacl) a
                   WHERE a.privilege_type = 'EXECUTE'
                     AND (a.grantee = 0
                          OR a.grantee::regrole::text IN ('anon', 'authenticated'))
               )
           END AS client_executable
    FROM fn f
),
col_priv AS (
    SELECT grantee, table_name, column_name, privilege_type
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
),
checks AS (

-- ---------------------------------------------------------------------------
-- A. Is phase 0 deployed at all? These objects exist only in that migration.
-- ---------------------------------------------------------------------------
SELECT 'A1' AS id, 'deployment' AS area,
       'is_active_enrollment() exists (phase-0 marker)' AS expectation,
       CASE WHEN EXISTS (SELECT 1 FROM fn WHERE proname = 'is_active_enrollment')
            THEN 'OK' ELSE 'ATTENTION' END AS status,
       CASE WHEN EXISTS (SELECT 1 FROM fn WHERE proname = 'is_active_enrollment')
            THEN 'present -- phase 0 appears deployed'
            ELSE 'MISSING -- phase 0 is NOT deployed; every check below marked '
                 || 'ATTENTION follows from this' END AS detail

UNION ALL
SELECT 'A2', 'deployment',
       'verify_certificate(text) exists (phase-0 marker)',
       CASE WHEN EXISTS (SELECT 1 FROM fn WHERE proname = 'verify_certificate')
            THEN 'OK' ELSE 'ATTENTION' END,
       COALESCE((SELECT 'present' FROM fn WHERE proname = 'verify_certificate' LIMIT 1),
                'MISSING -- anon certificate verification goes through table '
                || 'SELECT instead of a narrow function')

UNION ALL
-- Catalogue-only check. Referencing supabase_migrations.schema_migrations
-- directly would fail at PARSE time if the schema is absent, taking the whole
-- query with it. Contents are read by QUERY 3 instead.
SELECT 'A3', 'deployment',
       'migration ledger present',
       'INFO',
       COALESCE(
           (SELECT 'ledger exists -- run QUERY 3 for the applied versions'
            FROM pg_tables
            WHERE schemaname = 'supabase_migrations'
              AND tablename = 'schema_migrations'
            LIMIT 1),
           'no supabase_migrations.schema_migrations -- schema was likely built '
           || 'by hand or via the dashboard rather than by the CLI')

-- ---------------------------------------------------------------------------
-- B. Column-level grants. Phase 0's strongest control.
-- ---------------------------------------------------------------------------
UNION ALL
SELECT 'B1', 'privilege escalation',
       'authenticated CANNOT update profiles.plan',
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'profiles' AND column_name = 'plan'
                           AND privilege_type = 'UPDATE')
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'profiles' AND column_name = 'plan'
                           AND privilege_type = 'UPDATE')
            THEN 'GRANTED -- any user can set their own plan to pro (paid tier bypass)'
            ELSE 'not granted' END

UNION ALL
SELECT 'B2', 'privilege escalation',
       'authenticated CANNOT update profiles.cohort_id',
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'profiles' AND column_name = 'cohort_id'
                           AND privilege_type = 'UPDATE')
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'profiles' AND column_name = 'cohort_id'
                           AND privilege_type = 'UPDATE')
            THEN 'GRANTED -- any user can enrol themselves without an access code'
            ELSE 'not granted' END

UNION ALL
SELECT 'B3', 'privilege escalation',
       'authenticated CAN update profiles.full_name (should still work)',
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'profiles' AND column_name = 'full_name'
                           AND privilege_type = 'UPDATE')
            THEN 'OK' ELSE 'ATTENTION' END,
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'profiles' AND column_name = 'full_name'
                           AND privilege_type = 'UPDATE')
            THEN 'granted -- profile editing works'
            ELSE 'NOT granted -- users cannot edit their own name' END

UNION ALL
SELECT 'B4', 'privilege escalation',
       'authenticated CANNOT set protein_gallery.featured',
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'protein_gallery' AND column_name = 'featured'
                           AND privilege_type IN ('UPDATE', 'INSERT'))
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'protein_gallery' AND column_name = 'featured'
                           AND privilege_type IN ('UPDATE', 'INSERT'))
            THEN 'GRANTED -- users can feature their own designs'
            ELSE 'not granted' END

-- ---------------------------------------------------------------------------
-- C. RESTRICTIVE enrollment policies (phase 0 adds 7).
-- ---------------------------------------------------------------------------
UNION ALL
SELECT 'C1', 'enrollment gate',
       'RESTRICTIVE policies present on gated tables (expect >= 7)',
       CASE WHEN (SELECT count(*) FROM pg_policies
                  WHERE schemaname = 'public' AND permissive = 'RESTRICTIVE') >= 7
            THEN 'OK' ELSE 'ATTENTION' END,
       'found ' || (SELECT count(*) FROM pg_policies
                    WHERE schemaname = 'public' AND permissive = 'RESTRICTIVE')::text
       || ' restrictive policies. Without these, members of a CLOSED cohort keep '
       || 'full write access to progress, gallery and analytics.'

-- ---------------------------------------------------------------------------
-- D. Server-only functions must not be client callable.
-- ---------------------------------------------------------------------------
UNION ALL
SELECT 'D1', 'function exposure',
       'check_rate_limit NOT callable by anon/authenticated/PUBLIC',
       CASE WHEN EXISTS (SELECT 1 FROM fn_exposed
                         WHERE proname = 'check_rate_limit' AND client_executable)
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM fn_exposed
                         WHERE proname = 'check_rate_limit' AND client_executable)
            THEN 'CLIENT CALLABLE -- a client can burn or manipulate any '
                 || 'identifier''s quota, defeating signup and AI rate limits'
            ELSE 'server-only' END

UNION ALL
SELECT 'D2', 'function exposure',
       'verify_cohort_code NOT callable by anon/authenticated/PUBLIC',
       CASE WHEN EXISTS (SELECT 1 FROM fn_exposed
                         WHERE proname = 'verify_cohort_code' AND client_executable)
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM fn_exposed
                         WHERE proname = 'verify_cohort_code' AND client_executable)
            THEN 'CLIENT CALLABLE -- access codes can be brute forced directly '
                 || 'against the RPC, bypassing signup rate limiting'
            ELSE 'server-only' END

UNION ALL
SELECT 'D3', 'function exposure',
       'get_user_progress_summary NOT callable by anon/authenticated',
       CASE WHEN EXISTS (SELECT 1 FROM fn_exposed
                         WHERE proname = 'get_user_progress_summary' AND client_executable)
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM fn_exposed
                         WHERE proname = 'get_user_progress_summary' AND client_executable)
            THEN 'CLIENT CALLABLE -- takes an arbitrary user id and is '
                 || 'SECURITY DEFINER, so it reads other users'' progress'
            ELSE 'server-only or absent' END

UNION ALL
SELECT 'D4', 'function exposure',
       'every SECURITY DEFINER function pins search_path',
       CASE WHEN (SELECT count(*) FROM fn
                  WHERE prosecdef
                    AND (proconfig IS NULL
                         OR NOT EXISTS (SELECT 1 FROM unnest(proconfig) c
                                        WHERE c LIKE 'search\_path=%'))) = 0
            THEN 'OK' ELSE 'ATTENTION' END,
       COALESCE((SELECT string_agg(proname || '(' || args || ')', ', ')
                 FROM fn
                 WHERE prosecdef
                   AND (proconfig IS NULL
                        OR NOT EXISTS (SELECT 1 FROM unnest(proconfig) c
                                       WHERE c LIKE 'search\_path=%'))),
                'all SECURITY DEFINER functions pin search_path')

-- ---------------------------------------------------------------------------
-- E. Certificate exposure.
-- ---------------------------------------------------------------------------
UNION ALL
SELECT 'E1', 'certificates',
       'legacy "Anyone can verify by code" policy removed',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies
                         WHERE schemaname = 'public' AND tablename = 'certificates'
                           AND policyname = 'Anyone can verify by code')
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies
                         WHERE schemaname = 'public' AND tablename = 'certificates'
                           AND policyname = 'Anyone can verify by code')
            THEN 'STILL PRESENT -- broad SELECT on certificates rather than a '
                 || 'narrow verification function; enables enumeration'
            ELSE 'removed' END

UNION ALL
SELECT 'E2', 'certificates',
       'anon has no direct SELECT on certificates',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.table_privileges
                         WHERE table_schema = 'public' AND table_name = 'certificates'
                           AND grantee = 'anon' AND privilege_type = 'SELECT')
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.table_privileges
                         WHERE table_schema = 'public' AND table_name = 'certificates'
                           AND grantee = 'anon' AND privilege_type = 'SELECT')
            THEN 'GRANTED to anon' ELSE 'not granted to anon' END

-- ---------------------------------------------------------------------------
-- F. LBD-15 surface. Expected ATTENTION even when phase 0 IS deployed --
-- this is the open finding, recorded here so the fix can be confirmed later.
-- ---------------------------------------------------------------------------
UNION ALL
SELECT 'F1', 'certificate integrity',
       'user_progress.completed_steps not client-writable (known open finding)',
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'user_progress'
                           AND column_name = 'completed_steps'
                           AND privilege_type IN ('INSERT', 'UPDATE'))
            THEN 'ATTENTION' ELSE 'OK' END,
       CASE WHEN EXISTS (SELECT 1 FROM col_priv
                         WHERE table_name = 'user_progress'
                           AND column_name = 'completed_steps'
                           AND privilege_type IN ('INSERT', 'UPDATE'))
            THEN 'CLIENT WRITABLE -- LBD-15: the sole certificate criterion can '
                 || 'be written directly, so certificates are self-asserted'
            ELSE 'not client writable' END

-- ---------------------------------------------------------------------------
-- G. RLS coverage.
-- ---------------------------------------------------------------------------
UNION ALL
SELECT 'G1', 'row level security',
       'RLS enabled on every public table',
       CASE WHEN (SELECT count(*) FROM pg_tables
                  WHERE schemaname = 'public' AND NOT rowsecurity) = 0
            THEN 'OK' ELSE 'ATTENTION' END,
       COALESCE((SELECT string_agg(tablename, ', ' ORDER BY tablename)
                 FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity),
                'all public tables have RLS enabled')

UNION ALL
SELECT 'G2', 'row level security',
       'policy inventory',
       'INFO',
       (SELECT string_agg(tablename || ':' || cnt::text, '  ' ORDER BY tablename)
        FROM (SELECT tablename, count(*) AS cnt FROM pg_policies
              WHERE schemaname = 'public' GROUP BY tablename) s)
)
SELECT id, area, expectation, status, detail
FROM checks
ORDER BY
    CASE status WHEN 'ATTENTION' THEN 0 WHEN 'OK' THEN 1 ELSE 2 END,
    id;


-- ===========================================================================
-- QUERY 2 -- credential rotation (LBD-12). Run separately.
-- ===========================================================================
--
-- A cohort access code was committed to git in ec4c6b0. The phase-0 migration
-- rotates it by matching a SHA-256 digest, but that only fires if the database
-- still held the exact committed plaintext. If the code was changed by hand, the
-- rotation silently did nothing -- and if it was never changed, the leaked code
-- is live. Access codes are the only gate on registration.
--
-- Returns no codes and no plaintext, only counts.

SELECT
    'LBD-12' AS id,
    'credential' AS area,
    count(*) FILTER (
        WHERE encode(sha256(convert_to(access_code, 'utf8')), 'hex')
              = 'cbff2ae54d097b42f30eb2cc2f5868a4f5aa294bcd32bd15b881ad260b17dd08'
    ) AS cohorts_matching_leaked_code,
    count(*) FILTER (
        WHERE encode(sha256(convert_to(access_code, 'utf8')), 'hex')
              = 'cbff2ae54d097b42f30eb2cc2f5868a4f5aa294bcd32bd15b881ad260b17dd08'
          AND is_active
    ) AS active_cohorts_matching,
    count(*) AS total_cohorts,
    count(*) FILTER (WHERE is_active) AS active_cohorts,
    CASE
        WHEN count(*) FILTER (
            WHERE encode(sha256(convert_to(access_code, 'utf8')), 'hex')
                  = 'cbff2ae54d097b42f30eb2cc2f5868a4f5aa294bcd32bd15b881ad260b17dd08'
        ) > 0
        THEN 'ATTENTION -- the code committed to git is still in the database. '
             || 'Rotate it manually.'
        ELSE 'OK -- no cohort uses the leaked code.'
    END AS status
FROM public.cohorts;


-- ===========================================================================
-- QUERY 3 -- applied migration versions. Run separately, and only if QUERY 1
-- reported that the ledger exists (check A3). Errors harmlessly otherwise.
-- ===========================================================================

SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;
