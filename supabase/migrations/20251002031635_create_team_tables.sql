-- Create team tables if they don't exist
-- NOTE: This migration is now a no-op since the initial schema already includes these tables
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'team_members'
    ) THEN
        -- Create team_members table
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

        -- Create team_member_skills table
        CREATE TABLE team_member_skills (
            id BIGSERIAL PRIMARY KEY,
            team_member_id BIGINT REFERENCES team_members(id) ON DELETE CASCADE,
            skill TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        -- Create team_member_deadlines table
        CREATE TABLE team_member_deadlines (
            id BIGSERIAL PRIMARY KEY,
            team_member_id BIGINT REFERENCES team_members(id) ON DELETE CASCADE,
            project TEXT NOT NULL,
            deadline DATE NOT NULL,
            type TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        -- Create indexes for better performance
        CREATE INDEX idx_team_members_status ON team_members(status);
        CREATE INDEX idx_team_members_role ON team_members(role);
        CREATE INDEX idx_team_members_email ON team_members(email);
        CREATE INDEX idx_team_member_skills_team_member_id ON team_member_skills(team_member_id);
        CREATE INDEX idx_team_member_deadlines_team_member_id ON team_member_deadlines(team_member_id);
        CREATE INDEX idx_team_member_deadlines_deadline ON team_member_deadlines(deadline);

        -- Create triggers to automatically update the updated_at column
        CREATE TRIGGER update_team_members_updated_at 
            BEFORE UPDATE ON team_members 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        CREATE TRIGGER update_team_member_deadlines_updated_at 
            BEFORE UPDATE ON team_member_deadlines 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        -- Enable Row Level Security (RLS)
        ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE team_member_skills ENABLE ROW LEVEL SECURITY;
        ALTER TABLE team_member_deadlines ENABLE ROW LEVEL SECURITY;

        -- Create policies for RLS (allowing all operations for authenticated users)
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
    END IF;
END $$;
