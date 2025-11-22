-- ============================================================================
-- Fix Pages Table Foreign Key Constraint
-- Updates the foreign key to reference businesses instead of organizations
-- ============================================================================

-- Drop the old foreign key constraint if it exists
ALTER TABLE pages 
  DROP CONSTRAINT IF EXISTS pages_org_id_fkey;

-- Add the correct foreign key constraint pointing to businesses
ALTER TABLE pages 
  ADD CONSTRAINT pages_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Update RLS policies to ensure they work correctly
-- The policies should already be correct, but let's make sure they reference the right table

-- Drop and recreate the SELECT policy to ensure it's correct
DROP POLICY IF EXISTS "Members can view their organization pages" ON pages;
CREATE POLICY "Members can view their organization pages" ON pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Drop and recreate the INSERT policy
DROP POLICY IF EXISTS "Members can create pages in their organizations" ON pages;
CREATE POLICY "Members can create pages in their organizations" ON pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Drop and recreate the UPDATE policy
DROP POLICY IF EXISTS "Members can update their organization pages" ON pages;
CREATE POLICY "Members can update their organization pages" ON pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Drop and recreate the DELETE policy
DROP POLICY IF EXISTS "Members can delete their organization pages" ON pages;
CREATE POLICY "Members can delete their organization pages" ON pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Remove or restrict the public policy - it's too permissive
-- The public policy allows anyone to see published pages from any business
-- This should only apply to unauthenticated users for the public site
-- For authenticated users, they should only see pages from their own businesses
DROP POLICY IF EXISTS "Public can view published pages" ON pages;

-- Create a more restrictive public policy that only applies to unauthenticated users
-- This allows the public restaurant site to work, but prevents cross-business access
CREATE POLICY "Public can view published pages" ON pages
    FOR SELECT USING (
        status = 'published' 
        AND auth.uid() IS NULL  -- Only for unauthenticated (public) access
    );

