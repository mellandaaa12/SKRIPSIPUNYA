"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import {
  Search, Sparkles, Menu, LayoutDashboard,
  Activity as ActivityIcon, BookOpen, Users, ArrowRight, GraduationCap,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { classAPI, formatClassDisplayName } from "../utils/api";
import { supabase } from "../utils/supabase";
import { CuteClassCard } from "../components/CuteClassCard";

// ─── Colorful themes per card (aligned with blue palette) ────────────────────
const KELAS_THEMES = [
  { top: "#CAF0F8", topDeep: "#90E0EF", accent: "#0077B6", light: "#E8F4FD", text: "#023E8A", sub: "#0077B6" },
  { top: "#D1FAE5", topDeep: "#6EE7B7", accent: "#059669", light: "#ECFDF5", text: "#064E3B", sub: "#059669" },
  { top: "#EDE9FE", topDeep: "#C4B5FD", accent: "#7C3AED", light: "#F5F3FF", text: "#3B0764", sub: "#6D28D9" },
  { top: "#FEE2E2", topDeep: "#FCA5A5", accent: "#DC2626", light: "#FEF2F2", text: "#7F1D1D", sub: "#B91C1C" },
  { top: "#FEF9C3", topDeep: "#FDE68A", accent: "#D97706", light: "#FFFBEB", text: "#78350F", sub: "#92400E" },
  { top: "#E0F2FE", topDeep: "#7DD3FC", accent: "#0284C7", light: "#EFF6FF", text: "#0C4A6E", sub: "#0369A1" },
];

// ─── Animated Grade Display ───────────────────────────────────────────────────
function GradeIllustration({ grade, themeIndex }: { grade: string; themeIndex: number }) {
  const th = KELAS_THEMES[themeIndex % KELAS_THEMES.length];
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Decorative rings */}
      <div
        className="absolute w-28 h-28 rounded-full opacity-20 animate-pulse"
        style={{ background: th.accent, animationDuration: "3s" }}
      />
      <div
        className="absolute w-20 h-20 rounded-full opacity-30"
        style={{ background: th.accent, animation: "pulse 2.5s ease-in-out infinite 0.5s" }}
      />
      {/* Floating dots */}
      <div className="absolute top-4 right-8 w-3 h-3 rounded-full opacity-60" style={{ background: th.accent, animation: "float 3s ease-in-out infinite" }} />
      <div className="absolute bottom-5 left-6 w-2 h-2 rounded-full opacity-40" style={{ background: th.accent, animation: "float 4s ease-in-out infinite 1s" }} />
      <div className="absolute top-6 left-10 w-2 h-2 rounded-full opacity-50" style={{ background: th.accent, animation: "float 3.5s ease-in-out infinite 0.5s" }} />
      {/* Grade number */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <span
          className="text-5xl font-black tracking-tight drop-shadow-lg leading-none"
          style={{
            color: th.accent,
            textShadow: `0 4px 24px ${th.accent}40`,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {grade || "—"}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: th.accent }}>
          KELAS
        </span>
      </div>
    </div>
  );
}

