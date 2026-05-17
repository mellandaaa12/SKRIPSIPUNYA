import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "../utils/supabase";

// Read from env — validated at startup in supabase.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "guru" | "siswa";
  avatar: string | null;
  avatarColor: string;
  classId?: string;
  status: string;
  exp?: number;
  streak?: number;
  hintPoints?: number;
  lastStreakDate?: string | null;
}

interface AuthContextType {
  user: CustomUser | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<CustomUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ====== RAW FETCH HELPERS (bypass Supabase client entirely) ======

/** Fetch a user profile by ID using direct PostgREST call */
async function fetchProfileRaw(userId: string, accessToken: string): Promise<any | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.pgrst.object+json",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(tid);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getBackendUrl(): string {
  return `${SUPABASE_URL}/functions/v1/backend`;
}

/** Simpan sesi dari profil (fallback saat Supabase Auth rusak) */
function persistProfileSession(profile: any) {
  const authUser = {
    id: profile.id,
    email: profile.email,
    user_metadata: { name: profile.name, role: profile.role },
  };
  const customUser = buildUser(authUser, profile);
  const sessionData = {
    access_token: SUPABASE_ANON_KEY,
    refresh_token: "",
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: "bearer",
    user: authUser,
    profileSession: true,
  };
  const key = getStorageKey();
  if (key) localStorage.setItem(key, JSON.stringify(sessionData));
  return { user: authUser, session: sessionData, customUser };
}

/** Validasi username + password di tabel profiles (tanpa menyentuh auth.users) */
async function verifyProfileCredentials(username: string, password: string): Promise<any> {
  const { data, error } = await supabase.rpc("verify_profile_login", {
    p_username: username,
    p_password: password,
  });
  if (error) throw new Error(error.message || "Login gagal");
  if (!data?.ok) throw new Error(data?.error || "Username atau password salah");
  return data.profile;
}

