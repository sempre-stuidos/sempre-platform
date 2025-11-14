-- ============================================================================
-- Pages Table
-- Represents logical pages in the restaurant site (e.g., "Home Page", "Menu Page")
-- ============================================================================

CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    template TEXT,
    status TEXT NOT NULL CHECK (status IN ('published', 'dirty', 'draft')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(org_id, slug)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pages_org_id ON pages(org_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_org_slug ON pages(org_id, slug);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pages
-- Members can view pages in their organizations
CREATE POLICY "Members can view their organization pages" ON pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Members can insert pages in their organizations
CREATE POLICY "Members can create pages in their organizations" ON pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Members can update pages in their organizations
CREATE POLICY "Members can update their organization pages" ON pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Members can delete pages in their organizations
CREATE POLICY "Members can delete their organization pages" ON pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = pages.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Public read access for published pages (for public site)
-- This allows the public restaurant site to read published pages
CREATE POLICY "Public can view published pages" ON pages
    FOR SELECT USING (status = 'published');

-- Add comments
COMMENT ON TABLE pages IS 'Logical pages in the restaurant site (e.g., Home Page, Menu Page)';
COMMENT ON COLUMN pages.slug IS 'URL-friendly identifier (e.g., "home", "menu", "contact")';
COMMENT ON COLUMN pages.template IS 'Template identifier (e.g., "default_home", "menu_layout")';
COMMENT ON COLUMN pages.status IS 'Page status: published (all sections published), dirty (has unpublished changes), draft (not ready)';

