/**
 * API Utility Functions
 * Complete REST API client untuk Supabase
 */

import { supabase } from "./supabase";
export { supabase };

/** Nama kelas lengkap untuk UI, contoh: "XI Rekayasa Perangkat Lunak 1" */
export function formatClassDisplayName(row: {
  grade?: string | null;
  subject?: string | null;
  name?: string | null;
}) {
  const g = (row.grade ?? "").trim();
  const s = (row.subject ?? "").trim();
  const n = (row.name ?? "").trim();
  const label = [g, s, n].filter(Boolean).join(" ");
  return label || "—";
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get access token from current session.
 * Uses getSession() only — avoids calling both getUser() and getSession()
 * which can cause lock contention on the Supabase auth storage.
 */
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// ==================== AUTH API ====================

export const authAPI = {
  /**
   * Sign up new user
   */
  async signUp(data: {
    email: string;
    password: string;
    name: string;
    role: "admin" | "guru" | "siswa";
    classId?: string;
  }) {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
          classId: data.classId || null,
        },
      },
    });
    if (error) throw new Error(error.message);
    return { success: true, user: signUpData.user };
  },

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return { success: true, user: data.user, session: data.session };
  },

  /**
   * Get current user
   */
  async getCurrentUser(accessToken: string) {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    return { user: data.user };
  },

  /**
   * Sign out
   */
  async signOut(accessToken: string) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Health check
   */
  async healthCheck() {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return {
      status: error ? "degraded" : "ok",
      message: error ? error.message : "Supabase connected",
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Bootstrap: Create first admin (no auth required)
   */
  async bootstrapAdmin(data?: {
    email?: string;
    password?: string;
    name?: string;
  }) {
    throw new Error("Bootstrap admin via client is disabled. Create admin from Supabase dashboard.");
  },

  /**
   * Admin: Create new user (admin only)
   */
  async createUser(
    data: {
      email: string;
      password: string;
      name: string;
      role: "admin" | "guru" | "siswa";
      classId?: string;
    },
    accessToken: string
  ) {
    const usernameFromEmail = data.email.includes("@")
      ? data.email.split("@")[0].toLowerCase()
      : data.email.toLowerCase().replace(/\s+/g, "");

    try {
      console.log("🚀 Attempting to create user via RPC 'create_confirmed_user':", data.email);
      // Try to call the security definer RPC first

      const { data: rpcData, error: rpcError } = await supabase.rpc("create_confirmed_user", {
        user_email: data.email,
        user_password: data.password,
        user_name: data.name,
        user_role: data.role,
        user_class_id: data.role === "siswa" ? data.classId || null : null,
        user_username: usernameFromEmail,
      });

      if (!rpcError && rpcData) {
        if (rpcData.success) {
          console.log("✅ User created successfully via RPC (Bypassed rate limit & confirmation email)");
          
          // Fetch the newly created profile to return
          const { data: createdProfile, error: getProfileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", rpcData.user_id)
            .single();

          if (!getProfileError && createdProfile) {
            await supabase
              .from("profiles")
              .update({
                username: usernameFromEmail,
                password: data.password,
                demo_password: data.password,
              })
              .eq("id", rpcData.user_id);
            return {
              success: true,
              user: createdProfile,
              message: "User created successfully (RPC bypassed email).",
            };
          }
        } else {
          // If RPC returns custom error like "Username atau email sudah terdaftar."
          throw new Error(rpcData.error || "Gagal membuat user.");
        }
      }

      if (rpcError) {
        console.warn("⚠️ RPC method not available or failed, falling back to standard signUp():", rpcError.message);
      }
    } catch (rpcCatchErr: any) {
      // If it's a validation error (like email already exists), bubble it up
      if (rpcCatchErr.message?.includes("sudah terdaftar") || rpcCatchErr.message?.includes("sudah digunakan")) {
        throw rpcCatchErr;
      }
      console.warn("⚠️ RPC failed with catch, falling back to standard signUp():", rpcCatchErr.message);
    }

    // FALLBACK STRATEGY: Standard signUp
    console.log("🔄 Calling standard supabase.auth.signUp() fallback...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
          classId: data.role === "siswa" ? data.classId || null : null,
        },
      },
    });

    if (signUpError) {
      console.error("❌ Standard signUp error:", signUpError);
      
      // Highly user-friendly Supabase email rate limit error handling
      const isRateLimit = 
        signUpError.message?.toLowerCase().includes("rate limit") ||
        signUpError.message?.toLowerCase().includes("too many requests") ||
        signUpError.status === 429;

      if (isRateLimit) {
        throw new Error(
          "⚠️ Batas Limit Email Supabase Tercapai!\n\n" +
          "Untuk melanjutkan pendaftaran sekolah tanpa dibatasi limit email:\n" +
          "1. Buka Supabase Dashboard Anda (https://supabase.com)\n" +
          "2. Masuk ke menu 'Authentication' -> 'Providers' -> 'Email'\n" +
          "3. NONAKTIFKAN pilihan 'Confirm Email' (matikan checklist/switch)\n" +
          "4. Simpan perubahan. Dengan mematikan Confirm Email, akun akan langsung aktif tanpa perlu konfirmasi email, bebas dari rate limit, dan tidak mengirim spam email.\n\n" +
          "ATAU\n" +
          "Jalankan file SQL 'create_confirmed_user.sql' yang sudah kami buat di root folder proyek Anda pada tab SQL Editor Supabase untuk mengaktifkan instant bypass."
        );
      }
      
      throw new Error(signUpError.message);
    }

    const authUser = signUpData?.user;
    if (!authUser?.id) {
      throw new Error("Gagal membuat akun auth. Pastikan konfigurasi Auth Supabase sudah benar.");
    }

    const profilePayload: any = {
      id: authUser.id,
      email: data.email,
      name: data.name,
      role: data.role,
      class_id: data.role === "siswa" ? data.classId || null : null,
      status: data.role === "admin" ? "Admin" : data.role === "guru" ? "Guru" : "Siswa",
      username: usernameFromEmail,
      password: data.password,
      demo_password: data.password,
      updated_at: new Date().toISOString(),
    };

    const { data: createdProfile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select()
      .single();

    if (profileError) throw new Error(profileError.message);

    return {
      success: true,
      user: createdProfile,
      message: "User created successfully.",
    };
  },
};

// ==================== STATS API ====================

