"use client";

import { useState, useEffect } from "react";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { Users, BookOpen, FileText, AlertCircle, Sparkles, Menu, LogOut, LayoutDashboard, GraduationCap, Activity as ActivityIcon, MessageSquare, Calendar, Plus, Trash2, Clock, X } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { classAPI, scheduleAPI } from "../utils/api";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { supabase } from "../utils/supabase";
import { customPopup } from "../context/PopupContext";

interface Kelas {
  id: string;
  name: string;
  subject: string;
  grade: string;
}

export default function DashboardGuru() {
  const { preferences } = useSettings();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    day: "Senin",
    start_time: "07:00",
    end_time: "08:30",
    subject: "",
    class_name: ""
  });
  const [studentsNeedingHelp, setStudentsNeedingHelp] = useState<any[]>([]);
  const [loadingHelpAlerts, setLoadingHelpAlerts] = useState(false);
  const [studentActivities, setStudentActivities] = useState<any[]>([]);
  const [loadingStudentActivities, setLoadingStudentActivities] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-guru" },
    { id: "kelas", label: "Kelas", icon: BookOpen, path: "/dashboard-guru/kelas" },
    { id: "forum", label: "Forum Diskusi", icon: ActivityIcon, path: "/dashboard-guru/forum" },
  ];

  const fetchGuruKelas = async () => {
    if (!session?.access_token || !user?.id) return;

    try {
      setLoading(true);
      const response = await classAPI.getAll(session.access_token);
      // Filter kelas berdasarkan teacher_id yang sesuai dengan user yang login
      // atau jika guru tersebut adalah guru pengampu di kelas tersebut (ada di otherTeacherIds)
      const guruKelas = response.kelas?.filter((kelas: any) => {
        const wali = kelas.teacher_id === user.id || kelas.teacherId === user.id;
        const pengampu = Array.isArray(kelas.otherTeacherIds) && kelas.otherTeacherIds.includes(user.id);
        return wali || pengampu;
      }) || [];
      setKelasList(guruKelas);
    } catch (error: any) {
      console.error("Error fetching guru kelas:", error);
      setKelasList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (!session?.access_token || !user?.id) return;
    try {
      setLoadingSchedules(true);
      const res = await scheduleAPI.getTeacherSchedules(user.id, session.access_token);
      setSchedules(res.schedules || []);
    } catch (error) {
      console.error("Error fetching schedules", error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchStudentsNeedingHelp = async () => {
    if (!session?.access_token || !user?.id || kelasList.length === 0) return;
    try {
      setLoadingHelpAlerts(true);
      
      const classIds = kelasList.map((k: any) => k.id);
      
      // 1. Fetch student profiles in the classes taught by the teacher
      const { data: students } = await supabase
        .from("profiles")
        .select("id,name,email,class_id")
        .eq("role", "siswa")
        .in("class_id", classIds);

      const studentIds = (students || []).map((s: any) => s.id);
      if (studentIds.length === 0) {
        setStudentsNeedingHelp([]);
        return;
      }

      // 2. Fetch progress data for these student IDs
      const { data: progressRows } = await supabase
        .from('progress')
        .select('id,user_id,pembelajaran_id,step_id,updated_at,score,answers,completed')
        .in('user_id', studentIds);

      const studentById = new Map((students || []).map((s: any) => [s.id, s]));
      const studentsInNeedMap = new Map();

      (progressRows || []).forEach((p: any) => {
        const student = studentById.get(p.user_id);
        if (student) {
          const attempts = Number(p.answers?.attempts || 0);
          const needsHelp = p.answers?.needs_help === true;
          const lowScore = typeof p.score === 'number' && p.score < 60;

          if (needsHelp || attempts >= 3 || lowScore) {
            // Keep the most recent record for each user, or just count unique users
            studentsInNeedMap.set(p.user_id, {
              ...p,
              profiles: student,
              reason: needsHelp ? 'Butuh Bantuan' : attempts >= 3 ? '3x Gagal' : 'Nilai Rendah'
            });
          }
        }
      });
      
      setStudentsNeedingHelp(Array.from(studentsInNeedMap.values()));
    } catch (error) {
      console.error("Error fetching students needing help:", error);
    } finally {
      setLoadingHelpAlerts(false);
    }
  };

  const fetchStudentActivities = async () => {
    if (!session?.access_token || !user?.id || kelasList.length === 0) {
      setStudentActivities([]);
      return;
    }
    try {
      setLoadingStudentActivities(true);
      const classIds = kelasList.map((k: any) => k.id);
      const { data: students } = await supabase
        .from("profiles")
        .select("id,name,email,class_id,updated_at")
        .eq("role", "siswa")
        .in("class_id", classIds);
      const studentIds = (students || []).map((s: any) => s.id);
      if (studentIds.length === 0) {
        setStudentActivities([]);
        return;
      }
      const [{ data: progressRows }, { data: pembelajaranRows }] = await Promise.all([
        supabase
          .from("progress")
          .select("id,user_id,pembelajaran_id,step_id,updated_at,score,answers,completed")
          .in("user_id", studentIds)
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("pembelajaran")
          .select("id,judul,title,class_id,steps")
          .in("class_id", classIds),
      ]);

      const studentById = new Map((students || []).map((s: any) => [s.id, s]));
      const pembelajaranById = new Map((pembelajaranRows || []).map((m: any) => [m.id, m]));
      
      const now = new Date().getTime();
      const checkOnline = (updatedAt: string | undefined | null) => {
        if (!updatedAt) return false;
        return (now - new Date(updatedAt).getTime()) < 60000;
      };

      const normalized = (progressRows || []).map((r: any) => {
        const siswa = studentById.get(r.user_id);
        const materi = pembelajaranById.get(r.pembelajaran_id);
        const step = materi?.steps?.find((s: any) => s.id === r.step_id);
        const stepName = step?.judul || step?.title || `Step ${materi?.steps?.findIndex((s: any) => s.id === r.step_id) + 1 || 1}`;
        const attempts = Number(r.answers?.attempts || 0);
        const needsHelp = r.answers?.needs_help === true || attempts >= 3;
        return {
          id: r.id,
          studentName: siswa?.name || "Siswa",
          studentEmail: siswa?.email || "",
          classId: siswa?.class_id || "",
          materiTitle: materi?.judul || materi?.title || "Pembelajaran",
          stepId: r.step_id,
          stepName: stepName,
          attempts,
          score: typeof r.score === "number" ? r.score : null,
          completed: r.completed === true,
          needsHelp,
          updatedAt: r.updated_at || new Date().toISOString(),
          isOnline: checkOnline(siswa?.updated_at),
        };
      });
      setStudentActivities(normalized.slice(0, 150));
    } catch (error) {
      console.error("Error fetching student activities:", error);
      setStudentActivities([]);
    } finally {
      setLoadingStudentActivities(false);
    }
  };

  useEffect(() => {
    fetchGuruKelas();
    fetchSchedules();
  }, [session]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`guru-kelas-live-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => {
        void fetchGuruKelas();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "class_subjects" }, () => {
        void fetchGuruKelas();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (kelasList.length > 0) {
      fetchStudentsNeedingHelp();
      fetchStudentActivities();
    }
  }, [kelasList]);

  useEffect(() => {
    if (!user?.id || kelasList.length === 0) return;
    const channel = supabase
      .channel(`guru-student-activity-live-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, () => {
        void fetchStudentActivities();
        void fetchStudentsNeedingHelp();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void fetchStudentActivities();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pembelajaran" }, () => {
        void fetchStudentActivities();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, kelasList.map((k) => k.id).join(",")]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token || !user?.id) return;
    try {
      setSavingSchedule(true);
      await scheduleAPI.addTeacherSchedule(user.id, scheduleFormData, session.access_token);
      setShowScheduleModal(false);
      toast.success("Jadwal berhasil ditambahkan!");
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan jadwal");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!session?.access_token) return;
    const isConfirmed = await customPopup.confirm("Hapus jadwal ini?", 'warning');
    if (isConfirmed) {
      try {
        await scheduleAPI.deleteTeacherSchedule(id, session.access_token);
        toast.success("Jadwal dihapus!");
        fetchSchedules();
      } catch (error) {
        toast.error("Gagal menghapus");
      }
    }
  };

  const texts = {
    id: {
      title: "Dashboard Guru",
      subtitle: "Kelola pembelajaran, materi, dan pantau progres siswa",
      totalSiswa: "Total Siswa",
      kelasDiampu: "Kelas Diampu",
      tugasPending: "Tugas Pending",
      belumDinilai: "Belum Dinilai",
      performaTitle: "Kelas yang Diampu",
      submisiTitle: "Submisi Terbaru",
      lihatDetail: "Lihat Detail",
      lihatSemua: "Lihat Semua",
      noKelas: "Belum ada kelas yang diampu",
      noSubmisi: "Belum ada submisi",
    },
    en: {
      title: "Teacher Dashboard",
      subtitle: "Manage learning, materials, and monitor student progress",
      totalSiswa: "Total Students",
      kelasDiampu: "Classes Taught",
      tugasPending: "Pending Tasks",
      belumDinilai: "Ungraded",
      performaTitle: "Classes Taught",
      submisiTitle: "Recent Submissions",
      lihatDetail: "View Details",
      lihatSemua: "View All",
      noKelas: "No classes taught yet",
      noSubmisi: "No submissions yet",
    },
  };

  const t = texts[preferences.language];
  
  const totalSiswa = kelasList.reduce((sum: number, kelas: any) => sum + (kelas.studentCount || 0), 0);

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
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#90E0EF]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#90E0EF]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#CAF0F8]/30 blur-3xl" />
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
            {/* Left - Dashboard Guru Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#0077B6]" />
              <span className="text-sm font-semibold text-[#0077B6]">Dashboard Guru</span>
            </div>

            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[3rem] p-10 shadow-lg flex items-center justify-between">
              <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t.title}
              </h1>
              <p className="text-blue-100 text-sm">
                {t.subtitle}
              </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-scaleIn">
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-[1.5rem] bg-[#C8B6E2] flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#4A3B69]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0077B6] mb-1">{totalSiswa}</p>
              <p className="text-sm text-[#64748B]">{t.totalSiswa}</p>
            </div>

            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-[1.5rem] bg-[#B8E8C8] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#2B593F]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0077B6] mb-1">{kelasList.length}</p>
              <p className="text-sm text-[#64748B]">{t.kelasDiampu}</p>
            </div>

            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-[1.5rem] bg-[#FFE4B5] flex items-center justify-center">
                  <ActivityIcon className="w-6 h-6 text-[#8A6327]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0077B6] mb-1">{new Set(kelasList.map((k: any) => k.subject)).size}</p>
              <p className="text-sm text-[#64748B]">Mata Pelajaran</p>
            </div>

            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-[1.5rem] bg-[#FFB3C1] flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#8A2B3D]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0077B6] mb-1">{studentsNeedingHelp.length}</p>
              <p className="text-sm text-[#64748B]">Siswa Butuh Bantuan</p>
            </div>
          </div>


          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kelas yang Diampu */}
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-slideIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-[#0077B6]">
                  {t.performaTitle}
                </h2>
                <div className="text-sm text-[#64748B]">
                  {kelasList.length} kelas
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]" />
                  </div>
                ) : kelasList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                    <p className="text-sm text-[#94A3B8]">
                      {t.noKelas}
                    </p>
                  </div>
                ) : (
                  kelasList.map((kelas) => (
                    <div
                      key={kelas.id}
                      onClick={() => navigate(`/dashboard-guru/kelas/${kelas.id}`)}
                      className="flex items-center justify-between p-5 rounded-[2rem] bg-white/70 border border-[#E2E8F0]/50 hover:bg-[#F8FAFC] hover:border-[#628ECB]/50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0077B6] to-[#0077B6] flex items-center justify-center flex-shrink-0 shadow-sm">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0077B6] mb-1">
                            {kelas.grade} {kelas.subject} {kelas.name}
                          </p>
                          <div className="px-3 py-1 rounded-full bg-[#F1F5F9] inline-block">
                            <p className="text-xs font-semibold text-[#64748B]">
                              Tingkat {kelas.grade || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Jadwal Mengajar */}
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-slideIn delay-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-[#395886] flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-[#0077B6]" />
                  Jadwal Mengajar
                </h2>
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#0077B6] to-[#0077B6] text-white text-sm font-bold rounded-xl shadow hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                {loadingSchedules ? (
                   <div className="flex items-center justify-center py-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]" />
                   </div>
                ) : schedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 h-full">
                    <Calendar className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                    <p className="text-sm font-semibold text-[#64748B]">Belum ada jadwal mengajar.</p>
                  </div>
                ) : (
                  ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(day => {
                    const daySchedules = schedules.filter(s => s.day === day);
                    if (daySchedules.length === 0) return null;
                    return (
                      <div key={day} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl overflow-hidden mb-4">
                        <div className="bg-[#90E0EF] border-b border-[#00B4D8] px-4 py-2">
                           <h4 className="font-bold text-[#0077B6] text-sm">{day}</h4>
                        </div>
                        <div className="divide-y divide-[#E2E8F0]">
                          {daySchedules.map(schedule => (
                            <div key={schedule.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                               <div className="flex items-start gap-3">
                                  <div className="bg-[#F0F9FF] text-[#0284C7] p-2 rounded-lg font-bold text-xs mt-1 border border-[#D4ECF0]">
                                    {schedule.start_time} - {schedule.end_time}
                                  </div>
                                  <div>
                                     <p className="font-bold text-[#395886]">{schedule.class_name}</p>
                                     <p className="text-sm text-[#64748B] flex items-center gap-1 mt-0.5">
                                       <BookOpen className="w-3.5 h-3.5" /> {schedule.subject}
                                     </p>
                                  </div>
                               </div>
                               <button onClick={() => handleDeleteSchedule(schedule.id)} className="text-[#EF4444] hover:bg-[#FEE2E2] p-2 rounded-lg transition">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-slideIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl text-[#0077B6]">Aktivitas Siswa Realtime</h2>
              <div className="text-sm text-[#64748B]">{studentActivities.length} aktivitas</div>
            </div>
            {loadingStudentActivities ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]" />
              </div>
            ) : studentActivities.length === 0 ? (
              <div className="text-sm text-[#94A3B8]">Belum ada aktivitas siswa dari kelas yang Anda ajar.</div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
                {studentActivities.map((act: any) => (
                  <div key={act.id} className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white/70 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#0077B6]">{act.studentName}</p>
                        {act.isOnline ? (
                          <div className="h-2 w-2 rounded-full bg-[#4ADE80]" title="Online" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-[#94A3B8]" title="Offline" />
                        )}
                      </div>
                      <p className="text-xs text-[#64748B]">
                        {act.materiTitle} · {act.stepName} · Percobaan {act.attempts}
                        {typeof act.score === "number" ? ` · Nilai ${act.score}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${act.needsHelp ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#DCFCE7] text-[#15803D]"}`}>
                        {act.needsHelp ? "Butuh perhatian" : act.completed ? "Selesai" : "Sedang belajar"}
                      </span>
                      <p className="text-[10px] text-[#94A3B8] mt-1">
                        {new Date(act.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)}>
              <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowScheduleModal(false)} className="absolute top-6 right-6 text-[#94A3B8] hover:text-[#0077B6] transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-[#0077B6] mb-6">Tambah Jadwal Mengajar</h2>
                
                <form onSubmit={handleAddSchedule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0077B6] mb-1.5">Hari</label>
                    <select 
                      value={scheduleFormData.day} 
                      onChange={e => setScheduleFormData({...scheduleFormData, day: e.target.value})} 
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none text-[#0077B6] font-medium"
                    >
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0077B6] mb-1.5">Mulai</label>
                      <input 
                        type="time" required 
                        value={scheduleFormData.start_time} 
                        onChange={e => setScheduleFormData({...scheduleFormData, start_time: e.target.value})} 
                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none text-[#0077B6] font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0077B6] mb-1.5">Selesai</label>
                      <input 
                        type="time" required 
                        value={scheduleFormData.end_time} 
                        onChange={e => setScheduleFormData({...scheduleFormData, end_time: e.target.value})} 
                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none text-[#0077B6] font-medium" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0077B6] mb-1.5">Kelas</label>
                    <input 
                      type="text" required placeholder="Contoh: XII RPL 1" 
                      value={scheduleFormData.class_name} 
                      onChange={e => setScheduleFormData({...scheduleFormData, class_name: e.target.value})} 
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none text-[#0077B6] font-medium placeholder:text-[#94A3B8]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0077B6] mb-1.5">Mata Pelajaran</label>
                    <input 
                      type="text" required placeholder="Contoh: Pemrograman Web" 
                      value={scheduleFormData.subject} 
                      onChange={e => setScheduleFormData({...scheduleFormData, subject: e.target.value})} 
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none text-[#0077B6] font-medium placeholder:text-[#94A3B8]" 
                    />
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 bg-white border border-[rgba(0,180,216,0.2)] text-[#64748B] px-4 py-3 rounded-xl font-bold hover:bg-white hover:border-[rgba(0,180,216,0.4)] transition-colors">
                      Batal
                    </button>
                    <button type="submit" disabled={savingSchedule} className="flex-1 bg-[#0077B6] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#0077B6] transition-colors disabled:opacity-50">
                      {savingSchedule ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
