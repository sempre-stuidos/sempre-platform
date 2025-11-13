-- ============================================================================
-- Make menu_id required and client_id optional for menu_items
-- ============================================================================

-- Step 1: Ensure all existing menu items have a menu_id by linking them to default menus
DO $$
DECLARE
    item_record RECORD;
    menu_record RECORD;
BEGIN
    -- For items that don't have a menu_id, find or create a menu for their client's organization
    FOR item_record IN
        SELECT mi.id, mi.client_id, c.organization_id
        FROM menu_items mi
        JOIN clients c ON c.id = mi.client_id
        WHERE mi.menu_id IS NULL
        AND c.organization_id IS NOT NULL
    LOOP
        -- Find or create a default menu for this organization
        SELECT id INTO menu_record
        FROM menus
        WHERE organization_id = item_record.organization_id
        AND name = 'Main Menu'
        LIMIT 1;

        IF menu_record IS NULL THEN
            -- Create a default menu
            INSERT INTO menus (organization_id, name, description, is_active)
            VALUES (item_record.organization_id, 'Main Menu', 'Default menu', true)
            RETURNING id INTO menu_record;
        END IF;

        -- Update the item to link to the menu
        UPDATE menu_items
        SET menu_id = menu_record.id
        WHERE id = item_record.id;
    END LOOP;
END $$;

-- Step 2: Make menu_id NOT NULL
ALTER TABLE menu_items
    ALTER COLUMN menu_id SET NOT NULL;

-- Step 3: Make client_id nullable (for backward compatibility, but not required)
ALTER TABLE menu_items
    ALTER COLUMN client_id DROP NOT NULL;

-- Step 4: Update RLS policies to use menu_id instead of client_id
DROP POLICY IF EXISTS "Organization members can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Organization members can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Organization members can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Organization members can delete menu items" ON menu_items;
DROP POLICY IF EXISTS "Agency users can view all menu items" ON menu_items;

-- New policies based on menu_id
CREATE POLICY "Organization members can view menu items" ON menu_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can insert menu items" ON menu_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can update menu items" ON menu_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can delete menu items" ON menu_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_items.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

