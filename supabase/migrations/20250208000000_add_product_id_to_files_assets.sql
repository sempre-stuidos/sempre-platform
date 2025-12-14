-- ============================================================================
-- Add product_id to files_assets table
-- Adds support for linking gallery images to retail products
-- ============================================================================

-- Add product_id column (nullable UUID)
ALTER TABLE files_assets 
ADD COLUMN IF NOT EXISTS product_id UUID;

-- Add foreign key constraint referencing retail_products_table
-- Drop constraint if it exists first (for idempotency)
ALTER TABLE files_assets 
DROP CONSTRAINT IF EXISTS files_assets_product_id_fkey;

ALTER TABLE files_assets 
ADD CONSTRAINT files_assets_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES retail_products_table(id) 
ON DELETE SET NULL;

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_files_assets_product_id ON files_assets(product_id);

-- Add comment
COMMENT ON COLUMN files_assets.product_id IS 'Optional reference to retail_products_table. Links gallery images to products for retail businesses.';
