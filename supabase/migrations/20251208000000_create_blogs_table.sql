-- ============================================================================
-- Create blogs table for retail businesses
-- Allows retail business users to create, edit, and publish blog posts
-- ============================================================================

CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    author TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    read_time TEXT,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure unique slug per business
    UNIQUE(business_id, slug)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blogs_business_id ON blogs(business_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at);
CREATE INDEX IF NOT EXISTS idx_blogs_business_status ON blogs(business_id, status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_blogs_updated_at();

-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read blogs for their own business
CREATE POLICY "Users can read blogs for their business" ON blogs
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = blogs.business_id
        )
    );

-- Users can insert blogs for their own business
CREATE POLICY "Users can insert blogs for their business" ON blogs
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE id = blogs.business_id
        )
    );

-- Users can update blogs for their own business
CREATE POLICY "Users can update blogs for their business" ON blogs
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = blogs.business_id
        )
    );

-- Users can delete blogs for their own business
CREATE POLICY "Users can delete blogs for their business" ON blogs
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = blogs.business_id
        )
    );

-- Public can read published blogs (for landing page - will use admin client to bypass RLS)
-- This policy allows public read access to published blogs
CREATE POLICY "Public can read published blogs" ON blogs
    FOR SELECT USING (status = 'published');

COMMENT ON TABLE blogs IS 'Blog posts table for retail businesses';
COMMENT ON COLUMN blogs.business_id IS 'Business ID that owns this blog post';
COMMENT ON COLUMN blogs.status IS 'Blog status: draft, published, or archived';
COMMENT ON COLUMN blogs.slug IS 'URL-friendly slug, unique per business';
COMMENT ON COLUMN blogs.published_at IS 'Timestamp when blog was published';
COMMENT ON COLUMN blogs.read_time IS 'Estimated reading time (e.g., "5 min read")';

