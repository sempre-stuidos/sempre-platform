-- ============================================================================
-- Menu Categories Table
-- Creates table for menu categories with support for menu types (brunch, dinner, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_categories (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    menu_type TEXT, -- e.g., 'brunch', 'dinner', 'lunch' (nullable for backward compatibility)
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_client_id ON menu_categories(client_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_type ON menu_categories(menu_type);
CREATE INDEX IF NOT EXISTS idx_menu_categories_slug ON menu_categories(slug);
CREATE INDEX IF NOT EXISTS idx_menu_categories_is_active ON menu_categories(is_active);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_menu_categories_updated_at 
    BEFORE UPDATE ON menu_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Organization members can view menu categories for their client
CREATE POLICY "Organization members can view menu categories" ON menu_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_categories.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
        )
    );

-- Organization members can insert menu categories
CREATE POLICY "Organization members can insert menu categories" ON menu_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_categories.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- Organization members can update menu categories
CREATE POLICY "Organization members can update menu categories" ON menu_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_categories.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- Organization members can delete menu categories (soft delete via is_active)
CREATE POLICY "Organization members can delete menu categories" ON menu_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN memberships m ON m.org_id = c.organization_id
            WHERE c.id = menu_categories.client_id
            AND m.user_id = auth.uid()
            AND c.organization_id IS NOT NULL
            AND m.role IN ('owner', 'admin', 'staff', 'client')
        )
    );

-- Agency users can view all menu categories
CREATE POLICY "Agency users can view all menu categories" ON menu_categories
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM memberships m
            JOIN organizations o ON o.id = m.org_id
            WHERE m.user_id = auth.uid()
            AND o.type = 'client'
        )
    );

