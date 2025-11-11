-- ============================================================================
-- Update Foreign Keys to Reference user_roles Instead of team_members
-- ============================================================================

-- Update tasks.assignee_id to reference user_roles instead of team_members
DO $$ 
BEGIN
    -- Drop the old foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_assignee_id_fkey'
    ) THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_assignee_id_fkey;
    END IF;
    
    -- Add new foreign key constraint to user_roles
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) REFERENCES user_roles(id) ON DELETE SET NULL;
END $$;

-- Update presentations.owner_id to reference user_roles instead of team_members
DO $$ 
BEGIN
    -- Drop the old foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_presentations_owner_id'
    ) THEN
        ALTER TABLE presentations DROP CONSTRAINT fk_presentations_owner_id;
    END IF;
    
    -- Add new foreign key constraint to user_roles
    ALTER TABLE presentations 
    ADD CONSTRAINT fk_presentations_owner_id 
    FOREIGN KEY (owner_id) REFERENCES user_roles(id) ON DELETE SET NULL;
END $$;

