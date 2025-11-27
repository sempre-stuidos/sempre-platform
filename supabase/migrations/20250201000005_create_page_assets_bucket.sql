-- ============================================================================
-- Page Assets Storage Bucket
-- Creates storage bucket for page/section images organized by business-slug
-- ============================================================================

-- Create storage bucket for page assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-assets',
  'page-assets',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (idempotent)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload page assets
DROP POLICY IF EXISTS "Allow authenticated users to upload page assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload page assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'page-assets');

-- Policy: Allow public read access to page assets
DROP POLICY IF EXISTS "Allow public read access to page assets" ON storage.objects;
CREATE POLICY "Allow public read access to page assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'page-assets');

-- Policy: Allow authenticated users to update page assets
DROP POLICY IF EXISTS "Allow authenticated users to update page assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to update page assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'page-assets')
WITH CHECK (bucket_id = 'page-assets');

-- Policy: Allow authenticated users to delete page assets
DROP POLICY IF EXISTS "Allow authenticated users to delete page assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete page assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'page-assets');
