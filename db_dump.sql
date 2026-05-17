


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_highest_quiz_score"("p_progress_step_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  highest_score INTEGER;
BEGIN
  SELECT COALESCE(MAX(score), 0) INTO highest_score
  FROM quiz_attempts
  WHERE progress_step_id = p_progress_step_id;
  
  RETURN highest_score;
END;
$$;


ALTER FUNCTION "public"."get_highest_quiz_score"("p_progress_step_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'siswa'),
    '#1294f2'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."class_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "day" "text" NOT NULL,
    "start_time" "text" NOT NULL,
    "end_time" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."class_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "grade" "text" NOT NULL,
    "subtitle" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subject" "text",
    "teacher_id" "uuid",
    "jurusan" "text"
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pembelajaran" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" DEFAULT 'BookOpen'::"text" NOT NULL,
    "color" "text" DEFAULT '#1294f2'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pembelajaran" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "avatar" "text",
    "avatar_color" "text" DEFAULT '#1294f2'::"text" NOT NULL,
    "class_id" "uuid",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "demo_password" "text" DEFAULT 'temp123456'::"text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'guru'::"text", 'siswa'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."demo_password" IS 'Password for demo login (admin-created users)';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" DEFAULT 'Folder'::"text" NOT NULL,
    "color" "text" DEFAULT '#46bd84'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."class_statistics" AS
 SELECT "c"."id" AS "class_id",
    "c"."name" AS "class_name",
    "c"."grade",
    "count"(DISTINCT "p"."id") AS "total_students",
    "count"(DISTINCT "pb"."id") AS "total_pembelajaran",
    "count"(DISTINCT "pr"."id") AS "total_projects"
   FROM ((("public"."classes" "c"
     LEFT JOIN "public"."profiles" "p" ON (("c"."id" = "p"."class_id")))
     LEFT JOIN "public"."pembelajaran" "pb" ON (("c"."id" = "pb"."class_id")))
     LEFT JOIN "public"."projects" "pr" ON (("c"."id" = "pr"."class_id")))
  GROUP BY "c"."id", "c"."name", "c"."grade";


ALTER VIEW "public"."class_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "teacher_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."class_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_uploads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "bucket_name" "text" DEFAULT 'make-5b267751-files'::"text" NOT NULL,
    "related_entity_type" "text",
    "related_entity_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."file_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."forum_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."forum_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "files" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."forum_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kv_store_5b267751" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL
);


ALTER TABLE "public"."kv_store_5b267751" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pembelajaran_steps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pembelajaran_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "passing_score" integer,
    "step_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pembelajaran_steps_type_check" CHECK (("type" = ANY (ARRAY['materi'::"text", 'quiz'::"text"])))
);


ALTER TABLE "public"."pembelajaran_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_group_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "group_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_sintaks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "sintaks_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_sintaks_sintaks_order_check" CHECK ((("sintaks_order" >= 1) AND ("sintaks_order" <= 8)))
);


ALTER TABLE "public"."project_sintaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "sintaks_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "group_name" "text",
    "submission_content" "text",
    "files" "jsonb",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "teacher_notes" "text",
    "score" integer,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_submissions_score_check" CHECK ((("score" >= 0) AND ("score" <= 100))),
    CONSTRAINT "project_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'submitted'::"text", 'reviewed'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."project_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "score" integer NOT NULL,
    "answers" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "quiz_attempts_score_check" CHECK ((("score" >= 0) AND ("score" <= 100)))
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "step_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "correct_answer" integer NOT NULL,
    "question_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "time" time without time zone NOT NULL,
    "location" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "schedules_type_check" CHECK (("type" = ANY (ARRAY['siswa'::"text", 'guru'::"text", 'all'::"text"])))
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "pembelajaran_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."student_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."todos" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."student_dashboard_summary" AS
 SELECT "p"."id" AS "student_id",
    "p"."name" AS "student_name",
    "p"."class_id",
    "c"."name" AS "class_name",
    "count"(DISTINCT "sp"."pembelajaran_id") AS "total_pembelajaran_enrolled",
    "count"(DISTINCT "t"."id") AS "total_todos",
    "count"(DISTINCT
        CASE
            WHEN "t"."completed" THEN "t"."id"
            ELSE NULL::"uuid"
        END) AS "total_todos_completed"
   FROM ((("public"."profiles" "p"
     LEFT JOIN "public"."classes" "c" ON (("p"."class_id" = "c"."id")))
     LEFT JOIN "public"."student_progress" "sp" ON (("p"."id" = "sp"."student_id")))
     LEFT JOIN "public"."todos" "t" ON (("p"."id" = "t"."user_id")))
  WHERE ("p"."role" = 'siswa'::"text")
  GROUP BY "p"."id", "p"."name", "p"."class_id", "c"."name";


