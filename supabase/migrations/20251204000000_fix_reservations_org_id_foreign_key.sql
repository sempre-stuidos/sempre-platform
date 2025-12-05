-- ============================================================================
-- Fix Reservations org_id Foreign Key
-- Updates reservations.org_id foreign key to reference businesses(id) instead of organizations(id)
-- ============================================================================

DO $$
BEGIN
    -- Check if reservations table exists and has org_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations' 
        AND column_name = 'org_id'
    ) THEN
        -- Drop the old foreign key constraint if it exists
        ALTER TABLE reservations 
          DROP CONSTRAINT IF EXISTS reservations_org_id_fkey;
        
        -- Add new foreign key constraint referencing businesses
        ALTER TABLE reservations 
          ADD CONSTRAINT reservations_org_id_fkey 
          FOREIGN KEY (org_id) REFERENCES businesses(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated reservations.org_id foreign key to reference businesses(id)';
    ELSE
        RAISE NOTICE 'Reservations table or org_id column does not exist, skipping foreign key update';
    END IF;
END $$;

