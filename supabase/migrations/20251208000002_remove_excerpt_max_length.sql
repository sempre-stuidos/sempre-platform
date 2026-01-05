-- ============================================================================
-- Remove max length constraint from blogs.excerpt field
-- Allow full length excerpts in database, truncation handled in UI
-- ============================================================================

-- Drop the CHECK constraint if it exists
ALTER TABLE blogs DROP CONSTRAINT IF EXISTS blogs_excerpt_max_length;

