-- ==================================================================================
-- RESTORE PROGRESS TABLES AND DROP PROJECT FEATURE TABLES
-- Re-creating student_progress, student_progress_steps, quiz_attempts, quiz_questions, pembelajaran_steps
-- Dropping project, project_submissions, project_groups, project_group_members, project_sintaks
-- ==================================================================================

-- 1. DROP PROJECT MODULE TABLES (NOT NEEDED IN APP)
DROP TABLE IF EXISTS "public"."project_submissions" CASCADE;
DROP TABLE IF EXISTS "public"."project_group_members" CASCADE;
DROP TABLE IF EXISTS "public"."project_groups" CASCADE;
DROP TABLE IF EXISTS "public"."project_sintaks" CASCADE;
DROP TABLE IF EXISTS "public"."projects" CASCADE;

-- 2. RECREATE PEMBELAJARAN STEPS
CREATE TABLE IF NOT EXISTS "public"."pembelajaran_steps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "pembelajaran_id" "uuid" NOT NULL REFERENCES "public"."pembelajaran"("id") ON DELETE CASCADE,
    "type" "text" NOT NULL CHECK (type = ANY (ARRAY['materi'::text, 'quiz'::text])),
    "title" "text" NOT NULL,
    "content" "text",
    "passing_score" integer,
    "step_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "public"."pembelajaran_steps" OWNER TO "postgres";

-- 3. RECREATE QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "step_id" "uuid" NOT NULL REFERENCES "public"."pembelajaran_steps"("id") ON DELETE CASCADE,
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "correct_answer" integer NOT NULL,
    "question_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";

-- 4. RECREATE STUDENT PROGRESS
CREATE TABLE IF NOT EXISTS "public"."student_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "student_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "pembelajaran_id" "uuid" NOT NULL REFERENCES "public"."pembelajaran"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "student_progress_student_id_pembelajaran_id_key" UNIQUE ("student_id", "pembelajaran_id")
);
ALTER TABLE "public"."student_progress" OWNER TO "postgres";

-- 5. RECREATE STUDENT PROGRESS STEPS
CREATE TABLE IF NOT EXISTS "public"."student_progress_steps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "progress_id" "uuid" NOT NULL REFERENCES "public"."student_progress"("id") ON DELETE CASCADE,
    "step_id" "uuid" NOT NULL REFERENCES "public"."pembelajaran_steps"("id") ON DELETE CASCADE,
    "completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "student_progress_steps_progress_id_step_id_key" UNIQUE ("progress_id", "step_id")
);
ALTER TABLE "public"."student_progress_steps" OWNER TO "postgres";

-- 6. RECREATE QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "student_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "step_id" "uuid" NOT NULL,
    "score" integer NOT NULL CHECK (score >= 0 AND score <= 100),
    "answers" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";

-- 7. RECREATE VIEWS AND HELPER FUNCTIONS
CREATE OR REPLACE VIEW "public"."student_dashboard_summary" AS
 SELECT p.id AS student_id,
    p.name AS student_name,
    p.class_id,
    c.name AS class_name,
    count(DISTINCT sp.pembelajaran_id) AS total_pembelajaran_enrolled,
    count(DISTINCT t.id) AS total_todos,
    count(DISTINCT
        CASE
            WHEN t.completed THEN t.id
            ELSE NULL::uuid
        END) AS total_todos_completed
   FROM (((profiles p
     LEFT JOIN classes c ON ((p.class_id = c.id)))
     LEFT JOIN student_progress sp ON ((p.id = sp.student_id)))
     LEFT JOIN todos t ON ((p.id = t.user_id)))
  WHERE (p.role = 'siswa'::text)
  GROUP BY p.id, p.name, p.class_id, c.name;

ALTER VIEW "public"."student_dashboard_summary" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."teacher_dashboard_summary" AS
 SELECT t.id AS teacher_id,
    t.name AS teacher_name,
    count(DISTINCT c.id) AS total_classes,
    count(DISTINCT p.id) AS total_students_assigned
   FROM ((profiles t
     LEFT JOIN classes c ON ((c.teacher_id = t.id)))
     LEFT JOIN profiles p ON ((p.class_id = c.id AND p.role = 'siswa'::text)))
  WHERE (t.role = 'guru'::text)
  GROUP BY t.id, t.name;

