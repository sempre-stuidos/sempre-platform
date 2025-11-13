-- ============================================================================
-- Seed Default Menu Categories
-- Creates 3 default categories (Starters, Mains, Desserts) for each client
-- Categories are created for 'dinner' menu type by default
-- ============================================================================

-- Create default categories for each client that doesn't have any categories yet
DO $$
DECLARE
    client_record RECORD;
    default_categories TEXT[] := ARRAY['Starters', 'Mains', 'Desserts'];
    category_name TEXT;
    category_slug TEXT;
    sort_order_val INTEGER;
    menu_type_val TEXT := 'dinner'; -- Default menu type
BEGIN
    -- Loop through all clients
    FOR client_record IN 
        SELECT DISTINCT id FROM clients
    LOOP
        -- Check if client already has categories for the default menu type
        IF NOT EXISTS (
            SELECT 1 FROM menu_categories 
            WHERE client_id = client_record.id
            AND menu_type = menu_type_val
        ) THEN
            -- Create 3 default categories for the default menu type
            sort_order_val := 0;
            FOREACH category_name IN ARRAY default_categories
            LOOP
                category_slug := lower(regexp_replace(category_name, '[^a-zA-Z0-9]+', '-', 'g'));
                
                -- Check if category with this slug already exists for this client and menu type
                IF NOT EXISTS (
                    SELECT 1 FROM menu_categories
                    WHERE client_id = client_record.id
                    AND menu_type = menu_type_val
                    AND slug = category_slug
                ) THEN
                    INSERT INTO menu_categories (
                        client_id,
                        menu_type,
                        name,
                        slug,
                        sort_order,
                        is_active
                    ) VALUES (
                        client_record.id,
                        menu_type_val,
                        category_name,
                        category_slug,
                        sort_order_val,
                        true
                    );
                END IF;
                
                sort_order_val := sort_order_val + 1;
            END LOOP;
        END IF;
    END LOOP;
END $$;

