-- Fix permissions for class_schedules and teacher_schedules
-- These tables were created after the initial mass-grant migration

-- Grant ALL permissions to anon and authenticated roles
GRANT ALL ON TABLE class_schedules TO anon, authenticated, service_role;
GRANT ALL ON TABLE teacher_schedules TO anon, authenticated, service_role;

-- Also ensure sequences are accessible if any (though these use UUIDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Ensure RLS is still enabled and policies allow access
-- The existing policies in 20260425160000_add_schedules.sql use (true), 
-- which is very permissive, but that matches the project's current state.

-- If there are any other tables created recently without grants, they should be added here.
-- Check for subjects and class_subjects (already have grants in their migration)
-- Check for progress (already has grants in its migration)

-- Re-apply grants for classes and profiles just in case
GRANT ALL ON TABLE classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE pembelajaran TO anon, authenticated, service_role;
GRANT ALL ON TABLE projects TO anon, authenticated, service_role;
