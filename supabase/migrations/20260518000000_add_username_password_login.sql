-- Kolom username & password untuk login langsung dari tabel profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Isi username dari awalan email jika masih kosong
UPDATE public.profiles
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL OR trim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND trim(username) <> '';

-- Verifikasi login: cocokkan kolom username + password di profiles
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

-- Perbarui create_confirmed_user agar mengisi username + password
CREATE OR REPLACE FUNCTION public.create_confirmed_user(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_role TEXT,
  user_class_id UUID DEFAULT NULL,
  user_username TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  new_user_id UUID;
  encrypted_pass TEXT;
  login_username TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username atau email sudah terdaftar.');
  END IF;

  new_user_id := extensions.uuid_generate_v4();
  encrypted_pass := extensions.crypt(user_password, extensions.gen_salt('bf', 10));
  login_username := coalesce(nullif(trim(user_username), ''), lower(split_part(user_email, '@', 1)));

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmed_at
  ) VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000'::uuid, user_email, encrypted_pass, now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', user_name, 'role', user_role, 'classId', user_class_id),
    now(), now(), 'authenticated', 'authenticated', now()
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    new_user_id, new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email', now(), now(), now()
  );

  INSERT INTO public.profiles (
    id, email, name, role, class_id, status, username, password, demo_password, updated_at
  ) VALUES (
    new_user_id, user_email, user_name, user_role, user_class_id,
    CASE WHEN user_role = 'admin' THEN 'Admin' WHEN user_role = 'guru' THEN 'Guru' ELSE 'Siswa' END,
    login_username, user_password, user_password, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role,
    class_id = EXCLUDED.class_id, status = EXCLUDED.status,
    username = EXCLUDED.username, password = EXCLUDED.password,
    demo_password = EXCLUDED.demo_password, updated_at = now();

  RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_confirmed_user(TEXT, TEXT, TEXT, TEXT, UUID, TEXT) TO anon, authenticated;
