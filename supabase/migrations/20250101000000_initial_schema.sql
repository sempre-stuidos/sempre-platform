-- ============================================================================
-- Consolidated Database Schema Migration
-- This migration creates all tables with their final structure
-- ============================================================================

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Clients Table
-- ============================================================================

CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Past')),
    project_count INTEGER DEFAULT 0 NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    contact_email TEXT NOT NULL,
    last_contact DATE NOT NULL,
    total_value BIGINT DEFAULT 0 NOT NULL,
    phone TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_priority ON clients(priority);
CREATE INDEX idx_clients_business_type ON clients(business_type);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_website ON clients(website);

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON clients FOR DELETE USING (true);

-- ============================================================================
-- Team Members Tables
-- ============================================================================

CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Contractor', 'Past Collaborator')),
    email TEXT NOT NULL UNIQUE,
    timezone TEXT NOT NULL,
    avatar TEXT,
    current_projects INTEGER DEFAULT 0,
    active_tasks INTEGER DEFAULT 0,
    workload INTEGER DEFAULT 0 CHECK (workload >= 0 AND workload <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE team_member_skills (
    id BIGSERIAL PRIMARY KEY,
    team_member_id BIGINT REFERENCES team_members(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE team_member_deadlines (
    id BIGSERIAL PRIMARY KEY,
    team_member_id BIGINT REFERENCES team_members(id) ON DELETE CASCADE,
    project TEXT NOT NULL,
    deadline DATE NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_member_skills_team_member_id ON team_member_skills(team_member_id);
CREATE INDEX idx_team_member_deadlines_team_member_id ON team_member_deadlines(team_member_id);
CREATE INDEX idx_team_member_deadlines_deadline ON team_member_deadlines(deadline);

CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON team_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_member_deadlines_updated_at 
    BEFORE UPDATE ON team_member_deadlines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON team_members FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON team_members FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON team_members FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON team_member_skills FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON team_member_skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON team_member_skills FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON team_member_skills FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON team_member_deadlines FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON team_member_deadlines FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON team_member_deadlines FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON team_member_deadlines FOR DELETE USING (true);

-- ============================================================================
-- Projects Tables
-- ============================================================================

CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT,
    status TEXT CHECK (status IN ('Completed', 'In Progress', 'Review', 'Planned')),
    due_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    description TEXT,
    start_date DATE,
    budget BIGINT DEFAULT 0,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE project_team_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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

CREATE TABLE project_deliverables (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    deliverable TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE project_timeline (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_deliverables_project_id ON project_deliverables(project_id);
CREATE INDEX idx_project_timeline_project_id ON project_timeline(project_id);

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

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- Tasks Table
-- ============================================================================

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('To Do', 'In Progress', 'Review', 'Done')),
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    due_date DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    assignee_id BIGINT REFERENCES team_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON tasks FOR DELETE USING (true);

-- ============================================================================
-- Presentations Table
-- ============================================================================

CREATE TABLE presentations (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('Proposal', 'Onboarding', 'Progress Update', 'Report', 'Case Study')),
    created_date DATE NOT NULL,
    owner_id BIGINT REFERENCES team_members(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('Draft', 'Sent', 'Approved', 'Archived')),
    link TEXT NOT NULL,
    description TEXT,
    last_modified DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_presentations_client_id ON presentations(client_id);
CREATE INDEX idx_presentations_owner_id ON presentations(owner_id);
CREATE INDEX idx_presentations_type ON presentations(type);
CREATE INDEX idx_presentations_status ON presentations(status);
CREATE INDEX idx_presentations_created_date ON presentations(created_date);

CREATE TRIGGER update_presentations_updated_at 
    BEFORE UPDATE ON presentations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON presentations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON presentations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON presentations FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON presentations FOR DELETE USING (true);

-- ============================================================================
-- Files Assets Table
-- ============================================================================

CREATE TABLE files_assets (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Logo', 'Document', 'Mockup', 'Content', 'Images', 'Wireframe', 'Prototype', 'Templates', 'Video', 'Design System', 'Icons', 'Presentation', 'Template')),
    category TEXT NOT NULL CHECK (category IN ('Client Assets', 'Project Assets')),
    project TEXT NOT NULL,
    size TEXT NOT NULL,
    format TEXT NOT NULL,
    uploaded DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Review', 'Draft', 'Processing', 'Archive')),
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_files_assets_type ON files_assets(type);
CREATE INDEX idx_files_assets_category ON files_assets(category);
CREATE INDEX idx_files_assets_project ON files_assets(project);
CREATE INDEX idx_files_assets_format ON files_assets(format);
CREATE INDEX idx_files_assets_status ON files_assets(status);
CREATE INDEX idx_files_assets_uploaded ON files_assets(uploaded);
CREATE INDEX idx_files_assets_file_url ON files_assets(file_url);

COMMENT ON COLUMN files_assets.file_url IS 'Storage path/URL for the file in Supabase storage bucket';

CREATE TRIGGER update_files_assets_updated_at 
    BEFORE UPDATE ON files_assets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE files_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON files_assets FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON files_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON files_assets FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON files_assets FOR DELETE USING (true);

-- ============================================================================
-- Agency Toolkit Tables
-- ============================================================================

CREATE TABLE agency_toolkit (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    category TEXT NOT NULL CHECK (category IN ('Design', 'Hosting', 'AI', 'Marketing', 'Productivity')),
    plan_type TEXT NOT NULL,
    seats INTEGER DEFAULT 1,
    renewal_cycle TEXT NOT NULL CHECK (renewal_cycle IN ('Monthly', 'Yearly')),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    next_billing_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Trial', 'Canceled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE agency_toolkit_invoices (
    id BIGSERIAL PRIMARY KEY,
    toolkit_id BIGINT REFERENCES agency_toolkit(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE agency_toolkit_cost_history (
    id BIGSERIAL PRIMARY KEY,
    toolkit_id BIGINT REFERENCES agency_toolkit(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_agency_toolkit_category ON agency_toolkit(category);
CREATE INDEX idx_agency_toolkit_status ON agency_toolkit(status);
CREATE INDEX idx_agency_toolkit_renewal_cycle ON agency_toolkit(renewal_cycle);
CREATE INDEX idx_agency_toolkit_next_billing_date ON agency_toolkit(next_billing_date);
CREATE INDEX idx_agency_toolkit_invoices_toolkit_id ON agency_toolkit_invoices(toolkit_id);
CREATE INDEX idx_agency_toolkit_invoices_date ON agency_toolkit_invoices(date);
CREATE INDEX idx_agency_toolkit_cost_history_toolkit_id ON agency_toolkit_cost_history(toolkit_id);
CREATE INDEX idx_agency_toolkit_cost_history_date ON agency_toolkit_cost_history(date);

CREATE TRIGGER update_agency_toolkit_updated_at 
    BEFORE UPDATE ON agency_toolkit 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE agency_toolkit ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_toolkit_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_toolkit_cost_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON agency_toolkit FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON agency_toolkit FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON agency_toolkit FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON agency_toolkit FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON agency_toolkit_invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON agency_toolkit_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON agency_toolkit_invoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON agency_toolkit_invoices FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON agency_toolkit_cost_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON agency_toolkit_cost_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON agency_toolkit_cost_history FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON agency_toolkit_cost_history FOR DELETE USING (true);

-- ============================================================================
-- Agent Conversation Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_states (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_states_conversation_id ON conversation_states (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_states_stage ON conversation_states (stage);

DROP TRIGGER IF EXISTS set_conversations_updated_at ON conversations;
CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_conversation_states_updated_at ON conversation_states;
CREATE TRIGGER set_conversation_states_updated_at
    BEFORE UPDATE ON conversation_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select_policy ON conversations;
CREATE POLICY conversations_select_policy
    ON conversations
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS conversations_insert_policy ON conversations;
CREATE POLICY conversations_insert_policy
    ON conversations
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS conversations_update_policy ON conversations;
CREATE POLICY conversations_update_policy
    ON conversations
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS conversations_delete_policy ON conversations;
CREATE POLICY conversations_delete_policy
    ON conversations
    FOR DELETE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS messages_select_policy ON messages;
CREATE POLICY messages_select_policy
    ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS messages_insert_policy ON messages;
CREATE POLICY messages_insert_policy
    ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS messages_update_policy ON messages;
CREATE POLICY messages_update_policy
    ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS messages_delete_policy ON messages;
CREATE POLICY messages_delete_policy
    ON messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS conversation_states_select_policy ON conversation_states;
CREATE POLICY conversation_states_select_policy
    ON conversation_states
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS conversation_states_insert_policy ON conversation_states;
CREATE POLICY conversation_states_insert_policy
    ON conversation_states
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS conversation_states_update_policy ON conversation_states;
CREATE POLICY conversation_states_update_policy
    ON conversation_states
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS conversation_states_delete_policy ON conversation_states;
CREATE POLICY conversation_states_delete_policy
    ON conversation_states
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Storage Bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files-assets',
  'files-assets',
  true,
  52428800, -- 50MB in bytes
  NULL -- Allow all file types
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files-assets');

DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'files-assets');

DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
CREATE POLICY "Allow authenticated users to update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'files-assets')
WITH CHECK (bucket_id = 'files-assets');

DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'files-assets');

