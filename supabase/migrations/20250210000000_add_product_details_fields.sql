-- ============================================================================
-- Add product details fields to retail_products_table
-- Adds support for all fields needed by the product details page
-- ============================================================================

-- Add original_price column (nullable DECIMAL for showing discounted prices)
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- Add ingredients column (nullable TEXT array)
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS ingredients TEXT[];

-- Add how_to_use column (nullable TEXT for usage instructions)
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS how_to_use TEXT;

-- Add sizes column (nullable TEXT array for available product sizes)
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS sizes TEXT[];

-- Add badges column (nullable TEXT array for product badges like "Vegan", "Cruelty-Free")
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS badges TEXT[];

-- Add review_count column (nullable INTEGER for number of reviews)
ALTER TABLE retail_products_table 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN retail_products_table.original_price IS 'Original price before discount. Used to show sale prices on product pages.';
COMMENT ON COLUMN retail_products_table.ingredients IS 'Array of ingredient names displayed in the ingredients tab on product pages.';
COMMENT ON COLUMN retail_products_table.how_to_use IS 'Usage instructions displayed in the "How to Use" tab on product pages.';
COMMENT ON COLUMN retail_products_table.sizes IS 'Array of available product sizes (e.g., ["30ml", "60ml", "100ml"]).';
COMMENT ON COLUMN retail_products_table.badges IS 'Array of product badges/attributes (e.g., ["Vegan", "Cruelty-Free", "Made in Canada"]).';
COMMENT ON COLUMN retail_products_table.review_count IS 'Number of reviews for this product. Used for displaying review counts on product pages.';

