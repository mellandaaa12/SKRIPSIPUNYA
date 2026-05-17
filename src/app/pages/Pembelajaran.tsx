"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { Search, BookOpen, Loader, Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { getPembelajaranByClass, getProgress } from "../utils/api";
import { supabase } from "../utils/supabase";

export default function Pembelajaran() {
  const navigate = useNavigate();
  const { preferences } = useSettings();
  const { user, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [pembelajaran, setPembelajaran] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  useEffect(() => {
    if (user?.classId) {
      loadData();
    } else {
      // Jika tidak ada classId, tetap set loading ke false untuk menampilkan empty state
      setLoading(false);
    }
  }, [user?.classId, user?.id, session?.access_token]);

  useEffect(() => {
    if (!user?.classId) return;
    const cid = user.classId;
    const channel = supabase
      .channel(`murid-pembelajaran-${cid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pembelajaran", filter: `class_id=eq.${cid}` },
        () => {
          void loadData();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.classId]);

  const loadData = async () => {
    if (!user?.classId || !session?.access_token) return;

    setLoading(true);
    try {
      const [pembelajaranData, progressData] = await Promise.all([
        getPembelajaranByClass(user.classId, session.access_token),
        getProgress(user.id)
      ]);

      // Tampilkan materi yang dipublikasikan (default baru = published; data lama tanpa status tetap ditampilkan)
      const publishedPembelajaran = (pembelajaranData?.pembelajaran || []).filter(
        (p: any) => !p.status || p.status === "published"
      );
      setPembelajaran(publishedPembelajaran);

      // Convert progress array to map
      const progressMap: any = {};
      (progressData || []).forEach((p: any) => {
        progressMap[p.pembelajaranId] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error("Failed to load pembelajaran:", error);
      // Set empty array on error to prevent infinite loading
      setPembelajaran([]);
      setProgress({});
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (pembelajaranId: string) => {
    const p = progress[pembelajaranId];
    if (!p) return 0;
    
    const totalSteps = pembelajaran.find((pb: any) => pb.id === pembelajaranId)?.steps?.length || 0;
    if (totalSteps === 0) return 0;
    
    const completedSteps = Object.values(p.steps || {}).filter((s: any) => s.completed).length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const filteredPembelajaran = pembelajaran.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const texts = {
    id: {
      title: "Pembelajaran",
      subtitle: "Pilih materi pembelajaran yang ingin dipelajari",
      search: "Cari pembelajaran...",
      noResults: "Tidak ada hasil pencarian",
      noData: "Belum ada pembelajaran",
      progress: "Selesai",
      materi: "Materi",
    },
    en: {
      title: "Learning",
      subtitle: "Choose learning materials to study",
      search: "Search learning...",
      noResults: "No search results",
      noData: "No learning materials yet",
      progress: "Complete",
      materi: "Materials",
    },
  };

  const t = texts[preferences.language];

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#0077B6]/40 blur-3xl" />
          <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#0077B6]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-[#0077B6] animate-spin" />
            <p className="text-sm text-[#64748B]">Memuat pembelajaran...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#0077B6]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#0077B6]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
      </div>

      {/* Mobile: floating menu button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#0077B6] hover:bg-white transition-all duration-200 lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
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
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
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

      <SideBarMurid />

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Left - Pembelajaran Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#00B4D8]" />
              <span className="text-sm font-semibold text-[#0077B6]">{t.title}</span>
            </div>

            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div id="onboarding-welcome-card" className="mb-8 animate-slideIn">
            <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.15)] text-white">
              <h1 className="text-3xl font-bold text-white mb-3">
                {t.title}
              </h1>
              <p className="text-base text-blue-100">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            {/* Search Bar */}
            <div id="onboarding-pembelajaran-search" className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search}
                  className="w-full h-12 pl-12 pr-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Pembelajaran Grid */}
            {filteredPembelajaran.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-[#CBD5E1]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8] mb-1">
                  {searchQuery ? t.noResults : t.noData}
                </p>
              </div>
            ) : (
              <div id="onboarding-pembelajaran-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pt-4">
                {filteredPembelajaran.map((item, idx) => {
                  const progressValue = calculateProgress(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/pembelajaran/${item.id}`)}
                      className="group flex flex-col items-center cursor-pointer"
                    >
                      {/* Folder Stack Visual Container */}
                      <div className="relative w-56 h-48 flex items-end justify-center transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105">
                        {/* Sheets peeking out */}
                        
                        {/* Sheet 1 - Fisika Red (Left tilt) */}
                        <div className="absolute top-2 left-3 w-40 h-32 rounded-2xl bg-[#fca5a5] border border-[#dc2626]/20 shadow-sm -rotate-12 transition-transform duration-300 group-hover:-rotate-[16deg] group-hover:-translate-x-1 overflow-hidden p-2.5 flex flex-col justify-between">
                          <div className="w-1/3 h-1.5 bg-white/40 rounded-full" />
                          <div className="space-y-1.5">
                            <div className="w-full h-1 bg-white/20 rounded-full" />
                            <div className="w-4/5 h-1 bg-white/20 rounded-full" />
                            <div className="w-full h-1 bg-white/20 rounded-full" />
                          </div>
                          <div className="w-full h-8 bg-white/10 rounded-lg" />
                        </div>

                        {/* Sheet 2 - Matematika Blue (Right tilt) */}
                        <div className="absolute top-2 right-3 w-40 h-32 rounded-2xl bg-[#93c5fd] border border-[#0369a1]/20 shadow-sm rotate-12 transition-transform duration-300 group-hover:rotate-[16deg] group-hover:translate-x-1 overflow-hidden p-2.5 flex flex-col justify-between">
                          <div className="w-1/3 h-1.5 bg-white/40 rounded-full ml-auto" />
                          <div className="space-y-1.5">
                            <div className="w-full h-1 bg-white/20 rounded-full" />
                            <div className="w-3/4 h-1 bg-white/20 rounded-full" />
                          </div>
                          <div className="w-full h-8 bg-white/10 rounded-lg" />
                        </div>

                        {/* Sheet 3 - Kimia Green (Center straight) */}
                        <div className="absolute top-0 w-40 h-36 rounded-2xl bg-[#b9f8cf] border border-[#008236]/20 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 overflow-hidden p-3 flex flex-col gap-2">
                          <div className="w-1/2 h-2 bg-white/40 rounded-full" />
                          <div className="space-y-2 mt-1">
                            <div className="w-full h-1.5 bg-white/20 rounded-full" />
                            <div className="w-full h-1.5 bg-white/20 rounded-full" />
                            <div className="w-4/5 h-1.5 bg-white/20 rounded-full" />
                          </div>
                          <div className="w-full flex-1 bg-white/10 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white/60" />
                          </div>
                        </div>

                        {/* Main Frosted Folder Body */}
                        <div className="relative w-52 h-36 z-10">
                          {/* Folder Back Tab (Top Left) */}
                          <div className={`absolute -top-3 left-0 w-20 h-6 bg-white/80 backdrop-blur-md rounded-t-xl border-t border-l border-white/90 shadow-sm`} />

                          {/* Folder Front Cover */}
                          <div className={`absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] p-3.5 flex flex-col justify-between overflow-hidden`}>
                            {/* Glass reflection highlight */}
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/60 to-transparent" />

                            {/* Accessory Stamps / Stickers */}
                            <div className="flex items-start justify-between relative z-10">
                              {/* Stamp Accent */}
                              <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-gray-100 p-1 flex items-center justify-center rotate-[-4deg]">
                                <div className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-2xs" />
                              </div>

                              {/* Decorative Sticker */}
                              <div className="px-2 py-1 bg-[#F1F5F9]/80 backdrop-blur-xs rounded-md border border-white text-[10px] font-bold text-[#56B6C6] rotate-[6deg]">
                                Materi
                              </div>
                            </div>

                            {/* Dummy Debossed Lines */}
                            <div className="relative z-10 flex flex-col gap-1 items-center mb-0.5">
                              <div className="w-16 h-0.5 bg-white/40 rounded-full" />
                              <div className="w-10 h-0.5 bg-white/40 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Title Center Aligned */}
                      <h3 className="text-lg font-extrabold text-[#0077B6] text-center mt-4 px-2 line-clamp-1 group-hover:text-[#00B4D8] transition-colors">
                        {item.title}
                      </h3>

                      {/* Subtitle / Pill Badge */}
                      <div className="mt-1.5 flex flex-col items-center gap-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 border border-gray-200/50">
                          <span className="text-xs font-bold text-gray-600">
                            {item.steps?.length || 0} {t.materi}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className={`text-xs font-extrabold ${
                            progressValue === 100
                              ? 'text-[#10B981]'
                              : progressValue >= 50
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                          }`}>
                            {progressValue}% Complete
                          </span>
                        </div>
                        {/* Tiny live progress bar */}
                        <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progressValue}%`,
                              background: progressValue === 100 ? '#10B981' : progressValue >= 50 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
