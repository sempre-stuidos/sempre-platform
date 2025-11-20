-- ============================================================================
-- Rename Organizations to Businesses
-- Renames the organizations table and all related references
-- ============================================================================

-- Step 1: Rename the table
ALTER TABLE organizations RENAME TO businesses;

-- Step 2: Rename indexes
ALTER INDEX IF EXISTS idx_organizations_type RENAME TO idx_businesses_type;
ALTER INDEX IF EXISTS idx_organizations_name RENAME TO idx_businesses_name;
ALTER INDEX IF EXISTS idx_organizations_status RENAME TO idx_businesses_status;
ALTER INDEX IF EXISTS idx_organizations_email RENAME TO idx_businesses_email;
ALTER INDEX IF EXISTS idx_organizations_slug RENAME TO idx_businesses_slug;

-- Step 3: Rename constraints
ALTER TABLE businesses RENAME CONSTRAINT organizations_type_check TO businesses_type_check;

-- Rename trigger (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at' AND tgrelid = 'businesses'::regclass) THEN
        DROP TRIGGER IF EXISTS update_organizations_updated_at ON businesses;
        CREATE TRIGGER update_businesses_updated_at 
            BEFORE UPDATE ON businesses 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 4: Update foreign key constraints in other tables
-- Update memberships table
ALTER TABLE memberships 
  DROP CONSTRAINT IF EXISTS memberships_org_id_fkey,
  ADD CONSTRAINT memberships_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Update clients table - rename column for consistency
ALTER TABLE clients 
  DROP CONSTRAINT IF EXISTS clients_organization_id_fkey;
  
ALTER TABLE clients 
  RENAME COLUMN organization_id TO business_id;

ALTER TABLE clients 
  ADD CONSTRAINT clients_business_id_fkey 
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;

-- Rename index
ALTER INDEX IF EXISTS idx_clients_organization_id RENAME TO idx_clients_business_id;

-- Update events table
ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS events_org_id_fkey,
  ADD CONSTRAINT events_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Update reports table - rename column
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_organization_id_fkey;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'organization_id') THEN
            ALTER TABLE reports RENAME COLUMN organization_id TO business_id;
            
            ALTER TABLE reports 
              ADD CONSTRAINT reports_business_id_fkey 
              FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Update report_settings table - rename column
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_settings') THEN
        ALTER TABLE report_settings DROP CONSTRAINT IF EXISTS report_settings_organization_id_fkey;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_settings' AND column_name = 'organization_id') THEN
            ALTER TABLE report_settings RENAME COLUMN organization_id TO business_id;
            
            ALTER TABLE report_settings 
              ADD CONSTRAINT report_settings_business_id_fkey 
              FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Update menus table - rename column
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menus') THEN
        ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_organization_id_fkey;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menus' AND column_name = 'organization_id') THEN
            ALTER TABLE menus RENAME COLUMN organization_id TO business_id;
            
            ALTER TABLE menus 
              ADD CONSTRAINT menus_business_id_fkey 
              FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Update pages table - rename column
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pages') THEN
        ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_organization_id_fkey;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pages' AND column_name = 'organization_id') THEN
            ALTER TABLE pages RENAME COLUMN organization_id TO business_id;
            
            ALTER TABLE pages 
              ADD CONSTRAINT pages_business_id_fkey 
              FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Update reservations table - rename column
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
        ALTER TABLE reservations 
          DROP CONSTRAINT IF EXISTS reservations_organization_id_fkey;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'organization_id') THEN
            ALTER TABLE reservations 
              RENAME COLUMN organization_id TO business_id;
            
            ALTER TABLE reservations 
              ADD CONSTRAINT reservations_business_id_fkey 
              FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Step 5: Update RLS policies
-- Drop old policies
DROP POLICY IF EXISTS "Members can view their organizations" ON businesses;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON businesses;
DROP POLICY IF EXISTS "Owners can delete organizations" ON businesses;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON businesses;

-- Create new policies with updated names
CREATE POLICY "Members can view their businesses" ON businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = businesses.id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can update businesses" ON businesses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = businesses.id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can delete businesses" ON businesses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = businesses.id
            AND m.user_id = auth.uid()
            AND m.role = 'owner'
        )
    );

CREATE POLICY "Authenticated users can create businesses" ON businesses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 6: Update comments
COMMENT ON TABLE businesses IS 'Businesses table (formerly organizations)';
COMMENT ON COLUMN businesses.status IS 'Business status: active, inactive, or suspended';
COMMENT ON COLUMN businesses.type IS 'Business type: agency, restaurant, hotel, retail, service, or other';

-- Step 7: Update RLS policies in other tables that reference organizations
-- Events policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        DROP POLICY IF EXISTS "Members can view organization events" ON events;
        DROP POLICY IF EXISTS "Members can insert organization events" ON events;
        DROP POLICY IF EXISTS "Members can update organization events" ON events;
        DROP POLICY IF EXISTS "Members can delete organization events" ON events;
        
        CREATE POLICY "Members can view business events" ON events
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Members can insert business events" ON events
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Members can update business events" ON events
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Members can delete business events" ON events
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = events.org_id
                    AND m.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Reports policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP POLICY IF EXISTS "Organization members can view reports" ON reports;
        DROP POLICY IF EXISTS "Organization members can insert reports" ON reports;
        DROP POLICY IF EXISTS "Organization members can update reports" ON reports;
        DROP POLICY IF EXISTS "Organization members can delete reports" ON reports;
        
        CREATE POLICY "Business members can view reports" ON reports
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = reports.business_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Business members can insert reports" ON reports
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = reports.business_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Business members can update reports" ON reports
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = reports.business_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Business members can delete reports" ON reports
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = reports.business_id
                    AND m.user_id = auth.uid()
                )
            );
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_settings') THEN
        DROP POLICY IF EXISTS "Organization members can view report settings" ON report_settings;
        DROP POLICY IF EXISTS "Organization members can insert report settings" ON report_settings;
        DROP POLICY IF EXISTS "Organization members can update report settings" ON report_settings;
        
        CREATE POLICY "Business members can view report settings" ON report_settings
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = report_settings.business_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Business members can insert report settings" ON report_settings
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = report_settings.business_id
                    AND m.user_id = auth.uid()
                )
            );
        
        CREATE POLICY "Business members can update report settings" ON report_settings
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.org_id = report_settings.business_id
                    AND m.user_id = auth.uid()
                )
            );
    END IF;
END $$;

