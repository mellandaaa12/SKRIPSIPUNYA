"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { Search, Folder, Loader, Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { getProjectsByClass } from "../utils/api";
import { supabase } from "../utils/supabase";

export default function DaftarProject() {
  const navigate = useNavigate();
  const { preferences } = useSettings();
  const { session, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  useEffect(() => {
    if (user?.classId) {
      void loadProjects();
    } else {
      setLoading(false);
      setProjects([]);
    }
  }, [user?.classId, session?.access_token]);

  useEffect(() => {
    if (!user?.classId) return;
    const cid = user.classId;
    const channel = supabase
      .channel(`murid-projects-${cid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter: `class_id=eq.${cid}` },
        () => {
          void loadProjects();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.classId]);

  const loadProjects = async () => {
    if (!user?.classId) return;

    setLoading(true);
    try {
      const { projects } = await getProjectsByClass(user.classId, session?.access_token);
      setProjects(projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const texts = {
    id: {
      title: "Project PJBL",
      subtitle: "Daftar project berbasis masalah untuk pembelajaran kolaboratif",
      search: "Cari project...",
      noProject: "Belum ada project",
      noResults: "Tidak ada hasil pencarian",
      sintaks: "Sintaks PJBL",
    },
    en: {
      title: "PJBL Projects",
      subtitle: "List of problem-based projects for collaborative learning",
      search: "Search projects...",
      noProject: "No projects yet",
      noResults: "No search results",
      sintaks: "PJBL Syntax",
    },
  };

  const t = texts[preferences.language];

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-12 h-12 text-[#0077B6] animate-spin" />
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
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#00B4D8]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#00B4D8]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
      </div>

      {/* Mobile: floating menu button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#90E0EF] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#0077B6] hover:bg-white transition-all duration-200 lg:hidden"
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
            className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2rem] border border-[#90E0EF]/30 bg-white/75 backdrop-blur-16 shadow-2xl"
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
            {/* Left - Project Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#0077B6]" />
              <span className="text-sm font-semibold text-[#0077B6]">{t.title}</span>
            </div>

            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <h1 className="text-3xl font-bold text-[#0077B6] mb-3">
                {t.title}
              </h1>
              <p className="text-base text-[#64748B]">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search}
                  className="w-full h-12 pl-12 pr-4 rounded-[2.5rem] bg-white/70 border border-[#90E0EF] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Folder className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                <p className="text-sm text-[#94A3B8]">
                  {searchQuery ? t.noResults : t.noProject}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/project/${item.id}`)}
                    className="flex items-center gap-4 p-6 rounded-[2.5rem] bg-white/70 border border-[#CAF0F8]/50 hover:bg-white/90 hover:border-[#0077B6] transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-[1.5rem] bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center flex-shrink-0">
                      <Folder className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base text-[#0077B6] mb-1">
                        {item.title}
                      </p>
                      <p className="text-sm text-[#64748B] line-clamp-2">
                        {item.description}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-2">
                        {item.sintaks?.length || 0} {t.sintaks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
