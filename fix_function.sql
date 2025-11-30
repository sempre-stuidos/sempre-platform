-- Quick fix: Update check_user_access function with case-insensitive matching
CREATE OR REPLACE FUNCTION check_user_access(email_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_record RECORD;
  auth_user_record RECORD;
  business_records JSON;
  result JSON;
  user_status TEXT;
  user_role TEXT;
  user_id_val UUID;
  user_role_id_val BIGINT;
BEGIN
  email_input := LOWER(TRIM(email_input));
  
  -- First check auth.users
  SELECT id, encrypted_password INTO auth_user_record
  FROM auth.users
  WHERE LOWER(email) = email_input
  LIMIT 1;
  
  -- Check user_roles by invited_email (case-insensitive)
  SELECT id, user_id, role INTO user_role_record
  FROM user_roles
  WHERE LOWER(invited_email) = email_input
  LIMIT 1;
  
  -- If not found by email, try by user_id from auth.users
  IF user_role_record IS NULL AND auth_user_record IS NOT NULL THEN
    SELECT id, user_id, role INTO user_role_record
    FROM user_roles
    WHERE user_id = auth_user_record.id
    LIMIT 1;
  END IF;
  
  IF user_role_record IS NULL THEN
    RETURN json_build_object(
      'status', 'not_found',
      'role', NULL,
      'businesses', '[]'::json,
      'user_id', NULL,
      'user_role_id', NULL
    );
  END IF;
  
  user_role := user_role_record.role;
  user_role_id_val := user_role_record.id;
  user_id_val := COALESCE(user_role_record.user_id, auth_user_record.id);
  
  IF auth_user_record IS NULL THEN
    user_status := 'needs_password';
  ELSIF auth_user_record.encrypted_password IS NULL OR auth_user_record.encrypted_password = '' THEN
    user_status := 'needs_password';
    user_id_val := auth_user_record.id;
  ELSE
    user_status := 'has_password';
    user_id_val := auth_user_record.id;
  END IF;
  
  IF user_role_record.user_id IS NULL AND user_id_val IS NOT NULL THEN
    UPDATE user_roles
    SET user_id = user_id_val
    WHERE id = user_role_id_val;
  END IF;
  
  business_records := '[]'::json;
  IF user_role = 'Client' AND user_id_val IS NOT NULL THEN
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', b.id,
        'name', b.name,
        'slug', COALESCE(b.slug, '')
      )
    ), '[]'::json) INTO business_records
    FROM memberships m
    JOIN businesses b ON m.org_id = b.id
    WHERE m.user_id = user_id_val;
  END IF;
  
  RETURN json_build_object(
    'status', user_status,
    'role', user_role,
    'businesses', business_records,
    'user_id', user_id_val,
    'user_role_id', user_role_id_val
  );
END;
$$;
