-- ============================================================================
-- Convert Reservations ID to UUID
-- Changes reservations.id from BIGSERIAL to UUID to match live database schema
-- ============================================================================

DO $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Check if reservations table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations'
    ) THEN
        RAISE NOTICE 'Reservations table does not exist, skipping migration';
        RETURN;
    END IF;

    -- Check if id column is already UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations' 
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'Reservations.id is already UUID, skipping migration';
        RETURN;
    END IF;

    -- Count existing rows
    SELECT COUNT(*) INTO row_count FROM reservations;
    RAISE NOTICE 'Found % existing reservation(s)', row_count;

    -- Step 1: Drop primary key constraint
    ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_pkey;

    -- Step 2: Drop the sequence if it exists (BIGSERIAL creates a sequence)
    DROP SEQUENCE IF EXISTS reservations_id_seq CASCADE;

    -- Step 3: Handle existing data
    IF row_count > 0 THEN
        -- Add temporary UUID column
        ALTER TABLE reservations ADD COLUMN id_new UUID;
        
        -- Generate UUIDs for existing rows
        UPDATE reservations SET id_new = gen_random_uuid();
        
        -- Drop old id column
        ALTER TABLE reservations DROP COLUMN id;
        
        -- Rename new column to id
        ALTER TABLE reservations RENAME COLUMN id_new TO id;
        
        RAISE NOTICE 'Converted % existing reservation(s) to UUID', row_count;
    ELSE
        -- No existing data, just change the column type
        ALTER TABLE reservations 
            ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        
        RAISE NOTICE 'Changed id column type to UUID (no existing data)';
    END IF;

    -- Step 4: Set default and NOT NULL
    ALTER TABLE reservations 
        ALTER COLUMN id SET DEFAULT gen_random_uuid(),
        ALTER COLUMN id SET NOT NULL;

    -- Step 5: Recreate primary key constraint
    ALTER TABLE reservations 
        ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);

    RAISE NOTICE 'Successfully converted reservations.id to UUID';
END $$;

