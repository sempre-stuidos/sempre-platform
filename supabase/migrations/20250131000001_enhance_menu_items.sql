-- ============================================================================
-- Enhance Menu Items Table
-- Adds new fields for menu management: menu_category_id, menu_type, price_cents,
-- is_visible, is_featured, position, is_archived, archived_at
-- ============================================================================

-- Add new columns to menu_items
ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS menu_category_id BIGINT REFERENCES menu_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS menu_type TEXT, -- e.g., 'brunch', 'dinner', 'lunch'
    ADD COLUMN IF NOT EXISTS price_cents INTEGER, -- Store price as cents (integer)
    ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_category_id ON menu_items(menu_category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_type ON menu_items(menu_type);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_visible ON menu_items(is_visible);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_archived ON menu_items(is_archived);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_featured ON menu_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_items_position ON menu_items(position);

-- Migrate existing price data to price_cents
-- Convert NUMERIC(10,2) price to INTEGER cents
UPDATE menu_items
SET price_cents = ROUND(COALESCE(price, 0) * 100)::INTEGER
WHERE price_cents IS NULL AND price IS NOT NULL;

-- Create a default "Uncategorized" category for each client that has menu items
-- and assign existing items to it
DO $$
DECLARE
    client_record RECORD;
    default_category_id BIGINT;
BEGIN
    FOR client_record IN 
        SELECT DISTINCT client_id FROM menu_items WHERE menu_category_id IS NULL
    LOOP
        -- Check if default category already exists
        SELECT id INTO default_category_id
        FROM menu_categories
        WHERE client_id = client_record.client_id
        AND name = 'Uncategorized'
        AND menu_type IS NULL
        LIMIT 1;

        -- Create default category if it doesn't exist
        IF default_category_id IS NULL THEN
            INSERT INTO menu_categories (client_id, name, slug, sort_order, is_active)
            VALUES (
                client_record.client_id,
                'Uncategorized',
                'uncategorized',
                0,
                true
            )
            RETURNING id INTO default_category_id;
        END IF;

        -- Assign existing items to default category
        UPDATE menu_items
        SET menu_category_id = default_category_id
        WHERE client_id = client_record.client_id
        AND menu_category_id IS NULL;
    END LOOP;
END $$;

-- Note: We keep the old 'price' column for backward compatibility during migration
-- It can be removed in a future migration if needed

