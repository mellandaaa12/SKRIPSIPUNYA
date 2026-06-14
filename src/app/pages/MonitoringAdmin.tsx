"use client";

import { useState, useEffect } from "react";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { Search, Users, User, UserCheck, Activity, AlertCircle, BarChart3, BookOpen, 
  TrendingUp, RefreshCw, FileText, Upload, Target,
  Plus, ChevronRight, Sparkles, LayoutDashboard, LogOut, Menu, X, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ProfileHeader } from "../components/ProfileHeader";
import { formatClassDisplayName, getMonitoringData } from "../utils/api";
import { supabase } from "../utils/supabase";
import { buildSegmentsForStudentClass } from "../utils/learningProgress";
import { LearningStepProgressBar, type StepSegment } from "../components/LearningStepProgressBar";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface MonitoringData {
  summary: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeToday: number;
    newUsersThisWeek: number;
    totalSiswaAktif: number;
    totalSiswaButuhPerhatian: number;
    totalMateriDanTugasGuru: number;
  };
  recentActivities: Array<{
    id: string;
    type: 'student' | 'teacher';
    name: string;
    email: string;
    role: string;
    status: string;
    lastLogin: string;
    className: string | null;
  }>;
  classOverview: Array<{
    id: string;
    name: string;
    subject: string;
    studentCount: number;
    teacherCount: number;
    materialCount: number;
    projectCount: number;
  }>;
  studentProgress: Array<{
    id: string;
    studentName: string;
    studentEmail: string;
    className: string;
    classId: string | null;
    projectProgress: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    lastActivity: string;
    status: 'active' | 'behind' | 'inactive';
    stepSegments?: StepSegment[];
  }>;
  teacherActivities: Array<{
    id: string;
    teacherName: string;
    teacherEmail: string;
    className: string;
    materialsUploaded: number;
    assignmentsCreated: number;
    lastUpload: string;
    status: 'active' | 'inactive';
  }>;
  recentTeacherActivities: Array<{
    id: string;
    type: 'materi' | 'tugas';
    createdAt: string;
    teacherName: string;
    className: string;
    title: string;
  }>;
}

