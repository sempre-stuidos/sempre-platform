-- ============================================================================
-- Remove 'client' type from organizations
-- Updates existing 'client' organizations to 'restaurant' type
-- ============================================================================

-- Step 1: Update all existing organizations with type='client' to type='restaurant'
UPDATE organizations 
SET type = 'restaurant' 
WHERE type = 'client';

-- Step 2: Drop the existing constraint
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check;

-- Step 3: Add new constraint without 'client' type
ALTER TABLE organizations 
ADD CONSTRAINT organizations_type_check 
CHECK (type IN ('agency', 'restaurant', 'hotel', 'retail', 'service', 'other'));

-- Step 4: Update the comment
COMMENT ON COLUMN organizations.type IS 'Organization type: agency, restaurant, hotel, retail, service, or other';

