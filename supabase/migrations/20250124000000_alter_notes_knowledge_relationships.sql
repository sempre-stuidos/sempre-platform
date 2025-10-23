-- Alter notes_knowledge table to use foreign key relationships instead of text fields
-- This migration changes client and project from TEXT to foreign key references

-- First, add the new foreign key columns
ALTER TABLE notes_knowledge 
ADD COLUMN client_id BIGINT REFERENCES clients(id),
ADD COLUMN project_id BIGINT REFERENCES projects(id);

-- Create indexes for the new foreign keys
CREATE INDEX idx_notes_knowledge_client_id ON notes_knowledge(client_id);
CREATE INDEX idx_notes_knowledge_project_id ON notes_knowledge(project_id);

-- Drop the old text-based indexes
DROP INDEX IF EXISTS idx_notes_knowledge_client;
DROP INDEX IF EXISTS idx_notes_knowledge_project;

-- Note: We keep the old client and project columns for now to preserve data
-- They will be dropped in a future migration after data migration is complete
