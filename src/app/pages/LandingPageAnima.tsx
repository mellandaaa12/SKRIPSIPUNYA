"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { 
  Brain, CalendarCheck, UsersThree, Trophy, Lightning, Rocket,
  InstagramLogo, TwitterLogo, YoutubeLogo, TiktokLogo,
  Sun, Moon, List, X, ArrowRight, Star, CaretLeft, CaretRight
} from "@phosphor-icons/react";

// ============================
// TYPES & INTERFACES
// ============================

interface Feature {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  gradient: string;
  accent: string;
  tag: string;
  tagBg: string;
  tagBorder: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  school: string;
  emoji: string;
  gradient: string;
  subjectColor: string;
  streak: string;
  rating: number;
  quote: string;
}

interface Step {
  step: string;
  emoji: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  highlight: string;
  items: string[];
}

// ============================
// CONSTANTS
// ============================

const COLORS = ["#6c42f5", "#00d2ff", "#ff6b9d", "#ffd60a", "#00e676", "#ff9500"];

const features: Feature[] = [
  {
    icon: <Brain size={28} weight="fill" />,
    emoji: "🧠",
    title: "Belajar Interaktif",
    description: "Modul mini dengan kuis visual yang seru. Belajar semudah main game — tidak membosankan!",
    gradient: "from-violet-500 to-indigo-600",
    accent: "#6c42f5",
    tag: "Fitur Andalan",
    tagBg: "rgba(108,66,245,0.15)",
    tagBorder: "rgba(108,66,245,0.35)",
  },
  {
    icon: <CalendarCheck size={28} weight="fill" />,
    emoji: "🔥",
    title: "Streak Harian",
    description: "Sistem streak yang membuat kamu konsisten belajar setiap hari. Makin panjang streak, makin seru!",
    gradient: "from-cyan-400 to-blue-500",
    accent: "#00d2ff",
    tag: "Konsistensi",
    tagBg: "rgba(0,210,255,0.12)",
    tagBorder: "rgba(0,210,255,0.3)",
  },
  {
    icon: <UsersThree size={28} weight="fill" />,
    emoji: "👥",
    title: "Komunitas Pelajar",
    description: "Diskusi dan tanya jawab bareng pelajar SMK se-Indonesia. Belajar bareng jauh lebih seru!",
    gradient: "from-pink-500 to-rose-500",
    accent: "#ff6b9d",
    tag: "Kolaborasi",
    tagBg: "rgba(255,107,157,0.12)",
    tagBorder: "rgba(255,107,157,0.3)",
  },
  {
    icon: <Trophy size={28} weight="fill" />,
    emoji: "🏆",
    title: "Leaderboard & Badge",
    description: "Saingan sehat dengan leaderboard kelas dan sekolah. Kumpulkan badge dan tunjukkan skill-mu!",
    gradient: "from-amber-400 to-orange-500",
    accent: "#ff9500",
    tag: "Gamifikasi",
    tagBg: "rgba(255,149,0,0.12)",
    tagBorder: "rgba(255,149,0,0.3)",
  },
  {
    icon: <Lightning size={28} weight="fill" />,
    emoji: "⚡",
    title: "Materi Padat & Jelas",
    description: "Rangkuman materi SMK yang to the point, lengkap dengan ilustrasi dan contoh soal nyata.",
    gradient: "from-yellow-400 to-amber-500",
    accent: "#ffd60a",
    tag: "Efisien",
    tagBg: "rgba(255,213,10,0.12)",
    tagBorder: "rgba(255,213,10,0.3)",
  },
  {
    icon: <Rocket size={28} weight="fill" />,
    emoji: "🚀",
    title: "Simulasi Ujian",
    description: "Latihan soal UTS, UAS, dan Ujian Kompetensi Keahlian. Tampil percaya diri saat ujian tiba!",
    gradient: "from-green-400 to-emerald-500",
    accent: "#00e676",
    tag: "Persiapan",
    tagBg: "rgba(0,230,118,0.12)",
    tagBorder: "rgba(0,230,118,0.3)",
  },
];

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Rizki Ahmad",
    role: "Siswa TKJ",
    school: "SMK Negeri 1 Jakarta",
    emoji: "💻",
    gradient: "from-blue-500 to-cyan-500",
    subjectColor: "#00d2ff",
    streak: "🔥 30 Hari Streak",
    rating: 5,
    quote: "Study With Me bikin belajar jadi seru! Streak harian bikin aku semangat setiap hari. Materi-materinya juga mudah dipahami."
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    role: "Siswa AK",
    school: "SMK Negeri 2 Bandung",
    emoji: "📊",
    gradient: "from-pink-500 to-rose-500",
    subjectColor: "#ff6b9d",
    streak: "🏆 Top 5 Kelas",
    rating: 5,
    quote: "Dulu aku susah belajar akuntansi, tapi dengan Study With Me jadi mudah! Quiz-nya seru dan komunitasnya helpful banget."
  },
  {
    id: 3,
    name: "Budi Santoso",
    role: "Siswa MM",
    school: "SMK Negeri 3 Surabaya",
    emoji: "🎨",
    gradient: "from-purple-500 to-indigo-500",
    subjectColor: "#6c42f5",
    streak: "⭐ 100+ Badge",
    rating: 5,
    quote: "Platform terbaik untuk pelajar SMK! Fitur leaderboard-nya bikin aku kompetitif dan termotivasi untuk belajar lebih giat."
  },
];