ALTER VIEW "public"."teacher_dashboard_summary" OWNER TO "postgres";

-- Recreate class_statistics without projects table
CREATE OR REPLACE VIEW "public"."class_statistics" AS
 SELECT c.id AS class_id,
    c.name AS class_name,
    c.grade,
    count(DISTINCT p.id) AS total_students,
    count(DISTINCT pb.id) AS total_pembelajaran,
    0 AS total_projects
   FROM ((classes c
     LEFT JOIN profiles p ON ((c.id = p.class_id)))
     LEFT JOIN pembelajaran pb ON ((c.id = pb.class_id)))
  GROUP BY c.id, c.name, c.grade;

ALTER VIEW "public"."class_statistics" OWNER TO "postgres";

-- Recreate Functions
CREATE OR REPLACE FUNCTION "public"."get_student_progress_percentage"("p_student_id" "uuid", "p_pembelajaran_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_steps
  FROM pembelajaran_steps
  WHERE pembelajaran_id = p_pembelajaran_id;
  
  SELECT COUNT(*) INTO completed_steps
  FROM student_progress_steps sps
  INNER JOIN student_progress sp ON sps.progress_id = sp.id
  WHERE sp.student_id = p_student_id
    AND sp.pembelajaran_id = p_pembelajaran_id
    AND sps.completed = true;
  
  IF total_steps = 0 THEN
    RETURN 0;
  ELSE
    RETURN ROUND((completed_steps::NUMERIC / total_steps::NUMERIC) * 100);
  END IF;
END;
$$;

ALTER FUNCTION "public"."get_student_progress_percentage"("p_student_id" "uuid", "p_pembelajaran_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_step_unlocked"("p_student_id" "uuid", "p_pembelajaran_id" "uuid", "p_step_order" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  prev_step_completed BOOLEAN;
BEGIN
  IF p_step_order = 1 THEN
    RETURN true;
  END IF;
  
  SELECT COALESCE(sps.completed, false) INTO prev_step_completed
  FROM pembelajaran_steps ps
  LEFT JOIN student_progress sp ON sp.pembelajaran_id = ps.pembelajaran_id AND sp.student_id = p_student_id
  LEFT JOIN student_progress_steps sps ON sps.progress_id = sp.id AND sps.step_id = ps.id
  WHERE ps.pembelajaran_id = p_pembelajaran_id
    AND ps.step_order = p_step_order - 1;
  
  RETURN COALESCE(prev_step_completed, false);
END;
$$;

ALTER FUNCTION "public"."is_step_unlocked"("p_student_id" "uuid", "p_pembelajaran_id" "uuid", "p_step_order" integer) OWNER TO "postgres";

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER "update_student_progress_steps_updated_at" BEFORE UPDATE ON "public"."student_progress_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_student_progress_updated_at" BEFORE UPDATE ON "public"."student_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- 8. DISABLE RLS
ALTER TABLE "public"."pembelajaran_steps" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quiz_questions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_progress" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_progress_steps" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quiz_attempts" DISABLE ROW LEVEL SECURITY;

-- 9. GRANTS
GRANT ALL ON TABLE "public"."pembelajaran_steps" TO "anon", "authenticated", "service_role", "postgres";
GRANT ALL ON TABLE "public"."quiz_questions" TO "anon", "authenticated", "service_role", "postgres";
GRANT ALL ON TABLE "public"."student_progress" TO "anon", "authenticated", "service_role", "postgres";
GRANT ALL ON TABLE "public"."student_progress_steps" TO "anon", "authenticated", "service_role", "postgres";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "anon", "authenticated", "service_role", "postgres";
GRANT ALL ON TABLE "public"."class_statistics" TO "anon", "authenticated", "service_role", "postgres";
