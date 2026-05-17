-- ==================================================================================
-- FIX PEMBELAJARAN SCHEMA + ADD GAMIFICATION COLUMNS
-- Menyesuaikan skema DB dengan yang diharapkan frontend
-- ==================================================================================

-- Tambah kolom judul/deskripsi/steps/status ke tabel pembelajaran
ALTER TABLE pembelajaran ADD COLUMN IF NOT EXISTS judul TEXT;
ALTER TABLE pembelajaran ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE pembelajaran ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pembelajaran ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Sync data lama: copy title->judul, description->deskripsi
UPDATE pembelajaran SET 
  judul = COALESCE(judul, title, 'Materi Baru'),
  deskripsi = COALESCE(deskripsi, description, '');

-- Tambah kolom gamifikasi ke profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hint_points INTEGER NOT NULL DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- Buat tabel progress yang digunakan oleh MengerjakanLatihan dan BacaMateri
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pembelajaran_id UUID REFERENCES pembelajaran(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pembelajaran_id, step_id)
);

-- Permissions
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
GRANT ALL ON progress TO anon;
GRANT ALL ON progress TO authenticated;
GRANT ALL ON progress TO postgres;

-- Tambah kolom teacher_id ke classes jika belum ada  
ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject TEXT;

-- Permissions untuk progress table sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
