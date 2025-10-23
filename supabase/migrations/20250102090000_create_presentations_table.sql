-- Create presentations table
CREATE TABLE presentations (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    client_id BIGINT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Proposal', 'Onboarding', 'Progress Update', 'Report', 'Case Study')),
    created_date DATE NOT NULL,
    owner_id BIGINT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Sent', 'Approved', 'Archived')),
    link TEXT NOT NULL,
    description TEXT,
    last_modified DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_presentations_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_presentations_owner_id FOREIGN KEY (owner_id) REFERENCES team_members(id) ON DELETE CASCADE
);

-- Create indexes for faster filtering
CREATE INDEX idx_presentations_client_id ON presentations(client_id);
CREATE INDEX idx_presentations_owner_id ON presentations(owner_id);
CREATE INDEX idx_presentations_type ON presentations(type);
CREATE INDEX idx_presentations_status ON presentations(status);
CREATE INDEX idx_presentations_created_date ON presentations(created_date);

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_presentations_updated_at 
    BEFORE UPDATE ON presentations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all users" ON presentations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON presentations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON presentations FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON presentations FOR DELETE USING (true);
