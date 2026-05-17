-- Fix permissions for service role to access tables
-- Grant all permissions on all tables to the service role

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Also ensure the service role can access the tables
ALTER TABLE IF EXISTS classes OWNER TO postgres;
ALTER TABLE IF EXISTS profiles OWNER TO postgres;
ALTER TABLE IF EXISTS pembelajaran OWNER TO postgres;
ALTER TABLE IF EXISTS pembelajaran_steps OWNER TO postgres;
ALTER TABLE IF EXISTS quiz_questions OWNER TO postgres;
ALTER TABLE IF EXISTS projects OWNER TO postgres;
ALTER TABLE IF EXISTS project_sintaks OWNER TO postgres;
ALTER TABLE IF EXISTS project_groups OWNER TO postgres;
ALTER TABLE IF EXISTS project_group_members OWNER TO postgres;
ALTER TABLE IF EXISTS project_submissions OWNER TO postgres;
ALTER TABLE IF EXISTS student_progress OWNER TO postgres;
ALTER TABLE IF EXISTS student_progress_steps OWNER TO postgres;
ALTER TABLE IF EXISTS quiz_attempts OWNER TO postgres;
ALTER TABLE IF EXISTS todos OWNER TO postgres;
ALTER TABLE IF EXISTS schedules OWNER TO postgres;
ALTER TABLE IF EXISTS forum_posts OWNER TO postgres;
ALTER TABLE IF EXISTS forum_comments OWNER TO postgres;
ALTER TABLE IF EXISTS forum_likes OWNER TO postgres;
ALTER TABLE IF EXISTS file_uploads OWNER TO postgres;
