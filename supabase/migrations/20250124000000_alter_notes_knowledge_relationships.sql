-- Alter notes_knowledge table to use foreign key relationships instead of text fields
-- This migration changes client and project from TEXT to foreign key references
-- NOTE: This migration runs before notes_knowledge table is created, so it's a no-op
-- The table will be created with the correct structure in a later migration

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notes_knowledge'
    ) THEN
        -- First, add the new foreign key columns if they don't exist
        -- These are nullable to preserve existing data and allow notes without client/project
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notes_knowledge' AND column_name = 'client_id'
        ) THEN
            ALTER TABLE notes_knowledge 
            ADD COLUMN client_id BIGINT NULL REFERENCES clients(id);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notes_knowledge' AND column_name = 'project_id'
        ) THEN
            ALTER TABLE notes_knowledge 
            ADD COLUMN project_id BIGINT NULL REFERENCES projects(id);
        END IF;

        -- Create indexes for the new foreign keys
        CREATE INDEX IF NOT EXISTS idx_notes_knowledge_client_id ON notes_knowledge(client_id);
        CREATE INDEX IF NOT EXISTS idx_notes_knowledge_project_id ON notes_knowledge(project_id);

        -- Drop the old text-based indexes
        DROP INDEX IF EXISTS idx_notes_knowledge_client;
        DROP INDEX IF EXISTS idx_notes_knowledge_project;
    END IF;
END $$;

-- Note: We keep the old client and project columns for now to preserve data
-- They will be dropped in a future migration after data migration is complete
