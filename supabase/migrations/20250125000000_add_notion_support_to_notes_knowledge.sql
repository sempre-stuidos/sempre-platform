-- Add notion_url field and 'notion' type to notes_knowledge table
DO $$ 
BEGIN
    -- Add notion_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_knowledge' AND column_name = 'notion_url'
    ) THEN
        ALTER TABLE notes_knowledge ADD COLUMN notion_url TEXT;
    END IF;

    -- Update type constraint to include 'notion'
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notes_knowledge'
    ) THEN
        ALTER TABLE notes_knowledge DROP CONSTRAINT IF EXISTS notes_knowledge_type_check;
        ALTER TABLE notes_knowledge ADD CONSTRAINT notes_knowledge_type_check 
          CHECK (type IN ('Proposal', 'Meeting Notes', 'Internal Playbook', 'Research Notes', 'Bug Report', 'Feature Request', 'Standup Notes', 'Documentation', 'notion'));
    END IF;

    -- Make date and author nullable for notion type (we'll handle this in application logic)
    -- Note: We keep the NOT NULL constraint but handle it in the application layer
END $$;

