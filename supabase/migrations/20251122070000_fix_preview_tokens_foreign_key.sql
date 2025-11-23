-- ============================================================================
-- Fix Preview Tokens Foreign Key
-- Updates the foreign key to reference businesses instead of organizations
-- ============================================================================

-- Drop the old foreign key constraint if it exists
ALTER TABLE preview_tokens 
  DROP CONSTRAINT IF EXISTS preview_tokens_org_id_fkey;

-- Add the new foreign key constraint referencing businesses
ALTER TABLE preview_tokens 
  ADD CONSTRAINT preview_tokens_org_id_fkey 
  FOREIGN KEY (org_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- Verify the constraint was created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'preview_tokens_org_id_fkey'
        AND table_name = 'preview_tokens'
    ) THEN
        RAISE EXCEPTION 'Failed to create foreign key constraint';
    END IF;
END $$;