/** Login via backend edge function (username + password dari database) */
async function loginViaBackend(username: string, password: string): Promise<any> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15000);

  const res = await fetch(`${getBackendUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ username, password }),
    signal: controller.signal,
  });

  clearTimeout(tid);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || "Login gagal");
  }
  return json;
}

/** Fetch profile by email (when auth user id differs from profile id) */
async function fetchProfileByEmail(email: string, accessToken: string): Promise<any | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(tid);
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

/** Resolve a username to an email using direct PostgREST call */
async function resolveUsernameToEmail(username: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 6000);

    // Try exact name match (case-insensitive)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?name=ilike.${encodeURIComponent(username)}&select=email&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(tid);

    if (res.ok) {
      const profiles = await res.json();
      if (Array.isArray(profiles) && profiles.length > 0 && profiles[0].email) {
        return profiles[0].email;
      }
    }

    // Try email prefix match
    const controller2 = new AbortController();
    const tid2 = setTimeout(() => controller2.abort(), 6000);
    const res2 = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(username)}%25%40%25&select=email&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: "application/json",
        },
        signal: controller2.signal,
      }
    );
    clearTimeout(tid2);

    if (res2.ok) {
      const profiles2 = await res2.json();
      if (Array.isArray(profiles2) && profiles2.length > 0 && profiles2[0].email) {
        return profiles2[0].email;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/** Authenticate via Supabase Auth REST API directly */
async function authWithPassword(email: string, password: string): Promise<any> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 12000);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
    signal: controller.signal,
  });

  clearTimeout(tid);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error_description || json?.msg || json?.error || "Login gagal");
  }
  return json;
}

// Build a CustomUser from auth data + DB profile
function buildUser(authUser: any, profile: any | null): CustomUser {
  const role = (profile?.role || authUser.user_metadata?.role || "siswa") as "admin" | "guru" | "siswa";
  const name = profile?.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User";
  return {
    id: authUser.id,
    email: authUser.email || "",
    name,
    role,
    avatar: profile?.avatar || null,
    avatarColor: profile?.avatar_color || "#3B82F6",
    classId: profile?.class_id || undefined,
    status: profile?.status || "active",
    exp: profile?.exp || 0,
    streak: profile?.streak || 0,
    hintPoints: profile?.hint_points ?? 3,
    lastStreakDate: profile?.last_streak_date || null,
  };
}

// Derive the localStorage key for session persistence
function getStorageKey(): string {
  const ref = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
  return ref ? `sb-${ref}-auth-token` : "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const manualAuth = useRef(false);

  // ─── Initial session restore ───
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        // Try reading session from localStorage (no Supabase client auth calls)
        const key = getStorageKey();
        const raw = key ? localStorage.getItem(key) : null;
        if (!raw) return;

        const stored = JSON.parse(raw);
        if (!stored?.access_token || !stored?.user?.id) return;

        // Sesi login dari tabel profiles (tanpa Supabase Auth JWT)
        if (stored.profileSession) {
          const profile = await fetchProfileRaw(stored.user.id, stored.access_token);
          if (cancelled) return;
          setUser(buildUser(stored.user, profile));
          setSession(stored);
          return;
        }

        const expiresAt = stored.expires_at || 0;
        if (expiresAt < Math.floor(Date.now() / 1000)) {
          const { data: { session: refreshed } } = await supabase.auth.getSession();
          if (cancelled) return;
          if (refreshed?.user) {
            const profile = await fetchProfileRaw(refreshed.user.id, refreshed.access_token);
            if (cancelled) return;
            setUser(buildUser(refreshed.user, profile));
            setSession(refreshed);
          }
          return;
        }

        const profile = await fetchProfileRaw(stored.user.id, stored.access_token);
        if (cancelled) return;
        setUser(buildUser(stored.user, profile));
        setSession(stored);
      } catch (err) {
        console.warn("Session restore failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // ─── Auth state listener (handles sign out & token refresh) ───
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (manualAuth.current) return; // Don't interfere with manual signIn/signOut
      if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
      } else if (event === "TOKEN_REFRESHED" && newSession?.user) {
        setSession(newSession);
        const profile = await fetchProfileRaw(newSession.user.id, newSession.access_token);
        setUser(buildUser(newSession.user, profile));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Realtime profile sync ───
  useEffect(() => {
    const uid = user?.id;
    if (!uid || !session?.access_token) return;
    const ch = supabase
      .channel(`profile-sync-${uid}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${uid}` }, async () => {
        if (session?.access_token) {
          const profile = await fetchProfileRaw(uid, session.access_token);
          if (profile) setUser(buildUser(session.user || { id: uid, email: user.email }, profile));
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user?.id, session?.access_token]);

  // ─── Presence heartbeat ───
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    let stopped = false;
    const ping = () => {
      if (stopped) return;
      supabase.from("profiles").update({ updated_at: new Date().toISOString() }).eq("id", uid).then(() => {});
    };
    ping();
    const iv = setInterval(ping, 45000);
    const onVis = () => { if (document.visibilityState === "visible") ping(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { stopped = true; clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, [user?.id]);

  // ─── Sign In (backend validates username + password dari database) ───
  const signIn = async (emailOrUsername: string, password: string) => {
    manualAuth.current = true;

    try {
      const username = emailOrUsername.trim();
      console.log("🔐 Login via backend:", username);

      let authResult: any;
      let profileFromLogin: any = null;

      // Login via backend (Admin API — tidak merusak skema auth.users)
      try {
        authResult = await loginViaBackend(username, password);
        profileFromLogin = authResult.profile ?? null;
      } catch (backendErr: any) {
        const profile = await verifyProfileCredentials(username, password).catch(() => null);
        if (!profile) throw backendErr;

        // Auth Supabase rusak → login langsung dari tabel profiles
        console.warn("Auth service unavailable, using profile session:", backendErr.message);
        const result = persistProfileSession(profile);
        setSession(result.session);
        setUser(result.customUser);
        return result;
      }

      const accessToken = authResult.access_token;
      const authUser = authResult.user;

      let profile =
        profileFromLogin ||
        (await fetchProfileRaw(authUser.id, accessToken)) ||
        (authUser.email ? await fetchProfileByEmail(authUser.email, accessToken) : null);

      const customUser = buildUser(authUser, profile);
      console.log("✅ Login success! Role:", customUser.role);

      const sessionData = {
        access_token: accessToken,
        refresh_token: authResult.refresh_token,
        expires_in: authResult.expires_in,
        expires_at: Math.floor(Date.now() / 1000) + (authResult.expires_in || 3600),
        token_type: "bearer",
        user: authUser,
      };
      const key = getStorageKey();
      if (key) localStorage.setItem(key, JSON.stringify(sessionData));

      try {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: authResult.refresh_token,
        });
      } catch {
        // Non-critical
      }

      setSession(sessionData);
      setUser(customUser);

      return { user: authUser, session: sessionData, customUser };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Koneksi timeout. Silakan periksa jaringan Anda.");
      }
      throw error;
    } finally {
      setTimeout(() => { manualAuth.current = false; }, 1500);
    }
  };

  // ─── Sign Out ───
  const signOut = async () => {
    manualAuth.current = true;
    setUser(null);
    setSession(null);
    const key = getStorageKey();
    if (key) localStorage.removeItem(key);
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setTimeout(() => { manualAuth.current = false; }, 500);
  };

  // ─── Refresh user ───
  const refreshUser = async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.user) {
        const profile = await fetchProfileRaw(s.user.id, s.access_token);
        setUser(buildUser(s.user, profile));
        setSession(s);
      }
    } catch (err) {
      console.warn("refreshUser error:", err);
    }
  };

  // ─── Update profile ───
  const updateProfile = async (updates: Partial<CustomUser>) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("profiles")
      .update({
        name: updates.name,
        avatar: updates.avatar,
        avatar_color: updates.avatarColor,
        class_id: updates.classId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) throw error;
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
