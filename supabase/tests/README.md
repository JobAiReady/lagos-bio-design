# Database integration tests

Ephemeral-PostgreSQL tests for the Supabase schema: migrations, RLS policies,
grants, and `SECURITY DEFINER` functions.

## Why this exists

Two full code-review passes could not answer several questions about this
schema, because reading DDL cannot tell you:

- whether a PostgREST resource embed resolves or comes back `NULL`
- whether a policy actually restricts what its name claims
- whether a column-level `GRANT` blocks the write it was meant to block
- whether the migrations can be re-applied

Three findings sat unresolved as *inferred* until this suite ran. All three were
confirmed within minutes of it working. A fourth (non-idempotent migrations) was
found by the suite itself and has since been fixed.

Note: one case is deliberately withheld from this public repository because the
finding it covers is not yet fixed. See the hold block in `.gitignore`. A local
run will therefore show one more case than CI does.

## Running

```bash
pip install pgserver "psycopg[binary]" --break-system-packages
python3 supabase/tests/run_tests.py
```

No Docker, no hosted Supabase project, no root. `pgserver` ships its own
PostgreSQL 16 binaries and the runner creates and destroys a throwaway data
directory per run.

```bash
python3 supabase/tests/run_tests.py -k certificate   # filter by filename
python3 supabase/tests/run_tests.py --keep           # leave the DB up for psql
```

## What a run does

1. Applies `shim/*.sql` — a Supabase compatibility layer (see below).
2. Applies every file in `../migrations/` in filename order. Any failure aborts.
3. Applies them **all again** and reports anything that is not idempotent.
4. Runs each `cases/*.sql` in its own transaction, always rolled back, so cases
   are order-independent and cannot see each other's writes.

Exit code is non-zero if any migration fails to apply, any migration is not
idempotent, or any case fails.

## The shim

Supabase provides an `auth` schema, three roles, and helper functions that no
migration in this repo creates. `shim/00_supabase_shim.sql` reproduces the
minimum surface the migrations touch:

- roles `anon`, `authenticated`, `service_role`, with the default table
  privileges Supabase grants them — this matters, because the distinction
  between table privileges and row policies is what several findings turn on
- `auth.users`, `auth.uid()`, `auth.role()`
- `auth.test_create_user()`, which inserts a user so the profile trigger fires

`shim/pgcrypto_stub/` provides `digest()` and `gen_random_bytes()`, because
pgserver's PostgreSQL build has no `contrib/pgcrypto` but the migrations call
`CREATE EXTENSION pgcrypto`. `digest()` delegates to PostgreSQL's built-in
`sha*()` functions so hashes are real; `gen_random_bytes()` is backed by
`random()` and is **not** cryptographically secure. Test fixture only.

This is a fixture, not a GoTrue reimplementation. It models what the migrations
and policies actually reference and nothing else.

## Writing a case

```sql
-- TEST: short description shown in the runner output

SELECT t.act_as_admin();           -- setup runs as owner, bypassing RLS

INSERT INTO public.cohorts (name, access_code, start_date, is_active, max_students)
VALUES ('My Cohort', 'LBD-TEST-XYZ', current_date, true, 50);

DO $$
DECLARE
  v_user uuid;
BEGIN
  v_user := auth.test_create_user('someone@example.com', 'Name');

  PERFORM t.act_as(v_user);        -- become that user

  PERFORM t.assert_eq(
    (SELECT count(*)::integer FROM public.profiles),
    1,
    'a user should see exactly their own profile'
  );

  PERFORM t.assert_raises(
    format('UPDATE public.profiles SET plan = ''pro'' WHERE id = %L', v_user),
    'plan self-promotion must be blocked'
  );
END $$;
```

A case passes if it runs without raising. Helpers: `t.assert`, `t.assert_eq`,
`t.assert_raises`, `t.act_as`, `t.act_as_anon`, `t.act_as_admin`.

**Assert with `PERFORM`, not `CALL`.** The helpers are functions rather than
procedures for a specific reason: arguments to `CALL` are not evaluated under the
role and GUC context the surrounding block established, so a `SECURITY DEFINER`
function like `is_active_enrollment()` silently returns the wrong value when
passed straight into a `CALL`. This cost real debugging time; don't reintroduce
it.

**Always assert the negative.** `assert_raises` is the important helper. A suite
that only exercises happy paths tells you nothing about what your policies block,
which is the entire point of testing RLS.

## Current cases

| Case | Establishes |
|---|---|
| `10_lbd02_profile_embed_invisible` | A user cannot read another user's profile, so gallery attribution resolves to `NULL` |
| `11_lbd02_naive_fix_leaks_columns` | Fixing the above with a broad row policy also exposes `plan` and `cohort_id` — RLS filters rows, not columns |
| `20_lbd15_*` | **Held locally, not published** — see the hold block in `.gitignore`. Covers an unfixed certificate-integrity finding; it will be added here once fixed. |
| `30_lbd16_cohort_capacity_unenforced` | Capacity is advisory only; a cohort can be filled past `max_students` |
| `40_control_privilege_escalation_blocked` | Regression guard: plan/cohort self-promotion and `check_rate_limit` remain blocked |
| `41_control_enrollment_required` | Regression guard: deactivating a cohort revokes writes and certificate issuance |

Cases 10, 20 and 30 document defects and are expected to **pass while the defect
exists**. Each carries a `CONFIRMED` message naming the finding. When a defect is
fixed, invert the assertion rather than deleting the case — the case is the
regression test.

Cases 40 and 41 are positive controls protecting the hardening migration's work.
They must never start failing.

## See also

`docs/INDEPENDENT_REVIEW_2026-07-24_v2.md` — the findings these cases settle.
