-- ============================================================================
-- Associate All Pages with Johnny G's Restaurant
-- Updates all pages and page sections to be associated with "Johnny G's Restaurant"
-- Other businesses will not have access to these pages
-- ============================================================================

DO $$
DECLARE
    johnny_gs_business_id UUID;
    pages_count INTEGER;
    sections_count INTEGER;
BEGIN
    -- Find "Johnny G's Restaurant" business
    SELECT id INTO johnny_gs_business_id
    FROM businesses
    WHERE name ILIKE '%Johnny G%'
    LIMIT 1;
    
    -- If business doesn't exist, skip the update (it will be created later or via seed data)
    IF johnny_gs_business_id IS NULL THEN
        RAISE NOTICE 'Business "Johnny G''s Restaurant" not found. Skipping page association. Run this migration again after the business is created.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found business: % (ID: %)', (SELECT name FROM businesses WHERE id = johnny_gs_business_id), johnny_gs_business_id;
    
    -- Update all pages to be associated with Johnny G's Restaurant
    UPDATE pages
    SET org_id = johnny_gs_business_id
    WHERE org_id IS NULL OR org_id != johnny_gs_business_id;
    
    GET DIAGNOSTICS pages_count = ROW_COUNT;
    RAISE NOTICE 'Updated % page(s) to be associated with Johnny G''s Restaurant', pages_count;
    
    -- Update all page sections to be associated with Johnny G's Restaurant
    UPDATE page_sections_v2
    SET org_id = johnny_gs_business_id
    WHERE org_id IS NULL OR org_id != johnny_gs_business_id;
    
    GET DIAGNOSTICS sections_count = ROW_COUNT;
    RAISE NOTICE 'Updated % section(s) to be associated with Johnny G''s Restaurant', sections_count;
    
    -- Verify: Check if any pages are still associated with other businesses
    SELECT COUNT(*) INTO pages_count
    FROM pages
    WHERE org_id IS NOT NULL AND org_id != johnny_gs_business_id;
    
    IF pages_count > 0 THEN
        RAISE WARNING 'Warning: % page(s) are still associated with other businesses', pages_count;
    ELSE
        RAISE NOTICE 'All pages are now associated with Johnny G''s Restaurant';
    END IF;
    
    -- Verify: Check if any sections are still associated with other businesses
    SELECT COUNT(*) INTO sections_count
    FROM page_sections_v2
    WHERE org_id IS NOT NULL AND org_id != johnny_gs_business_id;
    
    IF sections_count > 0 THEN
        RAISE WARNING 'Warning: % section(s) are still associated with other businesses', sections_count;
    ELSE
        RAISE NOTICE 'All sections are now associated with Johnny G''s Restaurant';
    END IF;
    
END $$;

