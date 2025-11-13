-- ============================================================================
-- Reservations Table
-- Creates table for restaurant reservations with RLS policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'cancelled', 'completed')),
    special_requests TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_org_id ON reservations(org_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_email ON reservations(customer_email);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_reservations_updated_at 
    BEFORE UPDATE ON reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Restaurant members (organization members) can view reservations for their organization
CREATE POLICY "Organization members can view reservations" ON reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = reservations.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Restaurant members can insert reservations for their organization
CREATE POLICY "Organization members can insert reservations" ON reservations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = reservations.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Restaurant members can update reservations for their organization
CREATE POLICY "Organization members can update reservations" ON reservations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = reservations.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Restaurant members can delete reservations for their organization
CREATE POLICY "Organization members can delete reservations" ON reservations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = reservations.org_id
            AND m.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Insert Dummy Data
-- ============================================================================

-- Get a sample organization and client for dummy data
DO $$
DECLARE
    sample_org_id UUID;
    sample_client_id BIGINT;
    reservation_date DATE;
    reservation_time TIME;
    i INTEGER;
    statuses TEXT[] := ARRAY['pending', 'approved', 'completed', 'cancelled'];
    customer_names TEXT[] := ARRAY[
        'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 
        'David Wilson', 'Jessica Martinez', 'Christopher Anderson', 'Amanda Taylor',
        'Matthew Thomas', 'Lauren Jackson', 'Daniel White', 'Rachel Harris',
        'James Martin', 'Nicole Thompson', 'Robert Garcia'
    ];
    customer_emails TEXT[] := ARRAY[
        'john.smith@email.com', 'sarah.j@email.com', 'michael.b@email.com', 'emily.d@email.com',
        'david.w@email.com', 'jessica.m@email.com', 'chris.a@email.com', 'amanda.t@email.com',
        'matthew.t@email.com', 'lauren.j@email.com', 'daniel.w@email.com', 'rachel.h@email.com',
        'james.m@email.com', 'nicole.t@email.com', 'robert.g@email.com'
    ];
    customer_phones TEXT[] := ARRAY[
        '555-0101', '555-0102', '555-0103', '555-0104', '555-0105',
        '555-0106', '555-0107', '555-0108', '555-0109', '555-0110',
        '555-0111', '555-0112', '555-0113', '555-0114', '555-0115'
    ];
    times TIME[] := ARRAY[
        '18:00:00', '18:30:00', '19:00:00', '19:30:00', '20:00:00',
        '20:30:00', '21:00:00', '17:30:00', '17:00:00'
    ];
    current_status TEXT;
BEGIN
    -- Get first organization (if exists)
    SELECT id INTO sample_org_id FROM organizations LIMIT 1;
    
    -- Get first client (if exists)
    SELECT id INTO sample_client_id FROM clients LIMIT 1;
    
    -- Only insert dummy data if we have an organization
    IF sample_org_id IS NOT NULL THEN
        -- Insert 15 dummy reservations
        FOR i IN 1..15 LOOP
            -- Mix of upcoming and past dates
            IF i <= 8 THEN
                -- Upcoming reservations (next 7 days)
                reservation_date := CURRENT_DATE + (i - 1);
            ELSE
                -- Past reservations (last 7 days)
                reservation_date := CURRENT_DATE - (i - 7);
            END IF;
            
            -- Random time from the times array
            reservation_time := times[1 + floor(random() * array_length(times, 1))::int];
            
            -- Random status
            current_status := statuses[1 + floor(random() * array_length(statuses, 1))::int];
            
            -- Insert reservation
            INSERT INTO reservations (
                client_id,
                org_id,
                customer_name,
                customer_email,
                customer_phone,
                reservation_date,
                reservation_time,
                party_size,
                status,
                special_requests,
                approved_by,
                approved_at
            ) VALUES (
                sample_client_id,
                sample_org_id,
                customer_names[i],
                customer_emails[i],
                customer_phones[i],
                reservation_date,
                reservation_time,
                2 + floor(random() * 6)::int, -- Party size between 2 and 7
                current_status,
                CASE WHEN random() > 0.7 THEN 'Window seat preferred' 
                     WHEN random() > 0.4 THEN 'Birthday celebration' 
                     ELSE NULL END,
                CASE WHEN current_status IN ('approved', 'completed') THEN 'Restaurant Staff' ELSE NULL END,
                CASE WHEN current_status IN ('approved', 'completed') THEN NOW() - (random() * interval '5 days') ELSE NULL END
            );
        END LOOP;
    END IF;
END $$;

