-- Cohorts table for managing bootcamp access codes
CREATE TABLE IF NOT EXISTS public.cohorts (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  access_code text NOT NULL UNIQUE,
  start_date date NOT NULL,
  max_students integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage cohorts
DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
CREATE POLICY "Admins can manage cohorts" ON public.cohorts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Add cohort_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cohort_id bigint REFERENCES public.cohorts(id);

-- Cohorts and access codes must be created through the authenticated admin UI.
-- Never seed a usable enrollment credential in version control.
