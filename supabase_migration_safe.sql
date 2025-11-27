-- SAFE MIGRATION - Only adds missing user_progress table
-- Run this if you got "already exists" errors

-- 4. USER PROGRESS (Track module completion) - THE CRITICAL MISSING TABLE
create table if not exists public.user_progress (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  completed_steps integer[] default '{}',
  
  -- Metadata
  started_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one progress record per user per module
  unique(user_id, module_id)
);

-- Indexes for performance
create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
create index if not exists idx_user_progress_module_id on public.user_progress(module_id);

-- Enable RLS
alter table public.user_progress enable row level security;

-- Drop existing policies if they exist, then recreate
drop policy if exists "Users can view own progress" on public.user_progress;
drop policy if exists "Users can insert own progress" on public.user_progress;
drop policy if exists "Users can update own progress" on public.user_progress;

-- Create policies
create policy "Users can view own progress" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress" on public.user_progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own progress" on public.user_progress
  for update using (auth.uid() = user_id);

-- Auto-update timestamp function (safe to recreate)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists, then recreate
drop trigger if exists update_user_progress_updated_at on public.user_progress;

create trigger update_user_progress_updated_at
  before update on public.user_progress
  for each row
  execute function update_updated_at_column();
