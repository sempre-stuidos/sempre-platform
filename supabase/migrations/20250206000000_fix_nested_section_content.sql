-- ============================================================================
-- Fix Nested Section Content Structures
-- This migration fixes sections where heroImage (or other fields) contain
-- nested objects instead of the expected flat structure.
-- Ensures all sections match the Zod schema validation requirements.
-- ============================================================================

DO $$
DECLARE
  v_section RECORD;
  v_draft_content JSONB;
  v_published_content JSONB;
  v_fixed_draft JSONB;
  v_fixed_published JSONB;
  v_hero_image_url TEXT;
  v_accent_image_url TEXT;
BEGIN
  RAISE NOTICE 'Fixing nested section content structures...';
  
  -- Process all sections
  FOR v_section IN 
    SELECT id, component, draft_content, published_content
    FROM page_sections_v2
    WHERE component IN (
      'HeroSection', 'HeroWelcome', 'BrandPromise', 'IngredientTransparency',
      'FeaturedProducts', 'BrandStory', 'CustomerReviews', 'HowToUse',
      'Sustainability', 'FinalCTA', 'InfoBar', 'PromoCard', 'WhyWeStand',
      'Specialties', 'GalleryTeaser', 'CTABanner'
    )
  LOOP
    v_fixed_draft := v_section.draft_content;
    v_fixed_published := v_section.published_content;
    v_draft_content := COALESCE(v_section.draft_content, '{}'::jsonb);
    v_published_content := COALESCE(v_section.published_content, '{}'::jsonb);
    
    -- Fix HeroSection and HeroWelcome components
    IF v_section.component IN ('HeroSection', 'HeroWelcome') THEN
      -- Fix draft_content: if heroImage is an object, extract the URL or flatten it
      IF v_draft_content ? 'heroImage' THEN
        IF jsonb_typeof(v_draft_content->'heroImage') = 'object' THEN
          -- heroImage is an object - this is the bug we're fixing
          -- Try to extract a URL from common fields
          v_hero_image_url := COALESCE(
            v_draft_content->'heroImage'->>'heroImage',
            v_draft_content->'heroImage'->>'imageUrl',
            v_draft_content->'heroImage'->>'url',
            v_draft_content->'heroImage'->>'src',
            v_draft_content->'heroImage'->>'value',
            '' -- Default to empty if we can't find a URL
          );
          
          -- If we found a URL, use it; otherwise keep existing or use default
          IF v_hero_image_url = '' AND v_draft_content->'heroImage' ? 'badge' THEN
            -- This looks like a nested hero object - extract heroImage from it
            v_hero_image_url := COALESCE(
              v_draft_content->'heroImage'->>'heroImage',
              'https://images.unsplash.com/photo-1739980213756-753aea153bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBwcm9kdWN0JTIwbWFyYmxlfGVufDF8fHx8MTc2MzQ5NzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080'
            );
          END IF;
          
          -- Update heroImage to be a string URL
          v_fixed_draft := jsonb_set(
            COALESCE(v_fixed_draft, '{}'::jsonb),
            '{heroImage}',
            to_jsonb(v_hero_image_url)
          );
          
          RAISE NOTICE '  Fixed draft heroImage for section % (was object, now string)', v_section.id;
        END IF;
      END IF;
      
      -- Fix accentImage in draft_content
      IF v_draft_content ? 'accentImage' THEN
        IF jsonb_typeof(v_draft_content->'accentImage') = 'object' THEN
          v_accent_image_url := COALESCE(
            v_draft_content->'accentImage'->>'accentImage',
            v_draft_content->'accentImage'->>'imageUrl',
            v_draft_content->'accentImage'->>'url',
            v_draft_content->'accentImage'->>'src',
            v_draft_content->'accentImage'->>'value',
            'https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080'
          );
          
          v_fixed_draft := jsonb_set(
            COALESCE(v_fixed_draft, '{}'::jsonb),
            '{accentImage}',
            to_jsonb(v_accent_image_url)
          );
          
          RAISE NOTICE '  Fixed draft accentImage for section % (was object, now string)', v_section.id;
        END IF;
      END IF;
      
      -- Fix published_content: same logic
      IF v_published_content ? 'heroImage' THEN
        IF jsonb_typeof(v_published_content->'heroImage') = 'object' THEN
          v_hero_image_url := COALESCE(
            v_published_content->'heroImage'->>'heroImage',
            v_published_content->'heroImage'->>'imageUrl',
            v_published_content->'heroImage'->>'url',
            v_published_content->'heroImage'->>'src',
            v_published_content->'heroImage'->>'value',
            ''
          );
          
          IF v_hero_image_url = '' AND v_published_content->'heroImage' ? 'badge' THEN
            v_hero_image_url := COALESCE(
              v_published_content->'heroImage'->>'heroImage',
              'https://images.unsplash.com/photo-1739980213756-753aea153bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBwcm9kdWN0JTIwbWFyYmxlfGVufDF8fHx8MTc2MzQ5NzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080'
            );
          END IF;
          
          v_fixed_published := jsonb_set(
            COALESCE(v_fixed_published, '{}'::jsonb),
            '{heroImage}',
            to_jsonb(v_hero_image_url)
          );
          
          RAISE NOTICE '  Fixed published heroImage for section % (was object, now string)', v_section.id;
        END IF;
      END IF;
      
      IF v_published_content ? 'accentImage' THEN
        IF jsonb_typeof(v_published_content->'accentImage') = 'object' THEN
          v_accent_image_url := COALESCE(
            v_published_content->'accentImage'->>'accentImage',
            v_published_content->'accentImage'->>'imageUrl',
            v_published_content->'accentImage'->>'url',
            v_published_content->'accentImage'->>'src',
            v_published_content->'accentImage'->>'value',
            'https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080'
          );
          
          v_fixed_published := jsonb_set(
            COALESCE(v_fixed_published, '{}'::jsonb),
            '{accentImage}',
            to_jsonb(v_accent_image_url)
          );
          
          RAISE NOTICE '  Fixed published accentImage for section % (was object, now string)', v_section.id;
        END IF;
      END IF;
    END IF;
    
    -- Update the section if we made any changes
    IF v_fixed_draft IS DISTINCT FROM v_section.draft_content 
       OR v_fixed_published IS DISTINCT FROM v_section.published_content THEN
      
      UPDATE page_sections_v2
      SET 
        draft_content = v_fixed_draft,
        published_content = v_fixed_published,
        status = CASE 
          WHEN v_fixed_draft IS DISTINCT FROM v_fixed_published THEN 'dirty'
          ELSE 'published'
        END,
        updated_at = NOW()
      WHERE id = v_section.id;
      
      RAISE NOTICE '  ✅ Updated section % (component: %)', v_section.id, v_section.component;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ All nested section content structures fixed!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error fixing nested section content: %', SQLERRM;
    RAISE;
END $$;














