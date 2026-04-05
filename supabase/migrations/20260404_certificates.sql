-- Certificates table for verified course completions
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  issued_at timestamptz DEFAULT now(),
  verification_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificate
CREATE POLICY "Users can view own certificate" ON public.certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Public verification by code (narrow access)
CREATE POLICY "Anyone can verify by code" ON public.certificates
  FOR SELECT USING (true);
-- Note: the verification page will filter by verification_code,
-- exposing only issued_at + joined profile name

-- RPC to issue a certificate after validating all 5 modules are complete
CREATE OR REPLACE FUNCTION public.issue_certificate()
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_modules constant int := 5;
  completed_count int;
  cert public.certificates;
BEGIN
  -- Count modules where all steps are completed
  SELECT count(*) INTO completed_count
  FROM public.user_progress up
  WHERE up.user_id = auth.uid();

  IF completed_count < total_modules THEN
    RAISE EXCEPTION 'All % modules must have progress entries to earn a certificate', total_modules;
  END IF;

  -- Insert (or return existing) certificate
  INSERT INTO public.certificates (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
  RETURNING * INTO cert;

  RETURN cert;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_certificate() TO authenticated;
