-- ============================================================================
-- Preview Tokens Table
-- Enables preview functionality for draft content on the public site
-- ============================================================================

CREATE TABLE IF NOT EXISTS preview_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    section_id UUID REFERENCES page_sections_v2(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_preview_tokens_id ON preview_tokens(id);
CREATE INDEX IF NOT EXISTS idx_preview_tokens_org_id ON preview_tokens(org_id);
CREATE INDEX IF NOT EXISTS idx_preview_tokens_page_id ON preview_tokens(page_id);
CREATE INDEX IF NOT EXISTS idx_preview_tokens_section_id ON preview_tokens(section_id);
CREATE INDEX IF NOT EXISTS idx_preview_tokens_expires_at ON preview_tokens(expires_at);

-- Create index for token validation lookups
CREATE INDEX IF NOT EXISTS idx_preview_tokens_lookup ON preview_tokens(id, org_id, expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE preview_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preview_tokens
-- Members can view preview tokens for their organizations
CREATE POLICY "Members can view their organization preview tokens" ON preview_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = preview_tokens.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Members can create preview tokens for their organizations
CREATE POLICY "Members can create preview tokens for their organizations" ON preview_tokens
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = preview_tokens.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Public read access for token validation (for public site preview)
-- This allows the public site to validate preview tokens
-- Only valid (not expired) tokens are accessible
CREATE POLICY "Public can validate preview tokens" ON preview_tokens
    FOR SELECT USING (
        expires_at > NOW()
    );

-- Add comments
COMMENT ON TABLE preview_tokens IS 'Tokens for previewing draft content on the public site';
COMMENT ON COLUMN preview_tokens.page_id IS 'Page being previewed (nullable if previewing entire page)';
COMMENT ON COLUMN preview_tokens.section_id IS 'Section being previewed (nullable if previewing entire page)';
COMMENT ON COLUMN preview_tokens.expires_at IS 'Token expiration timestamp';

