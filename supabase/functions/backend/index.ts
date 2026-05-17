const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const SUPABASE_URL = "https://tjfmwixttmrayvhqhena.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZm13aXh0dG1yYXl2aHFoZW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDkxNDIsImV4cCI6MjA4ODEyNTE0Mn0.GcwxTKQAxvKgMRo9FIYS-Im8eW-qxN8UNIOTr4Oi_Ek";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZm13aXh0dG1yYXl2aHFoZW5hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU0OTE0MiwiZXhwIjoyMDg4MTI1MTQyfQ.DGPew64LmGf1xX5QDT5F72hTQrQksFDdgJJnoLAUyuU";

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function db(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || err.msg || `HTTP ${res.status}`);
  }
  return res.json();
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/backend", "");
    const method = req.method;
    console.log(`${method} ${path}`);

    // ── Health ──────────────────────────────────────────────────────────────
    if (path === "/health" && method === "GET") {
      return json({ status: "healthy", timestamp: new Date().toISOString() });
    }

    // ── Bootstrap Admin ─────────────────────────────────────────────────────
    if ((path === "/bootstrap/admin" || path === "/bootstrap-admin") && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const email = body.email || "admin@sekolah.com";
      const password = body.password || "admin123456";
      const name = body.name || "Administrator";
      try {
        const existing = await db(`profiles?email=eq.${encodeURIComponent(email)}&role=eq.admin`);
        if (existing.length > 0) {
          return json({ message: "Admin already exists", credentials: { email, password } });
        }
        const newAdmin = await db("profiles", {
          method: "POST",
          body: JSON.stringify({ id: crypto.randomUUID(), name, email, role: "admin", avatar_color: "#1294f2", status: "Active", demo_password: password }),
        });
        return json({ success: true, credentials: { email, password }, user: newAdmin[0] });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Login ────────────────────────────────────────────────────────────────
    if (path === "/login/demo" && method === "POST") {
      const { email, password } = await req.json();
      console.log("🔐 Login:", email);
      try {
        const profiles = await db(`profiles?email=eq.${encodeURIComponent(email)}`);
        if (profiles.length === 0) return json({ error: "User tidak ditemukan. Hubungi admin." }, 401);
        const profile = profiles[0];
        if (!profile.demo_password || profile.demo_password !== password) return json({ error: "Password salah" }, 401);
        console.log("✅ Login berhasil:", profile.name, profile.role);
        return json({
          access_token: `demo-token-${profile.id}`,
          refresh_token: `demo-refresh-${crypto.randomUUID()}`,
          expires_in: 3600,
          user: { id: profile.id, email: profile.email, user_metadata: { name: profile.name, role: profile.role }, role: "authenticated" },
        });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Profile ──────────────────────────────────────────────────────────────
    if (path === "/profile" && method === "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "No authorization header" }, 401);
      const token = authHeader.replace("Bearer ", "");
      try {
        let userId: string | null = null;
        if (token.startsWith("demo-token-")) {
          userId = token.replace("demo-token-", "");
        } else {
          const parts = token.split(".");
          if (parts.length === 3) userId = JSON.parse(atob(parts[1])).sub || null;
        }
        if (!userId) return json({ error: "Invalid token" }, 401);
        const profiles = await db(`profiles?id=eq.${userId}`);
        if (profiles.length === 0) return json({ error: "Profile not found" }, 404);
        return json({ profile: profiles[0] });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Get all users ────────────────────────────────────────────────────────
    if (path === "/users" && method === "GET") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      try {
        const users = await db("profiles?order=created_at.desc");
        return json({ users });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Get users by role ────────────────────────────────────────────────────
    if (path.match(/^\/users\/[a-z]+$/) && method === "GET") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const role = path.split("/")[2];
      try {
        const users = await db(`profiles?role=eq.${role}&order=created_at.desc`);
        const enriched = await Promise.all(users.map(async (u: any) => {
          try {
            if (role === "siswa" && u.class_id) {
              const classes = await db(`classes?id=eq.${u.class_id}`);
              return { ...u, className: classes[0]?.name || null };
            }
            if (role === "guru") {
              const classes = await db(`classes?teacher_id=eq.${u.id}`);
              return { ...u, className: classes.map((c: any) => c.name).join(", ") || null, classesTaught: classes };
            }
            return u;
          } catch { return u; }
        }));
        return json({ users: enriched });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Update user ──────────────────────────────────────────────────────────
    if (path.match(/^\/users\/[^\\/]+$/) && method === "PUT") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const userId = path.split("/")[2];
      const body = await req.json();
      try {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (body.name !== undefined) updateData.name = body.name;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.classId !== undefined) updateData.class_id = body.classId || null;
        const updated = await db(`profiles?id=eq.${userId}`, { method: "PATCH", body: JSON.stringify(updateData) });
        return json({ user: updated[0] });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Delete user ──────────────────────────────────────────────────────────
    if (path.match(/^\/users\/[^\\/]+$/) && method === "DELETE") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const userId = path.split("/")[2];
      try {
        await db(`profiles?id=eq.${userId}`, { method: "DELETE" });
        return json({ message: "User deleted successfully" });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Get kelas ────────────────────────────────────────────────────────────
    if ((path === "/kelas" || path === "/classes") && method === "GET") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      try {
        const classes = await db("classes?order=created_at.desc");
        const enriched = await Promise.all(classes.map(async (c: any) => {
          try {
            const students = await db(`profiles?class_id=eq.${c.id}&role=eq.siswa`);
            let teacherName = "Belum ada";
            if (c.teacher_id) {
              const teachers = await db(`profiles?id=eq.${c.teacher_id}&role=eq.guru`);
              if (teachers[0]) teacherName = teachers[0].name;
            }
            
            let otherTeacherIds: string[] = [];
            try {
               const classSubjects = await db(`class_subjects?class_id=eq.${c.id}`);
               if (classSubjects && Array.isArray(classSubjects)) {
                 otherTeacherIds = [...new Set(classSubjects.filter((cs: any) => cs.teacher_id && cs.teacher_id !== c.teacher_id).map((cs: any) => cs.teacher_id))];
               }
            } catch (e) { /* ignore */ }

            return { ...c, teacherName, studentCount: students ? students.length : 0, otherTeacherIds };
          } catch { return { ...c, teacherName: "Belum ada", studentCount: 0, otherTeacherIds: [] }; }
        }));
        const key = path === "/kelas" ? "kelas" : "classes";
        return json({ [key]: enriched });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Get kelas details ────────────────────────────────────────────────────
    if (path.match(/^\/classes\/[^\\/]+\/details$/) && method === "GET") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const classId = path.split("/")[2];
      try {
        const [kelas, students, materials] = await Promise.all([
          db(`classes?id=eq.${classId}`),
          db(`profiles?class_id=eq.${classId}&role=eq.siswa`),
          db(`pembelajaran?class_id=eq.${classId}&order=created_at.desc`)
        ]);
        if (kelas.length === 0) return json({ error: "Class not found" }, 404);
        
        let teacherName = "Belum ada";
        let teacherId = kelas[0].teacher_id;
        if (teacherId) {
          const teachers = await db(`profiles?id=eq.${teacherId}&role=eq.guru`);
          if (teachers[0]) teacherName = teachers[0].name;
        }

        // Fetch guru pengampu lainnya (selain wali kelas) dari class_subjects
        const classSubjects = await db(`class_subjects?class_id=eq.${classId}`);
        const otherTeacherIds = [...new Set(classSubjects.filter((cs: any) => cs.teacher_id && cs.teacher_id !== teacherId).map((cs: any) => cs.teacher_id))];
        
        let otherTeachers = [];
        if (otherTeacherIds.length > 0) {
           const otParams = otherTeacherIds.map(id => `id.eq.${id}`).join(',');
           const otProfiles = await db(`profiles?or=(${otParams})`);
           // Add class_subject_id to each teacher for deletion
           otherTeachers = (otProfiles || []).map((profile: any) => {
             const cs = classSubjects.find((c: any) => c.teacher_id === profile.id);
             return {
               ...profile,
               class_subject_id: cs?.id
             };
           });
        }

        const classDetails = {
          ...kelas[0],
          teacherName,
          otherTeachers,
          students: students || [],
          materials: materials || []
        };
        return json({ classDetails });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Create kelas ─────────────────────────────────────────────────────────
    if ((path === "/admin/create-kelas" || path === "/classes") && method === "POST") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const body = await req.json();
      try {
        const newKelas = await db("classes", {
          method: "POST",
          body: JSON.stringify({ id: crypto.randomUUID(), name: body.name, grade: body.grade || "", subject: body.subject || body.name, subtitle: body.subject || body.name, teacher_id: body.teacherId || null }),
        });
        return json({ kelas: newKelas[0], class: newKelas[0] });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Update kelas ─────────────────────────────────────────────────────────
    if ((path.match(/^\/classes\/[^\\/]+$/) || path.match(/^\/admin\/update-kelas\/[^\\/]+$/)) && method === "PUT") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const classId = path.split("/").pop()!;
      const body = await req.json();
      try {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (body.name) updateData.name = body.name;
        if (body.grade) updateData.grade = body.grade;
        if (body.subject) { updateData.subject = body.subject; updateData.subtitle = body.subject; }
        if (body.teacherId !== undefined) updateData.teacher_id = body.teacherId || null;
        const updated = await db(`classes?id=eq.${classId}`, { method: "PATCH", body: JSON.stringify(updateData) });
        return json({ kelas: updated[0], class: updated[0] });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Delete kelas ─────────────────────────────────────────────────────────
    if ((path.match(/^\/classes\/[^\\/]+$/) || path.match(/^\/admin\/delete-kelas\/[^\\/]+$/)) && method === "DELETE") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const classId = path.split("/").pop()!;
      try {
        await db(`profiles?class_id=eq.${classId}`, { method: "PATCH", body: JSON.stringify({ class_id: null }) });
        await db(`classes?id=eq.${classId}`, { method: "DELETE" });
        return json({ message: "Class deleted successfully" });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Create user ──────────────────────────────────────────────────────────
    if (path === "/admin/create-user" && method === "POST") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const body = await req.json();
      try {
        const existing = await db(`profiles?email=eq.${encodeURIComponent(body.email)}`);
        if (existing.length > 0) return json({ error: "Email sudah terdaftar" }, 400);
        const newUser = await db("profiles", {
          method: "POST",
          body: JSON.stringify({ id: crypto.randomUUID(), name: body.name, email: body.email, role: body.role, avatar_color: "#1294f2", class_id: body.classId || null, status: "Active", demo_password: body.password }),
        });
        return json({ user: newUser[0] });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Delete user (admin endpoint) ─────────────────────────────────────────
    if (path.match(/^\/admin\/delete-user\/[^\\/]+$/) && method === "DELETE") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const userId = path.split("/")[3];
      if (!userId || userId === "undefined") return json({ error: "Invalid user ID" }, 400);
      try {
        await db(`profiles?id=eq.${userId}`, { method: "DELETE" });
        return json({ message: "User deleted successfully" });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── Subjects ─────────────────────────────────────────────────────────────
    if (path === "/subjects" && method === "GET") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      try { return json({ subjects: await db("subjects?order=name.asc") }); }
      catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === "/subjects" && method === "POST") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const body = await req.json();
      try {
        const s = await db("subjects", { method: "POST", body: JSON.stringify({ name: body.name }) });
        return json({ subject: s[0] });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path.match(/^\/subjects\/[^\\/]+$/) && method === "DELETE") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const id = path.split("/")[2];
      try { await db(`subjects?id=eq.${id}`, { method: "DELETE" }); return json({ message: "Subject deleted" }); }
      catch (e: any) { return json({ error: e.message }, 500); }
    }

    // ── Class subjects ────────────────────────────────────────────────────────
    if (path.match(/^\/classes\/[^\\/]+\/subjects$/) && method === "GET") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const classId = path.split("/")[2];
      try {
        const cs = await db(`class_subjects?class_id=eq.${classId}`);
        const enriched = await Promise.all(cs.map(async (item: any) => {
          try {
            const [subjects, teachers] = await Promise.all([
              db(`subjects?id=eq.${item.subject_id}`),
              item.teacher_id ? db(`profiles?id=eq.${item.teacher_id}`) : Promise.resolve([]),
            ]);
            return { ...item, subjectName: subjects[0]?.name, teacherName: teachers[0]?.name };
          } catch { return item; }
        }));
        return json({ classSubjects: enriched });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === "/class-subjects" && method === "POST") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const body = await req.json();
      try {
        const cs = await db("class_subjects", { method: "POST", body: JSON.stringify({ class_id: body.classId, subject_id: body.subjectId, teacher_id: body.teacherId || null }) });
        return json({ classSubject: cs[0] });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path.match(/^\/class-subjects\/[^\\/]+$/) && method === "PUT") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const id = path.split("/")[2];
      const body = await req.json();
      try {
        const updated = await db(`class_subjects?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ teacher_id: body.teacherId || null, updated_at: new Date().toISOString() }) });
        return json({ classSubject: updated[0] });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path.match(/^\/class-subjects\/[^\\/]+$/) && method === "DELETE") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      const id = path.split("/")[2];
      try { await db(`class_subjects?id=eq.${id}`, { method: "DELETE" }); return json({ message: "Deleted" }); }
      catch (e: any) { return json({ error: e.message }, 500); }
    }

    // ── Admin Monitoring ──────────────────────────────────────────────────────
    if (path === "/admin/monitoring" && method === "GET") {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      try {
        const [users, classes] = await Promise.all([db("profiles"), db("classes")]);
        const guru = users.filter((u: any) => u.role === "guru");
        const siswa = users.filter((u: any) => u.role === "siswa");
        return json({ totalUsers: users.length, totalGuru: guru.length, totalSiswa: siswa.length, totalKelas: classes.length, users, classes });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    // ── Schedules (Teacher & Class) ──────────────────────────────────────────
    if (path.startsWith("/schedules")) {
      if (!req.headers.get("Authorization")) return json({ error: "No authorization header" }, 401);
      
      const segments = path.split("/").filter(Boolean);
      const type = segments[1]; // teacher or class
      const id = segments[2];

      if (type === "teacher") {
        if (method === "GET") {
          try {
            const data = await db(`teacher_schedules?teacher_id=eq.${id}&order=day.asc,start_time.asc`);
            return json({ schedules: data });
          } catch (e: any) { return json({ error: e.message }, 500); }
        }
        if (method === "POST") {
          try {
            const body = await req.json();
            const payload = { ...body, teacher_id: id };
            const data = await db("teacher_schedules", { method: "POST", body: JSON.stringify(payload) });
            return json({ schedule: data[0] });
          } catch (e: any) { return json({ error: e.message }, 500); }
        }
        if (method === "DELETE") {
           try {
             await db(`teacher_schedules?id=eq.${id}`, { method: "DELETE" });
             return json({ success: true });
           } catch (e: any) { return json({ error: e.message }, 500); }
        }
      } else if (type === "class") {
        if (method === "GET") {
          try {
            const data = await db(`class_schedules?class_id=eq.${id}&order=day.asc,start_time.asc`);
            return json({ schedules: data });
          } catch (e: any) { return json({ error: e.message }, 500); }
        }
        if (method === "POST") {
          try {
            const body = await req.json();
            const payload = { ...body, class_id: id };
            const data = await db("class_schedules", { method: "POST", body: JSON.stringify(payload) });
            return json({ schedule: data[0] });
          } catch (e: any) { return json({ error: e.message }, 500); }
        }
        if (method === "DELETE") {
           try {
             await db(`class_schedules?id=eq.${id}`, { method: "DELETE" });
             return json({ success: true });
           } catch (e: any) { return json({ error: e.message }, 500); }
        }
      }
    }

    // ── 404 ───────────────────────────────────────────────────────────────────
    return json({ error: "Not found", path }, 404);

  } catch (error: any) {
    console.log("❌ Server error:", error);
    return json({ error: "Internal server error: " + error.message }, 500);
  }
}

Deno.serve(handler);
