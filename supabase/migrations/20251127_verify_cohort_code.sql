-- Function to verify cohort access code securely on the server
-- Run this in your Supabase SQL Editor

create or replace function verify_cohort_code(code text)
returns boolean
language plpgsql
security definer -- Runs with privileges of the creator (postgres)
as $$
declare
  valid_code text;
begin
  -- In a real production app, you might store this in a 'secrets' table
  -- or use Vault. For now, we hardcode it in the function which is hidden from clients.
  valid_code := 'YOUR-ACCESS-CODE';
  
  return code = valid_code;
end;
$$;
