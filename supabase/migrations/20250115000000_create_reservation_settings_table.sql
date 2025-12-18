-- ============================================================================
-- Reservation Settings Table
-- Creates table for reservation email recipient settings
-- ============================================================================

-- Reservation settings table
CREATE TABLE IF NOT EXISTS reservation_settings (
    id BIGSERIAL PRIMARY KEY,
    business_id UUID UNIQUE NOT NULL,
    email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_reservation_settings_business_id ON reservation_settings(business_id);

-- Add foreign key constraint
ALTER TABLE reservation_settings 
  ADD CONSTRAINT reservation_settings_business_id_fkey 
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_reservation_settings_updated_at 
    BEFORE UPDATE ON reservation_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE reservation_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Business members can view reservation settings" ON reservation_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.org_id = reservation_settings.business_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Business members can insert reservation settings" ON reservation_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.org_id = reservation_settings.business_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Business members can update reservation settings" ON reservation_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.org_id = reservation_settings.business_id
            AND m.user_id = auth.uid()
        )
    );