// ─── Kelas Card ───────────────────────────────────────────────────────────────
function KelasCard({
  kelas,
  idx,
  onClick,
}: {
  kelas: any;
  idx: number;
  onClick: () => void;
}) {
  const th = KELAS_THEMES[idx % KELAS_THEMES.length];
  const classNameStr = kelas.displayName || formatClassDisplayName(kelas);

  return (
    <div
      onClick={onClick}
      className="group relative w-full rounded-[1.5rem] bg-white overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
      style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.09)" }}
    >
      {/* ── TOP: Animated grade visual ─────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 168,
          background: `linear-gradient(145deg, ${th.top} 0%, ${th.topDeep} 100%)`,
        }}
      >
        {/* Shine */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 75% 20%, rgba(255,255,255,0.55) 0%, transparent 65%)" }}
        />
        <GradeIllustration grade={kelas.grade || ""} themeIndex={idx} />

        {/* Subject pill — top left */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "rgba(255,255,255,0.72)",
              color: th.accent,
              border: `1.5px solid rgba(255,255,255,0.8)`,
              backdropFilter: "blur(4px)",
            }}
          >
            {kelas.subject || "Umum"}
          </span>
        </div>

        {/* Student count — top right */}
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "rgba(255,255,255,0.72)",
              color: th.accent,
              border: `1.5px solid rgba(255,255,255,0.8)`,
              backdropFilter: "blur(4px)",
            }}
          >
            <Users className="w-3 h-3" />
            {kelas.studentCount || 0} Siswa
          </span>
        </div>
      </div>

      {/* ── BOTTOM: White content ──────────────────────────────── */}
      <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5">
        {/* Class name */}
        <h3
          className="text-[15px] font-extrabold leading-snug line-clamp-2"
          style={{ color: th.text }}
        >
          {classNameStr}
        </h3>

        {/* Wali kelas */}
        {kelas.teacherName && (
          <p className="text-[12px] text-slate-500 flex items-center gap-1.5 -mt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            {kelas.teacherName}
          </p>
        )}

        {/* Divider */}
        <div className="h-px w-full" style={{ background: `${th.accent}14` }} />

        {/* Stats tags */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border"
            style={{
              background: `${th.accent}0D`,
              color: th.sub,
              borderColor: `${th.accent}20`,
            }}
          >
            <Users className="w-3 h-3" />
            {kelas.studentCount || 0} Siswa
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border"
            style={{
              background: `${th.accent}0D`,
              color: th.sub,
              borderColor: `${th.accent}20`,
            }}
          >
            <BookOpen className="w-3 h-3" />
            {kelas.materialCount || 0} Materi
          </span>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-[12px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
            style={{ color: th.accent }}
          >
            Buka Kelas <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              background: `${th.accent}15`,
              color: th.accent,
            }}
          >
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KelasGuru() {
  const navigate = useNavigate();
  const { preferences } = useSettings();
  const { user, session } = useAuth();
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-guru" },
    { id: "kelas", label: "Kelas", icon: ActivityIcon, path: "/dashboard-guru/kelas" },
    { id: "forum", label: "Forum Diskusi", icon: ActivityIcon, path: "/dashboard-guru/forum" },
  ];

  const fetchKelas = async () => {
    if (!session?.access_token || !user?.id) return;
    try {
      setLoading(true);
      const response = await classAPI.getAll(session.access_token);
      const guruKelas = response.kelas?.filter((kelas: any) => {
        const wali = kelas.teacher_id === user.id || kelas.teacherId === user.id;
        const pengampu = Array.isArray(kelas.otherTeacherIds) && kelas.otherTeacherIds.includes(user.id);
        return wali || pengampu;
      }) || [];
      setKelasList(guruKelas);
      setFiltered(guruKelas);
    } catch (error: any) {
      console.error("Error fetching kelas:", error);
      setKelasList([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKelas(); }, [session]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`guru-kelas-page-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => void fetchKelas())
      .on("postgres_changes", { event: "*", schema: "public", table: "class_subjects" }, () => void fetchKelas())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  // Filter by search
  useEffect(() => {
    if (!search.trim()) { setFiltered(kelasList); return; }
    const q = search.toLowerCase();
    setFiltered(kelasList.filter(k =>
      (k.displayName || formatClassDisplayName(k)).toLowerCase().includes(q) ||
      (k.subject || "").toLowerCase().includes(q) ||
      (k.grade || "").toLowerCase().includes(q)
    ));
  }, [search, kelasList]);

  const texts = {
    id: { title: "Daftar Kelas", subtitle: "Lihat daftar kelas yang kamu ajar", search: "Cari kelas...", noKelas: "Belum ada kelas yang diampu" },
    en: { title: "Class List", subtitle: "View the list of classes you teach", search: "Search classes...", noKelas: "No classes taught yet" },
  };
  const t = texts[preferences.language];

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#D4ECF0]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#D4ECF0]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#DCFCE7]/30 blur-3xl" />
      </div>

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#0077B6] hover:bg-white transition-all duration-200 lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2rem] border border-[#E2E8F0]/30 bg-white/75 backdrop-blur-16 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 rounded-xl p-3 text-left text-sm font-medium text-[#0077B6] hover:bg-white/60"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SideBarGuru />

      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#0077B6]" />
              <span className="text-sm font-semibold text-[#0077B6]">Kelas</span>
            </div>
            <ProfileHeader />
          </div>

          {/* Welcome banner */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <h1 className="text-3xl font-bold text-[#0077B6] mb-2">{t.title}</h1>
              <p className="text-base text-[#64748B]">{t.subtitle}</p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.search}
                  className="w-full h-12 pl-12 pr-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-[#CBD5E1]" />
                </div>
                <p className="text-sm font-semibold text-[#0077B6]">{t.noKelas}</p>
                <p className="text-xs text-[#94A3B8]">Tunggu admin menugaskan Anda ke dalam kelas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
                {filtered.map((kelas, idx) => (
                  <CuteClassCard
                    key={kelas.id}
                    kelas={kelas}
                    index={idx}
                    onClick={() => navigate(`/dashboard-guru/kelas/${kelas.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
