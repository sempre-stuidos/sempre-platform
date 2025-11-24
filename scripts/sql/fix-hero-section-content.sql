-- ============================================================================
-- Fix Hero Section Content Structure
-- This script fixes malformed hero section content to match the expected structure
-- ============================================================================

DO $$
DECLARE
  v_section_id UUID;
  v_current_content JSONB;
  v_fixed_content JSONB;
  v_badge_content JSONB;
BEGIN
  RAISE NOTICE 'Fixing hero section content structure...';
  
  -- Find all HeroSection components
  FOR v_section_id IN 
    SELECT id FROM page_sections_v2 WHERE component = 'HeroSection'
  LOOP
    -- Get current content (prefer draft, fallback to published)
    SELECT 
      COALESCE(draft_content, published_content, '{}'::jsonb)
    INTO v_current_content
    FROM page_sections_v2
    WHERE id = v_section_id;
    
    -- Initialize fixed content with default structure
    v_fixed_content := '{
      "badge": {"icon": "Leaf", "text": "Made in Canada"},
      "title": "Clean Beauty That Works—Made With Care in Canada",
      "subtitle": "Luxurious hair care and skincare crafted with clean ingredients, gentle botanicals, and modern science.",
      "primaryCta": {"label": "Shop Bestsellers", "href": "#products"},
      "secondaryCta": {"label": "See Our Ingredients", "href": "#ingredients"},
      "heroImage": "https://images.unsplash.com/photo-1739980213756-753aea153bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBwcm9kdWN0JTIwbWFyYmxlfGVufDF8fHx8MTc2MzQ5NzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      "accentImage": "https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080"
    }'::jsonb;
    
    -- Fix badge: if content has icon/text at top level, move them into badge object
    IF v_current_content ? 'icon' AND v_current_content ? 'text' THEN
      v_badge_content := jsonb_build_object(
        'icon', v_current_content->>'icon',
        'text', v_current_content->>'text'
      );
      v_fixed_content := jsonb_set(v_fixed_content, '{badge}', v_badge_content);
      RAISE NOTICE '  Fixed badge structure for section %', v_section_id;
    ELSIF v_current_content ? 'badge' AND jsonb_typeof(v_current_content->'badge') = 'object' THEN
      -- Badge already exists and is an object, preserve it
      v_fixed_content := jsonb_set(v_fixed_content, '{badge}', v_current_content->'badge');
    END IF;
    
    -- Fix title: if content has title nested in object, extract it
    IF v_current_content ? 'title' THEN
      IF jsonb_typeof(v_current_content->'title') = 'object' THEN
        -- Title is nested object like {"title": "..."}, extract the inner value
        IF v_current_content->'title' ? 'title' THEN
          v_fixed_content := jsonb_set(v_fixed_content, '{title}', to_jsonb(v_current_content->'title'->>'title'));
        ELSIF v_current_content->'title' ? 'value' THEN
          v_fixed_content := jsonb_set(v_fixed_content, '{title}', to_jsonb(v_current_content->'title'->>'value'));
        END IF;
      ELSIF jsonb_typeof(v_current_content->'title') = 'string' THEN
        -- Title is already a string, use it
        v_fixed_content := jsonb_set(v_fixed_content, '{title}', v_current_content->'title');
      END IF;
    END IF;
    
    -- Preserve other valid fields if they exist
    IF v_current_content ? 'subtitle' AND jsonb_typeof(v_current_content->'subtitle') = 'string' THEN
      v_fixed_content := jsonb_set(v_fixed_content, '{subtitle}', v_current_content->'subtitle');
    END IF;
    
    IF v_current_content ? 'primaryCta' AND jsonb_typeof(v_current_content->'primaryCta') = 'object' THEN
      v_fixed_content := jsonb_set(v_fixed_content, '{primaryCta}', v_current_content->'primaryCta');
    END IF;
    
    IF v_current_content ? 'secondaryCta' AND jsonb_typeof(v_current_content->'secondaryCta') = 'object' THEN
      v_fixed_content := jsonb_set(v_fixed_content, '{secondaryCta}', v_current_content->'secondaryCta');
    END IF;
    
    IF v_current_content ? 'heroImage' AND jsonb_typeof(v_current_content->'heroImage') = 'string' THEN
      v_fixed_content := jsonb_set(v_fixed_content, '{heroImage}', v_current_content->'heroImage');
    END IF;
    
    IF v_current_content ? 'accentImage' AND jsonb_typeof(v_current_content->'accentImage') = 'string' THEN
      v_fixed_content := jsonb_set(v_fixed_content, '{accentImage}', v_current_content->'accentImage');
    END IF;
    
    -- Update both draft_content and published_content
    UPDATE page_sections_v2
    SET 
      draft_content = v_fixed_content,
      published_content = COALESCE(
        CASE WHEN draft_content IS NOT NULL THEN v_fixed_content ELSE NULL END,
        v_fixed_content
      ),
      status = CASE 
        WHEN draft_content IS DISTINCT FROM published_content THEN 'dirty'
        ELSE 'published'
      END,
      updated_at = NOW()
    WHERE id = v_section_id;
    
    RAISE NOTICE '  Updated section % with fixed content structure', v_section_id;
  END LOOP;
  
  RAISE NOTICE '✅ Hero section content structure fixed!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error fixing hero section content: %', SQLERRM;
    RAISE;
END $$;

