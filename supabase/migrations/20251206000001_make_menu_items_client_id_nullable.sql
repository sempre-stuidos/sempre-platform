-- ============================================================================
-- Make client_id nullable in menu_items table
-- Menu items no longer require a client_id since access is controlled via
-- menu_id -> menus.business_id -> memberships.org_id
-- ============================================================================

ALTER TABLE menu_items
    ALTER COLUMN client_id DROP NOT NULL;

