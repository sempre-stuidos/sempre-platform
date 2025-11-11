-- Create tasks table if it doesn't exist
-- NOTE: This migration is now a no-op since the initial schema already includes tasks table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tasks'
    ) THEN
        CREATE TABLE tasks (
            id BIGSERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
            project_name TEXT NOT NULL,
            assignee_name TEXT NOT NULL,
            assignee_role TEXT NOT NULL,
            assignee_avatar TEXT,
            status TEXT NOT NULL CHECK (status IN ('To Do', 'In Progress', 'Review', 'Done')),
            priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
            due_date DATE NOT NULL,
            progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        -- Create indexes for better performance
        CREATE INDEX idx_tasks_status ON tasks(status);
        CREATE INDEX idx_tasks_priority ON tasks(priority);
        CREATE INDEX idx_tasks_project_id ON tasks(project_id);
        CREATE INDEX idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX idx_tasks_assignee_name ON tasks(assignee_name);

        -- Create trigger to automatically update the updated_at column
        CREATE TRIGGER update_tasks_updated_at 
            BEFORE UPDATE ON tasks 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        -- Enable Row Level Security (RLS)
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

        -- Create policies for RLS (allowing all operations for authenticated users)
        CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);
        CREATE POLICY "Enable insert for authenticated users only" ON tasks FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update for authenticated users only" ON tasks FOR UPDATE USING (true);
        CREATE POLICY "Enable delete for authenticated users only" ON tasks FOR DELETE USING (true);
    END IF;
END $$;