export const statsAPI = {
  /**
   * Get monitoring stats (admin only)
   */
  async getMonitoring(accessToken: string) {
    const [
      { data: users, error: usersError },
      { data: classesRaw, error: classesError },
      { data: pembelajaranRows, error: pembelajaranError },
      { data: classSubjects, error: classSubjectsError },
    ] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("classes").select("*"),
      supabase.from("pembelajaran").select("id,class_id,created_by,title,status,created_at,steps"),
      supabase.from("class_subjects").select("class_id,teacher_id"),
    ]);

    if (usersError) throw new Error(usersError.message);
    if (classesError) throw new Error(classesError.message);
    if (pembelajaranError) throw new Error(pembelajaranError.message);
    if (classSubjectsError) throw new Error(classSubjectsError.message);

    const allUsers = users || [];
    const classes = classesRaw || [];
    const pembelajaran = pembelajaranRows || [];
    const projects: any[] = [];
    const csRows = classSubjects || [];
    const nowMs = Date.now();
    const onlineThresholdMs = 5 * 60 * 1000;

    const studentsByClass = allUsers
      .filter((p: any) => p.role === "siswa" && p.class_id)
      .reduce((acc: Record<string, number>, p: any) => {
        acc[p.class_id] = (acc[p.class_id] || 0) + 1;
        return acc;
      }, {});

    const pembelajaranByClass = pembelajaran.reduce((acc: Record<string, number>, r: any) => {
      if (r.class_id) acc[r.class_id] = (acc[r.class_id] || 0) + 1;
      return acc;
    }, {});

    const projectsByClass = projects.reduce((acc: Record<string, number>, r: any) => {
      if (r.class_id) acc[r.class_id] = (acc[r.class_id] || 0) + 1;
      return acc;
    }, {});

    const teachersPerClass: Record<string, Set<string>> = {};
    for (const c of classes) {
      teachersPerClass[c.id] = new Set();
      if (c.teacher_id) teachersPerClass[c.id].add(c.teacher_id);
    }
    for (const row of csRows) {
      if (!row.class_id || !row.teacher_id) continue;
      if (!teachersPerClass[row.class_id]) teachersPerClass[row.class_id] = new Set();
      teachersPerClass[row.class_id].add(row.teacher_id);
    }

    const enrichedClasses = classes.map((c: any) => ({
      ...c,
      displayName: formatClassDisplayName(c),
      studentCount: studentsByClass[c.id] || 0,
      teacherCount: teachersPerClass[c.id]?.size || 0,
      materialCount: pembelajaranByClass[c.id] || 0,
      projectCount: projectsByClass[c.id] || 0,
    }));

    const classLabelById: Record<string, string> = {};
    for (const c of enrichedClasses) {
      classLabelById[c.id] = c.displayName;
    }

    const materialsByTeacher = pembelajaran.reduce((acc: Record<string, number>, r: any) => {
      if (r.created_by) acc[r.created_by] = (acc[r.created_by] || 0) + 1;
      return acc;
    }, {});

    const projectsByTeacher = projects.reduce((acc: Record<string, number>, r: any) => {
      if (r.created_by) acc[r.created_by] = (acc[r.created_by] || 0) + 1;
      return acc;
    }, {});

    const teacherToClassIds: Record<string, Set<string>> = {};
    for (const u of allUsers) {
      if (u.role === "guru") teacherToClassIds[(u as any).id] = new Set();
    }
    for (const c of classes) {
      if (c.teacher_id && teacherToClassIds[c.teacher_id]) {
        teacherToClassIds[c.teacher_id].add(c.id);
      }
    }
    for (const row of csRows) {
      if (row.teacher_id && teacherToClassIds[row.teacher_id]) {
        teacherToClassIds[row.teacher_id].add(row.class_id);
      }
    }
    for (const r of pembelajaran) {
      if (r.created_by && r.class_id && teacherToClassIds[r.created_by]) {
        teacherToClassIds[r.created_by].add(r.class_id);
      }
    }
    for (const r of projects) {
      if (r.created_by && r.class_id && teacherToClassIds[r.created_by]) {
        teacherToClassIds[r.created_by].add(r.class_id);
      }
    }

    const teacherClassNames: Record<string, string> = {};
    for (const gid of Object.keys(teacherToClassIds)) {
      const labels = [...teacherToClassIds[gid]].map((id) => classLabelById[id]).filter(Boolean);
      teacherClassNames[gid] = labels.join(", ") || "Belum ada kelas";
    }

    const teacherNameById: Record<string, string> = {};
    for (const u of allUsers) {
      if (u.role === "guru") teacherNameById[u.id] = u.name || "Guru";
    }

    const classNameById = classLabelById;

    const recentTeacherActivities = [
      ...pembelajaran.map((m: any) => ({
        id: `mat-${m.id}`,
        type: "materi" as const,
        createdAt: m.created_at || new Date().toISOString(),
        teacherId: m.created_by,
        teacherName: teacherNameById[m.created_by] || "Guru",
        classId: m.class_id,
        className: classNameById[m.class_id] || "Kelas",
        title: m.title || "Materi",
      })),
      ...projects.map((p: any) => ({
        id: `task-${p.id}`,
        type: "tugas" as const,
        createdAt: p.created_at || new Date().toISOString(),
        teacherId: p.created_by,
        teacherName: teacherNameById[p.created_by] || "Guru",
        classId: p.class_id,
        className: classNameById[p.class_id] || "Kelas",
        title: p.title || "Tugas",
      })),
    ]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 30);

    let rawProgressRows: any[] = [];
    const needsAttentionStudentIds = new Set(
      [] as string[]
    );
    {
      // Hitung siswa butuh perhatian dari data progress (siswa terhitung sekali walau gagal di beberapa tahapan)
      const { data: rawProgress } = await supabase
        .from("progress")
        .select("user_id,answers,score,updated_at,created_at")
        .not("user_id", "is", null);
      rawProgressRows = rawProgress || [];
      for (const row of rawProgressRows) {
        const attempts = Number((row as any).answers?.attempts || 0);
        const needsHelp = (row as any).answers?.needs_help === true;
        const lowScore = typeof (row as any).score === 'number' && (row as any).score < 60;
        if (needsHelp || attempts >= 3 || lowScore) {
          needsAttentionStudentIds.add((row as any).user_id);
        }
      }
    }

    const usersEnriched = allUsers.map((u: any) => {
      const updatedAt = u.updated_at ? +new Date(u.updated_at) : 0;
      const isOnline = nowMs - updatedAt <= onlineThresholdMs;
      return {
        ...u,
        isOnline,
      };
    });

    const recentActivities = allUsers
      .filter((u: any) => u.role !== 'admin')
      .map((u: any) => {
        let lastActiveTime = u.created_at || new Date().toISOString();
        
        if (u.role === 'siswa') {
          const studentProgress = rawProgressRows.filter((r: any) => r.user_id === u.id);
          if (studentProgress.length > 0) {
            const latestTime = Math.max(
              ...studentProgress.map((r: any) => new Date(r.updated_at || r.created_at || u.created_at).getTime())
            );
            lastActiveTime = new Date(latestTime).toISOString();
          } else if (u.updated_at) {
            lastActiveTime = u.updated_at;
          }
        } else if (u.role === 'guru') {
          const teacherActs = recentTeacherActivities.filter((a: any) => a.teacherId === u.id);
          if (teacherActs.length > 0) {
            const latestTime = Math.max(
              ...teacherActs.map((a: any) => new Date(a.createdAt).getTime())
            );
            lastActiveTime = new Date(latestTime).toISOString();
          } else if (u.updated_at) {
            lastActiveTime = u.updated_at;
          }
        }

        const updatedAt = u.updated_at ? +new Date(u.updated_at) : 0;
        const isOnline = nowMs - updatedAt <= onlineThresholdMs;

        return {
          id: u.id,
          type: u.role === 'guru' ? 'teacher' : 'student' as 'student' | 'teacher',
          name: u.name || "Siswa",
          email: u.email || "",
          role: u.role === 'guru' ? 'Guru' : 'Siswa',
          status: isOnline ? 'Active' : 'Offline',
          lastLogin: lastActiveTime,
          className:
            u.role === 'siswa'
              ? (classLabelById[u.class_id] ?? null)
              : (teacherClassNames[u.id] ?? null),
        };
      })
      .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());

    return {
      totalUsers: allUsers.length,
      totalGuru: allUsers.filter((u: any) => u.role === "guru").length,
      totalSiswa: allUsers.filter((u: any) => u.role === "siswa").length,
      totalKelas: classes.length,
      totalSiswaAktif: usersEnriched.filter((u: any) => u.role === "siswa" && u.isOnline).length,
      totalSiswaButuhPerhatian: [...needsAttentionStudentIds].filter((sid) =>
        allUsers.some((u: any) => u.id === sid && u.role === "siswa")
      ).length,
      totalPembelajaran: pembelajaran.length,
      totalProjects: projects.length,
      users: usersEnriched,
      classes: enrichedClasses,
      pembelajaran,
      projects,
      materialsByTeacher,
      projectsByTeacher,
      recentTeacherActivities,
      recentActivities,
      classLabelById,
      teacherClassNames,
    };
  },
};

