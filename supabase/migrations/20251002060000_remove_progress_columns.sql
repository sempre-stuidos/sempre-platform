-- Remove progress column from projects table
ALTER TABLE projects DROP COLUMN IF EXISTS progress;

-- Remove progress column from tasks table  
ALTER TABLE tasks DROP COLUMN IF EXISTS progress;
