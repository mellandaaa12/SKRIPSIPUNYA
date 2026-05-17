"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, ChevronLeft, AlertCircle, LogOut, ArrowRight, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signOut, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Initialize theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  // Redirect to dashboard after login (only after button click, not on page load)
  const redirectAfterLogin = (role: string) => {
    if (role === "admin") {
      navigate("/dashboard-admin", { replace: true });
    } else if (role === "guru") {
      navigate("/dashboard-guru", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleGoToDashboard = () => {
    if (user) {
      redirectAfterLogin(user.role);
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
    setEmail("");
    setPassword("");
    setError("");
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // If user is already logged in when visiting login page, redirect to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      redirectAfterLogin(user.role);
    }
  }, [user, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("🔐 Attempting login with username:", email);
      
      // Sign in via raw fetch — zero supabase client calls, never hangs
      const result = await signIn(email, password);
      
      console.log("✅ Login successful! Redirecting now...");
      
      // Redirect immediately using the role from the DB profile
      const role = result?.customUser?.role || result?.user?.user_metadata?.role;
      if (role) {
        redirectAfterLogin(role);
      }
      
    } catch (err: any) {
      console.error("❌ Login error:", err);
      
      let errorMessage = "Login gagal. ";
      
      if (err.message?.includes("Invalid login credentials") || err.message?.includes("invalid_credentials")) {
        errorMessage = "⚠️ Username atau password salah. Silakan coba lagi.";
      } else if (err.message?.includes("Email not confirmed")) {
        errorMessage = "⚠️ Email belum dikonfirmasi. Cek inbox Anda. (Tips: Nonaktifkan 'Confirm Email' di Supabase Dashboard -> Authentication -> Providers -> Email agar login instan tanpa email confirmation).";
      } else if (err.message?.includes("User not found")) {
        errorMessage = "⚠️ Akun tidak ditemukan. Hubungi administrator.";
      } else {
        errorMessage += err.message || "Terjadi kesalahan. Silakan coba lagi.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", transition: "background 0.4s ease", position: "relative", overflow: "hidden" }}>
      {/* Global Stars Background */}
      {[...Array(30)].map((_, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: "fixed",
            width: Math.random() * 2 + 1 + "px",
            height: Math.random() * 2 + 1 + "px",
            borderRadius: "50%",
            background: "rgba(0, 119, 182, 0.15)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 6}s`,
            boxShadow: "0 0 4px rgba(0, 119, 182, 0.1)",
            zIndex: 0,
          }}
        />
      ))}

      {/* Decorative Blob Elements */}
      <div style={{
        position: "absolute",
        top: "-10%",
        right: "-10%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "rgba(144, 224, 239, 0.35)",
        filter: "blur(80px)",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute",
        bottom: "-10%",
        left: "-10%",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "rgba(0, 180, 216, 0.15)",
        filter: "blur(100px)",
        zIndex: 0,
      }} />

      {/* Back to Landing */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/")}
        style={{
          position: "fixed",
          top: "40px",
          left: "40px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#64748B",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          zIndex: 50,
        }}
      >
        <ChevronLeft style={{ width: "20px", height: "20px" }} />
        <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px" }}>Kembali</span>
      </motion.button>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "60px 32px",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "80px",
          width: "100%",
          maxWidth: "1200px",
          alignItems: "center",
        }}>
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px" }}
          >
            <motion.h2
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 900,
                fontSize: "3.5rem",
                margin: "0 0 24px",
                lineHeight: 1.2,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                whiteSpace: "nowrap",
                flexWrap: "nowrap",
              }}
            >
              <span className="text-brand-gradient">Selamat Datang!</span>
              <motion.span
                animate={{ rotate: [0, 16, -16, 16, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  display: "inline-block",
                  transformOrigin: "bottom right",
                }}
              >
                👋
              </motion.span>
            </motion.h2>
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                color: "#64748B",
                fontFamily: "Nunito, sans-serif",
                fontSize: "1.1rem",
                lineHeight: 1.7,
                margin: "0 0 48px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Masuk ke akun Anda untuk melanjutkan pembelajaran dan mengakses semua fitur platform
            </motion.p>

            {/* Animated Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: "60px",
                left: "20px",
                background: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 24px rgba(3, 4, 94, 0.05)",
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ width: "60px", height: "60px", background: "rgba(0, 180, 216, 0.2)", borderRadius: "12px" }}
              />
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "100px", height: "8px", background: "rgba(0, 119, 182, 0.2)", borderRadius: "50%", marginTop: "12px" }}
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "70px", height: "6px", background: "rgba(144, 224, 239, 0.3)", borderRadius: "50%", marginTop: "8px" }}
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, 25, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              style={{
                position: "absolute",
                bottom: "60px",
                right: "20px",
                background: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 24px rgba(3, 4, 94, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <motion.div
                  animate={{ rotate: [0, -360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  style={{ width: "40px", height: "40px", background: "rgba(0, 180, 216, 0.2)", borderRadius: "50%" }}
                />
                <div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "80px", height: "8px", background: "rgba(0, 119, 182, 0.2)", borderRadius: "50%", marginBottom: "6px" }}
                  />
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "60px", height: "6px", background: "rgba(144, 224, 239, 0.3)", borderRadius: "50%" }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "56px 48px",
              border: "1px solid rgba(0, 119, 182, 0.12)",
              boxShadow: "0 20px 40px rgba(3, 4, 94, 0.05)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginBottom: "40px", textAlign: "center" }}
              >
                <motion.h3
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: "2rem",
                    color: "#1E293B",
                    margin: "0 0 8px",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Masuk ke Akun 🔐
                </motion.h3>
                <p style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "0.95rem",
                  color: "#64748B",
                  margin: 0,
                  fontWeight: 600,
                }}>
                  Gunakan username dan password yang terdaftar.
                </p>
              </motion.div>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Username Input */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <User style={{ width: "16px", height: "16px", color: "#0077B6" }} /> Username
                  </motion.label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: budi"
                    required
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "0.95rem",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "2px solid rgba(0, 119, 182, 0.15)",
                      background: "white",
                      color: "#1E293B",
                      outline: "none",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.border = "2px solid #0077B6";
                      e.target.style.boxShadow = "0 0 10px rgba(0, 119, 182, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.border = "2px solid rgba(0, 119, 182, 0.15)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </motion.div>

                {/* Password Input */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Lock style={{ width: "16px", height: "16px", color: "#0077B6" }} /> Kata Sandi
                  </motion.label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      required
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        fontSize: "0.95rem",
                        padding: "14px 16px",
                        paddingRight: "50px",
                        borderRadius: "12px",
                        border: "2px solid rgba(0, 119, 182, 0.15)",
                        background: "white",
                        color: "#1E293B",
                        outline: "none",
                        width: "100%",
                        transition: "all 0.3s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.border = "2px solid #0077B6";
                        e.target.style.boxShadow = "0 0 10px rgba(0, 119, 182, 0.15)";
                      }}
                      onBlur={(e) => {
                        e.target.style.border = "2px solid rgba(0, 119, 182, 0.15)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      {showPassword ? (
                        <EyeOff style={{ width: "20px", height: "20px" }} />
                      ) : (
                        <Eye style={{ width: "20px", height: "20px" }} />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Remember & Forgot */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "8px",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "6px",
                        border: "rgba(0, 119, 182, 0.2)",
                        accentColor: "#0077B6",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "0.95rem",
                      color: "#64748B",
                      fontWeight: 600,
                    }}>
                      Ingat Saya
                    </span>
                  </label>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05, color: "#023E8A" }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: "none",
                      border: "none",
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#0077B6",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Lupa sandi?
                  </motion.button>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444", flexShrink: 0 }} />
                    <p style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "0.9rem",
                      color: "#ef4444",
                      margin: 0,
                    }}>{error}</p>
                  </motion.div>
                )}

                {/* Login Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.05 }}
                    whileTap={{ scale: loading ? 1 : 0.95 }}
                    style={{
                      width: "100%",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "white",
                      background: "linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "16px 24px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 10px 28px rgba(3, 4, 94, 0.2)",
                      opacity: loading ? 0.7 : 1,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      animate={loading ? { x: ["0%", "100%"] } : {}}
                      transition={{ duration: 1.5, repeat: loading ? Infinity : 0 }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                      }}
                    />
                    <span style={{ position: "relative", zIndex: 1 }}>
                      {loading ? "Memproses..." : "Masuk 🔑"}
                    </span>
                  </motion.button>
                </motion.div>
              </form>

              {/* Info Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                style={{
                  marginTop: "32px",
                  background: "rgba(0, 180, 216, 0.05)",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid rgba(0, 180, 216, 0.1)",
                }}
              >
                <p style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "0.9rem",
                  color: "#64748B",
                  textAlign: "center",
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  💡 <strong>Informasi:</strong> Akun dikelola oleh administrator sekolah. Hubungi admin untuk mendapatkan akses.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
