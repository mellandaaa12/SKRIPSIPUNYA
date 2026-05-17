ALTER TABLE "public"."pembelajaran" 
ADD COLUMN IF NOT EXISTS "pertanyaan_kendala" text DEFAULT 'Apa kendala yang kamu alami?',
ADD COLUMN IF NOT EXISTS "pertanyaan_kesan" text DEFAULT 'Bagaimana pendapatmu tentang pembelajaran hari ini?';
