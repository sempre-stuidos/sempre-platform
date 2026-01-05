-- ============================================================================
-- Add is_bestseller column to retail_products_table
-- Allows products to be marked as bestsellers for featured display
-- ============================================================================

-- Add is_bestseller column (BOOLEAN, defaults to false)
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;

-- Create index for query performance (filtering bestsellers)
CREATE INDEX IF NOT EXISTS idx_retail_products_is_bestseller ON retail_products_table(is_bestseller);

-- Add comment
COMMENT ON COLUMN retail_products_table.is_bestseller IS 'Indicates if this product is marked as a bestseller. Bestseller products are prioritized in featured product displays.';

