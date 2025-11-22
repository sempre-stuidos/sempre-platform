-- ============================================================================
-- Seed Luxivie Business with Home Page and Sections (Idempotent)
-- Based on seed-luxivie-complete.ts
-- ============================================================================

DO $$
DECLARE
  v_business_name TEXT := 'Luxivie';
  v_business_slug TEXT := 'luxivie';
  v_business_type TEXT := 'retail';
  v_business_id UUID;
  v_page_id UUID;
  v_section_id UUID;
  v_admin_user_id UUID;
  v_section_content JSONB;
BEGIN
  RAISE NOTICE 'Seeding Luxivie business...';
  
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
      'Clean beauty crafted with care in Canada. Luxurious hair care and skincare with clean ingredients, gentle botanicals, and modern science.',
      'Toronto, Ontario, Canada',
      '+1 (555) 987-6543',
      'hello@luxivie.com',
      'https://www.luxivie.com',
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
  
  -- Section 1: hero_section
  v_section_content := '{"badge": {"icon": "Leaf", "text": "Made in Canada"}, "title": "Clean Beauty That Works—Made With Care in Canada", "subtitle": "Luxurious hair care and skincare crafted with clean ingredients, gentle botanicals, and modern science.", "primaryCta": {"label": "Shop Bestsellers", "href": "#products"}, "secondaryCta": {"label": "See Our Ingredients", "href": "#ingredients"}, "heroImage": "https://images.unsplash.com/photo-1739980213756-753aea153bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBwcm9kdWN0JTIwbWFyYmxlfGVufDF8fHx8MTc2MzQ5NzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080", "accentImage": "https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080"}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'hero_section';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'hero_section', 'Hero Section', 'HeroSection', 1, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Hero Section';
  ELSE
    UPDATE page_sections_v2 SET label = 'Hero Section', component = 'HeroSection', position = 1, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Hero Section';
  END IF;
  
  -- Section 2: brand_promise
  v_section_content := '{"promises": [{"icon": "MapPin", "title": "Made in Canada", "description": "Crafted with clean formulas in trusted GMP-certified facilities."}, {"icon": "FlaskConical", "title": "Backed by Clean Science", "description": "Effective botanical ingredients—safe, gentle, and performance-driven."}, {"icon": "Sparkles", "title": "Luxurious Yet Affordable", "description": "Premium results without premium pricing."}]}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'brand_promise';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'brand_promise', 'Brand Promise', 'BrandPromise', 2, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Brand Promise';
  ELSE
    UPDATE page_sections_v2 SET label = 'Brand Promise', component = 'BrandPromise', position = 2, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Brand Promise';
  END IF;
  
  -- Section 3: ingredient_transparency
  v_section_content := '{"title": "Pure, Tested, and Transparent", "subtitle": "Every ingredient is chosen for a reason", "ingredients": [{"icon": "Leaf", "name": "Rosemary Extract", "benefit": "Scalp stimulation"}, {"icon": "Droplets", "name": "Peppermint Oil", "benefit": "Cooling + soothing"}, {"icon": "Zap", "name": "Biotin", "benefit": "Strengthening"}, {"icon": "Shield", "name": "Keratin", "benefit": "Smoothing"}, {"icon": "Sparkles", "name": "Natural Oils Blend", "benefit": "Nourish + shine"}], "ctaLabel": "See Full Ingredient Breakdown"}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'ingredient_transparency';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'ingredient_transparency', 'Ingredient Transparency', 'IngredientTransparency', 3, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Ingredient Transparency';
  ELSE
    UPDATE page_sections_v2 SET label = 'Ingredient Transparency', component = 'IngredientTransparency', position = 3, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Ingredient Transparency';
  END IF;
  
  -- Section 4: featured_products
  v_section_content := '{"title": "Luxivie Bestsellers", "subtitle": "Our most-loved formulas for healthier, stronger hair", "products": [{"name": "Rosemary + Mint Hair Oil", "image": "https://images.unsplash.com/photo-1549049950-48d5887197a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb3NlbWFyeSUyMG9pbCUyMGJvdHRsZXxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080", "benefits": ["Stimulates scalp for healthier growth", "Cooling peppermint sensation", "100% natural botanical blend"], "badge": "Bestseller"}, {"name": "Rosemary Shampoo + Conditioner Set", "image": "https://images.unsplash.com/photo-1747858989102-cca0f4dc4a11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGFtcG9vJTIwYm90dGxlJTIwY2xlYW58ZW58MXx8fHwxNzYzNDk3OTI4fDA&ixlib=rb-4.1.0&q=80&w=1080", "benefits": ["Gentle cleansing without sulfates", "Strengthens & adds shine", "Safe for color-treated hair"], "badge": null}, {"name": "Biotin-Keratin Strengthening Duo", "image": "https://images.unsplash.com/photo-1739980213756-753aea153bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBwcm9kdWN0JTIwbWFyYmxlfGVufDF8fHx8MTc2MzQ5NzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080", "benefits": ["Repairs damaged strands", "Reduces breakage & split ends", "Long-lasting smoothness"], "badge": "Coming Soon"}]}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'featured_products';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'featured_products', 'Featured Products', 'FeaturedProducts', 4, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Featured Products';
  ELSE
    UPDATE page_sections_v2 SET label = 'Featured Products', component = 'FeaturedProducts', position = 4, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Featured Products';
  END IF;
  
  -- Section 5: brand_story
  v_section_content := '{"title": "Clean Beauty Rooted in Canada", "paragraphs": ["Luxivie was created to bring high-quality, clean, effective, and affordable beauty to Canadians.", "We believe that everyone deserves access to products that are both luxurious and transparent. That''s why every formula is crafted with care, using botanical ingredients backed by modern science.", "Some products are 100% made in Canada, while others are formulated here and crafted in trusted GMP-certified facilities abroad—always meeting Health Canada and FDA standards.", "From our bottles to your beauty ritual, Luxivie is a promise of purity, performance, and pride."], "image": "https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080", "ctaLabel": "Our Story"}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'brand_story';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'brand_story', 'Brand Story', 'BrandStory', 5, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Brand Story';
  ELSE
    UPDATE page_sections_v2 SET label = 'Brand Story', component = 'BrandStory', position = 5, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Brand Story';
  END IF;
  
  -- Section 6: customer_reviews
  v_section_content := '{"title": "Customer Love", "rating": 5, "subtitle": "Trusted by 10,000+ happy customers across Canada", "reviews": [{"quote": "My hair has never felt this full. The rosemary oil has become my holy grail product!", "name": "Sarah M.", "location": "Toronto, ON", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", "initials": "SM"}, {"quote": "Clean, fresh scent. Canadian brand I trust. Love supporting local businesses that care.", "name": "Jessica K.", "location": "Vancouver, BC", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica", "initials": "JK"}, {"quote": "Affordable luxury. My new go-to. Finally found products that work without breaking the bank.", "name": "Emily R.", "location": "Montreal, QC", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily", "initials": "ER"}]}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'customer_reviews';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'customer_reviews', 'Customer Reviews', 'CustomerReviews', 6, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Customer Reviews';
  ELSE
    UPDATE page_sections_v2 SET label = 'Customer Reviews', component = 'CustomerReviews', position = 6, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Customer Reviews';
  END IF;
  
  -- Section 7: how_to_use
  v_section_content := '{"title": "Your Hair Care Ritual", "subtitle": "Simple steps for transformative results", "steps": [{"number": "1", "icon": "Droplets", "title": "Apply 2–3 drops to scalp", "description": "Focus on areas that need extra care"}, {"number": "2", "icon": "HandMetal", "title": "Massage gently", "description": "Use circular motions to stimulate blood flow"}, {"number": "3", "icon": "Clock", "title": "Leave overnight or 30 minutes", "description": "Let the botanicals work their magic"}, {"number": "4", "icon": "Sparkles", "title": "Rinse with Luxivie Shampoo", "description": "For best results, use our complete system"}], "ctaLabel": "See Full Routine"}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'how_to_use';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'how_to_use', 'How To Use', 'HowToUse', 7, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: How To Use';
  ELSE
    UPDATE page_sections_v2 SET label = 'How To Use', component = 'HowToUse', position = 7, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: How To Use';
  END IF;
  
  -- Section 8: sustainability
  v_section_content := '{"title": "Sustainability + Quality", "subtitle": "Good for your hair, good for the planet", "features": [{"icon": "Leaf", "title": "Clean Ingredients", "description": "No harmful chemicals"}, {"icon": "Droplet", "title": "No Parabens / No Sulfates", "description": "Gentle on hair & scalp"}, {"icon": "Heart", "title": "Cruelty-Free", "description": "Never tested on animals"}, {"icon": "Award", "title": "GMP Certified", "description": "Quality you can trust"}, {"icon": "Recycle", "title": "Recyclable Packaging", "description": "Better for the planet"}, {"icon": "Palette", "title": "Safe for Color-Treated Hair", "description": "Protects your investment"}]}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'sustainability';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'sustainability', 'Sustainability', 'Sustainability', 8, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Sustainability';
  ELSE
    UPDATE page_sections_v2 SET label = 'Sustainability', component = 'Sustainability', position = 8, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Sustainability';
  END IF;
  
  -- Section 9: final_cta
  v_section_content := '{"title": "Ready for stronger, healthier hair?", "subtitle": "Join thousands of Canadians who''ve discovered the power of clean, botanical beauty", "primaryCta": {"label": "Shop Luxivie Now", "href": "#products"}, "accentImage": "https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080", "trustBadges": [{"icon": "Package", "text": "Fast shipping across Canada"}, {"icon": "Shield", "text": "Trusted by 10,000+ customers"}], "footer": {"brandName": "LUXIVIE", "tagline": "Clean beauty crafted with care in Canada", "links": {"shop": ["Hair Care", "Bestsellers", "Gift Sets", "New Arrivals"], "about": ["Our Story", "Ingredients", "Sustainability", "Reviews"], "support": ["Contact Us", "FAQs", "Shipping", "Returns"]}, "copyright": "© 2025 Luxivie. All rights reserved. Made with care in Canada. 🍁"}}'::jsonb;
  SELECT id INTO v_section_id FROM page_sections_v2 WHERE page_id = v_page_id AND key = 'final_cta';
  IF v_section_id IS NULL THEN
    INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status, created_at, updated_at)
    VALUES (v_page_id, v_business_id, 'final_cta', 'Final CTA', 'FinalCTA', 9, v_section_content, v_section_content, 'published', NOW(), NOW());
    RAISE NOTICE '  Created section: Final CTA';
  ELSE
    UPDATE page_sections_v2 SET label = 'Final CTA', component = 'FinalCTA', position = 9, published_content = v_section_content, draft_content = v_section_content, status = 'published', updated_at = NOW() WHERE id = v_section_id;
    RAISE NOTICE '  Updated section: Final CTA';
  END IF;
  
  RAISE NOTICE '✅ Luxivie seeding completed successfully!';
  RAISE NOTICE '   Business ID: %', v_business_id;
  RAISE NOTICE '   Page ID: %', v_page_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error seeding Luxivie: %', SQLERRM;
    RAISE;
END $$;

