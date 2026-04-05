-- Add plan column to profiles for tier gating (free | pro)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

-- Existing RLS "Users can view own profile" already covers SELECT on all columns
