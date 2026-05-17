-- Add demo_password column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_password TEXT;
