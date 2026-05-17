-- Table: class_schedules
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: teacher_schedules
CREATE TABLE IF NOT EXISTS teacher_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    activity TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (allow all for simplicity as requested before)
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for class_schedules" ON class_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for teacher_schedules" ON teacher_schedules FOR ALL USING (true) WITH CHECK (true);
