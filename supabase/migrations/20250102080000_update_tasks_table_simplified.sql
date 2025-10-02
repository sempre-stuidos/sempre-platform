-- Update tasks table to use simplified structure with project_id and assignee_id
-- Remove individual project and assignee fields, keep only IDs

-- Add assignee_id column
ALTER TABLE tasks 
ADD COLUMN assignee_id BIGINT;

-- Add foreign key constraint for assignee_id
ALTER TABLE tasks 
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) REFERENCES team_members(id) ON DELETE SET NULL;

-- Create index for assignee_id
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- Update existing tasks to populate assignee_id based on assignee_name
-- This is a temporary migration - in production you'd want to map names to IDs properly
UPDATE tasks 
SET assignee_id = (
  SELECT tm.id 
  FROM team_members tm 
  WHERE tm.name = tasks.assignee_name 
  LIMIT 1
)
WHERE assignee_name IS NOT NULL;

-- Make assignee_id NOT NULL (after populating it)
ALTER TABLE tasks 
ALTER COLUMN assignee_id SET NOT NULL;

-- Drop the individual assignee fields
ALTER TABLE tasks 
DROP COLUMN assignee_name,
DROP COLUMN assignee_role,
DROP COLUMN assignee_avatar;

-- Drop the project_name field (we'll get it from projects table)
ALTER TABLE tasks 
DROP COLUMN project_name;

-- Drop the old assignee_name index since we removed the column
DROP INDEX IF EXISTS idx_tasks_assignee_name;
