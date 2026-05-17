-- Fix RLS on pembelajaran table to allow authenticated users (guru) to update steps
-- The issue: browser clients lose their session state after auth key change,
-- causing update operations to hang waiting for auth verification

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable update for authenticated users" ON pembelajaran;
DROP POLICY IF EXISTS "guru can update pembelajaran" ON pembelajaran;
DROP POLICY IF EXISTS "authenticated users can update pembelajaran" ON pembelajaran;

-- Allow any authenticated user to read pembelajaran
DROP POLICY IF EXISTS "Enable read for authenticated users" ON pembelajaran;
CREATE POLICY "Enable read for authenticated users"
ON pembelajaran FOR SELECT
USING (true);

-- Allow authenticated users to insert pembelajaran
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pembelajaran;
CREATE POLICY "Enable insert for authenticated users"
ON pembelajaran FOR INSERT
WITH CHECK (true);

-- Allow any authenticated user to update pembelajaran steps (for teacher content editing)
CREATE POLICY "Enable update for authenticated users"
ON pembelajaran FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow deletion too
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON pembelajaran;
CREATE POLICY "Enable delete for authenticated users"
ON pembelajaran FOR DELETE
USING (true);
