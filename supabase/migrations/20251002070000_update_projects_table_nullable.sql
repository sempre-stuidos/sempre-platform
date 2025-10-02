-- Update projects table to make most fields nullable except name and client_id
ALTER TABLE projects 
ALTER COLUMN client_name DROP NOT NULL,
ALTER COLUMN status DROP NOT NULL,
ALTER COLUMN due_date DROP NOT NULL,
ALTER COLUMN start_date DROP NOT NULL,
ALTER COLUMN priority DROP NOT NULL;

-- Keep name as NOT NULL (required field)
-- Keep client_id as nullable (can be null)
-- Keep created_at and updated_at as NOT NULL (they have defaults)
