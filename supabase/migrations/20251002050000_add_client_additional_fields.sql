-- Add additional fields to clients table
ALTER TABLE clients 
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT,
ADD COLUMN website TEXT,
ADD COLUMN notes TEXT;

-- Create indexes for better performance
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_website ON clients(website);
