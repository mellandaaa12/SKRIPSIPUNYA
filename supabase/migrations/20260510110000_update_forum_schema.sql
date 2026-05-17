-- Add class_id and is_global columns to forum_posts
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;

-- Update existing posts: if user is admin, make it global. Otherwise, keep it private to creator (for now)
-- We'll assume existing posts are non-global unless the user is admin.
UPDATE forum_posts 
SET is_global = TRUE 
FROM profiles 
WHERE forum_posts.user_id = profiles.id AND profiles.role = 'admin';

-- Re-grant permissions just in case
GRANT ALL ON TABLE forum_posts TO anon, authenticated, service_role;
