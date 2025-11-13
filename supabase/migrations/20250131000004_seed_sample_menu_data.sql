-- ============================================================================
-- Seed Sample Menu Data
-- Creates sample categories and menu items for clients linked to organizations
-- ============================================================================

DO $$
DECLARE
    client_record RECORD;
    category_id BIGINT;
    menu_item_id BIGINT;
    starters_category_id BIGINT;
    mains_category_id BIGINT;
    desserts_category_id BIGINT;
    brunch_appetizers_id BIGINT;
    brunch_mains_id BIGINT;
    brunch_drinks_id BIGINT;
    lunch_salads_id BIGINT;
    lunch_sandwiches_id BIGINT;
    lunch_soups_id BIGINT;
BEGIN
    -- Loop through clients that are linked to organizations
    FOR client_record IN 
        SELECT id FROM clients WHERE organization_id IS NOT NULL
        LIMIT 5  -- Limit to first 5 clients to avoid too much data
    LOOP
        -- ====================================================================
        -- DINNER MENU - Get or create categories
        -- ====================================================================
        
        -- Starters category
        SELECT id INTO starters_category_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'dinner'
        AND slug = 'starters'
        LIMIT 1;
        
        IF starters_category_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'dinner', 'Starters', 'starters', 0, true)
            RETURNING id INTO starters_category_id;
        END IF;
        
        -- Mains category
        SELECT id INTO mains_category_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'dinner'
        AND slug = 'mains'
        LIMIT 1;
        
        IF mains_category_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'dinner', 'Mains', 'mains', 1, true)
            RETURNING id INTO mains_category_id;
        END IF;
        
        -- Desserts category
        SELECT id INTO desserts_category_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'dinner'
        AND slug = 'desserts'
        LIMIT 1;
        
        IF desserts_category_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'dinner', 'Desserts', 'desserts', 2, true)
            RETURNING id INTO desserts_category_id;
        END IF;
        
        -- ====================================================================
        -- DINNER MENU ITEMS
        -- ====================================================================
        
        -- Starters
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Garlic Bread' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, starters_category_id, 'dinner', 'Garlic Bread', 'Fresh baked bread with garlic butter and herbs', 599, true, false, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Bruschetta' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, starters_category_id, 'dinner', 'Bruschetta', 'Toasted bread topped with fresh tomatoes, basil, and mozzarella', 850, true, true, 1);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Caesar Salad' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, starters_category_id, 'dinner', 'Caesar Salad', 'Crisp romaine lettuce with Caesar dressing, parmesan, and croutons', 1200, true, false, 2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Mozzarella Sticks' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, starters_category_id, 'dinner', 'Mozzarella Sticks', 'Crispy fried mozzarella with marinara sauce', 899, true, false, 3);
        END IF;
        
        -- Mains
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Grilled Salmon' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, mains_category_id, 'dinner', 'Grilled Salmon', 'Fresh Atlantic salmon with lemon butter, served with roasted vegetables', 2899, true, true, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Ribeye Steak' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, mains_category_id, 'dinner', 'Ribeye Steak', '12oz prime ribeye, cooked to perfection, with garlic mashed potatoes', 3499, true, true, 1);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Chicken Parmesan' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, mains_category_id, 'dinner', 'Chicken Parmesan', 'Breaded chicken breast with marinara sauce and melted mozzarella, served over pasta', 2299, true, false, 2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Vegetarian Risotto' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, mains_category_id, 'dinner', 'Vegetarian Risotto', 'Creamy arborio rice with seasonal vegetables and parmesan', 1899, true, false, 3);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Pasta Carbonara' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, mains_category_id, 'dinner', 'Pasta Carbonara', 'Classic Italian pasta with bacon, eggs, and parmesan cheese', 1999, true, false, 4);
        END IF;
        
        -- Desserts
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Tiramisu' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, desserts_category_id, 'dinner', 'Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 999, true, true, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Chocolate Lava Cake' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, desserts_category_id, 'dinner', 'Chocolate Lava Cake', 'Warm chocolate cake with a molten center, served with vanilla ice cream', 1099, true, false, 1);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Cheesecake' AND menu_type = 'dinner') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, desserts_category_id, 'dinner', 'Cheesecake', 'New York style cheesecake with berry compote', 899, true, false, 2);
        END IF;
        
        -- ====================================================================
        -- BRUNCH MENU - Create categories
        -- ====================================================================
        
        -- Brunch Appetizers
        SELECT id INTO brunch_appetizers_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'brunch'
        AND slug = 'appetizers'
        LIMIT 1;
        
        IF brunch_appetizers_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'brunch', 'Appetizers', 'appetizers', 0, true)
            RETURNING id INTO brunch_appetizers_id;
        END IF;
        
        -- Brunch Mains
        SELECT id INTO brunch_mains_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'brunch'
        AND slug = 'mains'
        LIMIT 1;
        
        IF brunch_mains_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'brunch', 'Mains', 'mains', 1, true)
            RETURNING id INTO brunch_mains_id;
        END IF;
        
        -- Brunch Drinks
        SELECT id INTO brunch_drinks_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'brunch'
        AND slug = 'drinks'
        LIMIT 1;
        
        IF brunch_drinks_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'brunch', 'Drinks', 'drinks', 2, true)
            RETURNING id INTO brunch_drinks_id;
        END IF;
        
        -- ====================================================================
        -- BRUNCH MENU ITEMS
        -- ====================================================================
        
        -- Brunch Appetizers
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Fresh Fruit Bowl' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_appetizers_id, 'brunch', 'Fresh Fruit Bowl', 'Seasonal fresh fruits with yogurt', 699, true, false, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Avocado Toast' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_appetizers_id, 'brunch', 'Avocado Toast', 'Sourdough toast with smashed avocado, cherry tomatoes, and poached egg', 1299, true, true, 1);
        END IF;
        
        -- Brunch Mains
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Eggs Benedict' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_mains_id, 'brunch', 'Eggs Benedict', 'Poached eggs on English muffin with Canadian bacon and hollandaise', 1699, true, true, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Belgian Waffles' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_mains_id, 'brunch', 'Belgian Waffles', 'Crispy waffles with maple syrup, butter, and fresh berries', 1299, true, false, 1);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'French Toast' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_mains_id, 'brunch', 'French Toast', 'Brioche French toast with cinnamon, powdered sugar, and maple syrup', 1199, true, false, 2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Breakfast Burrito' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_mains_id, 'brunch', 'Breakfast Burrito', 'Scrambled eggs, bacon, cheese, and potatoes wrapped in a flour tortilla', 1399, true, false, 3);
        END IF;
        
        -- Brunch Drinks
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Mimosa' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_drinks_id, 'brunch', 'Mimosa', 'Champagne and fresh orange juice', 899, true, false, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Fresh Orange Juice' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_drinks_id, 'brunch', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 499, true, false, 1);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Coffee' AND menu_type = 'brunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, brunch_drinks_id, 'brunch', 'Coffee', 'Freshly brewed coffee', 399, true, false, 2);
        END IF;
        
        -- ====================================================================
        -- LUNCH MENU - Create categories
        -- ====================================================================
        
        -- Lunch Salads
        SELECT id INTO lunch_salads_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'lunch'
        AND slug = 'salads'
        LIMIT 1;
        
        IF lunch_salads_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'lunch', 'Salads', 'salads', 0, true)
            RETURNING id INTO lunch_salads_id;
        END IF;
        
        -- Lunch Sandwiches
        SELECT id INTO lunch_sandwiches_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'lunch'
        AND slug = 'sandwiches'
        LIMIT 1;
        
        IF lunch_sandwiches_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'lunch', 'Sandwiches', 'sandwiches', 1, true)
            RETURNING id INTO lunch_sandwiches_id;
        END IF;
        
        -- Lunch Soups
        SELECT id INTO lunch_soups_id
        FROM menu_categories
        WHERE client_id = client_record.id
        AND menu_type = 'lunch'
        AND slug = 'soups'
        LIMIT 1;
        
        IF lunch_soups_id IS NULL THEN
            INSERT INTO menu_categories (client_id, menu_type, name, slug, sort_order, is_active)
            VALUES (client_record.id, 'lunch', 'Soups', 'soups', 2, true)
            RETURNING id INTO lunch_soups_id;
        END IF;
        
        -- ====================================================================
        -- LUNCH MENU ITEMS
        -- ====================================================================
        
        -- Lunch Salads
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Garden Salad' AND menu_type = 'lunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, lunch_salads_id, 'lunch', 'Garden Salad', 'Mixed greens with tomatoes, cucumbers, carrots, and house dressing', 999, true, false, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Cobb Salad' AND menu_type = 'lunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, lunch_salads_id, 'lunch', 'Cobb Salad', 'Romaine lettuce with chicken, bacon, eggs, avocado, and blue cheese', 1499, true, true, 1);
        END IF;
        
        -- Lunch Sandwiches
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Club Sandwich' AND menu_type = 'lunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, lunch_sandwiches_id, 'lunch', 'Club Sandwich', 'Triple-decker with turkey, bacon, lettuce, tomato, and mayo', 1399, true, false, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Grilled Chicken Sandwich' AND menu_type = 'lunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, lunch_sandwiches_id, 'lunch', 'Grilled Chicken Sandwich', 'Grilled chicken breast with lettuce, tomato, and chipotle mayo', 1299, true, false, 1);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Veggie Wrap' AND menu_type = 'lunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, lunch_sandwiches_id, 'lunch', 'Veggie Wrap', 'Fresh vegetables, hummus, and feta cheese in a whole wheat tortilla', 1099, true, false, 2);
        END IF;
        
        -- Lunch Soups
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Tomato Soup' AND menu_type = 'lunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, lunch_soups_id, 'lunch', 'Tomato Soup', 'Creamy tomato soup with fresh basil', 699, true, false, 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM menu_items WHERE client_id = client_record.id AND name = 'Chicken Noodle Soup' AND menu_type = 'lunch') THEN
            INSERT INTO menu_items (client_id, menu_category_id, menu_type, name, description, price_cents, is_visible, is_featured, position)
            VALUES (client_record.id, lunch_soups_id, 'lunch', 'Chicken Noodle Soup', 'Classic comfort soup with tender chicken and egg noodles', 899, true, false, 1);
        END IF;
        
    END LOOP;
END $$;

