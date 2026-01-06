-- ============================================================================
-- Create analytics table for tracking website visits
-- Tracks daily visit counts per business for dashboard analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_count INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure unique record per business per day
    UNIQUE(business_id, visit_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_business_id ON analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visit_date ON analytics(visit_date);
CREATE INDEX IF NOT EXISTS idx_analytics_business_date ON analytics(business_id, visit_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_updated_at
    BEFORE UPDATE ON analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_updated_at();

-- Enable Row Level Security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can insert analytics (for tracking from welcome page)
-- This allows anonymous users to track visits
CREATE POLICY "Public can insert analytics" ON analytics
    FOR INSERT WITH CHECK (true);

-- Business members can read analytics for their own business
CREATE POLICY "Business members can read their analytics" ON analytics
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE id = analytics.business_id
            AND EXISTS (
                SELECT 1 FROM memberships m
                WHERE m.org_id = analytics.business_id
                AND m.user_id = auth.uid()
            )
        )
    );

-- Add comments for documentation
COMMENT ON TABLE analytics IS 'Website visit analytics table tracking daily visit counts per business';
COMMENT ON COLUMN analytics.business_id IS 'Business ID that owns this analytics record';
COMMENT ON COLUMN analytics.visit_date IS 'Date of the visit (DATE type for daily aggregation)';
COMMENT ON COLUMN analytics.visit_count IS 'Number of visits on this date (incremented for multiple visits per day)';

