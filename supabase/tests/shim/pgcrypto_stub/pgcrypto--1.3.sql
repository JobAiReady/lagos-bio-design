-- TEST STUB for pgcrypto. See pgcrypto.control for why this exists.

-- digest() over the algorithms these migrations actually request. Backed by
-- PostgreSQL's built-in sha*() functions (available since PG11), so hash values
-- are real and comparisons against known digests behave identically to pgcrypto.
CREATE FUNCTION digest(p_data text, p_type text) RETURNS bytea
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT CASE lower(p_type)
    WHEN 'sha256' THEN sha256(convert_to(p_data, 'utf8'))
    WHEN 'sha224' THEN sha224(convert_to(p_data, 'utf8'))
    WHEN 'sha384' THEN sha384(convert_to(p_data, 'utf8'))
    WHEN 'sha512' THEN sha512(convert_to(p_data, 'utf8'))
    WHEN 'md5'    THEN decode(md5(p_data), 'hex')
  END
$$;

CREATE FUNCTION digest(p_data bytea, p_type text) RETURNS bytea
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT CASE lower(p_type)
    WHEN 'sha256' THEN sha256(p_data)
    WHEN 'sha224' THEN sha224(p_data)
    WHEN 'sha384' THEN sha384(p_data)
    WHEN 'sha512' THEN sha512(p_data)
    WHEN 'md5'    THEN decode(md5(p_data), 'hex')
  END
$$;

-- NOT cryptographically secure. Sufficient only to let the access-code
-- rotation in the hardening migration execute and produce distinct values.
CREATE FUNCTION gen_random_bytes(p_count integer) RETURNS bytea
LANGUAGE sql VOLATILE STRICT AS $$
  SELECT decode(
    string_agg(lpad(to_hex(floor(random() * 256)::int), 2, '0'), ''),
    'hex'
  )
  FROM generate_series(1, p_count)
$$;
