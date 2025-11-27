-- FIX user_progress table - Drop and recreate with correct schema

-- Drop the table if it exists (this will remove any existing data!)
DROP TABLE IF EXISTS public.user_progress CASCADE;

-- Create the table with correct schema
CREATE TABLE public.user_progress (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  completed_steps integer[] DEFAULT '{}',
  
  -- Metadata
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one progress record per user per module
  UNIQUE(user_id, module_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON public.user_progress(module_id);

-- Enable Row Level Security
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own progress" 
  ON public.user_progress
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
  ON public.user_progress
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
  ON public.user_progress
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'user_progress table created successfully!' AS status;