const steps: Step[] = [
  {
    step: "01",
    emoji: "📝",
    title: "Daftar Akun",
    description: "Buat akun gratis dalam hitungan detik. Cukup email dan nama, kamu sudah bisa mulai belajar.",
    icon: <span className="text-3xl">📝</span>,
    gradient: "from-blue-500 to-cyan-500",
    highlight: "Gratis & Cepat",
    items: ["Email valid", "Nama lengkap", "Pilih jurusan", "Verifikasi"]
  },
  {
    step: "02", 
    emoji: "📚",
    title: "Pilih Materi",
    description: "Pilih pelajaran yang mau dipelajari. Tersedia materi untuk semua jurusan SMK.",
    icon: <span className="text-3xl">📚</span>,
    gradient: "from-purple-500 to-indigo-500",
    highlight: "Lengkap & Terstruktur",
    items: ["Teknik", "Bisnis", "Seni", "Bahasa"]
  },
  {
    step: "03",
    emoji: "🚀",
    title: "Mulai Belajar",
    description: "Langsung mulai belajar dengan modul interaktif, kuis seru, dan dapatkan streak!",
    icon: <span className="text-3xl">🚀</span>,
    gradient: "from-green-500 to-emerald-500",
    highlight: "Interaktif & Menyenangkan",
    items: ["Video pembelajaran", "Kuis interaktif", "Progress tracking", "Badge collection"]
  },
];

const socialLinks = [
  { icon: <InstagramLogo size={20} weight="fill" />, href: "#", label: "Instagram", hoverColor: "#ff6b9d" },
  { icon: <TwitterLogo size={20} weight="fill" />, href: "#", label: "Twitter", hoverColor: "#00d2ff" },
  { icon: <YoutubeLogo size={20} weight="fill" />, href: "#", label: "YouTube", hoverColor: "#ff3d3d" },
  { icon: <TiktokLogo size={20} weight="fill" />, href: "#", label: "TikTok", hoverColor: "#ffffff" },
];

