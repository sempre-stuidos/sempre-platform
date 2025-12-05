-- ============================================================================
-- Convert Menu IDs to UUID
-- Changes menus.id, menu_categories.menu_id, and menu_items.menu_id from
-- BIGSERIAL/BIGINT to UUID to match live database schema
-- ============================================================================

-- ============================================================================
-- Step 1: Drop foreign key constraints and indexes
-- ============================================================================

-- Drop foreign key constraints
ALTER TABLE IF EXISTS menu_items 
    DROP CONSTRAINT IF EXISTS menu_items_menu_id_fkey;

ALTER TABLE IF EXISTS menu_categories 
    DROP CONSTRAINT IF EXISTS menu_categories_menu_id_fkey;

-- Drop indexes (will be recreated)
DROP INDEX IF EXISTS idx_menu_items_menu_id;
DROP INDEX IF EXISTS idx_menu_categories_menu_id;
DROP INDEX IF EXISTS idx_menus_organization_id;
DROP INDEX IF EXISTS idx_menus_business_id;
DROP INDEX IF EXISTS idx_menus_is_active;

-- Drop triggers
DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;

-- ============================================================================
-- Step 2: Drop and recreate menus table with UUID id
-- ============================================================================

-- Drop RLS policies first
DROP POLICY IF EXISTS "Organization members can view menus" ON menus;
DROP POLICY IF EXISTS "Organization members can insert menus" ON menus;
DROP POLICY IF EXISTS "Organization members can update menus" ON menus;
DROP POLICY IF EXISTS "Organization members can delete menus" ON menus;

-- Drop the menus table (data will be lost - starting fresh)
DROP TABLE IF EXISTS menus CASCADE;

-- Recreate menus table with UUID id
CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_menus_business_id ON menus(business_id);
CREATE INDEX idx_menus_is_active ON menus(is_active);

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
            WHERE m.org_id = menus.business_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can insert menus" ON menus
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = menus.business_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can update menus" ON menus
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = menus.business_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

CREATE POLICY "Organization members can delete menus" ON menus
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = menus.business_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- ============================================================================
-- Step 3: Update menu_categories.menu_id to UUID
-- ============================================================================

-- Change menu_id column type to UUID
ALTER TABLE menu_categories
    ALTER COLUMN menu_id TYPE UUID USING menu_id::text::UUID;

-- Recreate foreign key constraint
ALTER TABLE menu_categories
    ADD CONSTRAINT menu_categories_menu_id_fkey 
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE;

-- Recreate index
CREATE INDEX idx_menu_categories_menu_id ON menu_categories(menu_id);

-- ============================================================================
-- Step 4: Update menu_items.menu_id to UUID
-- ============================================================================

-- Change menu_id column type to UUID
ALTER TABLE menu_items
    ALTER COLUMN menu_id TYPE UUID USING menu_id::text::UUID;

-- Recreate foreign key constraint
ALTER TABLE menu_items
    ADD CONSTRAINT menu_items_menu_id_fkey 
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE;

-- Recreate index
CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);

