-- 1. PROFILES (If not already created by Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. LAB RUNS (Track execution history)
create type run_status as enum ('queued', 'running', 'succeeded', 'failed');

create table public.lab_runs (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  status run_status not null default 'queued',
  
  -- Metadata
  script_name text,       -- e.g., 'module_1_alphafold.py'
  config jsonb,           -- Snapshot of config used
  
  -- Results
  result_summary text,
  metrics jsonb,          -- { "pLDDT": 85.4, "rmsd": 1.2 }
  
  started_at timestamptz default now(),
  finished_at timestamptz
);

alter table public.lab_runs enable row level security;

create policy "Users see own runs" on public.lab_runs
  for select using (auth.uid() = user_id);

create policy "Users insert own runs" on public.lab_runs
  for insert with check (auth.uid() = user_id);

create policy "Users update own runs" on public.lab_runs
  for update using (auth.uid() = user_id);

-- 3. PROTEIN GALLERY (Public designs)
create table public.protein_gallery (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  run_id bigint references public.lab_runs(id) on delete set null,
  
  title text not null,
  description text,
  tags text[] default '{}',
  
  pdb_url text,           -- URL to Supabase Storage
  thumbnail_url text,     -- URL to Supabase Storage (Image)
  
  is_public boolean default true,
  created_at timestamptz default now()
);

alter table public.protein_gallery enable row level security;

-- Everyone can view public designs
create policy "Public can view public gallery" on public.protein_gallery
  for select using (is_public = true);

-- Users can manage their own designs
create policy "Users manage own gallery items" on public.protein_gallery
  for all using (auth.uid() = user_id);

-- 4. USER PROGRESS (Track module completion)
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

-- Policies
create policy "Users can view own progress" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress" on public.user_progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own progress" on public.user_progress
  for update using (auth.uid() = user_id);

-- Auto-update timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_progress_updated_at
  before update on public.user_progress
  for each row
  execute function update_updated_at_column();
