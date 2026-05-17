-- ============================================================
-- JALANKAN DI SUPABASE SQL Editor (Run semua sekaligus)
-- ============================================================

-- LANGKAH 1: Perbaiki auth (tanpa ALTER TABLE — hindari error 42501)
CREATE OR REPLACE FUNCTION public.repair_auth_user_tokens()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public AS $$
DECLARE n1 INT; n2 INT; n3 INT; n4 INT;
BEGIN
  UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
  GET DIAGNOSTICS n1 = ROW_COUNT;
  UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
  GET DIAGNOSTICS n2 = ROW_COUNT;
  UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
  GET DIAGNOSTICS n3 = ROW_COUNT;
  UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
  GET DIAGNOSTICS n4 = ROW_COUNT;
  RETURN format('OK: %s+%s+%s+%s baris', n1, n2, n3, n4);
EXCEPTION WHEN OTHERS THEN RETURN 'SKIP auth repair: ' || SQLERRM;
END; $$;
GRANT EXECUTE ON FUNCTION public.repair_auth_user_tokens() TO postgres, anon, authenticated, service_role;
SELECT public.repair_auth_user_tokens();

-- LANGKAH 2: Login dari profiles.username + profiles.password
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

UPDATE public.profiles
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL OR trim(username) = '';

-- Hapus fungsi sync lama yang merusak auth.users (penyebab "Database error querying schema")
DROP FUNCTION IF EXISTS public.sync_profile_auth_password(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.verify_profile_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.profiles%ROWTYPE;
  u TEXT := trim(p_username);
  p TEXT := p_password;
BEGIN
  IF u = '' OR p IS NULL OR p = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Username dan password wajib diisi');
  END IF;

  SELECT * INTO rec
  FROM public.profiles
  WHERE lower(coalesce(trim(username), '')) = lower(u)
     OR lower(email) = lower(u)
     OR lower(name) = lower(u)
     OR lower(email) = lower(u) || '@studywithme.id'
     OR lower(split_part(email, '@', 1)) = lower(u)
  ORDER BY
    CASE WHEN lower(coalesce(trim(username), '')) = lower(u) THEN 0
         WHEN lower(name) = lower(u) THEN 1
         ELSE 2 END,
    created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User tidak ditemukan. Hubungi admin.');
  END IF;

  IF rec.password IS NOT NULL AND rec.password::text = p::text THEN
    NULL;
  ELSIF rec.demo_password IS NOT NULL AND rec.demo_password::text = p::text THEN
    NULL;
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'Username atau password salah');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'id', rec.id,
      'email', rec.email,
      'name', rec.name,
      'role', rec.role,
      'username', rec.username,
      'avatar', rec.avatar,
      'avatar_color', rec.avatar_color,
      'class_id', rec.class_id,
      'status', rec.status
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_profile_login(TEXT, TEXT) TO anon, authenticated;
