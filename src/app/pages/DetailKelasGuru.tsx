"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { Search, Plus, BookOpen, Users, AlertTriangle, Menu, LayoutDashboard, Activity as ActivityIcon, TrendingUp, ArrowLeft, Trash2 } from "lucide-react";
import { MacFolderVisual } from "../components/MacFolderVisual";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { classAPI, userAPI, progressAPI, pembelajaranAPI, formatClassDisplayName } from "../utils/api";
import { toast } from "sonner";
import { translateError } from "../utils/errorTranslator";

export default function DetailKelasGuru() {
  const navigate = useNavigate();
  const { kelasId } = useParams();
  const { preferences } = useSettings();
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<"materi" | "siswa">("materi");
  const [pembelajaranList, setPembelajaranList] = useState<any[]>([]);
  const [currentKelas, setCurrentKelas] = useState<any>(null);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-guru" },
    { id: "kelas", label: "Kelas", icon: ActivityIcon, path: "/dashboard-guru/kelas" },
    { id: "forum", label: "Forum Diskusi", icon: ActivityIcon, path: "/dashboard-guru/forum" },
  ];

  const fetchData = async () => {
    if (!kelasId || !user?.id || !session?.access_token) return;

    try {
      setLoading(true);

      // 1. Fetch class details from backend service (same source as admin)
      const classDetailRes = await classAPI.getDetails(kelasId, session.access_token);
      const kelas = classDetailRes?.classDetails;

      if (!kelas) {
        setAccessDenied(true);
        return;
      }

      // Access control
      const otherTeachers = Array.isArray(kelas.otherTeachers) ? kelas.otherTeachers : [];
      const isOtherTeacher = otherTeachers.some((t: any) => t?.id === user.id || t?.teacher_id === user.id);
      const isAuthorized = kelas.teacher_id === user.id || isOtherTeacher || user.role === 'admin';
      if (!isAuthorized) {
        setAccessDenied(true);
        return;
      }

      setCurrentKelas(kelas);

      // 2. Fetch students and progress in parallel, keep materials from class details
      const [studentsRes, progressRes] = await Promise.all([
        userAPI.getByRole("siswa"),
        progressAPI.getByClass(kelasId)
      ]);

      const students = studentsRes.users?.filter((u: any) => u.class_id === kelasId) || [];
      setSiswaList(students);

      const materials = Array.isArray(kelas.materials) ? kelas.materials : [];
      setPembelajaranList(materials);

      // Store progress as flat array for easier processing
      const progressList = progressRes.progress || [];

      // Group progress by student ID for the student view
      const progressByStudent: { [key: string]: any[] } = {};
      progressList.forEach((p: any) => {
        if (!progressByStudent[p.user_id]) progressByStudent[p.user_id] = [];
        progressByStudent[p.user_id].push(p);
      });
      setStudentProgress(progressByStudent);

    } catch (err: any) {
      console.error("❌ Error fetching class data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (materiId: string) => {
    if (!session?.access_token) return;

    const materi = pembelajaranList.find((p) => p.id === materiId);
    if (!materi || (materi.steps && materi.steps.length < 2)) {
      toast.error("Materi harus memiliki minimal 2 langkah untuk diterbitkan!");
      return;
    }

    try {
      setPublishing(materiId);
      await pembelajaranAPI.update(materiId, { status: "published" });
      setPembelajaranList(prev => prev.map(p => p.id === materiId ? { ...p, status: "published" } : p));
      toast.success("Materi berhasil diterbitkan");
    } catch (error: any) {
      console.error("Error publishing pembelajaran:", error);
      toast.error(translateError(error?.message || error) || "Terjadi kesalahan saat menerbitkan materi");
    } finally {
      setPublishing(null);
    }
  };

  const handleUnpublish = async (materiId: string) => {
    try {
      setPublishing(materiId);
      await pembelajaranAPI.update(materiId, { status: "draft" });
      setPembelajaranList(prev => prev.map(p => p.id === materiId ? { ...p, status: "draft" } : p));
      toast.success("Materi berhasil dibatalkan terbitnya");
    } catch (error: any) {
      console.error("Error unpublishing pembelajaran:", error);
      toast.error(translateError(error?.message || error) || "Terjadi kesalahan saat membatalkan terbitan materi");
    } finally {
      setPublishing(null);
    }
  };

  const handleDeleteMateri = async (materiId: string) => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      await pembelajaranAPI.delete(materiId, session.access_token);
      
      // Update state
      setPembelajaranList((prev) => prev.filter((p) => p.id !== materiId));
      toast.success(preferences.language === "en" ? "Material deleted successfully" : "Materi berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting pembelajaran:", error);
      toast.error(translateError(error?.message || error) || (preferences.language === "en" ? "Error deleting material" : "Terjadi kesalahan saat menghapus materi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!kelasId) return;

    // Setup realtime subscription for student profiles and progress
    const channel = supabase
      .channel(`detail-kelas-guru-sync-${kelasId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void fetchData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, () => {
        void fetchData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [kelasId, user?.id, session?.access_token]);

  // Calculate student data with progress from backend
  const studentData = siswaList.map((siswa) => {
    const progress = studentProgress[siswa.id] || [];
    const completedSteps = progress.length;
    const totalSteps = pembelajaranList.reduce((sum: number, p: any) => sum + (p.steps?.length || 0), 0);
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Calculate average score from quiz attempts
    const quizAttempts = progress.filter((p: any) => p.score !== null && p.score !== undefined);
    const averageScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum: number, a: any) => sum + a.score, 0) / quizAttempts.length)
      : 0;

    // Check if student needs attention (failed multiple quizzes)
    const failedQuizzes = quizAttempts.filter((a: any) => {
      // Get passing score from the pembelajaran step
      const pembelajaran = pembelajaranList.find((p: any) => p.id === a.pembelajaran_id);
      if (!pembelajaran) return false;
      const step = pembelajaran.steps?.find((s: any) => s.id === a.step_id);
      const passingScore = step?.content?.quiz?.nilaiMinimal || 75;
      return a.score < passingScore;
    });
    const needsAttention = progress.some((row: any) => (row.answers?.attempts || 0) >= 3 && (row.answers?.needs_help || row.score < 75)) || failedQuizzes.length >= 3;

    const isOnline = siswa.updated_at ? (new Date().getTime() - new Date(siswa.updated_at).getTime() < 60000) : false;

    let activityText = "Offline";
    let activityType: "online" | "mengerjakan" | "belum_mengerjakan" | "offline" = "offline";
    
    if (isOnline) {
      const statusStr = siswa.status || "Online";
      if (statusStr.includes("Membaca") || statusStr.includes("Mengerjakan") || statusStr.includes("Membuka Progressive")) {
        activityText = statusStr;
        activityType = "mengerjakan";
      } else {
        activityText = "Online";
        activityType = "belum_mengerjakan";
      }
    }

    return {
      ...siswa,
      name: siswa.name || siswa.email,
      avatar: siswa.avatar || null,
      avatarColor: siswa.avatar_color || '#0077B6',
      initials: (siswa.name || siswa.email)?.charAt(0).toUpperCase() || 'S',
      progressPercentage,
      averageScore,
      needsAttention,
      isOnline,
      activityText,
      activityType
    };
  });

  const texts = {
    id: {
      materi: "Materi",
      siswa: "Siswa",
      search: "Cari...",
      tambahPembelajaran: "Tambah Materi",
      materiCount: "materi pembelajaran tersedia",
      siswaCount: "siswa terdaftar",
      belumAdaMateri: "Belum ada materi pembelajaran",
      mulaiTambah: "Mulai tambahkan materi untuk kelas ini",
      kelas: "Kelas",
      detailKelas: "Detail Kelas",
    },
    en: {
      materi: "Materials",
      siswa: "Students",
      search: "Search...",
      tambahPembelajaran: "Add Material",
      materiCount: "learning materials available",
      siswaCount: "registered students",
      belumAdaMateri: "No learning materials yet",
      mulaiTambah: "Start adding materials for this class",
      kelas: "Class",
      detailKelas: "Class Details",
    },
  };

  const t = texts[preferences.language];

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
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#D4ECF0]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#D4ECF0]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#DCFCE7]/30 blur-3xl" />
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

      <SideBarGuru />

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Back Button Badge */}
            <button
              onClick={() => navigate("/dashboard-guru/kelas")}
              className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] hover:bg-[#0077B6] hover:border-[#0077B6] transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 text-[#0077B6] group-hover:text-white transition-colors" />
              <span className="text-sm font-bold text-[#0077B6] group-hover:text-white transition-colors">Daftar Kelas</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#0077B6] group-hover:bg-white transition-colors" />
            </button>

            <ProfileHeader />
          </div>

          {/* Header Detail Kelas */}
          <div className="mb-6 animate-slideIn">
            {loading ? (
              <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]" />
              </div>
            ) : accessDenied ? (
              <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex flex-col items-center justify-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h2>
                <p className="text-gray-600">Anda tidak memiliki akses ke kelas ini. Hubungi administrator.</p>
                <button
                  onClick={() => navigate("/dashboard-guru/kelas")}
                  className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-[2rem] bg-white border border-[#E2E8F0] shadow-sm hover:bg-[#0077B6] hover:border-[#0077B6] transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 text-[#0077B6] group-hover:text-white transition-colors" />
                  <span className="text-sm font-bold text-[#0077B6] group-hover:text-white transition-colors">Kembali ke Daftar Kelas</span>
                </button>
              </div>
            ) : currentKelas ? (
              <div className="relative overflow-hidden rounded-[32px] border border-white/90 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
                <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="p-7 md:p-9">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#BFE6F3] bg-[#EAF8FC] px-3 py-1 text-xs font-black text-[#0077B6]">
                        {currentKelas.grade || "Kelas"} • {currentKelas.subject || "Mapel"}
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        Kelas dibuat admin
                      </span>
                    </div>
                    <h1 className="max-w-3xl text-3xl font-black leading-tight text-[#12324A] md:text-4xl">
                      {currentKelas.displayName || formatClassDisplayName(currentKelas)}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                      Kelola materi pembelajaran dan pantau siswa dari satu tempat.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[#D9EEF6] bg-[#F3FBFD] p-4">
                        <p className="text-[11px] font-black uppercase text-[#0077B6]">Wali Kelas</p>
                        <p className="mt-1 line-clamp-1 text-sm font-bold text-[#12324A]">{currentKelas.teacher_name || currentKelas.teacherName || "Belum ditugaskan"}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-[11px] font-black uppercase text-emerald-700">Siswa</p>
                        <p className="mt-1 text-sm font-bold text-[#12324A]">{siswaList.length || 0} Terdaftar</p>
                      </div>
                      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                        <p className="text-[11px] font-black uppercase text-violet-700">Materi</p>
                        <p className="mt-1 text-sm font-bold text-[#12324A]">{pembelajaranList.length || 0} Modul</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative min-h-[220px] overflow-hidden bg-gradient-to-br from-[#D9ECFF] via-[#DDF8D2] to-[#FFF5C8]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(255,255,255,0.82),transparent_40%)]" />
                    {currentKelas.image_url || currentKelas.imageUrl || currentKelas.cover_image_url ? (
                      <img
                        src={currentKelas.image_url || currentKelas.imageUrl || currentKelas.cover_image_url}
                        alt={currentKelas.displayName || formatClassDisplayName(currentKelas)}
                        className="relative z-10 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="relative z-10 flex h-full items-center justify-center p-8">
                        <img
                          src={`https://api.dicebear.com/9.x/icons/svg?seed=${encodeURIComponent(currentKelas.subject || currentKelas.name || "kelas")}&backgroundColor=transparent`}
                          className="h-36 w-36 drop-shadow-sm"
                          alt=""
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
                <h1 className="text-3xl font-bold text-[#56B6C6] mb-3">Kelas Tidak Ditemukan</h1>
                <p className="text-base text-[#64748B]">Silakan kembali ke daftar kelas</p>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 animate-scaleIn">
            <button
              onClick={() => setActiveTab("materi")}
              className={`px-6 py-3 rounded-[1.5rem] flex items-center justify-center gap-2 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "materi"
                ? "bg-gradient-to-r from-[#56B6C6] to-[#3E8A96] text-white shadow-[0_8px_24px_-4px_rgba(86,182,198,0.2)]"
                : "bg-white/85 text-[#64748B] hover:bg-white border border-white/95 shadow-sm"
                }`}
            >
              <BookOpen className="w-5 h-5" />
              Materi Pembelajaran
            </button>
            <button
              onClick={() => setActiveTab("siswa")}
              className={`px-6 py-3 rounded-[1.5rem] flex items-center justify-center gap-2 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "siswa"
                ? "bg-gradient-to-r from-[#56B6C6] to-[#3E8A96] text-white shadow-[0_8px_24px_-4px_rgba(86,182,198,0.2)]"
                : "bg-white/85 text-[#64748B] hover:bg-white border border-white/95 shadow-sm"
                }`}
            >
              <Users className="w-5 h-5" />
              Daftar Siswa
            </button>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn">
            {/* Search Bar and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={t.search}
                  className="w-full h-12 pl-12 pr-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                />
              </div>
              {activeTab === "materi" && (
                <button
                  onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/buat`)}
                  className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#34D399] text-white rounded-[2.5rem] flex items-center gap-2 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.3)] transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-semibold">{t.tambahPembelajaran}</span>
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "materi" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                  {pembelajaranList.length > 0 ? (
                    pembelajaranList.map((materi, idx) => {
                      const materiTitle = materi.judul || materi.title || "Materi Tanpa Judul";
                      const stepCount = materi.steps?.length || 0;
                      const deskripsi = materi.deskripsi || materi.description || "Tidak ada deskripsi";

                      return (
                        <div
                          key={materi.id}
                          onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materi.id}`)}
                          className="flex flex-col items-center"
                        >
                          <MacFolderVisual
                            title={materiTitle}
                            badge={`${stepCount} Langkah`}
                            status={materi.status === "published" ? "published" : "draft"}
                            themeIndex={idx}
                            imageUrl={materi.image_url || materi.imageUrl || undefined}
                            className="w-full"
                          >
                            <div className="flex items-center gap-2 mt-2">
                              {materi.steps && materi.steps.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (materi.status === "draft") {
                                      handlePublish(materi.id);
                                    } else {
                                      handleUnpublish(materi.id);
                                    }
                                  }}
                                  disabled={publishing === materi.id}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95 animate-fadeIn"
                                  style={{
                                    background: materi.status === "draft" ? "#0077B6" : "#fff",
                                    border: materi.status === "draft" ? "1.5px solid #0077B6" : "1.5px solid #E2E8F0",
                                    color: materi.status === "draft" ? "#fff" : "#0077B6",
                                  }}
                                >
                                  {publishing === materi.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                                      <span>...</span>
                                    </>
                                  ) : materi.status === "draft" ? (
                                    <>
                                      <TrendingUp className="w-3 h-3" />
                                      <span>Terbitkan</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className="w-3 h-3" />
                                      <span>Batalkan Terbit</span>
                                    </>
                                  )}
                                </button>
                              )}
                              
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm("Apakah Anda yakin ingin menghapus materi ini beserta seluruh langkah pembelajarannya?")) {
                                    await handleDeleteMateri(materi.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 animate-fadeIn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </MacFolderVisual>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-[#CBD5E1]" />
                      </div>
                      <p className="text-sm font-semibold text-[#94A3B8]">{t.belumAdaMateri}</p>
                      <p className="text-xs text-[#CBD5E1]">{t.mulaiTambah}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "siswa" && (
                <div className="flex flex-col gap-4">
                  {/* Search Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-lg text-[#0077B6]">
                      Daftar Siswa
                    </h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="text"
                        placeholder="Cari siswa..."
                        className="pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#56B6C6] w-64"
                      />
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="space-y-3 mt-4">
                    {studentData.map((siswa) => (
                      <div
                        key={siswa.id}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0]/80 hover:border-[#00B4D8]/50 hover:shadow-[0_8px_24px_-4px_rgba(0,119,182,0.12)] transition-all duration-300"
                      >
                        {/* Dynamic Avatar */}
                        <div className="relative flex-shrink-0">
                          <div 
                            className="w-14 h-14 rounded-full p-0.5 shadow-sm group-hover:shadow-md transition-all flex items-center justify-center overflow-hidden"
                            style={{ 
                              background: siswa.avatar ? 'linear-gradient(to bottom right, #D4ECF0, #90E0EF)' : 'transparent'
                            }}
                          >
                            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                              {siswa.avatar ? (
                                <img 
                                  src={siswa.avatar} 
                                  alt={siswa.name} 
                                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center text-white text-lg font-bold font-['Poppins'] shadow-inner"
                                  style={{ backgroundColor: siswa.avatarColor }}
                                >
                                  {siswa.initials}
                                </div>
                              )}
                            </div>
                          </div>
                          {siswa.isOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm z-10"></div>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-[15px] text-[#0077B6] group-hover:text-[#0096C7] transition-colors">
                              {siswa.name}
                            </h3>
                            {/* Premium Real-time Activity Badges */}
                            {siswa.activityType === "mengerjakan" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0077B6] border border-blue-200 shadow-sm animate-pulse">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B4D8]"></span>
                                </span>
                                ✍️ {siswa.activityText}
                              </span>
                            )}
                            {siswa.activityType === "belum_mengerjakan" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                🟢 {siswa.activityText} (Belum Mengerjakan)
                              </span>
                            )}
                            {siswa.activityType === "offline" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                ⚫ {siswa.activityText}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#64748B] flex items-center gap-1.5 mt-0.5">
                            {siswa.email}
                          </p>
                        </div>
                        
                        {/* Quick Stats Summary */}
                        <div className="hidden sm:flex items-center gap-4 mr-2">
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Progress</p>
                            <p className="text-sm font-semibold text-[#0077B6]">{siswa.progressPercentage}%</p>
                          </div>
                          <div className="w-[1px] h-8 bg-[#E2E8F0]"></div>
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Skor Rata²</p>
                            <p className={`text-sm font-semibold ${siswa.averageScore >= 75 ? 'text-emerald-600' : siswa.averageScore > 0 ? 'text-amber-500' : 'text-[#64748B]'}`}>
                              {siswa.averageScore || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
