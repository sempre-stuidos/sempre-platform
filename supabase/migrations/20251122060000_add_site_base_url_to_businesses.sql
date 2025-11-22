-- ============================================================================
-- Add site_base_url field to businesses table
-- Allows each business to have its own custom base URL for site previews and links
-- ============================================================================

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS site_base_url TEXT;

-- Add comment
COMMENT ON COLUMN businesses.site_base_url IS 'Custom base URL for this business site (used for previews and public links). If not set, falls back to NEXT_PUBLIC_RESTAURANT_SITE_URL.';

-- Create index for site_base_url lookups (optional, but useful if we query by site_base_url)
CREATE INDEX IF NOT EXISTS idx_businesses_site_base_url ON businesses(site_base_url) WHERE site_base_url IS NOT NULL;

