-- Create RPC function for server-side access code validation
-- This prevents client-side bypass of the access code check

CREATE OR REPLACE FUNCTION verify_cohort_code(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    valid_code text := 'YOUR-ACCESS-CODE'; -- TODO: Move to secure config table
BEGIN
    -- Simple comparison for now
    RETURN code = valid_code;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_cohort_code(text) TO authenticated;

-- Verify the function works
SELECT verify_cohort_code('YOUR-ACCESS-CODE') as should_be_true;
SELECT verify_cohort_code('WRONG') as should_be_false;
