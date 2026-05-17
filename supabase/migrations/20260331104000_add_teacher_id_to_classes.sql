-- Add teacher_id column to classes table
ALTER TABLE classes ADD COLUMN teacher_id UUID REFERENCES profiles(id);

-- Create index for better performance
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
