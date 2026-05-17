/**
 * Script untuk menambahkan kolom image_url ke tabel pembelajaran
 * dan membuat storage bucket materi-images di Supabase
 *
 * Jalankan: node add-materi-image-column.js
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tjfmwixttmrayvhqhena.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZm13aXh0dG1yYXl2aHFoZW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDkxNDIsImV4cCI6MjA4ODEyNTE0Mn0.GcwxTKQAxvKgMRo9FIYS-Im8eW-qxN8UNIOTr4Oi_Ek';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔧 Checking pembelajaran table for image_url column...\n');

  // Check if column exists
  const { data: testData, error: testError } = await supabase
    .from('pembelajaran')
    .select('id, image_url')
    .limit(1);

  if (!testError) {
    console.log('✅ image_url column already exists! No action needed.\n');
    return;
  }

  if (testError.message.includes('image_url')) {
    console.log('❌ Column image_url does NOT exist.\n');
    console.log('📋 Please run this SQL in your Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/tjfmwixttmrayvhqhena/sql/new\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
-- Step 1: Add image_url column to pembelajaran table
ALTER TABLE pembelajaran ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Create storage bucket for materi images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materi-images',
  'materi-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "auth_upload_materi_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materi-images');

-- Step 4: Allow public to view images
CREATE POLICY IF NOT EXISTS "public_view_materi_images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materi-images');

-- Step 5: Allow authenticated users to delete their uploads
CREATE POLICY IF NOT EXISTS "auth_delete_materi_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materi-images');
    `);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('After running the SQL, restart the app and try uploading an image.');
  } else {
    console.error('Unexpected error:', testError.message);
  }
}

main().catch(console.error);
