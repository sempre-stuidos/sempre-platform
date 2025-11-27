-- Create products table for retail businesses
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    sku TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON products
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON products
    FOR DELETE USING (true);

COMMENT ON TABLE products IS 'Products table for retail businesses';
COMMENT ON COLUMN products.org_id IS 'Organization ID that owns this product';
COMMENT ON COLUMN products.status IS 'Product status: active, out of stock, or closed for sale';

