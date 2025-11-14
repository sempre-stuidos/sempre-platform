-- ============================================================================
-- Seed Home Page with Sections
-- This creates a default "Home Page" for organizations that need it
-- ============================================================================

-- Note: This migration seeds data for a default organization
-- In production, you would run this per organization or use a script

-- Function to seed home page for an organization
CREATE OR REPLACE FUNCTION seed_home_page_for_org(org_uuid UUID)
RETURNS UUID AS $$
DECLARE
  page_uuid UUID;
  section_uuid UUID;
BEGIN
  -- Create Home Page
  INSERT INTO pages (org_id, name, slug, template, status)
  VALUES (org_uuid, 'Home Page', 'home', 'default_home', 'published')
  ON CONFLICT (org_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    template = EXCLUDED.template
  RETURNING id INTO page_uuid;

  -- If page already exists, get its ID
  IF page_uuid IS NULL THEN
    SELECT id INTO page_uuid FROM pages WHERE org_id = org_uuid AND slug = 'home';
  END IF;

  -- Create InfoBar section
  INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status)
  VALUES (
    page_uuid,
    org_uuid,
    'info_bar',
    'Top Bar – Hours Strip',
    'InfoBar',
    1,
    '{"hours": "Hours: 5PM - 11PM Daily", "phone": "+1 (555) 123-4567", "tagline": "Fine Dining Experience"}'::jsonb,
    '{"hours": "Hours: 5PM - 11PM Daily", "phone": "+1 (555) 123-4567", "tagline": "Fine Dining Experience"}'::jsonb,
    'published'
  )
  ON CONFLICT (page_id, key) DO NOTHING;

  -- Create Hero section
  INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status)
  VALUES (
    page_uuid,
    org_uuid,
    'hero_welcome',
    'Hero – Welcome to Restaurant',
    'HeroWelcome',
    2,
    '{"title": "Culinary Excellence", "subtitle": "Experience an unforgettable evening of refined cuisine and impeccable service", "ctaLabel": "View Our Menu", "imageUrl": "/elegant-restaurant-interior.png"}'::jsonb,
    '{"title": "Culinary Excellence", "subtitle": "Experience an unforgettable evening of refined cuisine and impeccable service", "ctaLabel": "View Our Menu", "imageUrl": "/elegant-restaurant-interior.png"}'::jsonb,
    'published'
  )
  ON CONFLICT (page_id, key) DO NOTHING;

  -- Create WhyWeStand section
  INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status)
  VALUES (
    page_uuid,
    org_uuid,
    'why_we_stand',
    'Why People Love Us',
    'WhyWeStand',
    3,
    '{"reasons": [{"title": "Seasonal Ingredients", "description": "We source the finest locally-grown produce, partnering with regional farmers for the freshest offerings each season."}, {"title": "Expert Preparation", "description": "Our award-winning chefs bring years of international experience to every plate, crafting dishes that tell a story."}, {"title": "Refined Ambiance", "description": "Intimate lighting, carefully curated acoustics, and thoughtful design create the perfect setting for your special occasion."}]}'::jsonb,
    '{"reasons": [{"title": "Seasonal Ingredients", "description": "We source the finest locally-grown produce, partnering with regional farmers for the freshest offerings each season."}, {"title": "Expert Preparation", "description": "Our award-winning chefs bring years of international experience to every plate, crafting dishes that tell a story."}, {"title": "Refined Ambiance", "description": "Intimate lighting, carefully curated acoustics, and thoughtful design create the perfect setting for your special occasion."}]}'::jsonb,
    'published'
  )
  ON CONFLICT (page_id, key) DO NOTHING;

  -- Create Specialties section
  INSERT INTO page_sections_v2 (page_id, org_id, key, label, component, position, published_content, draft_content, status)
  VALUES (
    page_uuid,
    org_uuid,
    'specialties',
    'Our Specialties',
    'Specialties',
    4,
    '{"specialties": [{"title": "Breakfast Classics", "description": "Start your day with our signature morning selections, from delicate pastries to hearty egg preparations.", "image": "/gourmet-breakfast.png"}, {"title": "Evening Tasting Menu", "description": "Our chef''s carefully curated multi-course experience, showcasing the best of seasonal cuisine.", "image": "/fine-dining-tasting-menu-plating.jpg"}]}'::jsonb,
    '{"specialties": [{"title": "Breakfast Classics", "description": "Start your day with our signature morning selections, from delicate pastries to hearty egg preparations.", "image": "/gourmet-breakfast.png"}, {"title": "Evening Tasting Menu", "description": "Our chef''s carefully curated multi-course experience, showcasing the best of seasonal cuisine.", "image": "/fine-dining-tasting-menu-plating.jpg"}]}'::jsonb,
    'published'
  )
  ON CONFLICT (page_id, key) DO NOTHING;

  RETURN page_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION seed_home_page_for_org IS 'Seeds a default home page with sections for an organization';

