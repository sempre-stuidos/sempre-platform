-- ============================================================================
-- Make menu_id required and client_id optional for menu_categories
-- ============================================================================

-- Step 1: Make menu_id NOT NULL (after ensuring all existing records have menu_id)
-- First, ensure all existing categories have a menu_id by linking them to default menus
DO $$
DECLARE
    category_record RECORD;
    menu_record RECORD;
BEGIN
    -- For categories that don't have a menu_id, find or create a menu for their client's organization
    FOR category_record IN
        SELECT mc.id, mc.client_id, c.organization_id
        FROM menu_categories mc
        JOIN clients c ON c.id = mc.client_id
        WHERE mc.menu_id IS NULL
        AND c.organization_id IS NOT NULL
    LOOP
        -- Find or create a default menu for this organization
        SELECT id INTO menu_record
        FROM menus
        WHERE organization_id = category_record.organization_id
        AND name = 'Main Menu'
        LIMIT 1;

        IF menu_record IS NULL THEN
            -- Create a default menu
            INSERT INTO menus (organization_id, name, description, is_active)
            VALUES (category_record.organization_id, 'Main Menu', 'Default menu', true)
            RETURNING id INTO menu_record;
        END IF;

        -- Update the category to link to the menu
        UPDATE menu_categories
        SET menu_id = menu_record.id
        WHERE id = category_record.id;
    END LOOP;
END $$;

-- Step 2: Make menu_id NOT NULL
ALTER TABLE menu_categories
    ALTER COLUMN menu_id SET NOT NULL;

-- Step 3: Make client_id nullable (for backward compatibility, but not required)
ALTER TABLE menu_categories
    ALTER COLUMN client_id DROP NOT NULL;

-- Step 4: Update the foreign key constraint to allow NULL client_id
-- (The existing constraint should already allow this, but we'll verify)
-- Note: We keep the foreign key for backward compatibility, but it's now optional

