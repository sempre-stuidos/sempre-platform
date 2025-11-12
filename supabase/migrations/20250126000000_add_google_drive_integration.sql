-- Add Google Drive integration support
-- Store encrypted OAuth tokens for Google Drive access

-- Create table to store Google Drive OAuth tokens
CREATE TABLE IF NOT EXISTS google_drive_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_user_id ON google_drive_tokens(user_id);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_google_drive_tokens_updated_at 
    BEFORE UPDATE ON google_drive_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS - users can only access their own tokens
CREATE POLICY "Users can view their own Google Drive tokens" 
    ON google_drive_tokens FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Drive tokens" 
    ON google_drive_tokens FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Drive tokens" 
    ON google_drive_tokens FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Drive tokens" 
    ON google_drive_tokens FOR DELETE 
    USING (auth.uid() = user_id);

-- Add google_drive_file_id to files_assets table to track imported files
ALTER TABLE files_assets 
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_web_view_link TEXT,
ADD COLUMN IF NOT EXISTS imported_from_google_drive BOOLEAN DEFAULT FALSE;

-- Create index for Google Drive file ID lookups
CREATE INDEX IF NOT EXISTS idx_files_assets_google_drive_file_id ON files_assets(google_drive_file_id);

-- Add comment to document the columns
COMMENT ON COLUMN files_assets.google_drive_file_id IS 'Google Drive file ID for files imported from Google Drive';
COMMENT ON COLUMN files_assets.google_drive_web_view_link IS 'Google Drive web view link for the file';
COMMENT ON COLUMN files_assets.imported_from_google_drive IS 'Flag indicating if file was imported from Google Drive';

