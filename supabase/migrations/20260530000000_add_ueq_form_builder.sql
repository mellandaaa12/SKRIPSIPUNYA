-- ==================================================================================
-- ADD DYNAMIC NATIVE UEQ FORM BUILDER SCHEMA
-- Menambahkan kolom ueq_questions ke pembelajaran dan membuat tabel ueq_responses
-- ==================================================================================

-- 1. Tambah kolom ueq_questions pada pembelajaran
ALTER TABLE "public"."pembelajaran" 
ADD COLUMN IF NOT EXISTS "ueq_questions" jsonb DEFAULT '[]'::jsonb;

-- 2. Buat tabel ueq_responses untuk jawaban kuesioner kustom
CREATE TABLE IF NOT EXISTS "public"."ueq_responses" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "siswa_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "materi_id" uuid NOT NULL REFERENCES "public"."pembelajaran"("id") ON DELETE CASCADE,
    "answers" jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of { questionId: string, answer: any }
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE("siswa_id", "materi_id")
);

-- 3. Nonaktifkan RLS agar sesuai dengan pola tabel progress/refleksi lainnya
ALTER TABLE "public"."ueq_responses" DISABLE ROW LEVEL SECURITY;

-- 4. Berikan hak akses penuh ke semua role
GRANT ALL ON TABLE "public"."ueq_responses" TO "anon";
GRANT ALL ON TABLE "public"."ueq_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."ueq_responses" TO "postgres";
GRANT ALL ON TABLE "public"."ueq_responses" TO "service_role";