ALTER VIEW "public"."student_dashboard_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_progress_steps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "progress_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."student_progress_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_class_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid"
);


ALTER TABLE "public"."teacher_class_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."teacher_dashboard_summary" AS
 SELECT "p"."id" AS "teacher_id",
    "p"."name" AS "teacher_name",
    "count"(DISTINCT "pb"."id") AS "total_pembelajaran_created",
    "count"(DISTINCT "pr"."id") AS "total_projects_created",
    "count"(DISTINCT "ps"."student_id") AS "total_students_monitoring"
   FROM ((("public"."profiles" "p"
     LEFT JOIN "public"."pembelajaran" "pb" ON (("p"."id" = "pb"."created_by")))
     LEFT JOIN "public"."projects" "pr" ON (("p"."id" = "pr"."created_by")))
     LEFT JOIN "public"."student_progress" "ps" ON (("ps"."pembelajaran_id" IN ( SELECT "pembelajaran"."id"
           FROM "public"."pembelajaran"
          WHERE ("pembelajaran"."created_by" = "p"."id")))))
  WHERE ("p"."role" = 'guru'::"text")
  GROUP BY "p"."id", "p"."name";


ALTER VIEW "public"."teacher_dashboard_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "day" "text" NOT NULL,
    "start_time" "text" NOT NULL,
    "end_time" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subject" "text" DEFAULT ''::"text" NOT NULL,
    "class_name" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."teacher_schedules" OWNER TO "postgres";


ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_class_id_subject_id_key" UNIQUE ("class_id", "subject_id");



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_comments"
    ADD CONSTRAINT "forum_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_likes"
    ADD CONSTRAINT "forum_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_likes"
    ADD CONSTRAINT "forum_likes_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."forum_posts"
    ADD CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kv_store_5b267751"
    ADD CONSTRAINT "kv_store_5b267751_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."pembelajaran"
    ADD CONSTRAINT "pembelajaran_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pembelajaran_steps"
    ADD CONSTRAINT "pembelajaran_steps_pembelajaran_id_step_order_key" UNIQUE ("pembelajaran_id", "step_order");



ALTER TABLE ONLY "public"."pembelajaran_steps"
    ADD CONSTRAINT "pembelajaran_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_group_members"
    ADD CONSTRAINT "project_group_members_group_id_student_id_key" UNIQUE ("group_id", "student_id");



ALTER TABLE ONLY "public"."project_group_members"
    ADD CONSTRAINT "project_group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_groups"
    ADD CONSTRAINT "project_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_groups"
    ADD CONSTRAINT "project_groups_project_id_group_name_key" UNIQUE ("project_id", "group_name");



ALTER TABLE ONLY "public"."project_sintaks"
    ADD CONSTRAINT "project_sintaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_sintaks"
    ADD CONSTRAINT "project_sintaks_project_id_sintaks_order_key" UNIQUE ("project_id", "sintaks_order");



ALTER TABLE ONLY "public"."project_submissions"
    ADD CONSTRAINT "project_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_step_id_question_order_key" UNIQUE ("step_id", "question_order");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_progress_steps"
    ADD CONSTRAINT "student_progress_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_progress_steps"
    ADD CONSTRAINT "student_progress_steps_progress_id_step_id_key" UNIQUE ("progress_id", "step_id");



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_student_id_pembelajaran_id_key" UNIQUE ("student_id", "pembelajaran_id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_class_assignments"
    ADD CONSTRAINT "teacher_class_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_class_assignments"
    ADD CONSTRAINT "teacher_class_assignments_teacher_id_class_id_key" UNIQUE ("teacher_id", "class_id");



ALTER TABLE ONLY "public"."teacher_schedules"
    ADD CONSTRAINT "teacher_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_class_subjects_class_id" ON "public"."class_subjects" USING "btree" ("class_id");



CREATE INDEX "idx_class_subjects_subject_id" ON "public"."class_subjects" USING "btree" ("subject_id");



CREATE INDEX "idx_class_subjects_teacher_id" ON "public"."class_subjects" USING "btree" ("teacher_id");



