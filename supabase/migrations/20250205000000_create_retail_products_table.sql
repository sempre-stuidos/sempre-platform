-- Drop existing products table if it exists
DROP TABLE IF EXISTS products CASCADE;

-- Drop the old trigger function if it exists
DROP FUNCTION IF EXISTS update_products_updated_at() CASCADE;

-- Create retail_products_table for retail businesses
CREATE TABLE retail_products_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2),
    sku TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'out of stock', 'closed for sale')) DEFAULT 'active',
    category TEXT,
    stock INTEGER,
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_retail_products_business_id ON retail_products_table(business_id);
CREATE INDEX IF NOT EXISTS idx_retail_products_status ON retail_products_table(status);
CREATE INDEX IF NOT EXISTS idx_retail_products_category ON retail_products_table(category);
CREATE INDEX IF NOT EXISTS idx_retail_products_sku ON retail_products_table(sku);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_retail_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_retail_products_updated_at
    BEFORE UPDATE ON retail_products_table
    FOR EACH ROW
    EXECUTE FUNCTION update_retail_products_updated_at();

-- Enable Row Level Security
ALTER TABLE retail_products_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON retail_products_table
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON retail_products_table
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON retail_products_table
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON retail_products_table
    FOR DELETE USING (true);

COMMENT ON TABLE retail_products_table IS 'Products table for retail businesses';
COMMENT ON COLUMN retail_products_table.business_id IS 'Business ID that owns this product';
COMMENT ON COLUMN retail_products_table.status IS 'Product status: active, out of stock, or closed for sale';

