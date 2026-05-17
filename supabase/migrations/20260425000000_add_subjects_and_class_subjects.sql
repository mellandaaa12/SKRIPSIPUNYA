-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add jurusan column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS jurusan TEXT;

-- Update existing classes to have jurusan based on subject
UPDATE classes SET jurusan = 'RPL' WHERE subject LIKE '%RPL%' OR subject LIKE '%Pemrograman%';
UPDATE classes SET jurusan = 'TKJ' WHERE subject LIKE '%TKJ%' OR subject LIKE '%Jaringan%';
UPDATE classes SET jurusan = 'MM' WHERE subject LIKE '%MM%' OR subject LIKE '%Multimedia%';

-- Create class_subjects junction table
CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, subject_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher_id ON class_subjects(teacher_id);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON subjects TO authenticated;
GRANT ALL ON subjects TO anon;
GRANT ALL ON class_subjects TO authenticated;
GRANT ALL ON class_subjects TO anon;

-- RLS policies for subjects
CREATE POLICY "Enable read access for all users" ON subjects FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON subjects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON subjects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON subjects FOR DELETE USING (auth.role() = 'authenticated');

-- RLS policies for class_subjects
CREATE POLICY "Enable read access for all users" ON class_subjects FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON class_subjects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON class_subjects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON class_subjects FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default subjects
INSERT INTO subjects (name) VALUES 
('Matematika'),
('Bahasa Indonesia'),
('Bahasa Inggris'),
('Pemrograman Web'),
('Jaringan Dasar'),
('Multimedia Dasar'),
('PKN'),
('Agama'),
('Penjaskes'),
('Seni Budaya')
ON CONFLICT DO NOTHING;

-- Grant service role permissions
GRANT ALL ON subjects TO service_role;
GRANT ALL ON class_subjects TO service_role;
