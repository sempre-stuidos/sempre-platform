-- ============================================================================
-- Multi-Tenant Organization System
-- Creates profiles, organizations, and memberships tables with RLS policies
-- ============================================================================

-- ============================================================================
-- Profiles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    default_role TEXT CHECK (default_role IN ('owner', 'admin', 'staff', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_default_role ON profiles(default_role);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on first login)
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Authenticated users can view other profiles (for team member lists, etc.)
CREATE POLICY "Authenticated users can view all profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- Organizations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('agency', 'client')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations will be created after memberships table
-- (See end of file)

-- ============================================================================
-- Memberships Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS memberships (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(org_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON memberships(role);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_memberships_updated_at 
    BEFORE UPDATE ON memberships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memberships
-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships" ON memberships
    FOR SELECT USING (auth.uid() = user_id);

-- Members can view all memberships in their organizations
CREATE POLICY "Members can view organization memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = memberships.org_id
            AND m.user_id = auth.uid()
        )
    );

-- Owners and admins can insert memberships
CREATE POLICY "Owners and admins can add members" ON memberships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = memberships.org_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
        )
    );

-- Owners and admins can update memberships
CREATE POLICY "Owners and admins can update memberships" ON memberships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = memberships.org_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
        )
    );

-- Owners can delete memberships (but not their own if they're the only owner)
CREATE POLICY "Owners can remove members" ON memberships
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = memberships.org_id
            AND m.user_id = auth.uid()
            AND m.role = 'owner'
        )
    );

-- Users can insert their own membership if invited (via email matching)
-- This will be handled by application logic, but we allow it here
CREATE POLICY "Users can join organizations" ON memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Update Clients Table
-- ============================================================================

-- Add organization_id column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for organization_id
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);

-- ============================================================================
-- Organizations RLS Policies (created after memberships table exists)
-- ============================================================================

-- Members can view their organizations
CREATE POLICY "Members can view their organizations" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = organizations.id
            AND m.user_id = auth.uid()
        )
    );

-- Owners and admins can update their organizations
CREATE POLICY "Owners and admins can update organizations" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = organizations.id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
        )
    );

-- Owners can delete their organizations
CREATE POLICY "Owners can delete organizations" ON organizations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = organizations.id
            AND m.user_id = auth.uid()
            AND m.role = 'owner'
        )
    );

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- Add foreign key constraint to events table (if it exists)
-- ============================================================================

-- Add foreign key constraint to events.org_id if events table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        -- Drop existing constraint if it exists (in case it was added without proper reference)
        ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_org_id_fkey;
        
        -- Add proper foreign key constraint
        ALTER TABLE public.events 
        ADD CONSTRAINT events_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Add RLS policies for events table (now that memberships exists)
        DROP POLICY IF EXISTS "Members can view organization events" ON public.events;
        DROP POLICY IF EXISTS "Members can insert organization events" ON public.events;
        DROP POLICY IF EXISTS "Members can update organization events" ON public.events;
        DROP POLICY IF EXISTS "Members can delete organization events" ON public.events;
        
        CREATE POLICY "Members can view organization events" ON public.events
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Members can insert organization events" ON public.events
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Members can update organization events" ON public.events
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Members can delete organization events" ON public.events
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
        
        -- Add foreign key constraints and RLS policies for reports tables (if they exist)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
            ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_organization_id_fkey;
            ALTER TABLE public.reports 
            ADD CONSTRAINT reports_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
            
            DROP POLICY IF EXISTS "Organization members can view reports" ON public.reports;
            DROP POLICY IF EXISTS "Organization members can insert reports" ON public.reports;
            DROP POLICY IF EXISTS "Organization members can update reports" ON public.reports;
            DROP POLICY IF EXISTS "Organization members can delete reports" ON public.reports;
            
            CREATE POLICY "Organization members can view reports" ON public.reports
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.memberships m
                        WHERE m.org_id = reports.organization_id
                        AND m.user_id = auth.uid()
                    )
                );
            
            CREATE POLICY "Organization members can insert reports" ON public.reports
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM public.memberships m
                        WHERE m.org_id = reports.organization_id
                        AND m.user_id = auth.uid()
                    )
                );
            
            CREATE POLICY "Organization members can update reports" ON public.reports
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM public.memberships m
                        WHERE m.org_id = reports.organization_id
                        AND m.user_id = auth.uid()
                    )
                );
            
            CREATE POLICY "Organization members can delete reports" ON public.reports
                FOR DELETE USING (
                    EXISTS (
                        SELECT 1 FROM public.memberships m
                        WHERE m.org_id = reports.organization_id
                        AND m.user_id = auth.uid()
                    )
                );
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_settings') THEN
            ALTER TABLE public.report_settings DROP CONSTRAINT IF EXISTS report_settings_organization_id_fkey;
            ALTER TABLE public.report_settings 
            ADD CONSTRAINT report_settings_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
            
            DROP POLICY IF EXISTS "Organization members can view report settings" ON public.report_settings;
            DROP POLICY IF EXISTS "Organization members can insert report settings" ON public.report_settings;
            DROP POLICY IF EXISTS "Organization members can update report settings" ON public.report_settings;
            
            CREATE POLICY "Organization members can view report settings" ON public.report_settings
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.memberships m
                        WHERE m.org_id = report_settings.organization_id
                        AND m.user_id = auth.uid()
                    )
                );
            
            CREATE POLICY "Organization members can insert report settings" ON public.report_settings
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM public.memberships m
                        WHERE m.org_id = report_settings.organization_id
                        AND m.user_id = auth.uid()
                    )
                );
            
            CREATE POLICY "Organization members can update report settings" ON public.report_settings
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM public.memberships m
                        WHERE m.org_id = report_settings.organization_id
                        AND m.user_id = auth.uid()
                    )
                );
        END IF;
    END IF;
END $$;

