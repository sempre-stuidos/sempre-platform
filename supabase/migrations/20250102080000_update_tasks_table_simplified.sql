-- Update tasks table to use simplified structure with project_id and assignee_id
-- Remove individual project and assignee fields, keep only IDs
-- NOTE: This migration is now a no-op since the initial schema already includes assignee_id
-- Keeping it for historical purposes and to handle any edge cases

-- Add assignee_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'assignee_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN assignee_id BIGINT;
    END IF;
END $$;

-- Add foreign key constraint for assignee_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_assignee_id_fkey'
    ) THEN
ALTER TABLE tasks 
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for assignee_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);

-- Drop columns only if they exist (for backward compatibility with old schemas)
DO $$ 
BEGIN
    -- Drop assignee_name if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'assignee_name'
    ) THEN
        ALTER TABLE tasks DROP COLUMN assignee_name;
    END IF;

    -- Drop assignee_role if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'assignee_role'
    ) THEN
        ALTER TABLE tasks DROP COLUMN assignee_role;
    END IF;

    -- Drop assignee_avatar if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'assignee_avatar'
    ) THEN
        ALTER TABLE tasks DROP COLUMN assignee_avatar;
    END IF;

    -- Drop project_name if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'project_name'
    ) THEN
        ALTER TABLE tasks DROP COLUMN project_name;
    END IF;
END $$;

-- Drop the old assignee_name index if it exists
DROP INDEX IF EXISTS idx_tasks_assignee_name;
