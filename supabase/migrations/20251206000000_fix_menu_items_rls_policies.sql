-- ============================================================================
-- Fix Menu Items RLS Policies
-- Updates RLS policies to check organization membership via menus.business_id
-- Replaces permissive policies with proper organization-based access control
-- ============================================================================

-- ============================================================================
-- Step 1: Drop old permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON menu_items;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON menu_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON menu_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON menu_items;

-- Also drop any other old policies that might exist
DROP POLICY IF EXISTS "Organization members can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Organization members can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Organization members can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Organization members can delete menu items" ON menu_items;
DROP POLICY IF EXISTS "Agency users can view all menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can view their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can insert their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can update their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can delete their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can view all menu items" ON menu_items;

-- ============================================================================
-- Step 2: Create new organization-based RLS policies
-- These policies check membership via: menu_items.menu_id → menus.business_id → memberships.org_id
-- ============================================================================

-- SELECT policy: Users can view menu items if they have membership in the organization that owns the menu
CREATE POLICY "Organization members can view menu items" ON menu_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.business_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
        )
    );

-- INSERT policy: Users can insert menu items if they have appropriate membership role
CREATE POLICY "Organization members can insert menu items" ON menu_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.business_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- UPDATE policy: Users can update menu items if they have appropriate membership role
CREATE POLICY "Organization members can update menu items" ON menu_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.business_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- DELETE policy: Users can delete menu items if they have appropriate membership role
CREATE POLICY "Organization members can delete menu items" ON menu_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.business_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

