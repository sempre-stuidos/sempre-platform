-- ============================================================================
-- Fix Public Access Policy for Page Sections V2
-- Updates the policy to allow viewing dirty sections without requiring published_content
-- This matches the pages policy behavior and allows public landing pages to work
-- ============================================================================

-- Drop the existing policy if it exists (to recreate it properly)
DROP POLICY IF EXISTS "Public can view published page sections" ON page_sections_v2;

-- Create updated policy that allows viewing published OR dirty sections
-- This matches the pages policy behavior and ensures consistency
CREATE POLICY "Public can view published page sections" ON page_sections_v2
    FOR SELECT USING (
        status = 'published' 
        OR status = 'dirty'
    );

-- Add comment for documentation
COMMENT ON POLICY "Public can view published page sections" ON page_sections_v2 IS 
    'Allows public (anonymous) access to read published or dirty page sections. Required for public landing pages. Works alongside member-based policies.';

