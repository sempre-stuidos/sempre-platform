-- ============================================================================
-- Seed Admin User (Idempotent)
-- Ensures yolxanderjaca@gmail.com exists and has Admin role
-- ============================================================================

DO $$
DECLARE
  v_admin_email TEXT := 'yolxanderjaca@gmail.com';
  v_admin_name TEXT := 'Yolxander Jaca Gonzalez';
  v_user_id UUID;
  v_profile_exists BOOLEAN;
  v_role_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'Seeding admin user: % (%)', v_admin_name, v_admin_email;
  
  -- Check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_admin_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User % does not exist in auth.users. User must sign in via OAuth first.', v_admin_email;
    RAISE NOTICE 'Skipping profile and role setup. Run this seeder again after user signs in.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user in auth.users: %', v_user_id;
  
  -- Update user metadata if needed
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_admin_name)
  WHERE id = v_user_id
  AND (raw_user_meta_data->>'full_name' IS NULL OR raw_user_meta_data->>'full_name' != v_admin_name);
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- Create profile
    INSERT INTO profiles (id, full_name, default_role, created_at, updated_at)
    VALUES (v_user_id, v_admin_name, 'admin', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET full_name = v_admin_name,
        default_role = 'admin',
        updated_at = NOW();
    RAISE NOTICE 'Created profile for user';
  ELSE
    -- Update existing profile
    UPDATE profiles
    SET full_name = v_admin_name,
        default_role = 'admin',
        updated_at = NOW()
    WHERE id = v_user_id;
    RAISE NOTICE 'Updated existing profile';
  END IF;
  
  -- Check if Admin role exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'Admin') INTO v_role_exists;
  
  IF NOT v_role_exists THEN
    -- Check if any role exists for this user
    IF EXISTS(SELECT 1 FROM user_roles WHERE user_id = v_user_id) THEN
      -- Update existing role to Admin
      UPDATE user_roles
      SET role = 'Admin',
          invited_email = v_admin_email
      WHERE user_id = v_user_id;
      RAISE NOTICE 'Updated existing role to Admin';
    ELSE
      -- Create Admin role
      INSERT INTO user_roles (user_id, role, invited_email, created_at, updated_at)
      VALUES (v_user_id, 'Admin', v_admin_email, NOW(), NOW());
      RAISE NOTICE 'Created Admin role';
    END IF;
  ELSE
    RAISE NOTICE 'User already has Admin role';
  END IF;
  
  RAISE NOTICE '✅ Admin user seeded successfully: % (%)', v_admin_name, v_admin_email;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error seeding admin user: %', SQLERRM;
    RAISE;
END $$;

