-- ==================================================================================
-- RESTRUCTURE PROGRESS, REFLEKSI, AND UEQ RESPONSES TABLES
-- Menambahkan rekaman lengkap nama siswa, langkah guru, attempts, dan flat UEQ answers
-- ==================================================================================

-- 1. Tambah kolom baru ke tabel progress
ALTER TABLE "public"."progress" 
ADD COLUMN IF NOT EXISTS "siswa_name" text,
ADD COLUMN IF NOT EXISTS "pembelajaran_title" text,
ADD COLUMN IF NOT EXISTS "step_title" text,
ADD COLUMN IF NOT EXISTS "step_type" text,
ADD COLUMN IF NOT EXISTS "materi_content" text,
ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 1;

-- 2. Tambah kolom baru ke tabel refleksi
ALTER TABLE "public"."refleksi" 
ADD COLUMN IF NOT EXISTS "siswa_name" text;

-- 3. Hapus tabel ueq_responses lama dan buat baru dengan skema flat (satu baris per jawaban)
DROP TABLE IF EXISTS "public"."ueq_responses";
CREATE TABLE IF NOT EXISTS "public"."ueq_responses" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "siswa_id" uuid REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "siswa_name" text,
    "siswa_email" text,
    "materi_id" uuid REFERENCES "public"."pembelajaran"("id") ON DELETE CASCADE,
    "materi_title" text,
    "question_id" text NOT NULL,
    "question_label" text NOT NULL,
    "question_type" text NOT NULL,
    "answer" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Nonaktifkan RLS agar dapat diakses oleh anon/authenticated sesuai pola tabel progress
ALTER TABLE "public"."ueq_responses" DISABLE ROW LEVEL SECURITY;

-- 5. Berikan hak akses penuh ke semua role
GRANT ALL ON TABLE "public"."ueq_responses" TO "anon";
GRANT ALL ON TABLE "public"."ueq_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."ueq_responses" TO "postgres";
GRANT ALL ON TABLE "public"."ueq_responses" TO "service_role";