CREATE INDEX "idx_classes_grade" ON "public"."classes" USING "btree" ("grade");



CREATE INDEX "idx_classes_teacher_id" ON "public"."classes" USING "btree" ("teacher_id");



CREATE INDEX "idx_file_uploads_created_at" ON "public"."file_uploads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_file_uploads_related_entity" ON "public"."file_uploads" USING "btree" ("related_entity_type", "related_entity_id");



CREATE INDEX "idx_file_uploads_uploaded_by" ON "public"."file_uploads" USING "btree" ("uploaded_by");



CREATE INDEX "idx_forum_comments_created_at" ON "public"."forum_comments" USING "btree" ("created_at");



CREATE INDEX "idx_forum_comments_post_id" ON "public"."forum_comments" USING "btree" ("post_id");



CREATE INDEX "idx_forum_comments_user_id" ON "public"."forum_comments" USING "btree" ("user_id");



CREATE INDEX "idx_forum_likes_post_id" ON "public"."forum_likes" USING "btree" ("post_id");



CREATE INDEX "idx_forum_likes_user_id" ON "public"."forum_likes" USING "btree" ("user_id");



CREATE INDEX "idx_forum_posts_created_at" ON "public"."forum_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_forum_posts_user_id" ON "public"."forum_posts" USING "btree" ("user_id");



CREATE INDEX "idx_pembelajaran_class_id" ON "public"."pembelajaran" USING "btree" ("class_id");



CREATE INDEX "idx_pembelajaran_created_by" ON "public"."pembelajaran" USING "btree" ("created_by");



CREATE INDEX "idx_pembelajaran_steps_order" ON "public"."pembelajaran_steps" USING "btree" ("pembelajaran_id", "step_order");



CREATE INDEX "idx_pembelajaran_steps_pembelajaran_id" ON "public"."pembelajaran_steps" USING "btree" ("pembelajaran_id");



CREATE INDEX "idx_pembelajaran_steps_type" ON "public"."pembelajaran_steps" USING "btree" ("type");



