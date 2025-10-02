-- Create agency_toolkit table
CREATE TABLE agency_toolkit (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    category TEXT NOT NULL CHECK (category IN ('Design', 'Hosting', 'AI', 'Marketing', 'Productivity')),
    plan_type TEXT NOT NULL,
    seats INTEGER DEFAULT 1,
    renewal_cycle TEXT NOT NULL CHECK (renewal_cycle IN ('Monthly', 'Yearly')),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    next_billing_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Trial', 'Canceled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create agency_toolkit_invoices table
CREATE TABLE agency_toolkit_invoices (
    id BIGSERIAL PRIMARY KEY,
    toolkit_id BIGINT REFERENCES agency_toolkit(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create agency_toolkit_cost_history table
CREATE TABLE agency_toolkit_cost_history (
    id BIGSERIAL PRIMARY KEY,
    toolkit_id BIGINT REFERENCES agency_toolkit(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_agency_toolkit_category ON agency_toolkit(category);
CREATE INDEX idx_agency_toolkit_status ON agency_toolkit(status);
CREATE INDEX idx_agency_toolkit_renewal_cycle ON agency_toolkit(renewal_cycle);
CREATE INDEX idx_agency_toolkit_next_billing_date ON agency_toolkit(next_billing_date);
CREATE INDEX idx_agency_toolkit_invoices_toolkit_id ON agency_toolkit_invoices(toolkit_id);
CREATE INDEX idx_agency_toolkit_invoices_date ON agency_toolkit_invoices(date);
CREATE INDEX idx_agency_toolkit_cost_history_toolkit_id ON agency_toolkit_cost_history(toolkit_id);
CREATE INDEX idx_agency_toolkit_cost_history_date ON agency_toolkit_cost_history(date);

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_agency_toolkit_updated_at 
    BEFORE UPDATE ON agency_toolkit 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE agency_toolkit ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_toolkit_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_toolkit_cost_history ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allowing all operations for authenticated users)
CREATE POLICY "Enable read access for all users" ON agency_toolkit FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON agency_toolkit FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON agency_toolkit FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON agency_toolkit FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON agency_toolkit_invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON agency_toolkit_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON agency_toolkit_invoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON agency_toolkit_invoices FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON agency_toolkit_cost_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON agency_toolkit_cost_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON agency_toolkit_cost_history FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON agency_toolkit_cost_history FOR DELETE USING (true);
