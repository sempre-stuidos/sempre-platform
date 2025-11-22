-- ============================================================================
-- Seed Admin User Function
-- Creates a function to assign Admin role to a user by email
-- 
-- Usage: SELECT * FROM seed_admin_user('yolxanderjaca@gmail.com', 'Yolxander Jaca Gonzalez');
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_admin_user(
    user_email TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    full_name TEXT,
    profile_role TEXT,
    system_role TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    target_user_id UUID;
    profile_exists BOOLEAN;
    role_exists BOOLEAN;
    result_user_id UUID;
    result_email TEXT;
    result_full_name TEXT;
    result_profile_role TEXT;
    result_system_role TEXT;
    result_success BOOLEAN;
    result_message TEXT;
BEGIN
    -- Find user by email in auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        result_user_id := NULL;
        result_email := user_email;
        result_full_name := NULL;
        result_profile_role := NULL;
        result_system_role := NULL;
        result_success := false;
        result_message := 'User not found in auth.users. User must sign in first.';
        
        RETURN QUERY SELECT 
            result_user_id,
            result_email,
            result_full_name,
            result_profile_role,
            result_system_role,
            result_success,
            result_message;
        RETURN;
    END IF;
    
    -- Update user metadata if name provided
    IF user_name IS NOT NULL THEN
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('full_name', user_name)
        WHERE id = target_user_id;
    END IF;
    
    -- Ensure profile exists
    INSERT INTO profiles (id, full_name, default_role, created_at, updated_at)
    VALUES (
        target_user_id,
        COALESCE(user_name, (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id)),
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        default_role = 'admin',
        updated_at = NOW();
    
    -- Check if role already exists
    SELECT EXISTS(
        SELECT 1 FROM user_roles WHERE user_id = target_user_id
    ) INTO role_exists;
    
    IF role_exists THEN
        -- Update existing role to Admin
        UPDATE user_roles
        SET role = 'Admin',
            updated_at = NOW()
        WHERE user_id = target_user_id;
    ELSE
        -- Create Admin role
        INSERT INTO user_roles (user_id, role, invited_email, created_at, updated_at)
        VALUES (
            target_user_id,
            'Admin',
            LOWER(user_email),
            NOW(),
            NOW()
        );
    END IF;
    
    -- Get final values
    SELECT p.full_name INTO result_full_name FROM profiles p WHERE p.id = target_user_id;
    SELECT p.default_role INTO result_profile_role FROM profiles p WHERE p.id = target_user_id;
    SELECT ur.role INTO result_system_role FROM user_roles ur WHERE ur.user_id = target_user_id;
    
    result_user_id := target_user_id;
    result_email := user_email;
    result_success := true;
    result_message := 'Admin user seeded successfully';
    
    -- Return success result
    RETURN QUERY SELECT 
        result_user_id,
        result_email,
        result_full_name,
        result_profile_role,
        result_system_role,
        result_success,
        result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION seed_admin_user IS 'Seeds an admin user by email. User must exist in auth.users first.';

-- Example usage (commented out - uncomment to run):
-- SELECT * FROM seed_admin_user('yolxanderjaca@gmail.com', 'Yolxander Jaca Gonzalez');
