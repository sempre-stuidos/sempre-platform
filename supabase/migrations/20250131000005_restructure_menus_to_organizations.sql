-- ============================================================================
-- Restructure Menus to Organizations
-- Changes from: Organizations -> Clients -> Categories -> Items
-- To: Organizations -> Menus -> Categories -> Items
-- ============================================================================

-- ============================================================================
-- Step 1: Create menus table
-- ============================================================================

CREATE TABLE IF NOT EXISTS menus (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menus_organization_id ON menus(organization_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON menus(is_active);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_menus_updated_at 
    BEFORE UPDATE ON menus 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for menus
CREATE POLICY "Organization members can view menus" ON menus
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = menus.organization_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can insert menus" ON menus
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = menus.organization_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can update menus" ON menus
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = menus.organization_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can delete menus" ON menus
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = menus.organization_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- ============================================================================
-- Step 2: Add menu_id to menu_categories and migrate data
-- ============================================================================

-- Add menu_id column to menu_categories
ALTER TABLE menu_categories
    ADD COLUMN IF NOT EXISTS menu_id BIGINT REFERENCES menus(id) ON DELETE CASCADE;

-- Create index for menu_id
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON menu_categories(menu_id);

-- Migrate existing data: Create menus for each organization and link categories
DO $$
DECLARE
    org_record RECORD;
    menu_record RECORD;
    new_menu_id BIGINT;
    category_record RECORD;
BEGIN
    -- Loop through organizations that have clients with menu categories
    FOR org_record IN 
        SELECT DISTINCT c.organization_id
        FROM clients c
        JOIN menu_categories mc ON mc.client_id = c.id
        WHERE c.organization_id IS NOT NULL
    LOOP
        -- Create a default menu for this organization if it doesn't exist
        SELECT id INTO new_menu_id
        FROM menus
        WHERE organization_id = org_record.organization_id
        LIMIT 1;

        IF new_menu_id IS NULL THEN
            INSERT INTO menus (organization_id, name, description, is_active)
            VALUES (
                org_record.organization_id,
                'Main Menu',
                'Default menu for organization',
                true
            )
            RETURNING id INTO new_menu_id;
        END IF;

        -- Update all categories for clients in this organization to use the menu
        UPDATE menu_categories
        SET menu_id = new_menu_id
        WHERE menu_id IS NULL
        AND client_id IN (
            SELECT id FROM clients WHERE organization_id = org_record.organization_id
        );
    END LOOP;
END $$;

-- ============================================================================
-- Step 3: Add menu_id to menu_items and migrate data
-- ============================================================================

-- Add menu_id column to menu_items
ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS menu_id BIGINT REFERENCES menus(id) ON DELETE CASCADE;

-- Create index for menu_id
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);

-- Migrate existing data: Link menu items to menus via their categories
UPDATE menu_items mi
SET menu_id = (
    SELECT mc.menu_id
    FROM menu_categories mc
    WHERE mc.id = mi.menu_category_id
    LIMIT 1
)
WHERE mi.menu_id IS NULL
AND mi.menu_category_id IS NOT NULL;

-- For items without categories, link them to the menu of their client's organization
UPDATE menu_items mi
SET menu_id = (
    SELECT m.id
    FROM menus m
    JOIN clients c ON c.organization_id = m.organization_id
    WHERE c.id = mi.client_id
    LIMIT 1
)
WHERE mi.menu_id IS NULL;

-- ============================================================================
-- Step 4: Update RLS policies for menu_categories to use menus
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Organization members can view menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Organization members can insert menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Organization members can update menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Organization members can delete menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Agency users can view all menu categories" ON menu_categories;

-- Create new policies based on menus
CREATE POLICY "Organization members can view menu categories" ON menu_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_categories.menu_id
            AND mem.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can insert menu categories" ON menu_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_categories.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can update menu categories" ON menu_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_categories.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can delete menu categories" ON menu_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM menus m
            JOIN memberships mem ON mem.org_id = m.organization_id
            WHERE m.id = menu_categories.menu_id
            AND mem.user_id = auth.uid()
            AND mem.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- ============================================================================
-- Step 5: Update RLS policies for menu_items to use menus
-- ============================================================================

-- Drop old policies (keep the ones that might still be needed)
DROP POLICY IF EXISTS "Clients can view their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can insert their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can update their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Clients can delete their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can view all menu items" ON menu_items;

-- Create new policies based on menus
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

-- Note: We keep client_id columns for backward compatibility during transition
-- They can be removed in a future migration if needed

