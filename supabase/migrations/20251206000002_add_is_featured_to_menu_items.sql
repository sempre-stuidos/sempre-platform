-- ============================================================================
-- Add is_featured column to menu_items table
-- This column was missing from the live database
-- ============================================================================

ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for is_featured
CREATE INDEX IF NOT EXISTS idx_menu_items_is_featured ON menu_items(is_featured);

