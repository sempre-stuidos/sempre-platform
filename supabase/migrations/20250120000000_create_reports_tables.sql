-- ============================================================================
-- Reports Tables
-- Creates tables for client reports and report settings
-- ============================================================================

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Analytics', 'Performance', 'Summary', 'Custom')),
    status TEXT NOT NULL CHECK (status IN ('Generated', 'Pending', 'Failed')) DEFAULT 'Pending',
    file_url TEXT,
    file_format TEXT CHECK (file_format IN ('PDF', 'HTML', 'JSON')),
    generated_at TIMESTAMPTZ,
    period_start DATE,
    period_end DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Report settings table
CREATE TABLE IF NOT EXISTS report_settings (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID UNIQUE NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Never')) DEFAULT 'Monthly',
    email_enabled BOOLEAN DEFAULT false,
    email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
    include_analytics BOOLEAN DEFAULT true,
    include_reservations BOOLEAN DEFAULT true,
    include_menu_stats BOOLEAN DEFAULT true,
    include_gallery_stats BOOLEAN DEFAULT true,
    include_performance BOOLEAN DEFAULT true,
    include_events BOOLEAN DEFAULT false,
    include_custom_sections BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_organization_id ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_report_settings_organization_id ON report_settings(organization_id);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_settings_updated_at 
    BEFORE UPDATE ON report_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after memberships table is created
-- This is handled in the organizations migration

