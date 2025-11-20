-- ============================================================================
-- Enhance Organizations Table
-- Adds additional fields for better organization management
-- ============================================================================

-- Add new fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);

-- Update organization type constraint to support more types
-- First, drop the existing constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check;

-- Add new constraint with expanded types (client will be removed in next migration)
ALTER TABLE organizations 
ADD CONSTRAINT organizations_type_check 
CHECK (type IN ('agency', 'client', 'restaurant', 'hotel', 'retail', 'service', 'other'));

-- Add comment
COMMENT ON COLUMN organizations.status IS 'Organization status: active, inactive, or suspended';
COMMENT ON COLUMN organizations.type IS 'Organization type: agency, restaurant, hotel, retail, service, or other (client type will be migrated to restaurant)';

