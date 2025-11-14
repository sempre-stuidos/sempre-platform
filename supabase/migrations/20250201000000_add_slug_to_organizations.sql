-- ============================================================================
-- Add slug column to organizations table
-- This enables public site routing by organization slug
-- ============================================================================

-- Add slug column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug for public site lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug) 
WHERE slug IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug_lookup ON organizations(slug);

-- Add comment
COMMENT ON COLUMN organizations.slug IS 'URL-friendly identifier for public site routing (e.g., "johnny-gs", "maria-bistro")';

