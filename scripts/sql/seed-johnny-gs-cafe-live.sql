-- ============================================================================
-- Seed Johnny G's Cafe Business with Home Page and Sections (Idempotent)
-- Based on seed-johnny-gs-cafe-complete.ts
-- ============================================================================

DO $$
DECLARE
  v_business_name TEXT := 'Johnny G''s Cafe';
  v_business_slug TEXT := 'johnny-gs-cafe';
  v_business_type TEXT := 'restaurant';
  v_business_id UUID;
  v_page_id UUID;
  v_section_id UUID;
  v_admin_user_id UUID;
  v_section_content JSONB;
BEGIN
  RAISE NOTICE 'Seeding Johnny G''s Cafe business...';
  
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
      'A cozy neighborhood cafe serving fresh, locally-sourced ingredients with a focus on comfort food and community.',
      '123 Main Street, Downtown District, CA 90210',
      '+1 (555) 123-4567',
      'info@johnnygscafe.com',
      'https://www.johnnygscafe.com',
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
  
  -- Create/update sections
  RAISE NOTICE 'Creating/updating page sections...';
  
  -- Section 1: info_bar
  v_section_content := '{"hours": "Hours: 5PM - 11PM Daily", "phone": "+1 (555) 123-4567", "tagline": "Fine Dining Experience"}'::jsonb;
  SELECT id INTO v_section_id
  FROM page_sections_v2
  WHERE page_id = v_page_id AND key = 'info_bar';
  
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (
      page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at
    )
    VALUES (
      v_page_id, v_business_id, 'info_bar', 'Top Bar – Hours Strip', 'InfoBar', 1, v_section_content, v_section_content, 'published', NOW(), NOW()
    );
    RAISE NOTICE '  Created section: Top Bar – Hours Strip';
  ELSE
    UPDATE page_sections_v2
    SET label = 'Top Bar – Hours Strip',
        component = 'InfoBar',
        position = 1,
        published_content = v_section_content,
        draft_content = v_section_content,
        status = 'published',
        updated_at = NOW()
    WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Top Bar – Hours Strip';
  END IF;
  
  -- Section 2: hero_welcome
  v_section_content := '{"title": "Culinary Excellence", "subtitle": "Experience an unforgettable evening of refined cuisine and impeccable service", "ctaLabel": "View Our Menu", "imageUrl": "/elegant-restaurant-interior.png"}'::jsonb;
  SELECT id INTO v_section_id
  FROM page_sections_v2
  WHERE page_id = v_page_id AND key = 'hero_welcome';
  
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (
      page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at
    )
    VALUES (
      v_page_id, v_business_id, 'hero_welcome', 'Hero – Welcome to Restaurant', 'HeroWelcome', 2, v_section_content, v_section_content, 'published', NOW(), NOW()
    );
    RAISE NOTICE '  Created section: Hero – Welcome to Restaurant';
  ELSE
    UPDATE page_sections_v2
    SET label = 'Hero – Welcome to Restaurant',
        component = 'HeroWelcome',
        position = 2,
        published_content = v_section_content,
        draft_content = v_section_content,
        status = 'published',
        updated_at = NOW()
    WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Hero – Welcome to Restaurant';
  END IF;
  
  -- Section 3: why_we_stand
  v_section_content := '{"reasons": [{"title": "Seasonal Ingredients", "description": "We source the finest locally-grown produce, partnering with regional farmers for the freshest offerings each season."}, {"title": "Expert Preparation", "description": "Our award-winning chefs bring years of international experience to every plate, crafting dishes that tell a story."}, {"title": "Refined Ambiance", "description": "Intimate lighting, carefully curated acoustics, and thoughtful design create the perfect setting for your special occasion."}]}'::jsonb;
  SELECT id INTO v_section_id
  FROM page_sections_v2
  WHERE page_id = v_page_id AND key = 'why_we_stand';
  
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (
      page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at
    )
    VALUES (
      v_page_id, v_business_id, 'why_we_stand', 'Why People Love Us', 'WhyWeStand', 3, v_section_content, v_section_content, 'published', NOW(), NOW()
    );
    RAISE NOTICE '  Created section: Why People Love Us';
  ELSE
    UPDATE page_sections_v2
    SET label = 'Why People Love Us',
        component = 'WhyWeStand',
        position = 3,
        published_content = v_section_content,
        draft_content = v_section_content,
        status = 'published',
        updated_at = NOW()
    WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Why People Love Us';
  END IF;
  
  -- Section 4: specialties
  v_section_content := '{"specialties": [{"title": "Breakfast Classics", "description": "Start your day with our signature morning selections, from delicate pastries to hearty egg preparations.", "image": "/gourmet-breakfast.png"}, {"title": "Evening Tasting Menu", "description": "Our chef''s carefully curated multi-course experience, showcasing the best of seasonal cuisine.", "image": "/fine-dining-tasting-menu-plating.jpg"}]}'::jsonb;
  SELECT id INTO v_section_id
  FROM page_sections_v2
  WHERE page_id = v_page_id AND key = 'specialties';
  
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (
      page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at
    )
    VALUES (
      v_page_id, v_business_id, 'specialties', 'Our Specialties', 'Specialties', 4, v_section_content, v_section_content, 'published', NOW(), NOW()
    );
    RAISE NOTICE '  Created section: Our Specialties';
  ELSE
    UPDATE page_sections_v2
    SET label = 'Our Specialties',
        component = 'Specialties',
        position = 4,
        published_content = v_section_content,
        draft_content = v_section_content,
        status = 'published',
        updated_at = NOW()
    WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Our Specialties';
  END IF;
  
  -- Section 5: gallery_teaser
  v_section_content := '{"images": ["/plated-fine-dining-dish.jpg", "/elegant-restaurant-dining-room.jpg", "/gourmet-food-presentation.jpg"], "ctaLabel": "View Full Gallery"}'::jsonb;
  SELECT id INTO v_section_id
  FROM page_sections_v2
  WHERE page_id = v_page_id AND key = 'gallery_teaser';
  
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (
      page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at
    )
    VALUES (
      v_page_id, v_business_id, 'gallery_teaser', 'Gallery Teaser', 'GalleryTeaser', 5, v_section_content, v_section_content, 'published', NOW(), NOW()
    );
    RAISE NOTICE '  Created section: Gallery Teaser';
  ELSE
    UPDATE page_sections_v2
    SET label = 'Gallery Teaser',
        component = 'GalleryTeaser',
        position = 5,
        published_content = v_section_content,
        draft_content = v_section_content,
        status = 'published',
        updated_at = NOW()
    WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Gallery Teaser';
  END IF;
  
  -- Section 6: cta_banner
  v_section_content := '{"title": "Ready to Dine with Us?", "description": "Reserve your table now and prepare for an unforgettable culinary journey", "ctaLabel": "Book Your Reservation"}'::jsonb;
  SELECT id INTO v_section_id
  FROM page_sections_v2
  WHERE page_id = v_page_id AND key = 'cta_banner';
  
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (
      page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at
    )
    VALUES (
      v_page_id, v_business_id, 'cta_banner', 'Call to Action Banner', 'CTABanner', 6, v_section_content, v_section_content, 'published', NOW(), NOW()
    );
    RAISE NOTICE '  Created section: Call to Action Banner';
  ELSE
    UPDATE page_sections_v2
    SET label = 'Call to Action Banner',
        component = 'CTABanner',
        position = 6,
        published_content = v_section_content,
        draft_content = v_section_content,
        status = 'published',
        updated_at = NOW()
    WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Call to Action Banner';
  END IF;
  
  RAISE NOTICE '✅ Johnny G''s Cafe seeding completed successfully!';
  RAISE NOTICE '   Business ID: %', v_business_id;
  RAISE NOTICE '   Page ID: %', v_page_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error seeding Johnny G''s Cafe: %', SQLERRM;
    RAISE;
END $$;

