-- ============================================================================
-- Menu Images Storage Bucket
-- Creates storage bucket for menu item images with RLS policies
-- ============================================================================

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (idempotent)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload menu images
DROP POLICY IF EXISTS "Allow authenticated users to upload menu images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Policy: Allow public read access to menu images
DROP POLICY IF EXISTS "Allow public read access to menu images" ON storage.objects;
CREATE POLICY "Allow public read access to menu images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Policy: Allow authenticated users to update their menu images
DROP POLICY IF EXISTS "Allow authenticated users to update menu images" ON storage.objects;
CREATE POLICY "Allow authenticated users to update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

-- Policy: Allow authenticated users to delete menu images
DROP POLICY IF EXISTS "Allow authenticated users to delete menu images" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');

