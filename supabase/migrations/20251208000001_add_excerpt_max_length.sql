-- ============================================================================
-- Add max length constraint to blogs.excerpt field
-- Limits excerpt to 80 characters (matching example length)
-- ============================================================================

-- First, truncate existing excerpts that are too long
UPDATE blogs
SET excerpt = LEFT(excerpt, 80)
WHERE excerpt IS NOT NULL AND LENGTH(excerpt) > 80;

-- Add CHECK constraint to limit excerpt length
ALTER TABLE blogs
ADD CONSTRAINT blogs_excerpt_max_length 
CHECK (excerpt IS NULL OR LENGTH(excerpt) <= 80);

COMMENT ON CONSTRAINT blogs_excerpt_max_length ON blogs IS 'Excerpt must be 80 characters or less';