CREATE INDEX "idx_profiles_class_id" ON "public"."profiles" USING "btree" ("class_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_project_group_members_group_id" ON "public"."project_group_members" USING "btree" ("group_id");



CREATE INDEX "idx_project_group_members_student_id" ON "public"."project_group_members" USING "btree" ("student_id");



CREATE INDEX "idx_project_groups_project_id" ON "public"."project_groups" USING "btree" ("project_id");



CREATE INDEX "idx_project_sintaks_order" ON "public"."project_sintaks" USING "btree" ("project_id", "sintaks_order");



CREATE INDEX "idx_project_sintaks_project_id" ON "public"."project_sintaks" USING "btree" ("project_id");



CREATE INDEX "idx_project_submissions_project_id" ON "public"."project_submissions" USING "btree" ("project_id");



CREATE INDEX "idx_project_submissions_sintaks_id" ON "public"."project_submissions" USING "btree" ("sintaks_id");



CREATE INDEX "idx_project_submissions_status" ON "public"."project_submissions" USING "btree" ("status");



CREATE INDEX "idx_project_submissions_student_id" ON "public"."project_submissions" USING "btree" ("student_id");



CREATE INDEX "idx_projects_class_id" ON "public"."projects" USING "btree" ("class_id");



CREATE INDEX "idx_projects_created_by" ON "public"."projects" USING "btree" ("created_by");



CREATE INDEX "idx_quiz_attempts_created_at" ON "public"."quiz_attempts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_quiz_attempts_score" ON "public"."quiz_attempts" USING "btree" ("score");



CREATE INDEX "idx_quiz_attempts_step_id" ON "public"."quiz_attempts" USING "btree" ("step_id");



CREATE INDEX "idx_quiz_attempts_student_id" ON "public"."quiz_attempts" USING "btree" ("student_id");



CREATE INDEX "idx_quiz_questions_order" ON "public"."quiz_questions" USING "btree" ("step_id", "question_order");



CREATE INDEX "idx_quiz_questions_step_id" ON "public"."quiz_questions" USING "btree" ("step_id");



CREATE INDEX "idx_schedules_created_by" ON "public"."schedules" USING "btree" ("created_by");



CREATE INDEX "idx_schedules_date" ON "public"."schedules" USING "btree" ("date");



CREATE INDEX "idx_schedules_type" ON "public"."schedules" USING "btree" ("type");



CREATE INDEX "idx_student_progress_pembelajaran_id" ON "public"."student_progress" USING "btree" ("pembelajaran_id");



CREATE INDEX "idx_student_progress_steps_completed" ON "public"."student_progress_steps" USING "btree" ("completed");



CREATE INDEX "idx_student_progress_steps_progress_id" ON "public"."student_progress_steps" USING "btree" ("progress_id");



CREATE INDEX "idx_student_progress_steps_step_id" ON "public"."student_progress_steps" USING "btree" ("step_id");



CREATE INDEX "idx_student_progress_student_id" ON "public"."student_progress" USING "btree" ("student_id");



CREATE INDEX "idx_teacher_class_assignments_class_id" ON "public"."teacher_class_assignments" USING "btree" ("class_id");



CREATE INDEX "idx_teacher_class_assignments_teacher_id" ON "public"."teacher_class_assignments" USING "btree" ("teacher_id");



CREATE INDEX "idx_todos_completed" ON "public"."todos" USING "btree" ("completed");



CREATE INDEX "idx_todos_user_id" ON "public"."todos" USING "btree" ("user_id");



CREATE INDEX "kv_store_5b267751_key_idx" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx1" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx10" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx11" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx12" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx13" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx14" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx15" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx16" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx17" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx18" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx19" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx2" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx20" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx21" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx22" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx23" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx24" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx3" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx4" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx5" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx6" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx7" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx8" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_5b267751_key_idx9" ON "public"."kv_store_5b267751" USING "btree" ("key" "text_pattern_ops");



CREATE OR REPLACE TRIGGER "update_classes_updated_at" BEFORE UPDATE ON "public"."classes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_forum_comments_updated_at" BEFORE UPDATE ON "public"."forum_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_forum_posts_updated_at" BEFORE UPDATE ON "public"."forum_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pembelajaran_steps_updated_at" BEFORE UPDATE ON "public"."pembelajaran_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pembelajaran_updated_at" BEFORE UPDATE ON "public"."pembelajaran" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_groups_updated_at" BEFORE UPDATE ON "public"."project_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_sintaks_updated_at" BEFORE UPDATE ON "public"."project_sintaks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_submissions_updated_at" BEFORE UPDATE ON "public"."project_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quiz_questions_updated_at" BEFORE UPDATE ON "public"."quiz_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_schedules_updated_at" BEFORE UPDATE ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_student_progress_steps_updated_at" BEFORE UPDATE ON "public"."student_progress_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_student_progress_updated_at" BEFORE UPDATE ON "public"."student_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_todos_updated_at" BEFORE UPDATE ON "public"."todos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_comments"
    ADD CONSTRAINT "forum_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_comments"
    ADD CONSTRAINT "forum_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_likes"
    ADD CONSTRAINT "forum_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_likes"
    ADD CONSTRAINT "forum_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_posts"
    ADD CONSTRAINT "forum_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pembelajaran"
    ADD CONSTRAINT "pembelajaran_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pembelajaran"
    ADD CONSTRAINT "pembelajaran_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pembelajaran_steps"
    ADD CONSTRAINT "pembelajaran_steps_pembelajaran_id_fkey" FOREIGN KEY ("pembelajaran_id") REFERENCES "public"."pembelajaran"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_group_members"
    ADD CONSTRAINT "project_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."project_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_group_members"
    ADD CONSTRAINT "project_group_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_groups"
    ADD CONSTRAINT "project_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_sintaks"
    ADD CONSTRAINT "project_sintaks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_submissions"
    ADD CONSTRAINT "project_submissions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_submissions"
    ADD CONSTRAINT "project_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_submissions"
    ADD CONSTRAINT "project_submissions_sintaks_id_fkey" FOREIGN KEY ("sintaks_id") REFERENCES "public"."project_sintaks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_submissions"
    ADD CONSTRAINT "project_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."pembelajaran_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."pembelajaran_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_pembelajaran_id_fkey" FOREIGN KEY ("pembelajaran_id") REFERENCES "public"."pembelajaran"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_progress_steps"
    ADD CONSTRAINT "student_progress_steps_progress_id_fkey" FOREIGN KEY ("progress_id") REFERENCES "public"."student_progress"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_progress_steps"
    ADD CONSTRAINT "student_progress_steps_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."pembelajaran_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_class_assignments"
    ADD CONSTRAINT "teacher_class_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."teacher_class_assignments"
    ADD CONSTRAINT "teacher_class_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_class_assignments"
    ADD CONSTRAINT "teacher_class_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_schedules"
    ADD CONSTRAINT "teacher_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete all profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can insert profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage classes" ON "public"."classes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can manage schedules" ON "public"."schedules" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can update all profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))) OR ("auth"."uid"() = "id")));



