-- Supabase compatibility shim for a plain PostgreSQL instance.
--
-- Supabase provides an `auth` schema, a set of roles, and helper functions that
-- migrations depend on but that no migration in this repo creates. This file
-- reproduces the minimum surface needed for the migrations under
-- supabase/migrations/ to apply unmodified against vanilla Postgres, so that
-- RLS behaviour can be tested without Docker or a hosted project.
--
-- This is a TEST FIXTURE. It is deliberately not a faithful reimplementation of
-- GoTrue -- it only models what the migrations and RLS policies actually touch.

-- ---------------------------------------------------------------------------
-- Roles. Supabase ships these; PostgREST switches into them per request.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Supabase grants table privileges to these roles by default; RLS is what
-- actually restricts access. Reproducing that default matters, because a
-- finding about column exposure depends on the distinction between
-- table-level privileges and row-level policies.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- auth schema
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  encrypted_password text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Mirrors Supabase's auth.uid(): reads the JWT `sub` claim from the request
-- GUC. Tests impersonate a user with:
--   SET LOCAL ROLE authenticated;
--   SET LOCAL request.jwt.claim.sub = '<uuid>';
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.role', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
    current_user::text
  )
$$;

GRANT EXECUTE ON FUNCTION auth.uid(), auth.role() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Test helper: create an auth user and let the profile trigger fire.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.test_create_user(p_email text, p_full_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (
    v_id,
    p_email,
    jsonb_build_object('full_name', COALESCE(p_full_name, split_part(p_email, '@', 1)))
  );
  RETURN v_id;
END;
$$;
