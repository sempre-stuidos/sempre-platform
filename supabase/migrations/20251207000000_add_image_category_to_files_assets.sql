-- ============================================================================
-- Add image_category to files_assets table
-- Adds support for categorizing gallery images (Event, Menu) for restaurant businesses
-- ============================================================================

-- Add image_category column (nullable TEXT)
ALTER TABLE files_assets 
ADD COLUMN IF NOT EXISTS image_category TEXT;

-- Add CHECK constraint to ensure only valid values
ALTER TABLE files_assets 
DROP CONSTRAINT IF EXISTS files_assets_image_category_check;

ALTER TABLE files_assets 
ADD CONSTRAINT files_assets_image_category_check 
CHECK (image_category IN ('Event', 'Menu') OR image_category IS NULL);

-- Create index for filtering performance
CREATE INDEX IF NOT EXISTS idx_files_assets_image_category ON files_assets(image_category);

-- Add comment
COMMENT ON COLUMN files_assets.image_category IS 'Category for gallery images: Event, Menu, or NULL. Used for restaurant businesses to organize images into folders.';