CREATE POLICY "Admin can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))) OR ("auth"."uid"() = "id")));



CREATE POLICY "Admin full access" ON "public"."profiles" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can manage all class assignments" ON "public"."teacher_class_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Classes are viewable by authenticated users" ON "public"."classes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable all for class_schedules" ON "public"."class_schedules" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all for teacher_schedules" ON "public"."teacher_schedules" USING (true) WITH CHECK (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."class_subjects" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users" ON "public"."subjects" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."class_subjects" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."subjects" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."class_subjects" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."subjects" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."class_subjects" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."subjects" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "File uploads are viewable by authenticated users" ON "public"."file_uploads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Forum comments are viewable by authenticated users" ON "public"."forum_comments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Forum likes are viewable by authenticated users" ON "public"."forum_likes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Forum posts are viewable by authenticated users" ON "public"."forum_posts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Guru can delete own pembelajaran" ON "public"."pembelajaran" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))));



CREATE POLICY "Guru can delete own projects" ON "public"."projects" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))));



CREATE POLICY "Guru can insert pembelajaran" ON "public"."pembelajaran" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))));



CREATE POLICY "Guru can insert projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))));



CREATE POLICY "Guru can manage own pembelajaran steps" ON "public"."pembelajaran_steps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."pembelajaran" "p"
  WHERE (("p"."id" = "pembelajaran_steps"."pembelajaran_id") AND ("p"."created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))))));



CREATE POLICY "Guru can manage own project sintaks" ON "public"."project_sintaks" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "pr"
  WHERE (("pr"."id" = "project_sintaks"."project_id") AND ("pr"."created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))))));



CREATE POLICY "Guru can manage project group members" ON "public"."project_group_members" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."project_groups" "pg"
     JOIN "public"."projects" "pr" ON (("pg"."project_id" = "pr"."id")))
  WHERE (("pg"."id" = "project_group_members"."group_id") AND ("pr"."created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))))));



CREATE POLICY "Guru can manage project groups" ON "public"."project_groups" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "pr"
  WHERE (("pr"."id" = "project_groups"."project_id") AND ("pr"."created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))))));



CREATE POLICY "Guru can manage quiz questions" ON "public"."quiz_questions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."pembelajaran_steps" "ps"
     JOIN "public"."pembelajaran" "p" ON (("ps"."pembelajaran_id" = "p"."id")))
  WHERE (("ps"."id" = "quiz_questions"."step_id") AND ("p"."created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))))));



CREATE POLICY "Guru can review submissions" ON "public"."project_submissions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "pr"
  WHERE (("pr"."id" = "project_submissions"."project_id") AND ("pr"."created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))))));



CREATE POLICY "Guru can update own pembelajaran" ON "public"."pembelajaran" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))));



CREATE POLICY "Guru can update own projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guru'::"text"))))));



CREATE POLICY "Pembelajaran are viewable by authenticated users" ON "public"."pembelajaran" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Pembelajaran steps are viewable by authenticated users" ON "public"."pembelajaran_steps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Profiles are viewable by authenticated users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Project group members are viewable by authenticated users" ON "public"."project_group_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Project groups are viewable by authenticated users" ON "public"."project_groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Project sintaks are viewable by authenticated users" ON "public"."project_sintaks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Project submissions are viewable by authenticated users" ON "public"."project_submissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Projects are viewable by authenticated users" ON "public"."projects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Quiz questions are viewable by authenticated users" ON "public"."quiz_questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Schedules are viewable by authenticated users" ON "public"."schedules" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Students can create own progress" ON "public"."student_progress" FOR INSERT TO "authenticated" WITH CHECK ((("student_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'siswa'::"text"))))));



CREATE POLICY "Students can create own submissions" ON "public"."project_submissions" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "student_id") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'siswa'::"text"))))));



CREATE POLICY "Students can manage own progress steps" ON "public"."student_progress_steps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."student_progress" "sp"
  WHERE (("sp"."id" = "student_progress_steps"."progress_id") AND ("sp"."student_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'siswa'::"text"))))))));



CREATE POLICY "Students can update own progress" ON "public"."student_progress" FOR UPDATE TO "authenticated" USING ((("student_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'siswa'::"text"))))));



CREATE POLICY "Students can update own submissions" ON "public"."project_submissions" FOR UPDATE TO "authenticated" USING ((("student_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'siswa'::"text"))))));



CREATE POLICY "Students can view own progress" ON "public"."student_progress" FOR SELECT TO "authenticated" USING ((("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['guru'::"text", 'admin'::"text"])))))));



CREATE POLICY "Students can view own progress steps" ON "public"."student_progress_steps" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."student_progress" "sp"
  WHERE (("sp"."id" = "student_progress_steps"."progress_id") AND (("sp"."student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['guru'::"text", 'admin'::"text"]))))))))));



CREATE POLICY "Teachers can view their own class assignments" ON "public"."teacher_class_assignments" FOR SELECT USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "Users can create forum comments" ON "public"."forum_comments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create forum posts" ON "public"."forum_posts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage own likes" ON "public"."forum_likes" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own todos" ON "public"."todos" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own forum comments" ON "public"."forum_comments" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own forum posts" ON "public"."forum_posts" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can upload files" ON "public"."file_uploads" FOR INSERT TO "authenticated" WITH CHECK (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users or admin can delete forum comments" ON "public"."forum_comments" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "Users or admin can delete forum posts" ON "public"."forum_posts" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."class_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kv_store_5b267751" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_class_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_schedules" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_highest_quiz_score"("p_progress_step_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_progress_percentage"("p_student_id" "uuid", "p_pembelajaran_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_step_unlocked"("p_student_id" "uuid", "p_pembelajaran_id" "uuid", "p_step_order" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."class_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."pembelajaran" TO "anon";
GRANT ALL ON TABLE "public"."pembelajaran" TO "authenticated";
GRANT ALL ON TABLE "public"."pembelajaran" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."class_statistics" TO "anon";
GRANT ALL ON TABLE "public"."class_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."class_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."class_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."class_subjects" TO "anon";
GRANT ALL ON TABLE "public"."class_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."file_uploads" TO "anon";
GRANT ALL ON TABLE "public"."file_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."file_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."forum_comments" TO "anon";
GRANT ALL ON TABLE "public"."forum_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_comments" TO "service_role";



GRANT ALL ON TABLE "public"."forum_likes" TO "anon";
GRANT ALL ON TABLE "public"."forum_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_likes" TO "service_role";



GRANT ALL ON TABLE "public"."forum_posts" TO "anon";
GRANT ALL ON TABLE "public"."forum_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_posts" TO "service_role";



GRANT ALL ON TABLE "public"."kv_store_5b267751" TO "anon";
GRANT ALL ON TABLE "public"."kv_store_5b267751" TO "authenticated";
GRANT ALL ON TABLE "public"."kv_store_5b267751" TO "service_role";



GRANT ALL ON TABLE "public"."pembelajaran_steps" TO "anon";
GRANT ALL ON TABLE "public"."pembelajaran_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."pembelajaran_steps" TO "service_role";



GRANT ALL ON TABLE "public"."project_group_members" TO "anon";
GRANT ALL ON TABLE "public"."project_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."project_groups" TO "anon";
GRANT ALL ON TABLE "public"."project_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."project_groups" TO "service_role";



GRANT ALL ON TABLE "public"."project_sintaks" TO "anon";
GRANT ALL ON TABLE "public"."project_sintaks" TO "authenticated";
GRANT ALL ON TABLE "public"."project_sintaks" TO "service_role";



GRANT ALL ON TABLE "public"."project_submissions" TO "anon";
GRANT ALL ON TABLE "public"."project_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."project_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."student_progress" TO "anon";
GRANT ALL ON TABLE "public"."student_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."student_progress" TO "service_role";



GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";



GRANT ALL ON TABLE "public"."student_dashboard_summary" TO "anon";
GRANT ALL ON TABLE "public"."student_dashboard_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."student_dashboard_summary" TO "service_role";



GRANT ALL ON TABLE "public"."student_progress_steps" TO "anon";
GRANT ALL ON TABLE "public"."student_progress_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."student_progress_steps" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_class_assignments" TO "service_role";
GRANT ALL ON TABLE "public"."teacher_class_assignments" TO "anon";
GRANT ALL ON TABLE "public"."teacher_class_assignments" TO "authenticated";



GRANT ALL ON TABLE "public"."teacher_dashboard_summary" TO "anon";
GRANT ALL ON TABLE "public"."teacher_dashboard_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_dashboard_summary" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_schedules" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




























