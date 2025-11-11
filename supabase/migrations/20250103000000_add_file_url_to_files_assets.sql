-- Add file_url column to files_assets table if it doesn't exist
-- NOTE: This migration is now a no-op since the initial schema already includes file_url
-- Keeping it for historical purposes and to handle any edge cases

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files_assets' AND column_name = 'file_url'
    ) THEN
        ALTER TABLE files_assets ADD COLUMN file_url TEXT;
    END IF;
END $$;

-- Create index for better performance on file_url lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_files_assets_file_url ON files_assets(file_url);

-- Add comment to document the column
COMMENT ON COLUMN files_assets.file_url IS 'Storage path/URL for the file in Supabase storage bucket';

