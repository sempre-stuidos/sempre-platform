-- ============================================================================
-- Update Restaurant Tables RLS for Organization-Based Access
-- Replaces email-based matching with organization membership checks
-- ============================================================================

-- ============================================================================
-- Menu Items RLS Policies Update
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Clients can view their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can insert their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can update their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can delete their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can view all menu items" ON menu_items;

-- Create new organization-based policies
-- Users with membership in the client's organization can access menu items
CREATE POLICY "Organization members can view menu items" ON menu_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_items.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
        )
    );

CREATE POLICY "Organization members can insert menu items" ON menu_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_items.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can update menu items" ON menu_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_items.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can delete menu items" ON menu_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_items.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- Agency users (non-client org members) can view all menu items
CREATE POLICY "Agency users can view all menu items" ON menu_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM memberships m
            JOIN organizations o ON o.id = m.org_id
            WHERE m.user_id = auth.uid()
            AND o.type = 'client'
        )
    );

-- ============================================================================
-- Gallery Images RLS Policies Update
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Clients can view their own gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Clients can insert their own gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Clients can update their own gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Clients can delete their own gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Authenticated users can view all gallery images" ON gallery_images;

-- Create new organization-based policies
CREATE POLICY "Organization members can view gallery images" ON gallery_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = gallery_images.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
        )
    );

CREATE POLICY "Organization members can insert gallery images" ON gallery_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = gallery_images.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can update gallery images" ON gallery_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = gallery_images.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can delete gallery images" ON gallery_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = gallery_images.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- Agency users can view all gallery images
CREATE POLICY "Agency users can view all gallery images" ON gallery_images
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM memberships m
            JOIN organizations o ON o.id = m.org_id
            WHERE m.user_id = auth.uid()
            AND o.type = 'client'
        )
    );

-- ============================================================================
-- Page Sections RLS Policies Update
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Clients can view their own page sections" ON page_sections;
DROP POLICY IF EXISTS "Clients can insert their own page sections" ON page_sections;
DROP POLICY IF EXISTS "Clients can update their own page sections" ON page_sections;
DROP POLICY IF EXISTS "Clients can delete their own page sections" ON page_sections;
DROP POLICY IF EXISTS "Authenticated users can view all page sections" ON page_sections;

-- Create new organization-based policies
CREATE POLICY "Organization members can view page sections" ON page_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = page_sections.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
        )
    );

CREATE POLICY "Organization members can insert page sections" ON page_sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = page_sections.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can update page sections" ON page_sections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = page_sections.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can delete page sections" ON page_sections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = page_sections.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- Agency users can view all page sections
CREATE POLICY "Agency users can view all page sections" ON page_sections
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM memberships m
            JOIN organizations o ON o.id = m.org_id
            WHERE m.user_id = auth.uid()
            AND o.type = 'client'
        )
    );

