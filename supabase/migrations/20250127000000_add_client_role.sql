-- ============================================================================
-- Add 'Client' role to user_roles table
-- Updates the CHECK constraint to include 'Client' as a valid role
-- ============================================================================

-- Drop the existing CHECK constraint (PostgreSQL auto-generates constraint names)
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'user_roles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role IN%';
    
    -- Drop it if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- Drop existing constraint if it exists, then add the new CHECK constraint with 'Client' included
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_check
CHECK (role IN ('Admin', 'Manager', 'Member', 'Developer', 'Designer', 'Client'));

