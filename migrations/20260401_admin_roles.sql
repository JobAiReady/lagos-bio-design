-- Admin role check via RPC (replaces hardcoded email check in client code)
-- Usage: SELECT is_admin FROM check_admin_role();

-- 1. Create admin_roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'instructor',
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can see admin_roles
CREATE POLICY "Admins can view roles" ON public.admin_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. RPC function to check if current user is admin
CREATE OR REPLACE FUNCTION public.check_admin_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
  );
END;
$$;

-- 3. Seed the initial admin (replace with your actual user UUID after signup)
-- Run this manually after identifying the admin user's UUID:
-- INSERT INTO public.admin_roles (user_id, role) VALUES ('YOUR-UUID-HERE', 'instructor');
