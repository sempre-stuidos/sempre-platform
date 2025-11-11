-- Add content field to notes_knowledge table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_knowledge' AND column_name = 'content'
    ) THEN
        ALTER TABLE notes_knowledge ADD COLUMN content TEXT;
    END IF;
END $$;

