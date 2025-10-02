-- Create projects table
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Completed', 'In Progress', 'Review', 'Planned')),
    due_date DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    description TEXT,
    start_date DATE NOT NULL,
    budget BIGINT DEFAULT 0,
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create project_team_members table
CREATE TABLE project_team_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create project_tasks table
CREATE TABLE project_tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'pending')),
    deliverable TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create project_deliverables table
CREATE TABLE project_deliverables (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    deliverable TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create project_timeline table
CREATE TABLE project_timeline (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_deliverables_project_id ON project_deliverables(project_id);
CREATE INDEX idx_project_timeline_project_id ON project_timeline(project_id);

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at 
    BEFORE UPDATE ON project_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_timeline_updated_at 
    BEFORE UPDATE ON project_timeline 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allowing all operations for authenticated users)
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON projects FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON project_team_members FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON project_team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON project_team_members FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON project_team_members FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON project_tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON project_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON project_tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON project_tasks FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON project_deliverables FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON project_deliverables FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON project_deliverables FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON project_deliverables FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON project_timeline FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON project_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON project_timeline FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON project_timeline FOR DELETE USING (true);
