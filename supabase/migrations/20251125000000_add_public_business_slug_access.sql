-- ============================================================================
-- Add Public Access Policy for Business Slugs
-- This allows public (anonymous) access to businesses by slug for landing pages
-- ============================================================================

-- Drop the existing policy if it exists (to recreate it properly)
DROP POLICY IF EXISTS "Public can view business slugs" ON businesses;

-- Create the public policy with explicit configuration
-- This policy allows anyone (including anonymous users) to read businesses
-- It works alongside the "Members can view their businesses" policy
-- PERMISSIVE policies are OR'd together, so either policy can grant access
CREATE POLICY "Public can view business slugs" ON businesses
    FOR SELECT 
    USING (true);

-- Add comment for documentation
COMMENT ON POLICY "Public can view business slugs" ON businesses IS 
    'Allows public (anonymous) access to read businesses by slug. Required for public landing pages to look up businesses. Works alongside member-based policies.';

