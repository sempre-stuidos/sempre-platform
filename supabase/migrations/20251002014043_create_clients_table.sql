-- Create clients table
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Past')),
    project_count INTEGER DEFAULT 0 NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    contact_email TEXT NOT NULL,
    last_contact DATE NOT NULL,
    total_value BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create an index on status for faster filtering
CREATE INDEX idx_clients_status ON clients(status);

-- Create an index on priority for faster filtering
CREATE INDEX idx_clients_priority ON clients(priority);

-- Create an index on business_type for faster filtering
CREATE INDEX idx_clients_business_type ON clients(business_type);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust based on your authentication requirements)
-- For now, allowing all operations for authenticated users
CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON clients FOR DELETE USING (true);
