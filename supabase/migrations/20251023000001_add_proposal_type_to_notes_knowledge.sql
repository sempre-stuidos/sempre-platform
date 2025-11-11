-- Add 'Proposal' type to notes_knowledge table type constraint
-- Only update if table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notes_knowledge'
    ) THEN
        ALTER TABLE notes_knowledge DROP CONSTRAINT IF EXISTS notes_knowledge_type_check;
        ALTER TABLE notes_knowledge ADD CONSTRAINT notes_knowledge_type_check 
          CHECK (type IN ('Proposal', 'Meeting Notes', 'Internal Playbook', 'Research Notes', 'Bug Report', 'Feature Request', 'Standup Notes', 'Documentation'));
    END IF;
END $$;

