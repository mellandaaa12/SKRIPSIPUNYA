-- ============================================================
-- Perbaiki "Database error querying schema"
-- JANGAN pakai ALTER TABLE (error: must be owner of table users)
-- ============================================================

-- Opsi 1: Jalankan fungsi ini (coba dulu)
CREATE OR REPLACE FUNCTION public.repair_auth_user_tokens()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  n1 INT; n2 INT; n3 INT; n4 INT;
BEGIN
  UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
  GET DIAGNOSTICS n1 = ROW_COUNT;
  UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
  GET DIAGNOSTICS n2 = ROW_COUNT;
  UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
  GET DIAGNOSTICS n3 = ROW_COUNT;
  UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
  GET DIAGNOSTICS n4 = ROW_COUNT;
  RETURN format('OK: diperbaiki confirmation=%s recovery=%s email_change_new=%s email_change=%s', n1, n2, n3, n4);
EXCEPTION WHEN insufficient_privilege THEN
  RETURN 'GAGAL: tidak punya akses ke auth.users. Gunakan Dashboard Authentication atau login via aplikasi (fallback sudah aktif).';
WHEN OTHERS THEN
  RETURN 'GAGAL: ' || SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.repair_auth_user_tokens() TO postgres, anon, authenticated, service_role;

SELECT public.repair_auth_user_tokens();

-- Opsi 2: Jika Opsi 1 gagal, hapus baris ini dan jalankan manual di Dashboard:
-- Supabase Dashboard → Authentication → Users → hapus user bermasalah
-- Lalu buat ulang user dengan email/password yang sama
