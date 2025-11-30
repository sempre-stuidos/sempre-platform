-- ============================================================================
-- Fix check_user_access function - Case insensitive email matching
-- This fixes the issue where emails in user_roles.invited_email might not be lowercase
-- ============================================================================

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
  has_password BOOLEAN;
  user_status TEXT;
  user_role TEXT;
  user_id_val UUID;
  user_role_id_val BIGINT;
BEGIN
  -- Normalize email to lowercase
  email_input := LOWER(TRIM(email_input));
  
  -- First, check if auth user exists with this email
  SELECT id, encrypted_password INTO auth_user_record
  FROM auth.users
  WHERE LOWER(email) = email_input
  LIMIT 1;
  
  -- Check if email exists in user_roles table (case-insensitive comparison)
  SELECT id, user_id, role INTO user_role_record
  FROM user_roles
  WHERE LOWER(invited_email) = email_input
  LIMIT 1;
  
  -- If not found by invited_email, check if user_id links to an auth user with this email
  IF user_role_record IS NULL AND auth_user_record IS NOT NULL THEN
    SELECT ur.id, ur.user_id, ur.role INTO user_role_record
    FROM user_roles ur
    WHERE ur.user_id = auth_user_record.id
    LIMIT 1;
  END IF;
  
  -- If still not found, user doesn't exist in system
  IF user_role_record IS NULL THEN
    RETURN json_build_object(
      'status', 'not_found',
      'role', NULL,
      'businesses', '[]'::json,
      'user_id', NULL,
      'user_role_id', NULL
    );
  END IF;
  
  -- Store role and user_role_id
  user_role := user_role_record.role;
  user_role_id_val := user_role_record.id;
  user_id_val := user_role_record.user_id;
  
  -- If we found auth_user_record earlier, use it; otherwise check again
  IF auth_user_record IS NULL THEN
    SELECT id, encrypted_password INTO auth_user_record
    FROM auth.users
    WHERE LOWER(email) = email_input
    LIMIT 1;
  END IF;
  
  -- Determine status based on auth user and password
  IF auth_user_record IS NULL THEN
    -- No auth user exists yet
    user_status := 'needs_password';
    has_password := FALSE;
  ELSIF auth_user_record.encrypted_password IS NULL OR auth_user_record.encrypted_password = '' THEN
    -- Auth user exists but no password (OAuth user)
    user_status := 'needs_password';
    has_password := FALSE;
    user_id_val := auth_user_record.id;
  ELSE
    -- Auth user exists with password
    user_status := 'has_password';
    has_password := TRUE;
    user_id_val := auth_user_record.id;
  END IF;
  
  -- If user has user_id in user_roles but it doesn't match auth user, update it
  IF user_role_record.user_id IS NULL AND user_id_val IS NOT NULL THEN
    -- Link the user_roles record to the auth user
    UPDATE user_roles
    SET user_id = user_id_val
    WHERE id = user_role_id_val;
  END IF;
  
  -- Fetch businesses for Client role
  business_records := '[]'::json;
  IF user_role = 'Client' AND user_id_val IS NOT NULL THEN
    SELECT json_agg(
      json_build_object(
        'id', b.id,
        'name', b.name,
        'slug', COALESCE(b.slug, '')
      )
    ) INTO business_records
    FROM memberships m
    JOIN businesses b ON m.org_id = b.id
    WHERE m.user_id = user_id_val;
    
    -- If no businesses found but user_id is null, try to find by email match
    -- This handles the case where user_roles exists but user_id isn't set yet
    IF business_records IS NULL AND user_role_record.user_id IS NULL THEN
      -- Can't fetch businesses without user_id, return empty array
      business_records := '[]'::json;
    END IF;
    
    -- Ensure we return an array, not null
    IF business_records IS NULL THEN
      business_records := '[]'::json;
    END IF;
  END IF;
  
  -- Build and return result
  result := json_build_object(
    'status', user_status,
    'role', user_role,
    'businesses', business_records,
    'user_id', user_id_val,
    'user_role_id', user_role_id_val
  );
  
  RETURN result;
END;
$$;