const footerLinks = {
  "Platform": [
    { label: "Tentang Kami", href: "#" },
    { label: "Fitur", href: "#" },
    { label: "Harga", href: "#" },
    { label: "Testimoni", href: "#" },
  ],
  "Belajar": [
    { label: "Semua Materi", href: "#" },
    { label: "Jurusan TKJ", href: "#" },
    { label: "Jurusan AK", href: "#" },
    { label: "Jurusan MM", href: "#" },
  ],
  "Bantuan": [
    { label: "FAQ", href: "#" },
    { label: "Kontak", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const highlights = [
  { emoji: "🎮", title: "Gamifikasi", desc: "Belajar sambil main", color: "#6c42f5" },
  { emoji: "📱", title: "Mobile Friendly", desc: "Akses dimana saja", color: "#00d2ff" },
  { emoji: "🏆", title: "Reward System", desc: "Dapatkan badge", color: "#ff6b9d" },
  { emoji: "👥", title: "Komunitas", desc: "Diskusi bareng", color: "#ffd60a" },
];

// ============================
// MAIN COMPONENT
// ============================

export default function LandingPageAnima() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("swm-theme", newTheme);
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("swm-theme") as "dark" | "light" || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Testimonial navigation
  const nextTestimonial = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setTransitioning(false);
    }, 350);
  };

  const prevTestimonial = () => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setTransitioning(false);
    }, 350);
  };

  const goToTestimonial = (index: number) => {
    if (index !== currentTestimonial) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentTestimonial(index);
        setTransitioning(false);
      }, 350);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleCtaClick = () => {
    const el = document.getElementById("cta");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`app-root min-h-screen ${theme}`}>
      {/* CSS Variables */}
      <style>{`
        :root {
          --bg: ${theme === "dark" ? "#0a0a0f" : "#f8fafc"};
          --bg2: ${theme === "dark" ? "#151521" : "#ffffff"};
          --text: ${theme === "dark" ? "#ffffff" : "#1e293b"};
          --text2: ${theme === "dark" ? "#a1a1aa" : "#64748b"};
          --text3: ${theme === "dark" ? "#71717a" : "#94a3b8"};
          --card: ${theme === "dark" ? "#1a1a2e" : "#ffffff"};
          --card-border: ${theme === "dark" ? "#2a2a3e" : "#e2e8f0"};
          --primary: #6c42f5;
          --secondary: #00d2ff;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-text-rainbow {
          background: linear-gradient(135deg, #6c42f5, #00d2ff, #ff6b9d, #ffd60a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glass-accent {
          background: rgba(108, 66, 245, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 66, 245, 0.3);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          border: none;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(108, 66, 245, 0.3);
        }

        .nav-glass {
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .hero-bg {
          background: radial-gradient(ellipse at top, var(--primary) 0%, transparent 50%),
                      radial-gradient(ellipse at bottom, var(--secondary) 0%, transparent 50%);
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
        }

        .orb-1 {
          width: 300px;
          height: 300px;
          top: 10%;
          left: 10%;
          background: radial-gradient(circle, rgba(108,66,245,0.3) 0%, transparent 70%);
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          top: 50%;
          right: 10%;
          background: radial-gradient(circle, rgba(0,210,255,0.3) 0%, transparent 70%);
        }

        .orb-3 {
          width: 250px;
          height: 250px;
          bottom: 20%;
          left: 30%;
          background: radial-gradient(circle, rgba(255,107,157,0.3) 0%, transparent 70%);
        }

        .orb-4 {
          width: 350px;
          height: 350px;
          bottom: 10%;
          right: 30%;
          background: radial-gradient(circle, rgba(255,213,10,0.3) 0%, transparent 70%);
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          animation: particleFloat 3s ease-in-out infinite;
        }

        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-110px) scale(0); opacity: 0; }
        }

        .mascot-container {
          animation: bobble 3s ease-in-out infinite;
        }

        @keyframes bobble {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.06); }
        }

        .section-title {
          color: var(--text);
        }

        .section-desc {
          color: var(--text2);
        }

        .cta-card {
          background: linear-gradient(135deg, rgba(108,66,245,0.1) 0%, rgba(0,210,255,0.1) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feature-card {
          background: var(--card);
          border: 1px solid var(--card-border);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .step-card {
          background: var(--card);
          border: 1px solid var(--card-border);
          position: relative;
          overflow: hidden;
        }

        .testi-card {
          background: var(--card);
          border: 1px solid var(--card-border);
        }

        .nav-dot {
          background: var(--text3);
        }

        .nav-arrow {
          background: var(--card);
          border: 1px solid var(--card-border);
          color: var(--text);
        }

        .nav-arrow:hover {
          background: var(--primary);
          color: white;
        }

        .theme-toggle-btn {
          background: var(--card);
          border: 1px solid var(--card-border);
          color: var(--text);
        }

        .nav-icon-btn {
          background: transparent;
          border: none;
          color: var(--text);
        }

        .nav-brand {
          color: var(--text);
        }

        .hero-badge {
          background: rgba(108, 66, 245, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 66, 245, 0.3);
          color: white;
        }

        .steps-badge {
          background: rgba(0, 210, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 210, 255, 0.3);
          color: white;
        }

        .step-badge {
          background: rgba(108, 66, 245, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 66, 245, 0.3);
          color: white;
        }

        .step-item {
          background: rgba(108, 66, 245, 0.05);
          border: 1px solid rgba(108, 66, 245, 0.2);
          color: var(--text);
        }

        .step-num-label {
          color: var(--text3);
        }

        .step-desc {
          color: var(--text2);
        }

        .highlight-item {
          background: var(--card);
          border: 1px solid var(--card-border);
        }

        .highlight-title {
          color: var(--text);
        }

        .highlight-desc {
          color: var(--text2);
        }

        .feature-bubble {
          background: rgba(108, 66, 245, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 66, 245, 0.3);
          color: white;
        }

        .mascot-glow {
          background: radial-gradient(circle, rgba(108,66,245,0.3) 0%, transparent 70%);
        }

        .testi-name {
          color: var(--text);
        }

        .testi-role {
          color: var(--text2);
        }

        .testi-school {
          color: var(--text3);
        }

        .testi-quote {
          color: var(--text);
        }

        .quote-mark {
          color: var(--primary);
          opacity: 0.3;
        }

        .cta-badge {
          background: rgba(255, 107, 157, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 157, 0.3);
          color: white;
        }

        @media (max-width: 768px) {
          .orb-1, .orb-2, .orb-3, .orb-4 {
            width: 200px;
            height: 200px;
          }
        }
      `}</style>

      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "nav-glass shadow-2xl" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">SW</span>
              </div>
            </div>
            <span className="font-poppins font-black text-lg nav-brand">
              Study <span className="gradient-text">With Me</span>
            </span>
          </a>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl theme-toggle-btn flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark"
                ? <Sun size={18} weight="fill" className="text-yellow-400" />
                : <Moon size={18} weight="fill" className="text-indigo-500" />
              }
            </button>
            <button
              onClick={handleLogin}
              className="btn-primary px-6 py-2.5 rounded-xl font-poppins font-bold text-sm cursor-pointer"
            >
              🔐 Login
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl nav-icon-btn transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden nav-glass border-t border-white/8 px-6 py-4 flex flex-col gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold theme-toggle-btn cursor-pointer"
            >
              {theme === "dark"
                ? <Sun size={18} className="text-yellow-400" />
                : <Moon size={18} className="text-indigo-500" />}
              <span>{theme === "dark" ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}</span>
            </button>
            <button
              onClick={handleLogin}
              className="btn-primary px-5 py-3 rounded-xl font-poppins font-bold text-sm cursor-pointer"
            >
              🔐 Login
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative w-full min-h-screen flex items-center justify-center overflow-hidden hero-bg">
        {/* Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />

        {/* Floating particles */}
        {COLORS.map((c, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${8 + i * 16}%`,
              top: `${20 + (i * 13) % 60}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${3 + (i % 3)}s`,
              background: c,
              width: `${5 + (i % 3) * 3}px`,
              height: `${5 + (i % 3) * 3}px`,
            }}
          />
        ))}
        {COLORS.map((c, i) => (
          <div
            key={`p2-${i}`}
            className="particle"
            style={{
              right: `${5 + i * 13}%`,
              top: `${30 + (i * 11) % 55}%`,
              animationDelay: `${i * 0.5 + 1.5}s`,
              animationDuration: `${4 + (i % 2)}s`,
              background: c,
              width: `${4 + (i % 2) * 2}px`,
              height: `${4 + (i % 2) * 2}px`,
            }}
          />
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12 flex flex-col lg:flex-row items-center gap-12">
          {/* Left — Text */}
          <motion.div 
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Live indicator badge */}
            <motion.div
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full hero-badge text-sm font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              🚀 Platform Pembelajaran SMK Terbaik
            </motion.div>

            <motion.h1 
              className="font-poppins font-black text-4xl md:text-6xl section-title mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Belajar Jadi{" "}
              <span className="gradient-text-rainbow">Lebih Seru</span> 🎓
            </motion.h1>

            <motion.p 
              className="section-desc text-lg leading-relaxed mb-8 max-w-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Study With Me hadir sebagai teman belajarmu. Dengan fitur interaktif, gamifikasi cerdas, dan komunitas aktif — belajar tidak akan pernah membosankan lagi.
            </motion.p>

            {/* Highlights grid */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {highlights.map((h, i) => (
                <div key={i} className="highlight-item flex items-start gap-3 p-4 rounded-2xl group hover:scale-105 transition-transform duration-300 cursor-default">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${h.color}20`, border: `1px solid ${h.color}30` }}
                  >
                    {h.emoji}
                  </span>
                  <div>
                    <div className="font-poppins font-bold text-sm highlight-title">{h.title}</div>
                    <div className="highlight-desc text-xs mt-0.5">{h.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.button
              onClick={handleLogin}
              className="btn-primary px-8 py-4 rounded-2xl font-poppins font-bold text-base flex items-center justify-center gap-3 cursor-pointer group w-full sm:w-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Rocket size={22} weight="fill" />
              Login & Mulai Belajar
              <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Right — Mascot */}
          <motion.div 
            className="flex-shrink-0 flex flex-col items-center gap-6 relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute w-56 h-56 rounded-full mascot-glow blur-3xl" />
            <div className="relative z-10">
              <div className="mascot-container" style={{ width: 260, height: 260 }}>
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 rounded-3xl flex items-center justify-center text-white text-6xl font-bold shadow-2xl">
                  📚
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {["Belajar Kapan Saja 📱", "Materi Visual 🎨", "Kuis Seru 🎮", "Progres Terukur 📈"].map((text, i) => (
                <span key={i} className="feature-bubble px-3 py-1.5 rounded-xl text-xs font-bold">
                  {text}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-accent text-sm font-bold mb-5">
              🌟 Fitur Unggulan
            </div>
            <h2 className="font-poppins font-black text-4xl md:text-5xl section-title mb-4">
              Semua yang Kamu{" "}
              <span className="gradient-text-rainbow">Butuhkan</span>
            </h2>
            <p className="section-desc text-lg max-w-xl mx-auto">
              Fitur-fitur terbaik yang dirancang khusus untuk membuat proses belajar SMK menjadi lebih efektif dan menyenangkan.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card rounded-2xl p-6 cursor-pointer"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white text-2xl shadow-lg`}>
                    {feature.icon}
                  </div>
                  <div>
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: feature.tagBg, border: `1px solid ${feature.tagBorder}`, color: feature.accent }}
                    >
                      {feature.tag}
                    </div>
                  </div>
                </div>
                
                <h3 className="font-poppins font-bold text-xl section-title mb-2">
                  {feature.emoji} {feature.title}
                </h3>
                
                <p className="section-desc text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6 relative">
        {/* Background elements */}
        <div className="absolute top-1/4 right-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,210,255,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(108,66,245,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-accent text-sm font-bold mb-5">
              🗺️ Cara Menggunakan Platform
            </div>
            <h2 className="font-poppins font-black text-4xl md:text-5xl section-title mb-4">
              3 Langkah Simpel,{" "}
              <span className="gradient-text-rainbow">Langsung Mulai!</span>
            </h2>
            <p className="section-desc text-lg max-w-xl mx-auto">
              Tidak perlu setup rumit. Ikuti tiga langkah ini dan kamu sudah bisa belajar interaktif dalam hitungan menit.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="flex flex-col gap-16">
            {steps.map((step, index) => {
              const isEven = index % 2 === 1;
              return (
                <motion.div
                  key={step.step}
                  className={`flex flex-col ${isEven ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12`}
                  initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  {/* Visual card */}
                  <div className="w-full lg:w-1/2">
                    <div className="step-card rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-4 right-6 font-poppins font-black text-8xl watermark-num leading-none select-none opacity-10">
                        {step.step}
                      </div>
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white text-3xl mb-5 shadow-xl`}
                      >
                        {step.icon}
                      </div>
                      <div className="inline-flex items-center px-4 py-2 rounded-full glass-accent text-sm font-bold step-badge mb-4">
                        {step.highlight}
                      </div>
                      <div className="flex flex-col gap-2">
                        {step.items.map((item, i) => (
                          <div key={i} className="step-item text-sm font-semibold py-2 px-3 rounded-xl">
                            {item}
                          </div>
                        ))}
                      </div>
                      <div
                        className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${step.gradient} opacity-10 blur-2xl`}
                      />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="w-full lg:w-1/2 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-poppins font-black text-xl shadow-xl flex-shrink-0`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="step-num-label text-xs font-bold uppercase tracking-widest mb-1">
                          Langkah {step.step}
                        </div>
                        <h3 className="font-poppins font-black text-2xl md:text-3xl section-title">
                          {step.emoji} {step.title}
                        </h3>
                      </div>
                    </div>
                    <p className="step-desc text-lg leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-accent text-sm font-bold mb-5">
              💬 Apa Kata Mereka
            </div>
            <h2 className="font-poppins font-black text-4xl md:text-5xl section-title mb-4">
              Testimoni{" "}
              <span className="gradient-text-rainbow">Pelajar SMK</span>
            </h2>
            <p className="section-desc text-lg max-w-xl mx-auto">
              Dengarkan langsung pengalaman para pelajar SMK yang sudah merasakan manfaatnya.
            </p>
          </motion.div>

          {/* Testimonial Card */}
          <div className="relative">
            <motion.div
              className="testi-card rounded-3xl p-8 md:p-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${testimonials[currentTestimonial].gradient} flex items-center justify-center text-4xl shadow-xl`}
                  >
                    {testimonials[currentTestimonial].emoji}
                  </div>
                  <div>
                    <div className="testi-name font-poppins font-black text-lg">{testimonials[currentTestimonial].name}</div>
                    <div className="testi-role text-sm font-medium">{testimonials[currentTestimonial].role}</div>
                    <div className="testi-school text-xs mt-0.5">🏫 {testimonials[currentTestimonial].school}</div>
                  </div>
                </div>
                <div
                  className="px-4 py-2 rounded-full text-sm font-bold"
                  style={{ 
                    background: `${testimonials[currentTestimonial].subjectColor}20`, 
                    border: `1px solid ${testimonials[currentTestimonial].subjectColor}40`, 
                    color: testimonials[currentTestimonial].subjectColor 
                  }}
                >
                  {testimonials[currentTestimonial].streak}
                </div>
              </div>

              <div className="flex gap-1 mb-5">
                {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                  <Star key={i} size={20} weight="fill" className="text-yellow-400" />
                ))}
              </div>

              <blockquote className="testi-quote text-lg md:text-xl leading-relaxed font-medium relative">
                <span className="text-5xl font-serif leading-none absolute -top-2 -left-1 quote-mark">"</span>
                <span className="pl-7">{testimonials[currentTestimonial].quote}</span>
                <span className="text-5xl font-serif leading-none quote-mark ml-1">"</span>
              </blockquote>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="nav-arrow w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToTestimonial(i)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${i === currentTestimonial ? "w-8 h-3 bg-violet-500" : "w-3 h-3 nav-dot"}`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="nav-arrow w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110"
              >
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 px-6 relative">
        {/* Background elements */}
        <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,107,157,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="cta-card rounded-3xl p-8 md:p-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Left */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-accent text-sm font-bold cta-badge mb-6">
                  🚀 Mulai Perjalanan Belajarmu
                </div>

                <h2 className="font-poppins font-black text-4xl md:text-5xl section-title mb-5 leading-tight">
                  Siap Jadi Pelajar{" "}
                  <span className="gradient-text-rainbow">SMK Terbaik?</span> 🎓
                </h2>

                <p className="section-desc text-lg leading-relaxed mb-8 max-w-lg">
                  Study With Me hadir sebagai teman belajarmu. Dengan fitur interaktif, gamifikasi cerdas, dan komunitas aktif — belajar tidak akan pernah membosankan lagi.
                </p>

                {/* Highlights grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {highlights.map((h, i) => (
                    <div key={i} className="highlight-item flex items-start gap-3 p-4 rounded-2xl group hover:scale-105 transition-transform duration-300 cursor-default">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${h.color}20`, border: `1px solid ${h.color}30` }}
                      >
                        {h.emoji}
                      </span>
                      <div>
                        <div className="font-poppins font-bold text-sm highlight-title">{h.title}</div>
                        <div className="highlight-desc text-xs mt-0.5">{h.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={handleLogin}
                  className="btn-primary px-8 py-4 rounded-2xl font-poppins font-bold text-base flex items-center justify-center gap-3 cursor-pointer group w-full sm:w-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Rocket size={22} weight="fill" />
                  Login & Mulai Belajar
                  <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>

              {/* Right — Mascot */}
              <div className="flex-shrink-0 flex flex-col items-center gap-6 relative">
                <div className="absolute w-56 h-56 rounded-full mascot-glow blur-3xl" />
                <div className="relative z-10">
                  <div className="mascot-container" style={{ width: 260, height: 260 }}>
                    <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 rounded-3xl flex items-center justify-center text-white text-6xl font-bold shadow-2xl">
                      🎓
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                  {["Belajar Kapan Saja 📱", "Materi Visual 🎨", "Kuis Seru 🎮", "Progres Terukur 📈"].map((text, i) => (
                    <span key={i} className="feature-bubble px-3 py-1.5 rounded-xl text-xs font-bold">
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative pt-16 pb-8 px-6 overflow-hidden" style={{ background: "var(--bg2)" }}>
        {/* Top border glow */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(108,66,245,0.5), rgba(0,210,255,0.3), transparent)" }}
        />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="mascot-container" style={{ width: 56, height: 56 }}>
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    SW
                  </div>
                </div>
                <div>
                  <div className="font-poppins font-black text-xl section-title">Study With Me</div>
                  <div className="section-desc text-xs font-medium">Media Pembelajaran SMK</div>
                </div>
              </div>
              <p className="section-desc text-sm leading-relaxed mb-6 max-w-xs">
                Platform belajar interaktif yang dirancang khusus untuk pelajar SMK Indonesia. Belajar lebih seru, lebih efektif!
              </p>

              {/* Social links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-10 h-10 rounded-xl glass flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 section-desc"
                    style={{ color: "var(--text3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = s.hoverColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <div className="font-poppins font-bold section-title text-sm mb-4 uppercase tracking-wider">{category}</div>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="section-desc text-sm hover:text-violet-400 transition-all duration-200 cursor-pointer hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid var(--card-border)" }}
          >
            <p className="section-desc text-sm font-medium opacity-60">
              © {new Date().getFullYear()} Study With Me. Made with ❤️ for SMK Indonesia 🇮🇩
            </p>
            <div className="flex items-center gap-6">
              <span className="section-desc text-xs opacity-50">🔐 SSL Secured</span>
              <span className="section-desc text-xs opacity-50">☁️ Cloud Based</span>
              <span className="section-desc text-xs opacity-50">📱 Mobile Friendly</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
