-- ============================================================================
-- Add benefits to retail_products_table
-- Adds support for storing product benefits/features as an array
-- ============================================================================

-- Add benefits column (nullable TEXT array)
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS benefits TEXT[];

-- Add comment
COMMENT ON COLUMN retail_products_table.benefits IS 'Array of product benefits/features displayed on product pages. Each element is a string describing a benefit or feature.';
