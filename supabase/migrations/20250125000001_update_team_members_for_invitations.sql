-- ============================================================================
-- Update Team Members Table for Invitation System
-- Add auth_user_id and invited_email columns
-- Make name and timezone optional (populated after user accepts invitation)
-- ============================================================================

-- Add auth_user_id column (nullable, will be populated when user accepts invitation)
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add invited_email column to track email before user accepts
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS invited_email TEXT;

-- Make name and timezone optional (will be populated from Google OAuth after acceptance)
ALTER TABLE team_members 
ALTER COLUMN name DROP NOT NULL;

ALTER TABLE team_members 
ALTER COLUMN timezone DROP NOT NULL;

-- Create index for auth_user_id
CREATE INDEX IF NOT EXISTS idx_team_members_auth_user_id ON team_members(auth_user_id);

-- Create index for invited_email
CREATE INDEX IF NOT EXISTS idx_team_members_invited_email ON team_members(invited_email);

-- Update unique constraint on email to allow multiple pending invitations
-- Remove the unique constraint on email temporarily (we'll handle uniqueness via application logic)
-- Note: We keep email unique but allow NULL for invited_email entries
-- The unique constraint on email will remain, but we'll use invited_email for pending invitations

