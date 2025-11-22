-- ============================================================================
-- Add base_url field to pages table
-- Allows each page to have its own custom base URL for previews and links
-- ============================================================================

ALTER TABLE pages
ADD COLUMN IF NOT EXISTS base_url TEXT;

-- Add comment
COMMENT ON COLUMN pages.base_url IS 'Custom base URL for this page (used for previews and public links). If not set, falls back to NEXT_PUBLIC_RESTAURANT_SITE_URL.';

-- Create index for base_url lookups (optional, but useful if we query by base_url)
CREATE INDEX IF NOT EXISTS idx_pages_base_url ON pages(base_url) WHERE base_url IS NOT NULL;

