-- ============================================================================
-- Add archived_at column to menu_items table
-- This column was supposed to be added in the enhance_menu_items migration
-- but was missing from the live database
-- ============================================================================

ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