export default function MonitoringAdmin() {
  const { session, signOut } = useAuth();
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'students' | 'teachers' | 'classes'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'classes'>('overview');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setRefreshing(true);
      const response = await getMonitoringData(token);
      
      // Transform API response ke struktur MonitoringData
      const users: any[] = response.users || [];
      const classes: any[] = response.classes || [];
      const guru = users.filter((u: any) => u.role === 'guru');
      const siswa = users.filter((u: any) => u.role === 'siswa');
      const classLabelById: Record<string, string> = response.classLabelById || {};
      const teacherClassNames: Record<string, string> = response.teacherClassNames || {};
      const materialsByTeacher: Record<string, number> = response.materialsByTeacher || {};
      const projectsByTeacher: Record<string, number> = response.projectsByTeacher || {};
      const recentTeacherActivities = response.recentTeacherActivities || [];

      // Get recentActivities directly from dynamically populated and sorted API response
      const recentActivities = response.recentActivities || [];

      // Build classOverview dari classes nyata
      const classOverview = classes.map((c: any) => ({
        id: c.id,
        name: c.displayName || formatClassDisplayName(c),
        subject: c.subject || '',
        studentCount: c.studentCount ?? 0,
        teacherCount: c.teacherCount ?? 0,
        materialCount: c.materialCount ?? 0,
        projectCount: c.projectCount ?? 0,
      }));

      const classIds = [...new Set(siswa.map((u: any) => u.class_id).filter(Boolean))];
      const siswaIds = siswa.map((u: any) => u.id);
      const pbByClass: Record<string, Array<{ id: string; judul?: string; title?: string; steps?: any[] }>> = {};
      let allProgressRows: any[] = [];

      if (classIds.length) {
        const { data: pbList } = await supabase
          .from("pembelajaran")
          .select("id,class_id,judul,title,steps,status")
          .in("class_id", classIds);
        for (const row of pbList || []) {
          if (row.status != null && row.status !== "published") continue;
          if (!pbByClass[row.class_id]) pbByClass[row.class_id] = [];
          pbByClass[row.class_id].push({
            id: row.id,
            judul: row.judul || row.title,
            title: row.title,
            steps: row.steps || [],
          });
        }
      }
      if (siswaIds.length) {
        const { data: pr } = await supabase.from("progress").select("*").in("user_id", siswaIds);
        allProgressRows = pr || [];
      }

      const enrichedData: MonitoringData = {
        summary: {
          totalUsers: response.totalUsers || users.length,
          totalStudents: response.totalSiswa || siswa.length,
          totalTeachers: response.totalGuru || guru.length,
          totalClasses: response.totalKelas || classes.length,
          activeToday: users.filter((u: any) => u.isOnline).length,
          newUsersThisWeek: users.filter((u: any) => {
            const created = new Date(u.created_at);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return created > weekAgo;
          }).length,
          totalSiswaAktif: response.totalSiswaAktif || 0,
          totalSiswaButuhPerhatian: response.totalSiswaButuhPerhatian || 0,
          totalMateriDanTugasGuru: (response.totalPembelajaran || 0) + (response.totalProjects || 0),
        },
        recentActivities,
        classOverview,
        studentProgress: siswa.map((u: any, idx: number) => {
          const pbs = u.class_id ? pbByClass[u.class_id] || [] : [];
          const segments = buildSegmentsForStudentClass(u.id, pbs, allProgressRows);
          const completed = allProgressRows.filter((r) => r.user_id === u.id && r.completed).length;
          const total = Math.max(1, segments.length);
          const needsAttention = segments.some((s) => s.needsAttention);

          return {
            id: u.id || String(idx),
            studentName: u.name,
            studentEmail: u.email,
            className: (u.class_id && classLabelById[u.class_id]) || u.className || u.class_name || "Belum ada kelas",
            classId: u.class_id || null,
            projectProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
            assignmentsCompleted: completed,
            assignmentsTotal: total,
            lastActivity: (() => {
              const studentProgressRows = allProgressRows.filter((r) => r.user_id === u.id);
              if (studentProgressRows.length > 0) {
                const latestTime = Math.max(
                  ...studentProgressRows.map((r) => new Date(r.updated_at || r.created_at).getTime())
                );
                return new Date(latestTime).toISOString();
              }
              return u.updated_at || u.created_at || new Date().toISOString();
            })(),
            status: (needsAttention ? "behind" : "active") as "active" | "behind",
            stepSegments: segments,
          };
        }),
        teacherActivities: guru.map((u: any, idx: number) => ({
          id: u.id || String(idx),
          teacherName: u.name,
          teacherEmail: u.email,
          className: teacherClassNames[u.id] || u.className || u.class_name || 'Belum ada kelas',
          materialsUploaded: materialsByTeacher[u.id] ?? 0,
          assignmentsCreated: projectsByTeacher[u.id] ?? 0,
          lastUpload:
            recentTeacherActivities.find((a: any) => a.teacherId === u.id)?.createdAt ||
            u.updated_at ||
            u.created_at ||
            new Date().toISOString(),
          status: (u.isOnline ? 'active' : 'inactive') as 'active' | 'inactive',
        })),
        recentTeacherActivities: recentTeacherActivities.map((a: any) => ({
          id: a.id,
          type: a.type,
          createdAt: a.createdAt,
          teacherName: a.teacherName,
          className: a.className,
          title: a.title,
        })),
      };
      
      setMonitoringData(enrichedData);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [session]);

  useEffect(() => {
    const token = session?.access_token || localStorage.getItem("access_token");
    if (!token) return;
    const channel = supabase
      .channel("admin-monitoring-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void fetchMonitoringData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => {
        void fetchMonitoringData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "class_subjects" }, () => {
        void fetchMonitoringData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pembelajaran" }, () => {
        void fetchMonitoringData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, () => {
        void fetchMonitoringData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "class_schedules" }, () => {
        void fetchMonitoringData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_schedules" }, () => {
        void fetchMonitoringData();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.access_token]);

  const filteredData = () => {
    const emptyResult = { 
      summary: { totalUsers: 0, totalStudents: 0, totalTeachers: 0, totalClasses: 0, activeToday: 0, newUsersThisWeek: 0, totalSiswaAktif: 0, totalSiswaButuhPerhatian: 0, totalMateriDanTugasGuru: 0 }, 
      recentActivities: [], 
      classOverview: [], 
      studentProgress: [], 
      teacherActivities: [],
      recentTeacherActivities: [],
    };
    if (!monitoringData) return emptyResult;
    
    const searchLower = searchQuery.toLowerCase();
    
    return {
      summary: monitoringData.summary || emptyResult.summary,
      recentActivities: (monitoringData.recentActivities || []).filter(activity => {
        const matchesSearch = activity.name?.toLowerCase().includes(searchLower) ||
                             activity.email?.toLowerCase().includes(searchLower);
        const matchesFilter = filterType === 'all' || 
                             (filterType === 'students' && activity.type === 'student') ||
                             (filterType === 'teachers' && activity.type === 'teacher');
        return matchesSearch && matchesFilter;
      }),
      classOverview: (monitoringData.classOverview || []).filter(cls => 
        cls.name?.toLowerCase().includes(searchLower) || 
        cls.subject?.toLowerCase().includes(searchLower)
      ),
      studentProgress: (monitoringData.studentProgress || []).filter(student =>
        student.studentName?.toLowerCase().includes(searchLower) ||
        student.className?.toLowerCase().includes(searchLower)
      ),
      teacherActivities: (monitoringData.teacherActivities || []).filter(teacher =>
        teacher.teacherName?.toLowerCase().includes(searchLower) ||
        teacher.className?.toLowerCase().includes(searchLower)
      ),
      recentTeacherActivities: (monitoringData.recentTeacherActivities || []).filter((item) =>
        item.teacherName?.toLowerCase().includes(searchLower) ||
        item.className?.toLowerCase().includes(searchLower) ||
        item.title?.toLowerCase().includes(searchLower)
      ),
    };
  };

  const currentData = filteredData();

  const texts = {
    id: {
      title: "Monitoring Sistem",
      subtitle: "Pantau aktivitas, progress, dan kinerja siswa serta guru secara real-time",
      overview: "Ringkasan",
      students: "Siswa",
      teachers: "Guru", 
      classes: "Kelas",
      totalUsers: "Total Pengguna",
      activeToday: "Aktif Hari Ini",
      newUsers: "Pengguna Baru (Minggu Ini)",
      recentActivity: "Aktivitas Terkini",
      searchPlaceholder: "Cari nama, email, atau kelas...",
      allActivities: "Semua Aktivitas",
      refresh: "Refresh",
      activities: "aktivitas",
      noActivities: "Tidak ada aktivitas terkini",
      noSearchResults: "Tidak ada aktivitas yang cocok dengan pencarian",
      studentProgress: "Progress Siswa",
      teacherActivities: "Aktivitas Guru",
      projectProgress: "Progress Project",
      assignments: "Tugas",
      completed: "Selesai",
      lastActivity: "Aktivitas Terakhir",
      status: "Status",
      materialsUploaded: "Materi Diupload",
      assignmentsCreated: "Tugas Dibuat",
      lastUpload: "Upload Terakhir"
    },
    en: {
      title: "System Monitoring",
      subtitle: "Monitor student and teacher activities, progress, and performance in real-time",
      overview: "Overview",
      students: "Students",
      teachers: "Teachers",
      classes: "Classes", 
      totalUsers: "Total Users",
      activeToday: "Active Today",
      newUsers: "New Users (This Week)",
      recentActivity: "Recent Activities",
      searchPlaceholder: "Search name, email, or class...",
      allActivities: "All Activities",
      refresh: "Refresh",
      activities: "activities",
      noActivities: "No recent activities",
      noSearchResults: "No activities match your search",
      studentProgress: "Student Progress",
      teacherActivities: "Teacher Activities", 
      projectProgress: "Project Progress",
      assignments: "Assignments",
      completed: "Completed",
      lastActivity: "Last Activity",
      status: "Status",
      materialsUploaded: "Materials Uploaded",
      assignmentsCreated: "Assignments Created",
      lastUpload: "Last Upload"
    }
  };

  const t = texts.id;
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("monitoring");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-admin" },
    { id: "kelas", label: "Kelola Kelas", icon: BookOpen, path: "/dashboard-admin/kelola-kelas" },
    { id: "guru", label: "Kelola Guru", icon: GraduationCap, path: "/dashboard-admin/kelola-guru" },
    { id: "siswa", label: "Kelola Siswa", icon: Users, path: "/dashboard-admin/kelola-siswa" },
    { id: "monitoring", label: "Monitor", icon: Activity, path: "/dashboard-admin/monitoring" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[#2B593F] bg-[#B8E8C8]';
      case 'behind': return 'text-[#8A6327] bg-[#FFE4B5]';
      case 'needs_attention': return 'text-[#8A2B3D] bg-[#FFB3C1]';
      case 'inactive': return 'text-[#DC2626] bg-[#FEE2E2]';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'behind': return 'Butuh perhatian';
      case 'needs_attention': return 'Butuh Perhatian';
      case 'inactive': return 'Tidak Aktif';
      default: return status;
    }
  };

  const handleClassClick = (classId: string) => {
    setSelectedClass(classId);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
  };

  const statCardStyles = {
    primary: {
      iconBg: "bg-[#C8B6E2]",
      iconColor: "text-[#4A3B69]",
    },
    secondary: {
      iconBg: "bg-[#B8E8C8]",
      iconColor: "text-[#2B593F]",
    },
    tertiary: {
      iconBg: "bg-[#FFE4B5]",
      iconColor: "text-[#8A6327]",
    },
    warning: {
      iconBg: "bg-[#FFB3C1]",
      iconColor: "text-[#8A2B3D]",
    },
  };

  const StatCard = ({ icon: Icon, value, subtitle, variant = "primary", trend }: any) => {
    const style = statCardStyles[variant as keyof typeof statCardStyles] || statCardStyles.primary;
    return (
    <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] hover:border-[#CAF0F8] transition-all duration-200 cursor-pointer">
      <div className={`w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${style.iconColor}`} />
      </div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-3xl text-[#00B4D8]">
          {loading ? "..." : value}
        </h3>
        {trend && (
          <div className={`flex items-center text-xs ${trend > 0 ? 'text-[#0077B6]' : 'text-[#DC2626]'}`}>
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm text-[#64748B]">
        {subtitle}
      </p>
    </div>
    );
  };

  const StudentProgressRow = ({ student }: { student: any }) => (
    <div className="flex items-center gap-4 p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50 hover:bg-white/90 transition-all duration-200">
      <div className="w-10 h-10 rounded-full bg-[#C8B6E2] flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-[#4A3B69]" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-[#00B4D8] mb-1">
          {student.studentName}
        </div>
        <div className="text-xs text-[#64748B]">
          {student.studentEmail} • {student.className}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B]">
              {t.projectProgress}: {student.projectProgress}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B]">
              {t.assignments}: {student.assignmentsCompleted}/{student.assignmentsTotal}
            </span>
          </div>
        </div>
        {student.stepSegments && student.stepSegments.length > 0 ? (
          <div className="mt-3 w-full overflow-visible">
            <p className="text-[10px] text-[#94A3B8] mb-1">Langkah pembelajaran (hover = percobaan &amp; status)</p>
            <LearningStepProgressBar segments={student.stepSegments} />
          </div>
        ) : null}
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1.5 mb-1 text-xs ${
          getStatusColor(student.status)
        }`}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor(student.status)}`} />
          {getStatusText(student.status)}
        </div>
        <div className="text-[10px] text-[#94A3B8]">
          {new Date(student.lastActivity).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );

  const TeacherActivityRow = ({ teacher }: { teacher: any }) => (
    <div className="flex items-center gap-4 p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50 hover:bg-white/90 transition-all duration-200">
      <div className="w-10 h-10 rounded-full bg-[#B8E8C8] flex items-center justify-center flex-shrink-0">
        <GraduationCap className="w-5 h-5 text-[#2B593F]" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-[#00B4D8] mb-1">
          {teacher.teacherName}
        </div>
        <div className="text-xs text-[#64748B]">
          {teacher.teacherEmail} • {teacher.className}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B]">
              {t.materialsUploaded}: {teacher.materialsUploaded}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-xs text-[#64748B]">
              {t.assignmentsCreated}: {teacher.assignmentsCreated}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1.5 mb-1 text-xs ${
          getStatusColor(teacher.status)
        }`}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor(teacher.status)}`} />
          {getStatusText(teacher.status)}
        </div>
        <div className="text-[10px] text-[#94A3B8]">
          {new Date(teacher.lastUpload).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="ml-0 lg:ml-80 min-h-screen p-4 lg:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-[#0077B6] mx-auto mb-4" />
            <div className="text-lg text-[#00B4D8]">
              Memuat data monitoring...
            </div>
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
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#00B4D8]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#00B4D8]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
      </div>

      {/* Mobile: floating menu button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#90E0EF] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#00B4D8] hover:bg-white transition-all duration-200 lg:hidden"
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
            className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2.5rem] border border-[#90E0EF]/30 bg-white/75 backdrop-blur-16 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#00B4D8]">Menu</h2>
                <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
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
                      className="w-full flex items-center gap-3 rounded-xl p-3 text-left text-sm font-medium text-[#00B4D8] hover:bg-white/60"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
        <SideBarAdmin />
      </div>

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Left - Monitoring Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2.5rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#00B4D8]" />
              <span className="text-sm font-semibold text-[#00B4D8]">{t.title}</span>
            </div>

            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <h1 className="text-3xl font-bold text-[#00B4D8] mb-3">
                Monitoring Siswa & Guru
              </h1>
              <p className="text-base text-[#64748B]">
                Pantau aktivitas, progress, dan kinerja siswa serta guru secara real-time.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-4 mb-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            <div className="flex gap-2">
              {[
                { key: 'overview', label: t.overview, icon: BarChart3 },
                { key: 'students', label: t.students, icon: Users },
                { key: 'teachers', label: t.teachers, icon: GraduationCap },
                { key: 'classes', label: t.classes, icon: BookOpen }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-[#0077B6] text-white shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)]'
                        : 'text-[#64748B] hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 mb-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/70 border border-[#90E0EF] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2.5 rounded-xl bg-white/70 border border-[#90E0EF] text-sm text-[#00B4D8] focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all duration-200"
                >
                  <option value="all">{t.allActivities}</option>
                  <option value="students">{t.students}</option>
                  <option value="teachers">{t.teachers}</option>
                  <option value="classes">{t.classes}</option>
                </select>
                <button
                  onClick={fetchMonitoringData}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0077B6] to-[#0077B6] text-white rounded-[2.5rem] hover:shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)] disabled:opacity-50 text-sm font-medium transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {t.refresh}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 animate-fadeIn">
                <StatCard
                  icon={UserCheck}
                  value={currentData.summary?.totalSiswaAktif?.toString() || "0"}
                  subtitle="Total Siswa Aktif"
                  variant="primary"
                />
                <StatCard
                  icon={AlertCircle}
                  value={currentData.summary?.totalSiswaButuhPerhatian?.toString() || "0"}
                  subtitle="Siswa Butuh Perhatian"
                  variant="warning"
                />
                <StatCard
                  icon={Upload}
                  value={(currentData.recentTeacherActivities?.length || 0).toString()}
                  subtitle="Aktivitas Guru Terbaru"
                  variant="secondary"
                />
                <StatCard
                  icon={FileText}
                  value={currentData.summary?.totalMateriDanTugasGuru?.toString() || "0"}
                  subtitle="Jumlah Materi + Tugas Guru"
                  variant="tertiary"
                />
              </div>

              <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-slideIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl text-[#00B4D8]">Aktivitas Guru Terbaru</h2>
                  <div className="text-sm text-[#64748B]">{currentData.recentTeacherActivities.length} aktivitas</div>
                </div>
                <div className="space-y-3 max-h-[260px] overflow-y-auto">
                  {currentData.recentTeacherActivities.length > 0 ? (
                    currentData.recentTeacherActivities.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white/70 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[#00B4D8]">{item.teacherName} · {item.className}</p>
                          <p className="text-xs text-[#64748B]">
                            {item.type === "materi" ? "Upload materi" : "Upload tugas"}: {item.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#94A3B8]">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-[#94A3B8]">Belum ada aktivitas guru terbaru.</div>
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-slideIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl text-[#00B4D8]">
                    {t.recentActivity}
                  </h2>
                  <div className="text-sm text-[#64748B]">
                    {currentData.recentActivities.length} {t.activities}
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto">
                  {currentData.recentActivities.length > 0 ? (
                    currentData.recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50 hover:bg-white/90 transition-all duration-200"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'student' ? 'bg-[#C8B6E2]' : 'bg-[#B8E8C8]'
                        }`}>
                          {activity.type === 'student' ? (
                            <Users className="w-5 h-5 text-[#4A3B69]" />
                          ) : (
                            <UserCheck className="w-5 h-5 text-[#2B593F]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-[#00B4D8] mb-1">
                            {activity.name}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {activity.email} • {activity.role}
                          </div>
                          {activity.className && (
                            <div className="text-[11px] text-[#0077B6]">
                              Kelas: {activity.className}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#94A3B8]">
                            {new Date(activity.lastLogin).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1 text-[11px] ${
                            activity.status === 'Active' ? 'text-[#2B593F]' : 'text-[#DC2626]'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              activity.status === 'Active' ? 'bg-[#2B593F]' : 'bg-[#DC2626]'
                            }`} />
                            {activity.status}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                      <div className="text-sm text-[#94A3B8]">
                        {searchQuery ? t.noSearchResults : t.noActivities}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'students' && (
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-[#00B4D8]">
                  {t.studentProgress}
                </h2>
                <div className="text-sm text-[#64748B]">
                  {currentData.studentProgress.length} siswa
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto overflow-x-visible pr-1">
                {currentData.studentProgress.length > 0 ? (
                  currentData.studentProgress.map((student) => (
                    <StudentProgressRow key={student.id} student={student} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                    <div className="text-sm text-[#94A3B8]">
                      Tidak ada data progress siswa
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-[#00B4D8]">
                  {t.teacherActivities}
                </h2>
                <div className="text-sm text-[#64748B]">
                  {currentData.teacherActivities.length} guru
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                {currentData.teacherActivities.length > 0 ? (
                  currentData.teacherActivities.map((teacher) => (
                    <TeacherActivityRow key={teacher.id} teacher={teacher} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                    <div className="text-sm text-[#94A3B8]">
                      Tidak ada data aktivitas guru
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'classes' && !selectedClass && (
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-[#00B4D8]">
                  Kelas
                </h2>
                <div className="text-sm text-[#64748B]">
                  {currentData.classOverview.length} kelas
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentData.classOverview.length > 0 ? (
                  currentData.classOverview.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => handleClassClick(cls.id)}
                      className="p-5 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50 hover:bg-white/90 hover:border-[#CAF0F8] transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-base text-[#00B4D8]">
                          {cls.name}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-[#64748B]" />
                      </div>
                      <p className="text-xs text-[#64748B] mb-3">
                        {cls.subject}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {cls.studentCount} siswa · {cls.teacherCount} guru · {cls.materialCount} pembelajaran · {cls.projectCount} tugas
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                    <div className="text-sm text-[#94A3B8]">
                      Tidak ada data kelas
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'classes' && selectedClass && (
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToClasses}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-[#E2E8F0]/50 hover:bg-white/90 text-sm font-medium text-[#64748B] transition-all duration-200"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Kembali ke Daftar Kelas
                  </button>
                  <h2 className="font-bold text-xl text-[#00B4D8]">
                    {currentData.classOverview.find(c => c.id === selectedClass)?.name}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="bg-white/70 border border-[#E2E8F0]/50 rounded-[2.5rem] p-6">
                  <h3 className="font-bold text-lg text-[#00B4D8] mb-4">
                    Statistik Kelas
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">
                        Total Siswa
                      </span>
                      <span className="font-semibold text-base text-[#00B4D8]">
                        {currentData.studentProgress.filter(s => s.classId === selectedClass).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">
                        Siswa Aktif
                      </span>
                      <span className="font-semibold text-base text-[#2B593F]">
                        {currentData.studentProgress.filter(s => s.classId === selectedClass && s.status === 'active').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748B]">
                        Butuh Perhatian
                      </span>
                      <span className="font-semibold text-base text-[#8A6327]">
                        {currentData.studentProgress.filter(s => s.classId === selectedClass && s.status === 'behind').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 border border-[#E2E8F0]/50 rounded-[2.5rem] p-6">
                  <h3 className="font-bold text-lg text-[#00B4D8] mb-4">
                    Aktivitas Guru
                  </h3>
                  <div className="space-y-3">
                    {currentData.teacherActivities
                      .filter(teacher => {
                        if (!selectedClass) return false;
                        const activeClass = currentData.classOverview.find(c => c.id === selectedClass);
                        return activeClass && teacher.className.includes(activeClass.name);
                      })
                      .map((teacher) => (
                        <div key={teacher.id} className="flex justify-between items-center">
                          <span className="text-sm text-[#64748B]">
                            {teacher.teacherName}
                          </span>
                          <span className="font-semibold text-base text-[#00B4D8]">
                            {teacher.materialsUploaded} materi
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/70 border border-[#E2E8F0]/50 rounded-[2.5rem] p-8">
                <h3 className="font-bold text-xl text-[#00B4D8] mb-6">
                  Daftar Siswa
                </h3>

                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {currentData.studentProgress
                    .filter(student => selectedClass && student.classId === selectedClass)
                    .map((student) => (
                      <StudentProgressRow key={student.id} student={student} />
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>
      </div>
    );
}
