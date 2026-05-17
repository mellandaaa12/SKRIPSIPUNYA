-- Tambahkan kolom di tabel pembelajaran
ALTER TABLE "public"."pembelajaran" 
ADD COLUMN IF NOT EXISTS "enable_reflection" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "reflection_template" text DEFAULT 'Standar';

-- Buat tabel refleksi
CREATE TABLE IF NOT EXISTS "public"."refleksi" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "siswa_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "materi_id" uuid NOT NULL REFERENCES "public"."pembelajaran"("id") ON DELETE CASCADE,
    "pemahaman" text NOT NULL,
    "kendala" text,
    "kesan" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE("siswa_id", "materi_id")
);

-- RLS untuk tabel refleksi
ALTER TABLE "public"."refleksi" ENABLE ROW LEVEL SECURITY;

-- Siswa bisa melihat refleksinya sendiri
CREATE POLICY "Siswa bisa melihat refleksi sendiri" ON "public"."refleksi"
FOR SELECT USING (auth.uid() = siswa_id);

-- Siswa bisa insert refleksi
CREATE POLICY "Siswa bisa insert refleksi" ON "public"."refleksi"
FOR INSERT WITH CHECK (auth.uid() = siswa_id);

-- Guru bisa melihat refleksi untuk materi yang mereka buat
CREATE POLICY "Guru bisa melihat refleksi materinya" ON "public"."refleksi"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "public"."pembelajaran" p 
        WHERE p.id = refleksi.materi_id AND p.created_by = auth.uid()
    )
);

-- Admin bisa melihat semua refleksi
CREATE POLICY "Admin bisa melihat semua refleksi" ON "public"."refleksi"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "public"."profiles" 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Grant privileges
GRANT ALL ON TABLE "public"."refleksi" TO "anon";
GRANT ALL ON TABLE "public"."refleksi" TO "authenticated";
GRANT ALL ON TABLE "public"."refleksi" TO "service_role";
