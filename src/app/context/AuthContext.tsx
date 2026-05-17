import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

// Fetch user profile using raw fetch to bypass Supabase client locks
async function fetchUserProfile(userId: string, accessToken: string): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json' // Return single object
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn("Profile fetch failed:", response.status);
      return null;
    }
    
    return await response.json();
  } catch (err) {
    console.warn("Raw profile fetch error:", err);
    return null;
  }
}

// Helper to build CustomUser from auth user + DB profile
async function buildCustomUser(supabaseUser: any, accessToken?: string): Promise<CustomUser> {
  const profile = accessToken ? await fetchUserProfile(supabaseUser.id, accessToken) : null;
  
  // Prefer DB profile data over metadata
  const role = (profile?.role || supabaseUser.user_metadata?.role || "siswa") as "admin" | "guru" | "siswa";
  const name = profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || "User";
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name,
    role,
    avatar: profile?.avatar || supabaseUser.user_metadata?.avatar || null,
    avatarColor: profile?.avatar_color || supabaseUser.user_metadata?.avatarColor || "#3B82F6",
    classId: profile?.class_id || undefined,
    status: profile?.status || "active",
    exp: profile?.exp || 0,
    streak: profile?.streak || 0,
    hintPoints: profile?.hint_points ?? 3,
    lastStreakDate: profile?.last_streak_date || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Start with false to not block initial render

  const refreshUser = async () => {
    setLoading(true);
    const { data: { user: supaUser } } = await supabase.auth.getUser();
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (supaUser) {
      const customUser = await buildCustomUser(supaUser, currentSession?.access_token);
      setUser(customUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Listen for auth changes (non-blocking)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const customUser = await buildCustomUser(session.user, session.access_token);
        setUser(customUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: admin mengubah kelas siswa di profil → akun siswa langsung dapat classId baru tanpa reload
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    const channel = supabase
      .channel(`profile-sync-${uid}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
        async () => {
          const { data: { user: supaUser } } = await supabase.auth.getUser();
          const { data: { session: cur } } = await supabase.auth.getSession();
          if (supaUser) {
            setUser(await buildCustomUser(supaUser, cur?.access_token));
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Presence heartbeat: sinkron online/offline via updated_at profile.
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let stopped = false;

    const pingPresence = async () => {
      if (stopped) return;
      await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", uid);
    };

    void pingPresence();
    const intervalId = setInterval(() => {
      void pingPresence();
    }, 45000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void pingPresence();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session?.user?.id]);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername.trim();
      if (!email.includes("@")) {
        console.log("🔍 Resolving username to email:", email);
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .ilike("name", email)
          .limit(1)
          .maybeSingle();

        if (profile?.email) {
          email = profile.email;
        } else {
          const { data: fallbackProfile } = await supabase
            .from("profiles")
            .select("email")
            .ilike("email", `${email}@%`)
            .limit(1)
            .maybeSingle();

          if (fallbackProfile?.email) {
            email = fallbackProfile.email;
          } else {
            email = `${email.toLowerCase()}@studywithme.id`;
          }
        }
        console.log("✅ Resolved email:", email);
      }

      // Step 1: Call Auth REST API directly with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error_description || json?.msg || json?.error || "Login gagal");
      }

      // Step 2: Fetch profile directly
      const profile = await fetchUserProfile(json.user.id, json.access_token);
      
      // Step 3: Clear all stale local storage items that might cause lock issues
      Object.keys(localStorage).forEach(key => {
        if (key.includes('sb-') || key.includes('supabase') || key.includes('edulearn-auth') || key.includes('study-with-me-auth')) {
          localStorage.removeItem(key);
        }
      });

      // Step 4: Construct user and manually set local session
      const role = (profile?.role || json.user?.user_metadata?.role || "siswa") as "admin" | "guru" | "siswa";
      const name = profile?.name || json.user?.user_metadata?.name || email.split("@")[0];

      const customUser: CustomUser = {
        id: json.user.id,
        email: json.user.email,
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

      const sessionData = {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_in: json.expires_in,
        expires_at: Math.floor(Date.now() / 1000) + (json.expires_in || 3600),
        token_type: "bearer",
        user: json.user,
      };

      // Derive the project ref from the URL to build the standard Supabase storage key
      const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
      if (projectRef) {
        localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(sessionData));
      }

      // Step 5: Update state directly
      setSession({ access_token: json.access_token, user: json.user });
      setUser(customUser);
      setLoading(false);

      return { user: json.user, session: sessionData };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error("Koneksi timeout. Silakan periksa jaringan Anda.");
      }
      console.error("❌ Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  const updateProfile = async (updates: Partial<CustomUser>) => {
    if (!user) throw new Error("Not authenticated");
    
    try {
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

      // Update local state
      setUser((prevUser) => {
        if (prevUser) {
          return { ...prevUser, ...updates };
        }
        return null;
      });
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signOut,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("❌ useAuth called outside AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
