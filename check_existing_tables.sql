-- Check what tables and columns already exist

-- 1. Check if user_progress table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'user_progress';

-- 2. If it exists, check its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- 3. Check existing indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_progress';

-- 4. Check existing policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_progress';
