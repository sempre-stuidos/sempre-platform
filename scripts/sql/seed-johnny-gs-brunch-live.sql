-- ============================================================================
-- Seed Johnny G's Brunch Business with Home Page and Sections (Idempotent)
-- Based on seed-johnny-gs-brunch.ts
-- ============================================================================

DO $$
DECLARE
  v_business_name TEXT := 'Johnny G''s Brunch';
  v_business_slug TEXT := 'johnny-gs-brunch';
  v_business_type TEXT := 'restaurant';
  v_business_id UUID;
  v_page_id UUID;
  v_section_id UUID;
  v_admin_user_id UUID;
  v_section_content JSONB;
BEGIN
  RAISE NOTICE 'Seeding Johnny G''s Brunch business...';
  
  -- Try to find admin user (yolxanderjaca@gmail.com) for creator
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'yolxanderjaca@gmail.com'
  LIMIT 1;
  
  -- Check if business already exists
  SELECT id INTO v_business_id
  FROM businesses
  WHERE name = v_business_name OR slug = v_business_slug
  LIMIT 1;
  
  IF v_business_id IS NULL THEN
    -- Create business
    INSERT INTO businesses (
      name, type, slug, description, address, phone, email, website, status, created_at, updated_at
    )
    VALUES (
      v_business_name,
      v_business_type,
      v_business_slug,
      'A cozy neighborhood restaurant serving fresh brunch and dinner with a focus on comfort food and community. Established in 1975.',
      '478 Parliament St, Toronto, ON M5A 2L3',
      '+16473683877',
      'johnnygs478@gmail.com',
      'https://johnnygsrestaurant.ca',
      'active',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_business_id;
    
    RAISE NOTICE 'Created business: % (ID: %)', v_business_name, v_business_id;
  ELSE
    RAISE NOTICE 'Business already exists: % (ID: %)', v_business_name, v_business_id;
  END IF;
  
  -- Check if Home page exists
  SELECT id INTO v_page_id
  FROM pages
  WHERE org_id = v_business_id AND slug = 'home'
  LIMIT 1;
  
  IF v_page_id IS NULL THEN
    -- Create Home page
    INSERT INTO pages (
      org_id, name, slug, template, status, created_at, updated_at
    )
    VALUES (
      v_business_id,
      'Home Page',
      'home',
      'default_home',
      'published',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_page_id;
    
    RAISE NOTICE 'Created Home page (ID: %)', v_page_id;
  ELSE
    RAISE NOTICE 'Home page already exists (ID: %)', v_page_id;
  END IF;
  
  -- Create/update HomeHeroSection
  RAISE NOTICE 'Creating/updating HomeHeroSection...';
  
  -- Build section content based on content.json data
  v_section_content := jsonb_build_object(
    'address', '478 PARLIAMENT ST',
    'title', 'JOHNNY G''s',
    'subtitle', 'Brunch',
    'established', 'EST 1975',
    'daysLabel', 'MONDAY - SUNDAY',
    'day', jsonb_build_object(
      'description', 'Have brunch at one of the oldest Restaurants in Cabbagetown',
      'hours', '7:00 AM – 4:00 PM',
      'heroImage', '/home/brunch-frame-bg.jpg'
    ),
    'night', jsonb_build_object(
      'description', 'Have dinner at one of the oldest Restaurants in Cabbagetown',
      'hours', '7:00 PM – 12:00 AM',
      'heroImage', '/home/jazz-frame.jpg'
    ),
    'reservationPhone', '+16473683877',
    'reservationLabel', 'Reserve a Table'
  );
  
  SELECT id INTO v_section_id
  FROM page_sections_v2
  WHERE page_id = v_page_id AND key = 'home_hero';
  
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (
      page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at
    )
    VALUES (
      v_page_id, v_business_id, 'home_hero', 'Home Hero Section', 'HomeHeroSection', 1, v_section_content, v_section_content, 'published', NOW(), NOW()
    );
    RAISE NOTICE '  Created section: Home Hero Section';
  ELSE
    UPDATE page_sections_v2
    SET label = 'Home Hero Section',
        component = 'HomeHeroSection',
        position = 1,
        published_content = v_section_content,
        draft_content = v_section_content,
        status = 'published',
        updated_at = NOW()
    WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Home Hero Section';
  END IF;
  
  RAISE NOTICE '✅ Johnny G''s Brunch seeding completed successfully!';
  RAISE NOTICE '   Business ID: %', v_business_id;
  RAISE NOTICE '   Page ID: %', v_page_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error seeding Johnny G''s Brunch: %', SQLERRM;
    RAISE;
END $$;















