-- ==================================================================================
-- CLEAN UP UNUSED LEGACY TABLES, VIEWS, AND FUNCTIONS
-- Menghapus objek database lama yang tidak digunakan lagi oleh sistem aktif
-- ==================================================================================

-- 1. Hapus views warisan yang merujuk ke tabel lama
DROP VIEW IF EXISTS "public"."student_dashboard_summary" CASCADE;
DROP VIEW IF EXISTS "public"."teacher_dashboard_summary" CASCADE;

-- 2. Hapus fungsi-fungsi warisan
DROP FUNCTION IF EXISTS "public"."get_student_progress_percentage"(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS "public"."is_step_unlocked"(uuid, uuid, integer) CASCADE;

-- 3. Hapus tabel-tabel warisan yang digantikan oleh progress
DROP TABLE IF EXISTS "public"."student_progress_steps" CASCADE;
DROP TABLE IF EXISTS "public"."student_progress" CASCADE;
DROP TABLE IF EXISTS "public"."pembelajaran_steps" CASCADE;
DROP TABLE IF EXISTS "public"."quiz_questions" CASCADE;
DROP TABLE IF EXISTS "public"."quiz_attempts" CASCADE;
DROP TABLE IF EXISTS "public"."kv_store_5b267751" CASCADE;
