-- ============================================================================
-- Ensure user_roles table exists and is properly configured
-- This migration ensures the table exists even if previous migrations failed
-- ============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Member', 'Developer', 'Designer')),
    invited_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Drop existing unique constraints if they exist (to recreate them properly)
DO $$ 
BEGIN
    -- Drop unique constraint on user_id if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_key'
    ) THEN
        ALTER TABLE user_roles DROP CONSTRAINT user_roles_user_id_key;
    END IF;
    
    -- Drop unique constraint on invited_email if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_invited_email_key'
    ) THEN
        ALTER TABLE user_roles DROP CONSTRAINT user_roles_invited_email_key;
    END IF;
END $$;

-- Create partial unique index for user_id (allows multiple NULLs)
DROP INDEX IF EXISTS user_roles_user_id_unique;
CREATE UNIQUE INDEX user_roles_user_id_unique ON user_roles(user_id) WHERE user_id IS NOT NULL;

-- Create unique index for invited_email
DROP INDEX IF EXISTS user_roles_invited_email_unique;
CREATE UNIQUE INDEX user_roles_invited_email_unique ON user_roles(invited_email);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_invited_email ON user_roles(invited_email);

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_roles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON user_roles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON user_roles;

-- Create policies for RLS
-- Note: These policies allow authenticated users to read/insert/update/delete
-- But when using supabaseAdmin (service role), RLS is bypassed
CREATE POLICY "Enable read access for authenticated users" ON user_roles 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON user_roles 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON user_roles 
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON user_roles 
    FOR DELETE USING (auth.role() = 'authenticated');


