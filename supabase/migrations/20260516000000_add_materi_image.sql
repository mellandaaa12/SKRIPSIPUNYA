-- ==================================================================================
-- ADD IMAGE_URL TO PEMBELAJARAN + CREATE STORAGE BUCKET
-- ==================================================================================

-- Tambah kolom image_url ke tabel pembelajaran
ALTER TABLE pembelajaran ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Buat storage bucket untuk materi images (jika belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materi-images',
  'materi-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies untuk materi-images bucket
-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload materi images" ON storage.objects;
CREATE POLICY "Authenticated users can upload materi images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materi-images');

-- Allow public read
DROP POLICY IF EXISTS "Public can view materi images" ON storage.objects;
CREATE POLICY "Public can view materi images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materi-images');

-- Allow authenticated users to update their own uploads
DROP POLICY IF EXISTS "Authenticated users can update materi images" ON storage.objects;
CREATE POLICY "Authenticated users can update materi images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'materi-images');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Authenticated users can delete materi images" ON storage.objects;
CREATE POLICY "Authenticated users can delete materi images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materi-images');

