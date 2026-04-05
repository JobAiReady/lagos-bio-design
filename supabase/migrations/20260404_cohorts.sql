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
CREATE POLICY "Admins can manage cohorts" ON public.cohorts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Add cohort_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cohort_id bigint REFERENCES public.cohorts(id);

-- Seed the existing hardcoded access code as Cohort 1
INSERT INTO public.cohorts (name, access_code, start_date, max_students)
VALUES ('Lagos Bio-Design Cohort 1', 'LBD-WY48-9HNV', '2026-01-15', 50)
ON CONFLICT (access_code) DO NOTHING;
