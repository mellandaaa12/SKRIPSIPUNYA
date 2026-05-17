-- Add subject column to classes table to match frontend expectations
-- Existing subtitle column kept for compatibility

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Update updated_at trigger if exists (optional)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to classes table
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
