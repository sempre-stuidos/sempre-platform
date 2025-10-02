-- Create files_assets table
CREATE TABLE files_assets (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Logo', 'Document', 'Mockup', 'Content', 'Images', 'Wireframe', 'Prototype', 'Templates', 'Video', 'Design System', 'Icons', 'Presentation', 'Template')),
    category TEXT NOT NULL CHECK (category IN ('Client Assets', 'Project Assets')),
    project TEXT NOT NULL,
    size TEXT NOT NULL,
    format TEXT NOT NULL,
    uploaded DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Review', 'Draft', 'Processing', 'Archive')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_files_assets_type ON files_assets(type);
CREATE INDEX idx_files_assets_category ON files_assets(category);
CREATE INDEX idx_files_assets_project ON files_assets(project);
CREATE INDEX idx_files_assets_format ON files_assets(format);
CREATE INDEX idx_files_assets_status ON files_assets(status);
CREATE INDEX idx_files_assets_uploaded ON files_assets(uploaded);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_files_assets_updated_at 
    BEFORE UPDATE ON files_assets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE files_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allowing all operations for authenticated users)
CREATE POLICY "Enable read access for all users" ON files_assets FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON files_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON files_assets FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON files_assets FOR DELETE USING (true);
