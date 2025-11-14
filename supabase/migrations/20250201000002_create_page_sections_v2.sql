-- ============================================================================
-- Page Sections Table (v2)
-- Each row represents a block/section inside a page (hero, hours bar, promo card, etc.)
-- Supports draft/published content workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS page_sections_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    component TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    published_content JSONB DEFAULT '{}'::jsonb,
    draft_content JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('published', 'dirty', 'draft')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(page_id, key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_page_sections_v2_page_id ON page_sections_v2(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_v2_org_id ON page_sections_v2(org_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_v2_position ON page_sections_v2(page_id, position);
CREATE INDEX IF NOT EXISTS idx_page_sections_v2_status ON page_sections_v2(status);
CREATE INDEX IF NOT EXISTS idx_page_sections_v2_component ON page_sections_v2(component);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_page_sections_v2_updated_at 
    BEFORE UPDATE ON page_sections_v2 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE page_sections_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_sections_v2
-- Members can view sections in their organization pages
CREATE POLICY "Members can view their organization page sections" ON page_sections_v2
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Members can insert sections in their organization pages
CREATE POLICY "Members can create sections in their organization pages" ON page_sections_v2
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Members can update sections in their organization pages
CREATE POLICY "Members can update their organization page sections" ON page_sections_v2
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Members can delete sections in their organization pages
CREATE POLICY "Members can delete their organization page sections" ON page_sections_v2
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = page_sections_v2.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Public read access for published sections (for public site)
-- This allows the public restaurant site to read published sections
CREATE POLICY "Public can view published page sections" ON page_sections_v2
    FOR SELECT USING (status = 'published');

-- Add comments
COMMENT ON TABLE page_sections_v2 IS 'Sections/blocks within pages (hero, promo cards, etc.) with draft/published workflow';
COMMENT ON COLUMN page_sections_v2.key IS 'Internal stable key (e.g., "hero_welcome", "breakfast_promo")';
COMMENT ON COLUMN page_sections_v2.label IS 'Human-readable name (e.g., "Hero – Welcome to Restaurant")';
COMMENT ON COLUMN page_sections_v2.component IS 'Front-end component type (e.g., "HeroWelcome", "PromoCard", "InfoBar")';
COMMENT ON COLUMN page_sections_v2.position IS 'Sort order within the page';
COMMENT ON COLUMN page_sections_v2.published_content IS 'Live version of content (JSONB)';
COMMENT ON COLUMN page_sections_v2.draft_content IS 'Editing version of content (JSONB)';
COMMENT ON COLUMN page_sections_v2.status IS 'Section status: published (matches published_content), dirty (draft differs from published), draft (not ready)';

