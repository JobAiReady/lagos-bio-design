-- Create analytics_events table
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  event_type text not null, -- 'page_view', 'heartbeat', 'error', 'completion'
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.analytics_events enable row level security;

-- Policy: Users can insert their own events
create policy "Users can insert their own events"
  on public.analytics_events for insert
  with check (auth.uid() = user_id);

-- Policy: Users can view their own events (optional, maybe for debugging)
create policy "Users can view their own events"
  on public.analytics_events for select
  using (auth.uid() = user_id);

-- Policy: Admins can view all events
-- For MVP, we'll hardcode the admin email or use a specific claim if available.
-- Ideally, you'd have an 'admins' table or role.
-- REPLACE 'josepholadiran93@gmail.com' with the actual admin email if known, 
-- or use a broader check if you have an admin role.
create policy "Admins can view all events"
  on public.analytics_events for select
  using (
    auth.jwt() ->> 'email' = 'josepholadiran93@gmail.com' 
    -- OR auth.uid() in (select user_id from admin_users) -- Future proofing
  );

-- Index for performance
create index if not exists idx_analytics_user_id on public.analytics_events(user_id);
create index if not exists idx_analytics_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_created_at on public.analytics_events(created_at desc);
