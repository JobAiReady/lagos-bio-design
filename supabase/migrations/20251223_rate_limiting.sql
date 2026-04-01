-- Track API calls per user/IP
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id bigserial PRIMARY KEY,
  identifier text NOT NULL, -- user_id or IP address (we'll use email for auth)
  action_type text NOT NULL, -- 'signup', 'signin', 'rpc_call'
  call_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE(identifier, action_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action_type);

-- Enable RLS (though this table is mostly system-internal, it's good practice)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_calls integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to check/update the table
SET search_path = public -- Secure search path
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz;
BEGIN
  -- Get current rate limit record
  SELECT call_count, window_start INTO v_current_count, v_window_start
  FROM public.rate_limits
  WHERE identifier = p_identifier AND action_type = p_action_type;

  -- If no record exists or window expired, create/reset
  IF v_current_count IS NULL OR v_window_start < (now() - (p_window_minutes || ' minutes')::interval) THEN
    INSERT INTO public.rate_limits (identifier, action_type, call_count, window_start)
    VALUES (p_identifier, p_action_type, 1, now())
    ON CONFLICT (identifier, action_type)
    DO UPDATE SET call_count = 1, window_start = now();
    RETURN TRUE;
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= p_max_calls THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  UPDATE public.rate_limits
  SET call_count = call_count + 1
  WHERE identifier = p_identifier AND action_type = p_action_type;

  RETURN TRUE;
END;
$$;

-- Grant access to authenticated and anon users (needed for login/signup checks)
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO authenticated, anon, service_role;
GRANT ALL ON public.rate_limits TO service_role;
-- We don't grant direct table access to anon/authenticated, only via the function
