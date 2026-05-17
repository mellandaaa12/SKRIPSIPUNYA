-- Create junction table for teacher-class assignments (many-to-many relationship)
CREATE TABLE teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    UNIQUE(teacher_id, class_id)
);

-- Create indexes for better performance
CREATE INDEX idx_teacher_class_assignments_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX idx_teacher_class_assignments_class_id ON teacher_class_assignments(class_id);

-- Disable RLS for now (will be fixed later)
ALTER TABLE teacher_class_assignments DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to all roles
GRANT ALL ON teacher_class_assignments TO anon;
GRANT ALL ON teacher_class_assignments TO authenticated;
GRANT ALL ON teacher_class_assignments TO service_role;
GRANT ALL ON teacher_class_assignments TO postgres;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO postgres;
