-- ============================================================================
-- Login Codes Table
-- Stores one-time login codes for business members (clients) to create passwords
-- ============================================================================

CREATE TABLE IF NOT EXISTS login_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_codes_code ON login_codes(code);
CREATE INDEX IF NOT EXISTS idx_login_codes_user_id ON login_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_codes(email);
CREATE INDEX IF NOT EXISTS idx_login_codes_expires_at ON login_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_codes_used_at ON login_codes(used_at) WHERE used_at IS NULL;

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_login_codes_updated_at 
    BEFORE UPDATE ON login_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE login_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own unused codes
CREATE POLICY "Users can read their own unused codes" ON login_codes
    FOR SELECT
    USING (
        auth.uid() = user_id 
        AND used_at IS NULL 
        AND expires_at > NOW()
    );

-- Admins can read all codes
CREATE POLICY "Admins can read all codes" ON login_codes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'Admin'
        )
    );

-- Admins and business owners/admins can insert codes
CREATE POLICY "Admins and business owners can insert codes" ON login_codes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'Admin'
        )
        OR EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
            AND EXISTS (
                SELECT 1 FROM memberships m2
                WHERE m2.org_id = m.org_id
                AND m2.user_id = login_codes.user_id
            )
        )
    );

-- Admins and business owners/admins can update codes (to mark as used)
CREATE POLICY "Admins and business owners can update codes" ON login_codes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'Admin'
        )
        OR EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
            AND EXISTS (
                SELECT 1 FROM memberships m2
                WHERE m2.org_id = m.org_id
                AND m2.user_id = login_codes.user_id
            )
        )
    );

-- Service role can do everything (for API endpoints)
CREATE POLICY "Service role can manage all codes" ON login_codes
    FOR ALL
    USING (true)
    WITH CHECK (true);
