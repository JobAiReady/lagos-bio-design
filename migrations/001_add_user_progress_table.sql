-- Migration: Add user_progress table
-- Created: 2025-11-26
-- Purpose: Track user completion of module steps

-- ========================================
-- User Progress Tracking Table
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  completed_steps INTEGER[] DEFAULT '{}',
  
  -- Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one progress record per user per module
  UNIQUE(user_id, module_id)
);

-- ========================================
-- Indexes for Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id 
  ON public.user_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_module_id 
  ON public.user_progress(module_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_updated_at 
  ON public.user_progress(updated_at DESC);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress (optional, for data privacy)
CREATE POLICY "Users can delete own progress"
  ON public.user_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- Auto-Update Timestamp Trigger
-- ========================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_progress table
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Helpful Functions
-- ========================================

-- Function to get user progress summary
CREATE OR REPLACE FUNCTION get_user_progress_summary(p_user_id UUID)
RETURNS TABLE (
  total_modules INTEGER,
  modules_started INTEGER,
  total_steps_completed INTEGER,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT module_id) FROM public.user_progress) as total_modules,
    COUNT(*)::INTEGER as modules_started,
    SUM(ARRAY_LENGTH(completed_steps, 1))::INTEGER as total_steps_completed,
    ROUND(
      (SUM(ARRAY_LENGTH(completed_steps, 1))::NUMERIC / 
       NULLIF((SELECT SUM(ARRAY_LENGTH(completed_steps, 1)) 
               FROM public.user_progress), 0)) * 100, 
      2
    ) as completion_percentage
  FROM public.user_progress
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Sample Data for Testing (Optional)
-- ========================================

-- Uncomment to add test data
/*
INSERT INTO public.user_progress (user_id, module_id, completed_steps)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Module 1: Protein Design Paradigms', ARRAY[0, 1]),
  ('00000000-0000-0000-0000-000000000000', 'Module 2: AI Toolkit', ARRAY[0])
ON CONFLICT (user_id, module_id) DO NOTHING;
*/

-- ========================================
-- Verification Queries
-- ========================================

-- Check that table was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_progress'
  ) THEN
    RAISE NOTICE 'user_progress table created successfully';
  END IF;
END $$;

-- Check RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_progress' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Row Level Security enabled on user_progress';
  END IF;
END $$;

-- List all policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_progress';
