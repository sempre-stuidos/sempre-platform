-- Update projects table to make most fields nullable except name and client_id
-- Only update if table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'projects'
    ) THEN
        -- Check each column before altering to avoid errors
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'client_name' AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE projects ALTER COLUMN client_name DROP NOT NULL;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'status' AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE projects ALTER COLUMN status DROP NOT NULL;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'due_date' AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE projects ALTER COLUMN due_date DROP NOT NULL;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'start_date' AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE projects ALTER COLUMN start_date DROP NOT NULL;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'priority' AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE projects ALTER COLUMN priority DROP NOT NULL;
        END IF;
    END IF;
END $$;

-- Keep name as NOT NULL (required field)
-- Keep client_id as nullable (can be null)
-- Keep created_at and updated_at as NOT NULL (they have defaults)
