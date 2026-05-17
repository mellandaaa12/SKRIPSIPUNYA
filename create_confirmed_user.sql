-- SQL Script: Run this in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)
-- This creates an RPC function to bypass SMTP rate limits and auto-confirm emails.

CREATE OR REPLACE FUNCTION public.create_confirmed_user(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_role TEXT,
  user_class_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  encrypted_pass TEXT;
BEGIN
  -- 1. Check if user already exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username atau email sudah terdaftar.');
  END IF;

  -- 2. Generate UUID for the user
  new_user_id := extensions.uuid_generate_v4();

  -- 3. Encrypt the password using bcrypt compatible with Supabase Auth
  encrypted_pass := extensions.crypt(user_password, extensions.gen_salt('bf', 10));

  -- 4. Insert into auth.users directly
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmed_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    user_email,
    encrypted_pass,
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', user_name, 'role', user_role, 'classId', user_class_id),
    now(),
    now(),
    'authenticated',
    'authenticated',
    now()
  );

  -- 5. Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', user_email),
    'email',
    now(),
    now(),
    now()
  );

  -- 6. Insert/Upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    class_id,
    status,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    user_name,
    user_role,
    user_class_id,
    CASE 
      WHEN user_role = 'admin' THEN 'Admin'
      WHEN user_role = 'guru' THEN 'Guru'
      ELSE 'Siswa'
    END,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    class_id = EXCLUDED.class_id,
    status = EXCLUDED.status,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_confirmed_user(TEXT, TEXT, TEXT, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.create_confirmed_user(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
