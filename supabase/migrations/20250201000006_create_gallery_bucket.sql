-- ============================================================================
-- Gallery Storage Bucket
-- Creates storage bucket for gallery images organized by business-slug/gallery
-- ============================================================================

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (idempotent)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload gallery images
DROP POLICY IF EXISTS "Allow authenticated users to upload gallery images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

-- Policy: Allow public read access to gallery images
DROP POLICY IF EXISTS "Allow public read access to gallery images" ON storage.objects;
CREATE POLICY "Allow public read access to gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

-- Policy: Allow authenticated users to update gallery images
DROP POLICY IF EXISTS "Allow authenticated users to update gallery images" ON storage.objects;
CREATE POLICY "Allow authenticated users to update gallery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery')
WITH CHECK (bucket_id = 'gallery');

-- Policy: Allow authenticated users to delete gallery images
DROP POLICY IF EXISTS "Allow authenticated users to delete gallery images" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');

