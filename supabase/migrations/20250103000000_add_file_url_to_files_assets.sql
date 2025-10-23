-- Add file_url column to files_assets table
ALTER TABLE files_assets ADD COLUMN file_url TEXT;

-- Create index for better performance on file_url lookups
CREATE INDEX idx_files_assets_file_url ON files_assets(file_url);

-- Add comment to document the column
COMMENT ON COLUMN files_assets.file_url IS 'Storage path/URL for the file in Supabase storage bucket';