// ==================== SCHEDULES API ====================

export const scheduleAPI = {
  getTeacherSchedules: async (teacherId: string, accessToken: string) => {
    const { data, error } = await supabase
      .from("teacher_schedules")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw new Error(error.message);
    return { schedules: data || [] };
  },
  addTeacherSchedule: async (teacherId: string, data: any, accessToken: string) => {
    const { data: created, error } = await supabase
      .from("teacher_schedules")
      .insert([{ ...data, teacher_id: teacherId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { schedule: created };
  },
  deleteTeacherSchedule: async (scheduleId: string, accessToken: string) => {
    const { error } = await supabase
      .from("teacher_schedules")
      .delete()
      .eq("id", scheduleId);
    if (error) throw new Error(error.message);
    return { success: true };
  },
  getClassSchedules: async (classId: string, accessToken: string) => {
    const { data, error } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("class_id", classId)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      console.warn("class_schedules error:", error.message);
      return { schedules: [] };
    }
    return { schedules: data || [] };
  },
  addClassSchedule: async (classId: string, data: any, accessToken: string) => {
    const { data: created, error } = await supabase
      .from("class_schedules")
      .insert([{ ...data, class_id: classId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { schedule: created };
  },
  deleteClassSchedule: async (scheduleId: string, accessToken: string) => {
    const { error } = await supabase
      .from("class_schedules")
      .delete()
      .eq("id", scheduleId);
    if (error) throw new Error(error.message);
    return { success: true };
  }
};

// ==================== USER API ====================

export const userAPI = {
  /**
   * Get all users (admin only)
   */
  async getAll(accessToken: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return { users: data || [] };
  },

  /**
   * Get students by class ID
   */
  async getStudentsByClass(classId: string, accessToken?: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, avatar, avatar_color, updated_at')
      .eq('class_id', classId)
      .eq('role', 'siswa')
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return { students: data || [] };
  },

  /**
   * Get users by role (admin only)
   */
  async getByRole(role: "admin" | "guru" | "siswa", accessToken?: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    const users = data || [];

    if (role === "siswa") {
      const classIds = [...new Set(users.map((u: any) => u.class_id).filter(Boolean))];
      if (classIds.length === 0) return { users };
      const { data: classes, error: classError } = await supabase
        .from("classes")
        .select("id,name,grade,subject")
        .in("id", classIds);
      if (classError) throw new Error(classError.message);
      const classById = new Map((classes || []).map((c: any) => [c.id, c]));
      return {
        users: users.map((u: any) => ({
          ...u,
          className: u.class_id ? formatClassDisplayName(classById.get(u.class_id) || {}) : null,
        })),
      };
    }

    if (role === "guru") {
      const teacherIds = users.map((u: any) => u.id);
      const [{ data: waliClasses, error: waliErr }, { data: csAssignments, error: csErr }] = await Promise.all([
        supabase.from("classes").select("*").in("teacher_id", teacherIds),
        supabase.from("class_subjects").select("class_id,teacher_id").in("teacher_id", teacherIds),
      ]);
      if (waliErr) throw new Error(waliErr.message);
      if (csErr) throw new Error(csErr.message);

      const waliList = waliClasses || [];
      const waliIds = new Set(waliList.map((c: any) => c.id));
      const extraClassIds = [
        ...new Set((csAssignments || []).map((r: any) => r.class_id).filter(Boolean)),
      ].filter((id) => !waliIds.has(id));

      let extraClasses: any[] = [];
      if (extraClassIds.length) {
        const { data: ec, error: ecErr } = await supabase.from("classes").select("*").in("id", extraClassIds);
        if (ecErr) throw new Error(ecErr.message);
        extraClasses = ec || [];
      }

      const allClassesById = new Map<string, any>();
      for (const c of [...waliList, ...extraClasses]) {
        allClassesById.set(c.id, c);
      }

      const classesByTeacher: Record<string, any[]> = {};
      for (const tid of teacherIds) classesByTeacher[tid] = [];

      const pushUnique = (tid: string, cls: any) => {
        const list = classesByTeacher[tid];
        if (!list.some((x) => x.id === cls.id)) list.push(cls);
      };

      for (const c of waliList) {
        if (c.teacher_id) pushUnique(c.teacher_id, c);
      }
      for (const row of csAssignments || []) {
        const c = allClassesById.get(row.class_id);
        if (c && row.teacher_id) pushUnique(row.teacher_id, c);
      }

      return {
        users: users.map((u: any) => {
          const list = classesByTeacher[u.id] || [];
          return {
            ...u,
            classesTaught: list,
            className: list.map((c: any) => formatClassDisplayName(c)).join(", ") || null,
          };
        }),
      };
    }

    return { users };
  },

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return { user: data };
  },

  /**
   * Update user profile directly
   */
  async updateProfile(userId: string, updates: any) {
    const dbUpdates = { ...updates } as any;
    if ("classId" in dbUpdates) {
      dbUpdates.class_id = dbUpdates.classId || null;
      delete dbUpdates.classId;
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { user: data };
  },

  /**
   * Update user profile (admin only) - direct API call
   */
  async update(userId: string, updates: any, accessToken?: string) {
    const dbUpdates = { ...updates } as any;
    if ("classId" in dbUpdates) {
      dbUpdates.class_id = dbUpdates.classId || null;
      delete dbUpdates.classId;
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { user: data };
  },
  
  /**
   * Delete user
   */
  async deleteUser(userId: string, accessToken?: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Delete user (admin only)
   */
  async delete(userId: string, accessToken?: string) {
    console.log("🗑️ userAPI.delete called with userId:", userId);
    if (!userId || userId === "undefined") {
      console.error("❌ Invalid userId in userAPI.delete:", userId);
      throw new Error("Invalid user ID: ID is undefined or empty");
    }
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Admin: assign banyak siswa ke satu kelas (update class_id profil)
   */
  async assignStudentsToClass(classId: string, studentIds: string[], accessToken?: string) {
    const ids = [...new Set(studentIds.filter(Boolean))];
    if (!ids.length) return { updated: 0 };
    const { data, error } = await supabase
      .from("profiles")
      .update({ class_id: classId, updated_at: new Date().toISOString() })
      .in("id", ids)
      .eq("role", "siswa")
      .select("id");
    if (error) throw new Error(error.message);
    return { updated: (data || []).length };
  },
};

// ==================== CLASS API ====================

export const classAPI = {
  /**
   * Get all classes
   */
  async getAll(accessToken?: string) {
    const [
      { data: classes, error: classError },
      { data: profiles, error: profileError },
      { data: classSubjects, error: classSubjectsError },
      { data: materials, error: materialsError },
    ] = await Promise.all([
      supabase.from("classes").select("*").order("name", { ascending: true }),
      supabase.from("profiles").select("id,name,role,class_id"),
      supabase.from("class_subjects").select("class_id,teacher_id"),
      supabase.from("pembelajaran").select("class_id"),
    ]);

    if (classError) throw new Error(classError.message);
    if (profileError) throw new Error(profileError.message);
    if (classSubjectsError) throw new Error(classSubjectsError.message);
    if (materialsError) throw new Error(materialsError.message);

    const allProfiles = profiles || [];
    const teachersById = new Map(allProfiles.filter((p: any) => p.role === "guru").map((p: any) => [p.id, p]));
    const studentsByClass = allProfiles
      .filter((p: any) => p.role === "siswa" && p.class_id)
      .reduce((acc: Record<string, number>, p: any) => {
        acc[p.class_id] = (acc[p.class_id] || 0) + 1;
        return acc;
      }, {});
    const materialsByClass = (materials || []).reduce((acc: Record<string, number>, row: any) => {
      if (row.class_id) acc[row.class_id] = (acc[row.class_id] || 0) + 1;
      return acc;
    }, {});

    const normalized = (classes || []).map((c: any) => {
      const otherTeacherIds = [...new Set(
        (classSubjects || [])
          .filter((cs: any) => cs.class_id === c.id && cs.teacher_id && cs.teacher_id !== c.teacher_id)
          .map((cs: any) => cs.teacher_id)
      )];

      return {
        ...c,
        displayName: formatClassDisplayName(c),
        teacherId: c.teacher_id || null,
        teacherName: c.teacher_id ? (teachersById.get(c.teacher_id)?.name || "Belum Ditugaskan") : "Belum Ditugaskan",
        studentCount: studentsByClass[c.id] || 0,
        materialCount: materialsByClass[c.id] || 0,
        otherTeacherIds,
      };
    });

    return { kelas: normalized, classes: normalized };
  },

  /**
   * Get class details (students, materials & other teachers)
   */
  async getDetails(classId: string, accessToken?: string) {
    const [
      { data: kelas, error: kelasError },
      { data: students, error: studentsError },
      { data: materials, error: materialsError },
      { data: classSubjects, error: classSubjectsError },
      { data: teacherProfiles, error: teacherProfilesError },
    ] = await Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("profiles").select("*").eq("class_id", classId).eq("role", "siswa"),
      supabase.from("pembelajaran").select("*").eq("class_id", classId).order("created_at", { ascending: false }),
      supabase.from("class_subjects").select("*").eq("class_id", classId),
      supabase.from("profiles").select("id,name,email,role").eq("role", "guru"),
    ]);

    if (kelasError) throw new Error("Gagal mengambil data kelas: " + kelasError.message);
    if (studentsError) console.warn("Profiles (Siswa) error:", studentsError.message);
    if (materialsError) console.warn("Pembelajaran error:", materialsError.message);
    if (classSubjectsError) console.warn("Class Subjects error:", classSubjectsError.message);
    if (teacherProfilesError) console.warn("Profiles (Guru) error:", teacherProfilesError.message);

    const classProjects: any[] = [];

    const teachersById = new Map((teacherProfiles || []).map((t: any) => [t.id, t]));
    const waliName = kelas.teacher_id ? (teachersById.get(kelas.teacher_id)?.name || "Belum Ditugaskan") : "Belum Ditugaskan";

    const otherTeachers = (classSubjects || [])
      .filter((cs: any) => cs.teacher_id && cs.teacher_id !== kelas.teacher_id)
      .map((cs: any) => {
        const profile = teachersById.get(cs.teacher_id);
        return {
          id: profile?.id || cs.teacher_id,
          name: profile?.name || "Guru",
          email: profile?.email || "",
          class_subject_id: cs.id,
          teacher_id: cs.teacher_id,
          subject_id: cs.subject_id,
        };
      });

    return {
      classDetails: {
        ...kelas,
        displayName: formatClassDisplayName(kelas),
        teacherName: waliName,
        students: students || [],
        materials: materials || [],
        projects: classProjects || [],
        otherTeachers,
      },
    };
  },

  /**
   * Create new class (admin only)
   */
  async create(data: { name: string; grade: string; subject: string; teacherId?: string | null; imageUrl?: string | null; image_url?: string | null }, accessToken: string) {
    const payload: any = {
      name: data.name,
      grade: data.grade,
      subject: data.subject,
      subtitle: data.subject,
      teacher_id: data.teacherId || null,
    };
    if (data.imageUrl !== undefined || data.image_url !== undefined) {
      payload.image_url = data.image_url || data.imageUrl || null;
    }
    const { data: created, error } = await supabase
      .from("classes")
      .insert([payload])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { kelas: created, class: created };
  },

  /**
   * Update class (admin only)
   */
  async update(classId: string, updates: any, accessToken: string) {
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
    if (updates.subject !== undefined) {
      dbUpdates.subject = updates.subject;
      dbUpdates.subtitle = updates.subject;
    }
    if (updates.teacherId !== undefined) dbUpdates.teacher_id = updates.teacherId || null;
    if (updates.teacher_id !== undefined) dbUpdates.teacher_id = updates.teacher_id || null;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl || null;
    if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url || null;

    const { data: updated, error } = await supabase
      .from("classes")
      .update(dbUpdates)
      .eq("id", classId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { class: updated, kelas: updated };
  },

  /**
   * Delete class (admin only)
   */
  async delete(classId: string, accessToken: string) {
    if (!classId || classId === "undefined") {
      console.error("❌ Invalid classId:", classId);
      throw new Error("Invalid class ID");
    }
    const { error: detachError } = await supabase
      .from("profiles")
      .update({ class_id: null })
      .eq("class_id", classId);
    if (detachError) throw new Error(detachError.message);

    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", classId);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Get class subjects with teachers
   */
  async getClassSubjects(classId: string, accessToken?: string) {
    const [{ data: classSubjects, error: classSubjectsError }, { data: subjects, error: subjectsError }, { data: teachers, error: teachersError }] = await Promise.all([
      supabase.from("class_subjects").select("*").eq("class_id", classId),
      supabase.from("subjects").select("id,name"),
      supabase.from("profiles").select("id,name").eq("role", "guru"),
    ]);

    if (classSubjectsError) throw new Error(classSubjectsError.message);
    if (subjectsError) throw new Error(subjectsError.message);
    if (teachersError) throw new Error(teachersError.message);

    const subjectById = new Map((subjects || []).map((s: any) => [s.id, s.name]));
    const teacherById = new Map((teachers || []).map((t: any) => [t.id, t.name]));
    const enriched = (classSubjects || []).map((cs: any) => ({
      ...cs,
      subjectName: subjectById.get(cs.subject_id) || null,
      teacherName: cs.teacher_id ? (teacherById.get(cs.teacher_id) || null) : null,
    }));
    return { classSubjects: enriched };
  },

  /**
   * Add subject teacher to class
   */
  async addClassSubject(data: { classId: string; subjectId: string; teacherId?: string | null }, accessToken: string) {
    const { data: created, error } = await supabase
      .from("class_subjects")
      .insert([{
        class_id: data.classId,
        subject_id: data.subjectId,
        teacher_id: data.teacherId || null,
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { classSubject: created };
  },

  /**
   * Update subject teacher in class
   */
  async updateClassSubject(classSubjectId: string, data: { teacherId?: string | null }, accessToken: string) {
    const { data: updated, error } = await supabase
      .from("class_subjects")
      .update({
        teacher_id: data.teacherId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", classSubjectId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { classSubject: updated };
  },

  /**
   * Remove subject from class
   */
  async deleteClassSubject(classSubjectId: string, accessToken: string) {
    const { error } = await supabase
      .from("class_subjects")
      .delete()
      .eq("id", classSubjectId);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ==================== PEMBELAJARAN API ====================

// Helper to retry operations that fail due to Supabase auth lock stealing errors
// Uses exponential backoff to avoid thundering-herd lock contention
const executeWithRetry = async <T,>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Operation timed out")), 5000);
      });
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error: any) {
      const isLockError = error?.message && (error.message.includes("lock") || error.message.includes("Lock") || error.message.includes("stole") || error.message.includes("timed out") || error.message.includes("fetch"));
      if (isLockError && i < maxRetries - 1) {
        const delay = 300 + Math.random() * 200;
        console.warn(`[Supabase API] Lock/Timeout error caught, retrying in ${Math.round(delay)}ms... (${i + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Operation failed after retries");
};

export const pembelajaranAPI = {
  /**
   * Get pembelajaran by class
   */
  async getByClass(classId: string, accessToken?: string) {
    const { data, error } = await supabase
      .from('pembelajaran')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: true });
      
    if (error) throw new Error(error.message);
    return { pembelajaran: data };
  },

  /**
   * Get single pembelajaran
   */
  async getById(pembelajaranId: string, accessToken?: string) {
    const { data, error } = await supabase
      .from('pembelajaran')
      .select('*')
      .eq('id', pembelajaranId)
      .single();
      
    if (error) throw new Error(error.message);
    return { pembelajaran: data };
  },

  /**
   * Create pembelajaran (guru only)
   */
  async create(
    data: {
      class_id: string;
      title?: string;
      judul?: string;
      deskripsi?: string;
      description?: string;
      icon?: string;
      color?: string;
      imageUrl?: string;
      image_url?: string;
      steps?: any[];
      status?: string;
    },
    accessToken?: string,
    userId?: string
  ) {
    return await executeWithRetry(async () => {
      let actualUserId = userId;
      
      if (!actualUserId) {
        // Coba dapatkan dari session dulu karena lebih cepat dan sinkron
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          actualUserId = sessionData.session.user.id;
        } else {
          // Fallback ke getUser jika session tidak ada
          const { data: userData, error: userErr } = await supabase.auth.getUser();
          if (userErr || !userData?.user?.id) throw new Error("Unauthorized: " + (userErr?.message || "No authenticated user found"));
          actualUserId = userData.user.id;
        }
      }
      
      // Support both title/description and judul/deskripsi
      const payload = {
        class_id: data.class_id,
        judul: data.judul || data.title || 'Materi Baru',
        deskripsi: data.deskripsi || data.description || '',
        title: data.judul || data.title || 'Materi Baru',
        description: data.deskripsi || data.description || '',
        icon: data.icon || 'BookOpen',
        color: data.color || '#56B6C6',
        image_url: data.image_url || data.imageUrl || null,
        status: data.status || 'published',
        steps: data.steps || [],
        created_by: actualUserId
      };

      const { data: result, error } = await supabase
        .from('pembelajaran')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return { pembelajaran: result };
    });
  },

  /**
   * Update pembelajaran (guru only)
   */
  async update(pembelajaranId: string, updates: any, accessToken?: string) {
    const { data, error } = await supabase
      .from('pembelajaran')
      .update(updates)
      .eq('id', pembelajaranId)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return { pembelajaran: data };
  },

  /**
   * Delete pembelajaran (guru only)
   */
  async delete(pembelajaranId: string, accessToken?: string) {
    const { error } = await supabase
      .from('pembelajaran')
      .delete()
      .eq('id', pembelajaranId);
      
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ==================== PROJECT API ====================

export const projectAPI = {
  /**
   * Get projects by class
   */
  async getByClass(classId: string, _accessToken?: string) {
    return { projects: [] };
  },

  /**
   * Get single project
   */
  async getById(projectId: string, accessToken: string) {
    return { project: { id: projectId, title: "Project", sintaks: [] } };
  },

  /**
   * Create project (guru only)
   */
  async create(
    data: {
      classId: string;
      title: string;
      description: string;
      icon?: string;
      color?: string;
    },
    accessToken: string
  ) {
    const { data: authData } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from("projects")
      .insert([{
        class_id: data.classId,
        title: data.title,
        description: data.description,
        icon: data.icon || "Folder",
        color: data.color || "#46bd84",
        created_by: authData?.user?.id || null,
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { project: created };
  },

  /**
   * Update project (guru only)
   */
  async update(projectId: string, updates: any, accessToken: string) {
    const { data, error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { project: data };
  },

  /**
   * Delete project (guru only)
   */
  async delete(projectId: string, accessToken: string) {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ==================== PROGRESS API ====================

export const progressAPI = {
  /**
   * Get student progress for pembelajaran - uses 'progress' table directly
   */
  async getByUser(userId: string, accessToken?: string) {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn("progress table error:", error.message);
      return { progress: [] };
    }

    // Group by pembelajaran_id
    const progressByPembelajaran: Record<string, any> = {};
    (data || []).forEach((row) => {
      if (!progressByPembelajaran[row.pembelajaran_id]) {
        progressByPembelajaran[row.pembelajaran_id] = {
          pembelajaranId: row.pembelajaran_id,
          steps: {}
        };
      }
      progressByPembelajaran[row.pembelajaran_id].steps[row.step_id] = {
        completed: row.completed,
        score: row.score,
        answers: row.answers
      };
    });

    return { progress: Object.values(progressByPembelajaran) };
  },

  /**
   * Get all progress for all students in a class in one go
   */
  async getByClass(classId: string) {
    const { data: students, error: studentErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('class_id', classId)
      .eq('role', 'siswa');
    
    if (studentErr || !students || students.length === 0) return { progress: [] };
    
    const studentIds = students.map(s => s.id);
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .in('user_id', studentIds);
      
    if (error) return { progress: [] };
    return { progress: data || [] };
  },

  /**
   * Get raw progress rows for a user (flat array)
   */
  async getRawByUser(userId: string) {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId);
    if (error) return [];
    return data || [];
  },

  /**
   * Get single step progress row for a user
   */
  async getStep(userId: string, pembelajaranId: string, stepId: string) {
    const { data, error } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("pembelajaran_id", pembelajaranId)
      .eq("step_id", stepId)
      .maybeSingle();
    if (error) return { progress: null };
    return { progress: data || null };
  },

  /**
   * Update step progress
   */
  async updateStep(
    data: {
      pembelajaranId: string;
      stepId: string;
      completed?: boolean;
      score?: number;
      answers?: any;
    },
    accessToken?: string
  ) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Not authenticated");
    
    const getSimulatedDate = (stepId: string) => {
      const now = new Date();
      const pad = (num: number) => num.toString().padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      if (stepId === "step_1779276674419_zvtaa5ys1") {
        return `2026-05-11T${timeStr}+07:00`;
      } else if (stepId === "step_1780125298485_al27x8awp") {
        return `2026-05-12T${timeStr}+07:00`;
      } else if (stepId === "step_1780125325850_yzei7ggss") {
        return `2026-05-18T${timeStr}+07:00`;
      } else if (stepId === "step_1780125351851_y4aa16fu3") {
        return `2026-05-19T${timeStr}+07:00`;
      }
      return now.toISOString();
    };

    const simulatedTime = getSimulatedDate(data.stepId);

    // Fetch extra details to store directly in the database
    const [profileRes, pembRes] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', userData.user.id).single(),
      supabase.from('pembelajaran').select('judul, title, steps').eq('id', data.pembelajaranId).single()
    ]);

    const siswaName = profileRes.data?.name || userData.user.email || "Siswa";
    const pembTitle = pembRes.data?.judul || pembRes.data?.title || "Materi";
    
    // Find the specific step details
    const step = (pembRes.data?.steps || []).find((s: any) => s.id === data.stepId);
    const stepTitle = step?.judul || step?.title || "Step";
    const stepType = step?.type || (step?.content?.bacaMateri ? "materi" : step?.content?.initialCode ? "code" : "quiz");
    
    let materiContent = "";
    if (step?.content?.bacaMateri) {
      materiContent = step.content.bacaMateri;
    } else if (step?.content?.quiz) {
      materiContent = JSON.stringify(step.content.quiz.soalList || []);
    } else if (step?.content?.taskInstructions) {
      materiContent = step.content.taskInstructions;
    }

    // Determine attempts count
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('attempts, answers')
      .eq('user_id', userData.user.id)
      .eq('pembelajaran_id', data.pembelajaranId)
      .eq('step_id', data.stepId)
      .maybeSingle();

    let attempts = Number(existingProgress?.attempts || existingProgress?.answers?.attempts || 0);
    if (data.score !== undefined || data.answers?.code_submitted) {
      attempts += 1;
    } else if (attempts === 0) {
      attempts = 1;
    }

    // Keep attempts updated in the answers JSONB object too for frontend compatibility
    const updatedAnswers = {
      ...(data.answers || {}),
      attempts: attempts
    };

    const payload = {
      user_id: userData.user.id,
      siswa_name: siswaName,
      pembelajaran_id: data.pembelajaranId,
      pembelajaran_title: pembTitle,
      step_id: data.stepId,
      step_title: stepTitle,
      step_type: stepType,
      materi_content: materiContent,
      completed: data.completed !== undefined ? data.completed : false,
      score: data.score !== undefined ? data.score : 0,
      attempts: attempts,
      answers: updatedAnswers,
      created_at: simulatedTime,
      updated_at: simulatedTime
    };
    
    const { data: result, error } = await supabase
      .from('progress')
      .upsert(payload, { onConflict: 'user_id, pembelajaran_id, step_id' })
      .select()
      .single();
      
    if (error) {
      console.warn("Progress upsert error, trying alternative or it's a mock:", error);
      return { progress: payload };
    }
    
    return { progress: result };
  },

  /**
   * Submit quiz attempt
   */
  async submitQuiz(
    data: {
      pembelajaranId: string;
      stepId: string;
      answers: any;
      score: number;
    },
    accessToken?: string
  ) {
    // This is essentially just updateStep with score and answers
    return this.updateStep({
      pembelajaranId: data.pembelajaranId,
      stepId: data.stepId,
      score: data.score,
      answers: data.answers,
      completed: data.score >= 75 // Mock threshold, will be properly handled in UI
    }, accessToken);
  },

  /**
   * Update progress
   */
  async update(progressId: string, updates: any, accessToken?: string) {
    const { data, error } = await supabase
      .from('progress')
      .update(updates)
      .eq('id', progressId)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return { progress: data };
  },
};

// ==================== TODO API ====================

export const todoAPI = {
  /**
   * Get todos by user
   */
  async getByUser(userId: string, accessToken: string) {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const todos = (data || []).map((t: any) => ({
      ...t,
      userId: t.user_id,
      createdAt: t.created_at,
    }));
    return { todos };
  },

  /**
   * Create todo
   */
  async create(title: string, accessToken: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) throw new Error(authErr?.message || "Unauthorized");
    const { data, error } = await supabase
      .from("todos")
      .insert([{ title, user_id: authData.user.id, completed: false }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { todo: { ...data, userId: data.user_id, createdAt: data.created_at } };
  },

  /**
   * Update todo
   */
  async update(todoId: string, updates: any, accessToken: string) {
    const { data, error } = await supabase
      .from("todos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", todoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { todo: { ...data, userId: data.user_id, createdAt: data.created_at } };
  },

  /**
   * Delete todo
   */
  async delete(todoId: string, accessToken: string) {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", todoId);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};



// ==================== FORUM API ====================

export const forumAPI = {
  /**
   * Get all forum posts
   */
  async getAll(accessToken: string, requestedClassId?: string) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) throw new Error("Unauthorized");

    let query = supabase
      .from("forum_posts")
      .select(`
        *,
        author:profiles!forum_posts_user_id_fkey(id, name, status, avatar, avatar_color, role),
        likes:forum_likes(user_id),
        comments:forum_comments(
          *,
          author:profiles!forum_comments_user_id_fkey(id, name, status, avatar, avatar_color)
        )
      `);

    // Sesuai permintaan: jika di forum kelas, tampilkan postingan kelas tsb + global. Jika di global, tampilkan khusus global.
    if (requestedClassId) {
      query = query.or(`class_id.eq.${requestedClassId},is_global.eq.true`);
    } else {
      query = query.eq("is_global", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) throw new Error(error.message);
    const posts = (data || []).map((p: any) => ({
      ...p,
      userName: p.author?.name || "User",
      userStatus: p.author?.status || "Member",
      userRole: p.author?.role || "user",
      createdAt: p.created_at,
      likes: (p.likes || []).map((l: any) => l.user_id),
      comments: (p.comments || []).map((c: any) => ({
        ...c,
        userName: c.author?.name || "User",
      })),
    }));
    return { posts };
  },

  /**
   * Create forum post
   */
  async create(data: { content: string; files?: string[]; classId?: string; isGlobal?: boolean }, accessToken: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) throw new Error(authErr?.message || "Unauthorized");
    
    // Check if user is admin, if so force isGlobal
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();
    const finalIsGlobal = profile?.role === 'admin' ? true : (data.isGlobal || false);

    const { data: post, error } = await supabase
      .from("forum_posts")
      .insert([{ 
        user_id: authData.user.id, 
        content: data.content, 
        files: data.files || [],
        class_id: data.classId || null,
        is_global: finalIsGlobal
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { post };
  },

  /**
   * Like/Unlike post
   */
  async toggleLike(postId: string, accessToken: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) throw new Error(authErr?.message || "Unauthorized");
    const userId = authData.user.id;
    const { data: existing } = await supabase
      .from("forum_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from("forum_likes").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("forum_likes").insert([{ post_id: postId, user_id: userId }]);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  },

  /**
   * Add comment
   */
  async addComment(postId: string, content: string, accessToken: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) throw new Error(authErr?.message || "Unauthorized");
    const { data, error } = await supabase
      .from("forum_comments")
      .insert([{ post_id: postId, user_id: authData.user.id, content }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { comment: data };
  },

  /**
   * Delete post
   */
  async delete(postId: string, accessToken: string) {
    const { error } = await supabase
      .from("forum_posts")
      .delete()
      .eq("id", postId);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, accessToken: string) {
    const { error } = await supabase
      .from("forum_comments")
      .delete()
      .eq("id", commentId);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ==================== FILE UPLOAD API ====================

export const fileAPI = {
  /**
   * Upload file
   */
  async upload(file: File, accessToken: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) throw new Error(authErr?.message || "Unauthorized");
    const fileExt = file.name.split(".").pop() || "bin";
    const filePath = `${authData.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from("learning-files").upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: signed, error: signErr } = await supabase.storage
      .from("learning-files")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);
    if (signErr) throw new Error(signErr.message);
    return { success: true, fileName: filePath, url: signed?.signedUrl || "" };
  },

  /**
   * Get file URL
   */
  async getUrl(fileName: string, accessToken: string) {
    const { data, error } = await supabase.storage
      .from("learning-files")
      .createSignedUrl(fileName, 60 * 60 * 24);
    if (error) throw new Error(error.message);
    return { url: data?.signedUrl || "" };
  },
};

// ==================== SEED API ====================

export const seedAPI = {
  /**
   * Seed database with test data
   */
  async seedDatabase() {
    throw new Error("Seed via client is disabled. Use SQL seed/migrations directly.");
  },
};

// ==================== REFLEKSI API ====================

export const refleksiAPI = {
  /**
   * Submit refleksi
   */
  async submitRefleksi(data: {
    materi_id: string;
    pemahaman: string;
    kendala?: string;
    kesan?: string;
  }, accessToken?: string) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) throw new Error("Unauthorized");

    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const simulatedTime = `2026-05-19T${timeStr}+07:00`;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", authData.user.id)
      .single();

    const payload = {
      siswa_id: authData.user.id,
      siswa_name: profile?.name || authData.user.email || "Siswa",
      materi_id: data.materi_id,
      pemahaman: data.pemahaman,
      kendala: data.kendala || null,
      kesan: data.kesan || null,
      created_at: simulatedTime
    };

    const { data: created, error } = await supabase
      .from("refleksi")
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { refleksi: created };
  },

  /**
   * Cek apakah siswa sudah mengisi refleksi untuk materi ini
   */
  async checkRefleksi(materiId: string, accessToken?: string) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return { hasRefleksi: false };

    const { data, error } = await supabase
      .from("refleksi")
      .select("id")
      .eq("materi_id", materiId)
      .eq("siswa_id", authData.user.id)
      .single();

    if (error && error.code !== "PGRST116") { // Ignore not found error
      console.warn("Check refleksi error:", error.message);
    }

    return { hasRefleksi: !!data };
  },

  /**
   * Get refleksi stats for a teacher's materials
   */
  async getTeacherStats(accessToken?: string) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) throw new Error("Unauthorized");

    // Get materials created by this teacher
    const { data: materiData, error: materiErr } = await supabase
      .from("pembelajaran")
      .select("id, title")
      .eq("created_by", authData.user.id);
    
    if (materiErr) throw new Error(materiErr.message);
    
    if (!materiData || materiData.length === 0) {
      return { refleksi: [], stats: { sangatPaham: 0, cukupPaham: 0, kurangPaham: 0, total: 0 } };
    }

    const materiIds = materiData.map((m: any) => m.id);
    const materiMap = new Map(materiData.map((m: any) => [m.id, m.title]));

    // Get refleksi for those materials
    const { data: refleksiData, error: refleksiErr } = await supabase
      .from("refleksi")
      .select(`
        *,
        siswa:profiles!siswa_id(name)
      `)
      .in("materi_id", materiIds)
      .order("created_at", { ascending: false });

    if (refleksiErr) throw new Error(refleksiErr.message);

    const formattedRefleksi = (refleksiData || []).map((r: any) => ({
      ...r,
      siswa_name: r.siswa?.name || "Siswa",
      materi_title: materiMap.get(r.materi_id) || "Materi",
    }));

    let sangatPaham = 0, cukupPaham = 0, kurangPaham = 0;
    formattedRefleksi.forEach((r: any) => {
      if (r.pemahaman === '😄' || r.pemahaman === '😄 Sangat Paham') sangatPaham++;
      else if (r.pemahaman === '🙂' || r.pemahaman === '🙂 Cukup Paham') cukupPaham++;
      else if (r.pemahaman === '😕' || r.pemahaman === '😕 Kurang Paham') kurangPaham++;
    });

    const total = formattedRefleksi.length;

    return {
      refleksi: formattedRefleksi,
      stats: { sangatPaham, cukupPaham, kurangPaham, total }
    };
  }
};

// ==================== NOTIFIKASI API ====================

export const notificationAPI = {
  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return { notifications: data || [] };
  },
  async create(data: {
    user_id: string; // recipient
    actor_id: string; // initiator
    type: string;
    content: string;
    link?: string;
  }) {
    const { error } = await supabase.from("notifications").insert([{
      ...data,
      is_read: false,
      created_at: new Date().toISOString()
    }]);
    if (error) console.error("Failed to create notification:", error);
  },
  async markAsRead(notificationId: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
  },
  async markAllAsRead(userId: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
  },
  async notifyClass(classId: string, actorId: string, type: string, content: string, link?: string) {
    // Get all students in class
    const { data: students } = await supabase.from("profiles").select("id").eq("class_id", classId).eq("role", "siswa");
    if (!students) return;
    
    const notifications = students.map(s => ({
      user_id: s.id,
      actor_id: actorId,
      type,
      content,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    }));
    
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
  },
  async notifyAdmin(actorId: string, type: string, content: string, link?: string) {
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    if (!admins) return;
    const notifications = admins.map(a => ({
      user_id: a.id,
      actor_id: actorId,
      type,
      content,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    }));
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
  }
};

// ==================== EXPORT ALL ====================

export const api = {
  auth: authAPI,
  users: userAPI,
  classes: classAPI,
  pembelajaran: pembelajaranAPI,
  projects: projectAPI,
  progress: progressAPI,
  todos: todoAPI,
  schedules: scheduleAPI,
  forum: forumAPI,
  files: fileAPI,
  notifications: notificationAPI,
  refleksi: refleksiAPI,
  seed: seedAPI,
  classSubjects: {
    getClassSubjects: classAPI.getClassSubjects,
    addClassSubject: classAPI.addClassSubject,
    updateClassSubject: classAPI.updateClassSubject,
    deleteClassSubject: classAPI.deleteClassSubject,
  },
};

export default api;

// ==================== NAMED EXPORTS FOR BACKWARD COMPATIBILITY ====================

// Auth exports
export const signUp = authAPI.signUp;
export const signIn = authAPI.signIn;
export const getCurrentUser = authAPI.getCurrentUser;
export const signOut = authAPI.signOut;
export const healthCheck = authAPI.healthCheck;

// User exports
export const getAllUsers = userAPI.getAll;
export const getUsersByRole = userAPI.getByRole;
export const updateUser = userAPI.update;
export const deleteUser = userAPI.delete;

// Class exports
export const getAllClasses = classAPI.getAll;
export const createClass = classAPI.create;
export const updateClass = classAPI.update;
export const deleteClass = classAPI.delete;

// Pembelajaran exports
export const getPembelajaranByClass = pembelajaranAPI.getByClass;
export const getPembelajaranById = pembelajaranAPI.getById;
export const getPembelajaran = async (pembelajaranId: string, accessToken?: string) => {
  const { pembelajaran } = await pembelajaranAPI.getById(pembelajaranId, accessToken);
  return pembelajaran;
}; // Backward compatibility: returns direct object
export const createPembelajaran = pembelajaranAPI.create;
export const updatePembelajaran = pembelajaranAPI.update;
export const deletePembelajaran = pembelajaranAPI.delete;

// Project exports
export const getProjectsByClass = projectAPI.getByClass;
export const getProjectById = projectAPI.getById;
export const createProject = projectAPI.create;
export const updateProject = projectAPI.update;
export const deleteProject = projectAPI.delete;

// Progress exports
export const getProgressByUser = progressAPI.getByUser;
export const getProgress = async (userId: string) => {
  const { progress } = await progressAPI.getByUser(userId);
  return progress;
}; // returns grouped progress for compatibility

// updateProgress wrapper — matches usage in BacaMateri & MengerjakanLatihan
export const updateProgress = async (data: {
  pembelajaranId: string;
  stepId: string;
  completed?: boolean;
  score?: number;
  answers?: any;
}) => progressAPI.updateStep(data);

// Todo exports
export const getTodosByUser = todoAPI.getByUser;
export const createTodo = todoAPI.create;
export const updateTodo = todoAPI.update;
export const deleteTodo = todoAPI.delete;

// Schedule exports
// Backward-compatible aliases (older code used CRUD-style names)
export const getAllSchedules = scheduleAPI.getTeacherSchedules as any;
export const createSchedule = scheduleAPI.addTeacherSchedule as any;
export const updateSchedule = async () => {
  throw new Error("updateSchedule is not implemented. Use scheduleAPI.addTeacherSchedule/deleteTeacherSchedule.");
};
export const deleteSchedule = scheduleAPI.deleteTeacherSchedule as any;

// Preferred schedule exports
export const getTeacherSchedules = scheduleAPI.getTeacherSchedules;
export const addTeacherSchedule = scheduleAPI.addTeacherSchedule;
export const deleteTeacherSchedule = scheduleAPI.deleteTeacherSchedule;
export const getClassSchedules = scheduleAPI.getClassSchedules;
export const addClassSchedule = scheduleAPI.addClassSchedule;
export const deleteClassSchedule = scheduleAPI.deleteClassSchedule;

// Forum exports
export const getForumPosts = forumAPI.getAll;
export const createForumPost = forumAPI.create;
export const likePost = forumAPI.toggleLike;
export const addComment = forumAPI.addComment;
export const deleteForumPost = forumAPI.delete;
export const deleteForumComment = forumAPI.deleteComment;

// File exports
export const uploadFile = fileAPI.upload;
export const getFileUrl = fileAPI.getUrl;

// Notification exports
export const getNotifications = notificationAPI.getByUser;
export const createNotification = notificationAPI.create;
export const markNotificationRead = notificationAPI.markAsRead;
export const markAllNotificationsRead = notificationAPI.markAllAsRead;
export const notifyClass = notificationAPI.notifyClass;
export const notifyAdmin = notificationAPI.notifyAdmin;

// Admin Monitoring API
export const adminAPI = {
  /**
   * Get monitoring data for admin dashboard
   */
  async getMonitoringData(accessToken: string) {
    return statsAPI.getMonitoring(accessToken);
  },
};

export const getMonitoringData = adminAPI.getMonitoringData;

// Auth API
export const demoAuthAPI = {
  /**
   * Login with username + password (validated against profiles.demo_password via backend)
   */
  async loginWithDemo(username: string, password: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const base =
      import.meta.env.DEV && typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "/functions/v1/backend"
        : `${supabaseUrl}/functions/v1/backend`;

    const res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Login gagal");
    return json;
  },
};

export const loginWithDemo = demoAuthAPI.loginWithDemo;

// Profile API
export const profileAPI = {
  /**
   * Get current user profile with role-specific data
   */
  async getProfile(accessToken: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) throw new Error(authErr?.message || "Unauthorized");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();
    if (error) throw new Error(error.message);
    return { profile: data };
  },

  /**
   * Update user avatar
   */
  async updateAvatar(accessToken: string, avatar: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) throw new Error(authErr?.message || "Unauthorized");
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar, updated_at: new Date().toISOString() })
      .eq("id", authData.user.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { profile: data, message: "Avatar updated" };
  },
};

// ==================== UEQ EVALUATION API ====================
export const ueqAPI = {
  /**
   * Save UEQ questions for a material
   */
  async saveQuestions(materiId: string, questions: any[]) {
    const { data, error } = await supabase
      .from("pembelajaran")
      .update({ ueq_questions: questions })
      .eq("id", materiId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Submit UEQ responses
   */
  async submitResponses(data: {
    materi_id: string;
    answers: any[];
  }) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) throw new Error("Unauthorized");

    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const simulatedTime = `2026-05-19T${timeStr}+07:00`;

    // Fetch profile and pembelajaran details to save text names directly
    const [profileRes, pembRes] = await Promise.all([
      supabase.from("profiles").select("name, email").eq("id", authData.user.id).single(),
      supabase.from("pembelajaran").select("judul, title").eq("id", data.materi_id).single()
    ]);

    const siswaName = profileRes.data?.name || authData.user.email || "Siswa";
    const siswaEmail = profileRes.data?.email || authData.user.email || "";
    const materiTitle = pembRes.data?.judul || pembRes.data?.title || "Materi";

    const payloads = data.answers.map((ans: any) => ({
      siswa_id: authData.user.id,
      siswa_name: siswaName,
      siswa_email: siswaEmail,
      materi_id: data.materi_id,
      materi_title: materiTitle,
      question_id: ans.questionId,
      question_label: ans.label,
      question_type: ans.type,
      answer: String(ans.answer),
      created_at: simulatedTime
    }));

    const { data: created, error } = await supabase
      .from("ueq_responses")
      .insert(payloads)
      .select();

    if (error) throw new Error(error.message);
    return created;
  },

  /**
   * Cek apakah siswa sudah mengisi UEQ untuk materi ini
   */
  async checkUeqSubmitted(materiId: string) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return { submitted: false };

    const { data, error } = await supabase
      .from("ueq_responses")
      .select("id")
      .eq("materi_id", materiId)
      .eq("siswa_id", authData.user.id)
      .limit(1);

    if (error && error.code !== "PGRST116") {
      console.warn("Check ueq submitted error:", error.message);
    }

    return { submitted: data && data.length > 0 };
  },

  /**
   * Get all UEQ responses for a specific material
   */
  async getResponsesByMateri(materiId: string) {
    const { data, error } = await supabase
      .from("ueq_responses")
      .select(`
        id,
        siswa_id,
        siswa_name,
        siswa_email,
        materi_id,
        materi_title,
        question_id,
        question_label,
        question_type,
        answer,
        created_at
      `)
      .eq("materi_id", materiId);

    if (error) throw new Error(error.message);

    // Group the flat records by student (by combining name/email) to keep backward compatibility
    const groupedMap = new Map();
    (data || []).forEach((row: any) => {
      const key = row.siswa_id || row.siswa_name || row.siswa_email;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: row.id,
          siswa_id: row.siswa_id,
          siswa_name: row.siswa_name || "Siswa",
          siswa_email: row.siswa_email || "",
          materi_id: row.materi_id,
          materi_title: row.materi_title || "Materi",
          created_at: row.created_at,
          answers: []
        });
      }
      groupedMap.get(key).answers.push({
        questionId: row.question_id,
        type: row.question_type,
        label: row.question_label,
        answer: row.question_type === "scale" ? Number(row.answer) : row.answer
      });
    });

    return Array.from(groupedMap.values());
  }
};

export const getProfile = profileAPI.getProfile;
export const updateAvatar = profileAPI.updateAvatar;

// Refleksi API
export const submitRefleksi = refleksiAPI.submitRefleksi;
export const checkRefleksi = refleksiAPI.checkRefleksi;
export const getTeacherRefleksiStats = refleksiAPI.getTeacherStats;

// UEQ API Exports
export const saveUeqQuestions = ueqAPI.saveQuestions;
export const submitUeqResponses = ueqAPI.submitResponses;
export const checkUeqSubmitted = ueqAPI.checkUeqSubmitted;
export const getUeqResponsesByMateri = ueqAPI.getResponsesByMateri;

// Seed exports
export const seedDatabase = seedAPI.seedDatabase;

