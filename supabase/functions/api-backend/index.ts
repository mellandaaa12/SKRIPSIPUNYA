import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
const app = new Hono();
// Enable logger
app.use("*", logger(console.log));
// Enable CORS for all routes and methods
app.use("/*", cors({
  origin: "*",
  allowHeaders: [
    "Content-Type",
    "Authorization"
  ],
  allowMethods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
  ],
  exposeHeaders: [
    "Content-Length"
  ],
  maxAge: 600
}));
// Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
// Admin client with service role key (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
// User client with anon key (for validating user JWTs)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
// Storage bucket setup
const BUCKET_NAME = "learning-files";
// Initialize storage bucket (wrapped in try-catch to prevent startup errors)
async function initStorage() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("⚠️ Supabase credentials not available, skipping storage initialization");
      return;
    }
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((bucket)=>bucket.name === BUCKET_NAME);
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false
      });
      console.log("Storage bucket created:", BUCKET_NAME);
    }
  } catch (error) {
    console.log("⚠️ Storage initialization skipped:", error);
  }
}
// Don't call initStorage() at startup - call it lazily when needed
// initStorage();
// ==================== UTILITY FUNCTIONS ====================
// Helper: Get user from token
async function getUserFromToken(authHeader) {
  if (!authHeader) {
    console.log("❌ No Authorization header provided");
    return null;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("❌ No token found in Authorization header");
    return null;
  }
  try {
    console.log("🔍 Validating JWT token...");
    // Use admin client to validate and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error) {
      console.error("❌ JWT validation error:", error.message);
      return null;
    }
    if (!user) {
      console.log("❌ No user found for token");
      return null;
    }
    console.log("✅ JWT valid for user:", user.id);
    // Get user data from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).single();
    if (profileError) {
      console.error("❌ Error fetching profile:", profileError.message);
      return null;
    }
    if (!profile) {
      console.log("⚠️ User found in auth but not in profiles table:", user.id);
      return null;
    }
    console.log("✅ User data from database:", profile);
    return profile;
  } catch (error) {
    console.error("❌ Error in getUserFromToken:", error);
    return null;
  }
}
// Helper: Generate avatar color
function generateAvatarColor() {
  const colors = [
    "#1294f2",
    "#46bd84",
    "#ffcb14",
    "#dc2626",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
// ==================== ROOT ROUTE (DEBUG) ====================
app.get("/", (c)=>{
  return c.json({
    status: "ok",
    message: "make-server is running",
    timestamp: new Date().toISOString()
  });
});
// ==================== HEALTH CHECK ====================
app.get("/health", (c)=>{
  return c.json({
    status: "ok",
    message: "Backend is running with Supabase Database",
    timestamp: new Date().toISOString()
  });
});
// ==================== AUTH ROUTES ====================
// Sign in
app.post("/auth/signin", async (c)=>{
  try {
    const { email, password } = await c.req.json();
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      return c.json({
        error: error.message
      }, 400);
    }
    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("*").eq("id", data.user.id).single();
    if (profileError) {
      return c.json({
        error: "User profile not found"
      }, 404);
    }
    return c.json({
      success: true,
      user: profile,
      session: data.session
    });
  } catch (error) {
    console.error("Signin error:", error);
    return c.json({
      error: String(error)
    }, 500);
  }
});
// Get current user
app.get("/auth/me", async (c)=>{
  const user = await getUserFromToken(c.req.header("Authorization"));
  if (!user) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  return c.json({
    user
  });
});
// Sign out
app.post("/auth/signout", async (c)=>{
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const token = authHeader.split(" ")[1];
  try {
    // Use correct signOut method (not .auth.admin.signOut)
    const { error } = await supabaseAdmin.auth.signOut(token);
    if (error) {
      console.error("Signout error:", error);
      return c.json({
        error: error.message
      }, 400);
    }
    return c.json({
      success: true
    });
  } catch (err) {
    console.error("Signout exception:", err);
    return c.json({
      error: "Signout failed"
    }, 500);
  }
});
// ==================== ADMIN: CREATE USER ====================
// Bootstrap: Create first admin account (no auth required)
app.post("/bootstrap/admin", async (c)=>{
  try {
    console.log("🔧 Bootstrap admin request received");
    // Check if any admin already exists
    const { data: existingAdmins } = await supabaseAdmin.from("profiles").select("id").eq("role", "admin");
    if (existingAdmins && existingAdmins.length > 0) {
      console.log("❌ Admin already exists, bootstrap disabled");
      return c.json({
        error: "Admin already exists. This endpoint is disabled.",
        message: "For security reasons, you can only create the first admin via this endpoint."
      }, 403);
    }
    console.log("✅ No admin found, proceeding with bootstrap");
    // Get credentials from request or use defaults
    const body = await c.req.json().catch(()=>({}));
    const email = body.email || "admin@sekolah.com";
    const password = body.password || "admin123456";
    const name = body.name || "Administrator";
    console.log(`Creating bootstrap admin: ${email}`);
    // Create admin user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "admin"
      }
    });
    if (createError) {
      console.error("❌ Create admin error:", createError);
      return c.json({
        error: createError.message
      }, 400);
    }
    console.log("✅ Admin created in Supabase Auth:", newUser.user.id);
    // Create admin profile in database
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUser.user.id,
      email,
      name,
      role: "admin",
      avatar: null,
      avatar_color: "#ef4444",
      class_id: null,
      status: "Admin"
    }).select().single();
    if (profileError) {
      console.error("❌ Create profile error:", profileError);
      return c.json({
        error: profileError.message
      }, 400);
    }
    console.log("✅ Admin created in database");
    console.log("🎉 Bootstrap complete!");
    return c.json({
      success: true,
      admin: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      },
      credentials: {
        email,
        password
      },
      message: "✅ Admin account created successfully! Please save these credentials securely.",
      warning: "⚠️ This endpoint is now disabled. Use /admin/create-user to create additional users."
    });
  } catch (error) {
    console.error("❌ Bootstrap error:", error);
    return c.json({
      error: "Failed to create admin",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
// Admin: Create new user (admin only)
app.post("/admin/create-user", async (c)=>{
  try {
    const currentUser = await getUserFromToken(c.req.header("Authorization"));
    if (!currentUser || currentUser.role !== "admin") {
      return c.json({
        error: "Forbidden: Admin access required"
      }, 403);
    }
    const { email, password, name, role, classId } = await c.req.json();
    // Validate required fields
    if (!email || !password || !name || !role) {
      return c.json({
        error: "Missing required fields: email, password, name, role"
      }, 400);
    }
    // Validate role
    if (![
      "admin",
      "guru",
      "siswa"
    ].includes(role)) {
      return c.json({
        error: "Invalid role. Must be: admin, guru, or siswa"
      }, 400);
    }
    // Validate classId for siswa
    if (role === "siswa" && !classId) {
      return c.json({
        error: "classId is required for siswa role"
      }, 400);
    }
    console.log(`Creating new user: ${email} with role: ${role}`);
    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        classId: role === "siswa" ? classId : undefined
      }
    });
    if (createError) {
      console.error("Create user error:", createError);
      return c.json({
        error: createError.message
      }, 400);
    }
    console.log("✅ User created in Supabase Auth:", newUser.user.id);
    // Create user profile in database
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUser.user.id,
      email,
      name,
      role,
      avatar: null,
      avatar_color: generateAvatarColor(),
      class_id: role === "siswa" ? classId : null,
      status: role === "admin" ? "Admin" : role === "guru" ? "Guru" : "Siswa"
    }).select().single();
    if (profileError) {
      console.error("Create profile error:", profileError);
      return c.json({
        error: profileError.message
      }, 400);
    }
    console.log("✅ User created in database");
    return c.json({
      success: true,
      user: profile,
      message: "User created successfully. User can now login with provided credentials."
    });
  } catch (error) {
    console.error("Create user error:", error);
    return c.json({
      error: "Failed to create user",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
// ==================== USER ROUTES ====================
// Get all users (admin only)
app.get("/users", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "admin") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { data: users, error } = await supabaseAdmin.from("profiles").select("*").order("created_at", {
    ascending: false
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    users
  });
});
// Get users by role
app.get("/users/:role", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "admin") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const role = c.req.param("role");
  const { data: users, error } = await supabaseAdmin.from("profiles").select("*").eq("role", role).order("created_at", {
    ascending: false
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    users
  });
});
// Update user profile
app.put("/users/:userId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const userId = c.req.param("userId");
  const updates = await c.req.json();
  // Only allow user to update their own profile or admin to update any
  if (currentUser.id !== userId && currentUser.role !== "admin") {
    return c.json({
      error: "Forbidden"
    }, 403);
  }
  const { data: updatedUser, error } = await supabaseAdmin.from("profiles").update({
    ...updates,
    updated_at: new Date().toISOString()
  }).eq("id", userId).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    user: updatedUser
  });
});
// Delete user (admin only)
app.delete("/users/:userId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "admin") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const userId = c.req.param("userId");
  // Delete from Supabase Auth (will cascade to profiles table)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    success: true
  });
});
// ==================== CLASS ROUTES ====================
// Get all classes
app.get("/classes", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { data: classesRaw, error } = await supabaseAdmin.from("classes").select(`
    *,
    teacher:profiles(name)!classes_teacher_id_fkey
  `).order("created_at", {
    ascending: false
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  const classes = classesRaw.map(cls => ({
    ...cls,
    teacherName: cls.teacher?.name || "-",
    teacherId: cls.teacher_id
  }));
  return c.json({
    classes
  });
});
// Create class (admin only)
app.post("/classes", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "admin") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { name, grade, subject } = await c.req.json();
  const { data: classData, error } = await supabaseAdmin.from("classes").insert({
    name,
    grade,
    subject
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    class: classData
  });
});
// Update class (admin only)
app.put("/classes/:classId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "admin") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const classId = c.req.param("classId");
  const updates = await c.req.json();
  // Map frontend teacherId to backend teacher_id
  const dbUpdates = {
    ...updates,
    teacher_id: updates.teacherId || updates.teacher_id,
    updated_at: new Date().toISOString()
  };
  delete dbUpdates.teacherId; // Clean up
  const { data: updatedClass, error } = await supabaseAdmin.from("classes").update(dbUpdates).eq("id", classId).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    class: updatedClass
  });
});
// Delete class (admin only)
app.delete("/classes/:classId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "admin") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const classId = c.req.param("classId");
  const { error } = await supabaseAdmin.from("classes").delete().eq("id", classId);
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    success: true
  });
});
// ==================== PEMBELAJARAN ROUTES ====================
// Get pembelajaran by class
app.get("/pembelajaran/class/:classId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const classId = c.req.param("classId");
  const { data: pembelajaran, error } = await supabaseAdmin.from("pembelajaran").select("*").eq("class_id", classId).order("created_at", {
    ascending: false
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    pembelajaran
  });
});
// Get single pembelajaran with steps
app.get("/pembelajaran/:pembelajaranId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const pembelajaranId = c.req.param("pembelajaranId");
  // Get pembelajaran
  const { data: pembelajaran, error: pembelajaranError } = await supabaseAdmin.from("pembelajaran").select("*").eq("id", pembelajaranId).single();
  if (pembelajaranError) {
    return c.json({
      error: pembelajaranError.message
    }, 404);
  }
  // Get steps
  const { data: steps, error: stepsError } = await supabaseAdmin.from("pembelajaran_steps").select("*").eq("pembelajaran_id", pembelajaranId).order("step_order", {
    ascending: true
  });
  if (stepsError) {
    return c.json({
      error: stepsError.message
    }, 500);
  }
  // Get quiz questions for each quiz step
  const stepsWithQuestions = await Promise.all(steps.map(async (step)=>{
    if (step.type === "quiz") {
      const { data: questions } = await supabaseAdmin.from("quiz_questions").select("*").eq("step_id", step.id).order("question_order", {
        ascending: true
      });
      return {
        ...step,
        questions: questions || []
      };
    }
    return step;
  }));
  return c.json({
    pembelajaran: {
      ...pembelajaran,
      steps: stepsWithQuestions
    }
  });
});
// Create pembelajaran (guru only)
app.post("/pembelajaran", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "guru") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { classId, title, description, icon, color } = await c.req.json();
  const { data: pembelajaran, error } = await supabaseAdmin.from("pembelajaran").insert({
    class_id: classId,
    title,
    description,
    icon: icon || "BookOpen",
    color: color || "#1294f2",
    created_by: currentUser.id
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    pembelajaran
  });
});
// Update pembelajaran (guru only)
app.put("/pembelajaran/:pembelajaranId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "guru") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const pembelajaranId = c.req.param("pembelajaranId");
  const updates = await c.req.json();
  const { data: updatedPembelajaran, error } = await supabaseAdmin.from("pembelajaran").update({
    ...updates,
    updated_at: new Date().toISOString()
  }).eq("id", pembelajaranId).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    pembelajaran: updatedPembelajaran
  });
});
// Delete pembelajaran (guru only)
app.delete("/pembelajaran/:pembelajaranId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "guru") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const pembelajaranId = c.req.param("pembelajaranId");
  const { error } = await supabaseAdmin.from("pembelajaran").delete().eq("id", pembelajaranId);
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    success: true
  });
});
// Create step for pembelajaran (guru only)
app.post("/pembelajaran/:pembelajaranId/steps", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "guru") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const pembelajaranId = c.req.param("pembelajaranId");
  const { type, title, content, passingScore, stepOrder, questions } = await c.req.json();
  // Create step
  const { data: step, error: stepError } = await supabaseAdmin.from("pembelajaran_steps").insert({
    pembelajaran_id: pembelajaranId,
    type,
    title,
    content,
    passing_score: passingScore,
    step_order: stepOrder
  }).select().single();
  if (stepError) {
    return c.json({
      error: stepError.message
    }, 500);
  }
  // If quiz type, create questions
  if (type === "quiz" && questions && questions.length > 0) {
    const questionInserts = questions.map((q, index)=>({
        step_id: step.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        question_order: index + 1
      }));
    const { error: questionsError } = await supabaseAdmin.from("quiz_questions").insert(questionInserts);
    if (questionsError) {
      return c.json({
        error: questionsError.message
      }, 500);
    }
  }
  return c.json({
    step
  });
});
// ==================== PROJECT ROUTES ====================
// Get projects by class
app.get("/projects/class/:classId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const classId = c.req.param("classId");
  const { data: projects, error } = await supabaseAdmin.from("projects").select("*").eq("class_id", classId).order("created_at", {
    ascending: false
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    projects
  });
});
// Get single project with sintaks
app.get("/projects/:projectId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const projectId = c.req.param("projectId");
  // Get project
  const { data: project, error: projectError } = await supabaseAdmin.from("projects").select("*").eq("id", projectId).single();
  if (projectError) {
    return c.json({
      error: projectError.message
    }, 404);
  }
  // Get sintaks
  const { data: sintaks, error: sintaksError } = await supabaseAdmin.from("project_sintaks").select("*").eq("project_id", projectId).order("sintaks_order", {
    ascending: true
  });
  if (sintaksError) {
    return c.json({
      error: sintaksError.message
    }, 500);
  }
  return c.json({
    project: {
      ...project,
      sintaks: sintaks || []
    }
  });
});
// Create project (guru only)
app.post("/projects", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "guru") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { classId, title, description, icon, color } = await c.req.json();
  const { data: project, error } = await supabaseAdmin.from("projects").insert({
    class_id: classId,
    title,
    description,
    icon: icon || "Folder",
    color: color || "#46bd84",
    created_by: currentUser.id
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    project
  });
});
// Create sintaks for project (guru only)
app.post("/projects/:projectId/sintaks", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || currentUser.role !== "guru") {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const projectId = c.req.param("projectId");
  const { title, description, sintaksOrder } = await c.req.json();
  const { data: sintaks, error } = await supabaseAdmin.from("project_sintaks").insert({
    project_id: projectId,
    title,
    description,
    sintaks_order: sintaksOrder
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    sintaks
  });
});
// ==================== PROGRESS ROUTES ====================
// Get student progress for pembelajaran
app.get("/progress/pembelajaran/:userId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const userId = c.req.param("userId");
  // Only allow user to see their own progress or teacher/admin
  if (currentUser.id !== userId && ![
    "guru",
    "admin"
  ].includes(currentUser.role)) {
    return c.json({
      error: "Forbidden"
    }, 403);
  }
  const { data: progress, error } = await supabaseAdmin.from("student_progress").select("*").eq("student_id", userId);
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    progress
  });
});
// Update student progress (step completion)
app.post("/progress/step", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { pembelajaranId, stepId, completed } = await c.req.json();
  // Check if progress exists
  let { data: progress } = await supabaseAdmin.from("student_progress").select("id").eq("student_id", currentUser.id).eq("pembelajaran_id", pembelajaranId).single();
  // Create progress if doesn't exist
  if (!progress) {
    const { data: newProgress, error: createError } = await supabaseAdmin.from("student_progress").insert({
      student_id: currentUser.id,
      pembelajaran_id: pembelajaranId,
      completed: false
    }).select().single();
    if (createError) {
      return c.json({
        error: createError.message
      }, 500);
    }
    progress = newProgress;
  }
  // Update step progress
  const { data: stepProgress, error: stepError } = await supabaseAdmin.from("student_progress_steps").upsert({
    progress_id: progress.id,
    step_id: stepId,
    completed,
    completed_at: completed ? new Date().toISOString() : null
  }).select().single();
  if (stepError) {
    return c.json({
      error: stepError.message
    }, 500);
  }
  return c.json({
    progress: stepProgress
  });
});
// Submit quiz attempt
app.post("/progress/quiz", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { stepId, answers, score } = await c.req.json();
  const { data: attempt, error } = await supabaseAdmin.from("quiz_attempts").insert({
    student_id: currentUser.id,
    step_id: stepId,
    answers,
    score
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    attempt
  });
});
// ==================== TODO ROUTES ====================
// Get todos
app.get("/todos/:userId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const userId = c.req.param("userId");
  if (currentUser.id !== userId) {
    return c.json({
      error: "Forbidden"
    }, 403);
  }
  const { data: todos, error } = await supabaseAdmin.from("todos").select("*").eq("user_id", userId).order("created_at", {
    ascending: false
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    todos
  });
});
// Create todo
app.post("/todos", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { title } = await c.req.json();
  const { data: todo, error } = await supabaseAdmin.from("todos").insert({
    user_id: currentUser.id,
    title,
    completed: false
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    todo
  });
});
// Update todo
app.put("/todos/:todoId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const todoId = c.req.param("todoId");
  const updates = await c.req.json();
  const { data: todo, error } = await supabaseAdmin.from("todos").update({
    ...updates,
    updated_at: new Date().toISOString()
  }).eq("id", todoId).eq("user_id", currentUser.id).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    todo
  });
});
// Delete todo
app.delete("/todos/:todoId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const todoId = c.req.param("todoId");
  const { error } = await supabaseAdmin.from("todos").delete().eq("id", todoId).eq("user_id", currentUser.id);
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    success: true
  });
});
// ==================== SCHEDULE ROUTES ====================
// Get schedules
app.get("/schedules", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { data: schedules, error } = await supabaseAdmin.from("schedules").select("*").order("date", {
    ascending: true
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    schedules
  });
});
// Create schedule (admin/guru only)
app.post("/schedules", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser || ![
    "admin",
    "guru"
  ].includes(currentUser.role)) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { title, date, time, location, description } = await c.req.json();
  const { data: schedule, error } = await supabaseAdmin.from("schedules").insert({
    title,
    date,
    time,
    location,
    description,
    created_by: currentUser.id
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    schedule
  });
});
// ==================== FORUM ROUTES ====================
// Get all forum posts
app.get("/forum", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { data: posts, error } = await supabaseAdmin.from("forum_posts").select(`
      *,
      author:profiles!forum_posts_user_id_fkey(id, name, avatar, avatar_color),
      likes:forum_likes(user_id),
      comments:forum_comments(
        *,
        author:profiles!forum_comments_user_id_fkey(id, name, avatar, avatar_color)
      )
    `).order("created_at", {
    ascending: false
  });
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    posts
  });
});
// Create forum post
app.post("/forum", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const { content, files } = await c.req.json();
  const { data: post, error } = await supabaseAdmin.from("forum_posts").insert({
    user_id: currentUser.id,
    content,
    files: files || []
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    post
  });
});
// Like/Unlike post
app.post("/forum/:postId/like", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const postId = c.req.param("postId");
  // Check if already liked
  const { data: existingLike } = await supabaseAdmin.from("forum_likes").select("id").eq("post_id", postId).eq("user_id", currentUser.id).single();
  if (existingLike) {
    // Unlike
    await supabaseAdmin.from("forum_likes").delete().eq("post_id", postId).eq("user_id", currentUser.id);
  } else {
    // Like
    await supabaseAdmin.from("forum_likes").insert({
      post_id: postId,
      user_id: currentUser.id
    });
  }
  return c.json({
    success: true
  });
});
// Add comment
app.post("/forum/:postId/comment", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const postId = c.req.param("postId");
  const { content } = await c.req.json();
  const { data: comment, error } = await supabaseAdmin.from("forum_comments").insert({
    post_id: postId,
    user_id: currentUser.id,
    content
  }).select().single();
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    comment
  });
});
// Delete post
app.delete("/forum/:postId", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const postId = c.req.param("postId");
  // Check ownership
  const { data: post } = await supabaseAdmin.from("forum_posts").select("user_id").eq("id", postId).single();
  if (!post || post.user_id !== currentUser.id && currentUser.role !== "admin") {
    return c.json({
      error: "Forbidden"
    }, 403);
  }
  const { error } = await supabaseAdmin.from("forum_posts").delete().eq("id", postId);
  if (error) {
    return c.json({
      error: error.message
    }, 500);
  }
  return c.json({
    success: true
  });
});
// ==================== FILE UPLOAD ROUTES ====================
// Upload file
app.post("/upload", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!file) {
      return c.json({
        error: "No file provided"
      }, 400);
    }
    const fileExt = file.name.split(".").pop();
    const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(fileName, buffer, {
      contentType: file.type,
      upsert: false
    });
    if (error) {
      console.error("Upload error:", error);
      return c.json({
        error: error.message
      }, 400);
    }
    // Get signed URL
    const { data: signedUrlData } = await supabaseAdmin.storage.from(BUCKET_NAME).createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year
    // Save to file_uploads table
    await supabaseAdmin.from("file_uploads").insert({
      user_id: currentUser.id,
      file_name: file.name,
      file_path: fileName,
      file_type: file.type,
      file_size: file.size
    });
    return c.json({
      success: true,
      fileName,
      url: signedUrlData?.signedUrl
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({
      error: String(error)
    }, 500);
  }
});
// Get file URL
app.get("/files/:fileName", async (c)=>{
  const currentUser = await getUserFromToken(c.req.header("Authorization"));
  if (!currentUser) {
    return c.json({
      error: "Unauthorized"
    }, 401);
  }
  const fileName = c.req.param("fileName");
  const { data } = await supabaseAdmin.storage.from(BUCKET_NAME).createSignedUrl(fileName, 60 * 60 * 24); // 24 hours
  if (!data) {
    return c.json({
      error: "File not found"
    }, 404);
  }
  return c.json({
    url: data.signedUrl
  });
});
// ==================== START SERVER ====================
Deno.serve(app.fetch);
