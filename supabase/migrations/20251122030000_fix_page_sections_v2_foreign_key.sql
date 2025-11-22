-- ============================================================================
-- Fix Page Sections V2 Foreign Key Constraint
-- Updates the foreign key to reference businesses instead of organizations
-- ============================================================================

-- Drop the old foreign key constraint if it exists
ALTER TABLE page_sections_v2 
  DROP CONSTRAINT IF EXISTS page_sections_v2_org_id_fkey;

-- Add the correct foreign key constraint pointing to businesses
ALTER TABLE page_sections_v2 
  ADD CONSTRAINT page_sections_v2_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Update RLS policies to ensure they work correctly
-- The policies should already be correct, but let's make sure they reference the right table

-- Drop and recreate the SELECT policy to ensure it's correct
DROP POLICY IF EXISTS "Members can view their organization page sections" ON page_sections_v2;
CREATE POLICY "Members can view their organization page sections" ON page_sections_v2
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Drop and recreate the INSERT policy
DROP POLICY IF EXISTS "Members can create sections in their organization pages" ON page_sections_v2;
CREATE POLICY "Members can create sections in their organization pages" ON page_sections_v2
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Drop and recreate the UPDATE policy
DROP POLICY IF EXISTS "Members can update their organization page sections" ON page_sections_v2;
CREATE POLICY "Members can update their organization page sections" ON page_sections_v2
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Drop and recreate the DELETE policy
DROP POLICY IF EXISTS "Members can delete their organization page sections" ON page_sections_v2;
CREATE POLICY "Members can delete their organization page sections" ON page_sections_v2
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Fix the public policy to only apply to unauthenticated users
DROP POLICY IF EXISTS "Public can view published page sections" ON page_sections_v2;
CREATE POLICY "Public can view published page sections" ON page_sections_v2
    FOR SELECT USING (
        status = 'published' 
        AND auth.uid() IS NULL  -- Only for unauthenticated (public) access
    );

