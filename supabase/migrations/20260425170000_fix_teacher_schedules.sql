-- Fix teacher_schedules: drop old columns, add subject and class_name
ALTER TABLE teacher_schedules DROP COLUMN IF EXISTS activity;
ALTER TABLE teacher_schedules DROP COLUMN IF EXISTS location;

ALTER TABLE teacher_schedules ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT '';
ALTER TABLE teacher_schedules ADD COLUMN IF NOT EXISTS class_name TEXT NOT NULL DEFAULT '';
