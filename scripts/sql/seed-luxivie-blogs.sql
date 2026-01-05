-- ============================================================================
-- Seed Luxivie Business with Blog Posts (Idempotent)
-- Creates 3 blog posts related to Luxivie products and hair care
-- ============================================================================

DO $$
DECLARE
  v_business_slug TEXT := 'luxivie';
  v_business_id UUID;
  v_blog_count INTEGER;
BEGIN
  RAISE NOTICE 'Seeding Luxivie blog posts...';
  
  -- Get Luxivie business ID
  SELECT id INTO v_business_id
  FROM businesses
  WHERE slug = v_business_slug OR name ILIKE '%luxivie%'
  LIMIT 1;
  
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Luxivie business not found. Please create the business first.';
  END IF;
  
  RAISE NOTICE 'Found business: % (ID: %)', v_business_slug, v_business_id;
  
  -- Check existing blogs count
  SELECT COUNT(*) INTO v_blog_count
  FROM blogs
  WHERE business_id = v_business_id;
  
  RAISE NOTICE 'Existing blogs for Luxivie: %', v_blog_count;
  
  -- Blog 1: Natural Hair Care Ingredients
  IF NOT EXISTS (
    SELECT 1 FROM blogs 
    WHERE business_id = v_business_id 
    AND slug = 'natural-hair-care-ingredients-guide'
  ) THEN
    INSERT INTO blogs (
      business_id,
      title,
      slug,
      excerpt,
      content,
      author,
      category,
      tags,
      status,
      published_at,
      read_time,
      seo_title,
      seo_description,
      created_at,
      updated_at
    ) VALUES (
      v_business_id,
      'The Ultimate Guide to Natural Hair Care Ingredients',
      'natural-hair-care-ingredients-guide',
      'Discover the power of botanical ingredients in your hair care routine. Learn which natural ingredients work best for different hair types and how to incorporate them into your daily routine.',
      '<h2>Why Natural Ingredients Matter</h2><p>When it comes to hair care, nature provides some of the most effective solutions. At Luxivie, we believe in harnessing the power of botanical ingredients to create products that not only nourish your hair but also respect your body and the environment.</p><h2>Key Natural Ingredients</h2><h3>Argan Oil</h3><p>Rich in vitamin E and fatty acids, argan oil deeply moisturizes and adds shine to your hair. It''s particularly effective for dry, damaged, or frizzy hair.</p><h3>Aloe Vera</h3><p>Known for its soothing and hydrating properties, aloe vera helps maintain scalp health and promotes hair growth. It''s gentle enough for sensitive scalps.</p><h3>Biotin</h3><p>This B-vitamin is essential for healthy hair growth. It strengthens hair follicles and prevents breakage, leading to thicker, fuller hair over time.</p><h2>How to Use Natural Hair Care Products</h2><p>Start by identifying your hair type and specific concerns. Choose products that contain ingredients targeted to your needs. Remember, consistency is key when using natural products—results may take a few weeks to become noticeable, but they''re worth the wait.</p><h2>Conclusion</h2><p>Natural hair care isn''t just a trend—it''s a commitment to healthier hair and a healthier planet. By choosing products with botanical ingredients, you''re making a choice that benefits both you and the environment.</p>',
      'Luxivie Team',
      'Hair Care',
      ARRAY['natural ingredients', 'hair care', 'botanical', 'argan oil', 'aloe vera'],
      'published',
      NOW(),
      '5 min read',
      'Natural Hair Care Ingredients Guide | Luxivie',
      'Learn about the best natural ingredients for hair care. Discover how botanical ingredients like argan oil, aloe vera, and biotin can transform your hair routine.',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Created blog: Natural Hair Care Ingredients Guide';
  ELSE
    RAISE NOTICE 'Blog already exists: Natural Hair Care Ingredients Guide';
  END IF;
  
  -- Blog 2: Benefits of Clean Beauty
  IF NOT EXISTS (
    SELECT 1 FROM blogs 
    WHERE business_id = v_business_id 
    AND slug = 'benefits-of-clean-beauty-products'
  ) THEN
    INSERT INTO blogs (
      business_id,
      title,
      slug,
      excerpt,
      content,
      author,
      category,
      tags,
      status,
      published_at,
      read_time,
      seo_title,
      seo_description,
      created_at,
      updated_at
    ) VALUES (
      v_business_id,
      'Why Clean Beauty Products Are Better for Your Hair',
      'benefits-of-clean-beauty-products',
      'Clean beauty isn''t just a buzzword—it''s a movement towards safer, more effective hair care. Learn why switching to clean beauty products can make a significant difference in your hair health and overall well-being.',
      '<h2>What is Clean Beauty?</h2><p>Clean beauty refers to products made with safe, non-toxic ingredients that are transparently labeled. These products avoid harmful chemicals like sulfates, parabens, phthalates, and synthetic fragrances that can damage hair and scalp health.</p><h2>Benefits for Your Hair</h2><h3>Healthier Scalp</h3><p>Clean beauty products are gentler on your scalp, reducing irritation and promoting a healthy environment for hair growth. Without harsh chemicals, your scalp can maintain its natural balance.</p><h3>Stronger Hair</h3><p>By avoiding damaging ingredients, clean beauty products help maintain your hair''s natural strength and elasticity. This means less breakage and healthier-looking hair over time.</p><h3>Better Long-Term Results</h3><p>While some conventional products may provide quick results, they often cause long-term damage. Clean beauty products work with your hair''s natural processes, leading to sustainable improvements.</p><h2>Environmental Impact</h2><p>Choosing clean beauty also means choosing products that are better for the environment. Many clean beauty brands, including Luxivie, use sustainable sourcing and eco-friendly packaging.</p><h2>Making the Switch</h2><p>Transitioning to clean beauty doesn''t have to be overwhelming. Start by replacing one product at a time, beginning with products you use most frequently. Your hair will thank you for the change.</p>',
      'Luxivie Team',
      'Clean Beauty',
      ARRAY['clean beauty', 'hair health', 'sustainable', 'non-toxic'],
      'published',
      NOW(),
      '4 min read',
      'Benefits of Clean Beauty Products for Hair | Luxivie',
      'Discover why clean beauty products are better for your hair. Learn about the benefits of switching to non-toxic, sustainable hair care solutions.',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Created blog: Benefits of Clean Beauty Products';
  ELSE
    RAISE NOTICE 'Blog already exists: Benefits of Clean Beauty Products';
  END IF;
  
  -- Blog 3: Hair Care Routine Tips
  IF NOT EXISTS (
    SELECT 1 FROM blogs 
    WHERE business_id = v_business_id 
    AND slug = 'complete-hair-care-routine-guide'
  ) THEN
    INSERT INTO blogs (
      business_id,
      title,
      slug,
      excerpt,
      content,
      author,
      category,
      tags,
      status,
      published_at,
      read_time,
      seo_title,
      seo_description,
      created_at,
      updated_at
    ) VALUES (
      v_business_id,
      'The Complete Guide to a Healthy Hair Care Routine',
      'complete-hair-care-routine-guide',
      'Transform your hair with a proper care routine. From washing techniques to styling tips, learn how to create a personalized hair care routine that works for your hair type and lifestyle.',
      '<h2>Understanding Your Hair Type</h2><p>Before creating a routine, it''s essential to understand your hair type. Whether you have straight, wavy, curly, or coily hair, each type has unique needs that should be addressed in your routine.</p><h2>Daily Hair Care Steps</h2><h3>Washing</h3><p>How often you wash your hair depends on your hair type and lifestyle. For most people, washing 2-3 times per week is sufficient. Use lukewarm water and focus on massaging the scalp, not just the hair strands.</p><h3>Conditioning</h3><p>Always follow shampoo with conditioner. Apply it from mid-length to ends, avoiding the roots. Leave it in for at least 2-3 minutes to allow the ingredients to penetrate.</p><h3>Drying</h3><p>Pat your hair dry with a microfiber towel instead of rubbing. If using a blow dryer, use the lowest heat setting and keep it moving to avoid heat damage.</p><h2>Weekly Treatments</h2><p>Incorporate a deep conditioning treatment once a week. This helps restore moisture and repair damage. For best results, use a treatment mask and leave it on for 15-30 minutes.</p><h2>Styling Tips</h2><p>When styling, always use heat protectant products. Limit the use of hot tools and opt for air-drying when possible. Choose styling products that complement your hair type and desired look.</p><h2>Maintenance</h2><p>Regular trims every 6-8 weeks help prevent split ends and maintain healthy hair. Also, protect your hair while sleeping by using a silk or satin pillowcase.</p><h2>Conclusion</h2><p>A consistent hair care routine tailored to your hair type can make a significant difference in your hair''s health and appearance. Remember, patience and consistency are key to seeing results.</p>',
      'Luxivie Team',
      'Hair Care Tips',
      ARRAY['hair routine', 'hair care tips', 'hair health', 'styling'],
      'published',
      NOW(),
      '6 min read',
      'Complete Hair Care Routine Guide | Luxivie',
      'Learn how to create the perfect hair care routine for your hair type. Get expert tips on washing, conditioning, styling, and maintaining healthy hair.',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Created blog: Complete Hair Care Routine Guide';
  ELSE
    RAISE NOTICE 'Blog already exists: Complete Hair Care Routine Guide';
  END IF;
  
  -- Final count
  SELECT COUNT(*) INTO v_blog_count
  FROM blogs
  WHERE business_id = v_business_id;
  
  RAISE NOTICE '✅ Seeding complete! Total blogs for Luxivie: %', v_blog_count;
  
END $$;

