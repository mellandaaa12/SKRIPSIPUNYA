"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { 
  Plus, Search, Filter, BookOpen, Users, FileText, Calendar, 
  Edit, Trash2, Eye, Clock, AlertCircle, CheckCircle, XCircle,
  PlayCircle, BarChart3, UserCheck, UserX, TrendingUp, Download, ArrowLeft
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { classAPI, progressAPI } from "../utils/api";
import { supabase } from "../utils/supabase";
import { buildSegmentsForStudentClass } from "../utils/learningProgress";
import { LearningStepProgressBar } from "../components/LearningStepProgressBar";
import { MacFolderVisual } from "../components/MacFolderVisual";

interface Class {
  id: string;
  name: string;
  subject: string;
  description?: string;
  student_count: number;
  teacher_count: number;
  created_at: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: 'active' | 'inactive';
  student_progress: number;
  step_count: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  status: 'active' | 'completed' | 'expired';
  submissions_count: number;
  total_students: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  last_activity: string;
  status: 'active' | 'inactive' | 'needs_attention';
  assignments_completed: number;
  assignments_total: number;
  quiz_attempts: number;
  quiz_success_rate: number;
}

export default function DetailKelasAdmin() {
  const { preferences } = useSettings();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { kelasId } = useParams<{ kelasId: string }>();
  
  const [kelas, setKelas] = useState<Class | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [progressRowsState, setProgressRowsState] = useState<any[]>([]);
  const [pembelajaranListState, setPembelajaranListState] = useState<
    Array<{ id: string; judul?: string; title?: string; steps?: any[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'assignments' | 'students'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState<'material' | 'assignment'>('material');

  const fetchClassData = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token || !kelasId) {
      if (!kelasId) {
        setLoading(false);
      }
      return;
    }
    
    try {
      setLoading(true);
      console.log("📚 Fetching class data for ID:", kelasId);
      
      const [{ classDetails }, { progress: progressRows }] = await Promise.all([
        classAPI.getDetails(kelasId, token),
        progressAPI.getByClass(kelasId),
      ]);
      
      console.log("📚 Class details received:", classDetails);
      console.log("📚 Progress rows received:", progressRows);
      
      if (!classDetails) {
        console.error("❌ Class details is null");
        setKelas(null);
        return;
      }

      setKelas({
        id: classDetails.id,
        name: classDetails.name,
        subject: classDetails.subject || classDetails.subtitle || "-",
        description: classDetails.description,
        student_count: classDetails.students?.length || 0,
        teacher_count: 1 + (classDetails.otherTeachers?.length || 0),
        created_at: classDetails.created_at,
      });

      const rawMats = classDetails.materials || [];
      const pembelajaranList = rawMats.map((m: any) => ({
        id: m.id,
        judul: m.judul || m.title,
        title: m.title,
        steps: m.steps || [],
      }));
      setPembelajaranListState(pembelajaranList);
      setProgressRowsState(progressRows || []);

      const materialList = rawMats.map((m: any) => {
        const rowsForMaterial = (progressRows || []).filter(r => r.pembelajaran_id === m.id);
        const completedRows = rowsForMaterial.filter(r => r.completed).length;
        const studentCount = classDetails.students?.length || 0;
        const stepCount = Math.max(1, (m.steps || []).length);
        const studentProgress = studentCount > 0
          ? Math.round((completedRows / (studentCount * stepCount)) * 100)
          : 0;
        return {
          id: m.id,
          title: m.judul || m.title || "Materi",
          description: m.deskripsi || m.description || "",
          created_at: m.created_at,
          status: m.status === "published" ? "active" : "inactive",
          student_progress: Math.min(100, Math.max(0, studentProgress)),
          step_count: (m.steps || []).length,
        };
      }) as Material[];
      setMaterials(materialList);

      setAssignments([]);

      const progressByStudent = (progressRows || []).reduce((acc: Record<string, any[]>, row: any) => {
        if (!acc[row.user_id]) acc[row.user_id] = [];
        acc[row.user_id].push(row);
        return acc;
      }, {});

      const totalStepsClass = Math.max(
        1,
        pembelajaranList.reduce((sum: number, m: any) => sum + Math.max(1, (m.steps || []).length), 0)
      );

      const now = new Date().getTime();
      const checkOnline = (updatedAt: string | undefined | null) => {
        if (!updatedAt) return false;
        return (now - new Date(updatedAt).getTime()) < 60000;
      };

      const studentList = (classDetails.students || []).map((s: any) => {
        const rows = progressByStudent[s.id] || [];
        const completed = rows.filter(r => r.completed).length;
        const allScores = rows.filter(r => typeof r.score === "number").map(r => r.score);
        const passCount = rows.filter(r => typeof r.score === "number" && r.score >= 75).length;
        const attempts = rows.reduce((sum, r) => sum + (r.answers?.attempts || 0), 0);
        const segments = buildSegmentsForStudentClass(s.id, pembelajaranList, progressRows || []);
        const needsAttention = segments.some((seg) => seg.needsAttention || seg.variant === "red");
        const progressPct = totalStepsClass > 0 ? Math.round((completed / totalStepsClass) * 100) : 0;
        
        const isOnline = checkOnline(s.updated_at);
        let status = "inactive";
        if (needsAttention) {
          status = "needs_attention";
        } else if (isOnline) {
          status = "active";
        }

        const latestProgressTime = rows.length > 0
          ? Math.max(...rows.map((r) => new Date(r.updated_at || r.created_at).getTime()))
          : null;
        const lastActivity = latestProgressTime
          ? new Date(latestProgressTime).toISOString()
          : (s.updated_at || s.created_at || new Date().toISOString());

        return {
          id: s.id,
          name: s.name || s.email,
          email: s.email,
          progress: Math.min(100, Math.max(0, progressPct)),
          last_activity: lastActivity,
          status: status,
          assignments_completed: completed,
          assignments_total: totalStepsClass,
          quiz_attempts: attempts,
          quiz_success_rate: allScores.length ? Math.round((passCount / allScores.length) * 100) : 0,
        };
      }) as Student[];
      setStudents(studentList);
      
    } catch (error: any) {
      console.error("Error fetching class data:", error.message || error);
      setKelas(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [session, kelasId]);

  useEffect(() => {
    if (!kelasId) return;
    let tm: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (tm) clearTimeout(tm);
      tm = setTimeout(() => {
        void fetchClassData();
      }, 450);
    };
    const channel = supabase
      .channel(`admin-detail-kelas-progress-${kelasId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "pembelajaran" }, schedule)
      .subscribe();
    return () => {
      if (tm) clearTimeout(tm);
      void supabase.removeChannel(channel);
    };
  }, [kelasId, session?.access_token]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'needs_attention': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'needs_attention': return 'Butuh Perhatian';
      case 'inactive': return 'Tidak Aktif';
      default: return status;
    }
  };

  const texts = {
    id: {
      title: "Detail Kelas",
      subtitle: "Kelola materi, tugas, dan pantau progress siswa",
      overview: "Ringkasan",
      materials: "Materi",
      students: "Siswa",
      createMaterial: "Buat Materi",
      createAssignment: "Buat Tugas",
      searchStudents: "Cari siswa...",
      totalStudents: "Total Siswa",
      activeStudents: "Siswa Aktif",
      needsAttention: "Butuh Perhatian",
      averageProgress: "Progress Rata-rata",
      totalMaterials: "Total Materi",
      studentProgress: "Progress Siswa",
      lastActivity: "Aktivitas Terakhir",
      assignmentsCompleted: "Pembelajaran Selesai",
      quizAttempts: "Percobaan Quiz",
      successRate: "Tingkat Keberhasilan",
      dueDate: "Batas Waktu",
      submissions: "Pengumpulan",
      edit: "Edit",
      delete: "Hapus",
      view: "Lihat"
    },
    en: {
      title: "Class Details",
      subtitle: "Manage materials, assignments, and monitor student progress",
      overview: "Overview",
      materials: "Materials", 
      students: "Students",
      createMaterial: "Create Material",
      createAssignment: "Create Assignment",
      searchStudents: "Search students...",
      totalStudents: "Total Students",
      activeStudents: "Active Students",
      needsAttention: "Needs Attention", 
      averageProgress: "Average Progress",
      totalMaterials: "Total Materials",
      studentProgress: "Student Progress",
      lastActivity: "Last Activity",
      assignmentsCompleted: "Assignments Completed",
      quizAttempts: "Quiz Attempts",
      successRate: "Success Rate",
      dueDate: "Due Date",
      submissions: "Submissions",
      edit: "Edit",
      delete: "Delete", 
      view: "View"
    }
  };

  const t = texts[preferences.language];

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#90E0EF]/40 blur-3xl" />
          <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#90E0EF]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#CAF0F8]/30 blur-3xl" />
        </div>
        
        <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
          <SideBarAdmin />
        </div>
        
        <main className="ml-0 lg:ml-80 min-h-screen relative flex items-center justify-center">
          <div className="text-center bg-white/80 backdrop-blur-md p-10 rounded-[3rem] shadow-xl border border-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B4D8] mx-auto mb-4" />
            <div className="font-poppins text-lg text-[#0077B6]">
              Memuat data kelas...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!kelas) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
          <SideBarAdmin />
        </div>
        <main className="ml-0 lg:ml-80 min-h-screen relative flex items-center justify-center">
          <div className="text-center bg-white/80 backdrop-blur-md p-10 rounded-[3rem] shadow-xl border border-white">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <div className="font-poppins text-lg text-[#0077B6]">
              Kelas tidak ditemukan
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#90E0EF]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#90E0EF]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#CAF0F8]/30 blur-3xl" />
      </div>

      <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
        <SideBarAdmin />
      </div>

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative p-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[3rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.2)] mb-8"
        >
          <div className="flex flex-col gap-[16px]">
            <motion.button
              whileHover={{ x: -4 }}
              onClick={() => navigate("/dashboard-admin/kelola-kelas")}
              className="flex items-center gap-[8px] text-white/80 hover:text-white transition-colors group w-fit"
            >
              <ArrowLeft className="w-[18px] h-[18px] transition-transform group-hover:-translate-x-1" />
              <span className="font-['Poppins'] text-[14px] font-medium">Kembali ke Daftar Kelas</span>
            </motion.button>
            <div>
              <h1 className="font-['Lato'] font-extrabold text-[40px] text-white uppercase tracking-[1.6px] leading-[1.4]">
                {kelas.name}
              </h1>
              <p className="font-['Poppins'] text-[18px] text-white/90 leading-[27px] capitalize">
                {kelas.subject} • {t.subtitle}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`rounded-[3rem] p-[16px] mb-[20px] border-2 transition-colors duration-300 ${
            preferences.darkMode 
              ? "bg-[#334155] border-[#64748b]" 
              : "bg-white border-[#e2e8f0]"
          }`}
        >
          <div className="flex gap-[8px]">
            {[
              { key: 'overview', label: t.overview, icon: BarChart3 },
              { key: 'materials', label: t.materials, icon: BookOpen },
              { key: 'students', label: t.students, icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-[8px] px-[16px] py-[12px] rounded-[2rem] font-['Poppins'] text-[13px] transition-colors ${
                    activeTab === tab.key
                      ? 'bg-[#0077B6] text-white'
                      : preferences.darkMode
                      ? 'bg-[#475569] text-gray-300 hover:bg-[#64748b]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-[16px] h-[16px]" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-[20px]"
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-[20px]">
              <div className={`rounded-[3rem] p-[24px] shadow-md border-2 transition-colors duration-300 ${
                preferences.darkMode ? "bg-[#334155] border-[#64748b]" : "bg-white border-[#e2e8f0]"
              }`}>
                <h3 className={`font-['Poppins'] font-bold text-[18px] mb-[16px] ${
                  preferences.darkMode ? "text-white" : "text-[#1e293b]"
                }`}>
                  Statistik Kelas
                </h3>
                <div className="space-y-[12px]">
                  <div className="flex justify-between items-center">
                    <span className={`text-[14px] ${preferences.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.totalStudents}
                    </span>
                    <span className={`font-semibold text-[16px] ${preferences.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {students.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[14px] ${preferences.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.activeStudents}
                    </span>
                    <span className={`font-semibold text-[16px] text-green-600`}>
                      {students.filter(s => s.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[14px] ${preferences.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.needsAttention}
                    </span>
                    <span className={`font-semibold text-[16px] text-yellow-600`}>
                      {students.filter(s => s.status === 'needs_attention').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[14px] ${preferences.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.averageProgress}
                    </span>
                    <span className={`font-semibold text-[16px] ${preferences.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className={`rounded-[3rem] p-[24px] shadow-md border-2 transition-colors duration-300 ${
                preferences.darkMode ? "bg-[#334155] border-[#64748b]" : "bg-white border-[#e2e8f0]"
              }`}>
                <h3 className={`font-['Poppins'] font-bold text-[18px] mb-[16px] ${
                  preferences.darkMode ? "text-white" : "text-[#1e293b]"
                }`}>
                  Aktivitas Kelas
                </h3>
                <div className="space-y-[12px]">
                  <div className="flex justify-between items-center">
                    <span className={`text-[14px] ${preferences.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.totalMaterials}
                    </span>
                    <span className={`font-semibold text-[16px] ${preferences.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {materials.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className={`rounded-[3rem] p-[32px] shadow-md border-2 transition-colors duration-300 ${
              preferences.darkMode ? "bg-[#334155] border-[#64748b]" : "bg-white border-[#e2e8f0]"
            }`}>
              <div className="flex items-center justify-between mb-[24px]">
                <h2 className={`font-['Poppins'] font-bold text-[20px] ${
                  preferences.darkMode ? "text-white" : "text-[#1e293b]"
                }`}>
                  {t.materials}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[28px] pt-[12px]">
                {materials.map((material, idx) => {
                  return (
                    <motion.div
                      key={material.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <MacFolderVisual
                        title={material.title}
                        badge={`${material.step_count || 0} Materi`}
                        status={material.status === "active" ? "published" : "draft"}
                        themeIndex={idx}
                        progressValue={material.student_progress}
                        progressLabel="Avg Progress"
                      >
                        <div className="flex items-center justify-center gap-[8px]">
                          <button
                            onClick={() => navigate(`/pembelajaran/${material.id}`)}
                            className="p-[8px] rounded-full bg-[#0077B6] text-white hover:bg-[#023E8A] transition-colors"
                            title="Lihat Materi"
                          >
                            <Eye className="w-[12px] h-[12px]" />
                          </button>
                          <button
                            className="p-[8px] rounded-full bg-[#FFB703] text-white hover:bg-[#F59E0B] transition-colors"
                            title="Edit Materi"
                          >
                            <Edit className="w-[12px] h-[12px]" />
                          </button>
                          <button
                            className="p-[8px] rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Hapus Materi"
                          >
                            <Trash2 className="w-[12px] h-[12px]" />
                          </button>
                        </div>
                      </MacFolderVisual>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className={`rounded-[3rem] p-[32px] shadow-md border-2 transition-colors duration-300 ${
              preferences.darkMode ? "bg-[#334155] border-[#64748b]" : "bg-white border-[#e2e8f0]"
            }`}>
              <div className="flex items-center justify-between mb-[24px]">
                <h2 className={`font-['Poppins'] font-bold text-[20px] ${
                  preferences.darkMode ? "text-white" : "text-[#1e293b]"
                }`}>
                  {t.students}
                </h2>
                <div className="relative">
                  <Search className="absolute left-[12px] top-[50%] transform -translate-y-1/2 w-[16px] h-[16px] text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.searchStudents}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-[40px] pr-[16px] py-[8px] rounded-[2rem] border ${
                      preferences.darkMode 
                        ? 'bg-[#374151] border-gray-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div className="space-y-[16px]">
                {filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-[16px] p-[20px] rounded-[2rem] border-2 transition-colors ${
                      preferences.darkMode 
                        ? "bg-[#475569] border-[#64748b]" 
                        : "bg-[#f8fafc] border-[#e2e8f0]"
                    }`}
                  >
                    <div className="w-[48px] h-[48px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-[24px] h-[24px] text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-[12px] mb-[4px]">
                        <h3 className={`font-semibold text-[16px] ${
                          preferences.darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {student.name}
                        </h3>
                        <span className={`px-[10px] py-[4px] rounded-full text-[10px] font-medium ${getStatusColor(student.status)}`}>
                          {getStatusText(student.status)}
                        </span>
                      </div>
                      <p className={`text-[12px] mb-[8px] ${
                        preferences.darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {student.email}
                      </p>
                      <div className="grid grid-cols-4 gap-[16px] text-[11px]">
                        <div>
                          <span className={`block ${preferences.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Progress
                          </span>
                          <span className={`font-semibold ${preferences.darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.progress}%
                          </span>
                        </div>
                        <div>
                          <span className={`block ${preferences.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.assignmentsCompleted}
                          </span>
                          <span className={`font-semibold ${preferences.darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.assignments_completed}/{student.assignments_total}
                          </span>
                        </div>
                        <div>
                          <span className={`block ${preferences.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.quizAttempts}
                          </span>
                          <span className={`font-semibold ${preferences.darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.quiz_attempts}
                          </span>
                        </div>
                        <div>
                          <span className={`block ${preferences.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.successRate}
                          </span>
                          <span className={`font-semibold ${preferences.darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.quiz_success_rate}%
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-[4px] mt-[8px] text-[10px] ${
                        preferences.darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Clock className="w-[10px] h-[10px]" />
                        {t.lastActivity}: {new Date(student.last_activity).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="mt-3 w-full overflow-visible pr-1">
                        <p className={`text-[10px] mb-1 ${preferences.darkMode ? "text-gray-500" : "text-gray-500"}`}>
                          Progress per step (hijau = 1× berhasil, oranye = 2×, merah = ≥3 / butuh perhatian)
                        </p>
                        <LearningStepProgressBar
                          segments={buildSegmentsForStudentClass(student.id, pembelajaranListState, progressRowsState)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-[8px]">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-[8px] rounded-full bg-[#0077B6] text-white hover:bg-[#023E8A] transition-colors"
                      >
                        <Eye className="w-[14px] h-[14px]" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-[8px] rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <Download className="w-[14px] h-[14px]" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-[500px] rounded-[3rem] p-[32px] ${
              preferences.darkMode ? 'bg-[#334155]' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`font-['Poppins'] font-bold text-[20px] mb-[24px] ${
              preferences.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {modalType === 'material' ? t.createMaterial : t.createAssignment}
            </h3>
            <div className="space-y-[16px]">
              <div>
                <label className={`block text-[14px] font-medium mb-[8px] ${
                  preferences.darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Judul
                </label>
                <input
                  type="text"
                  className={`w-full px-[16px] py-[12px] rounded-[2rem] border ${
                    preferences.darkMode 
                      ? 'bg-[#374151] border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Masukkan judul..."
                />
              </div>
              <div>
                <label className={`block text-[14px] font-medium mb-[8px] ${
                  preferences.darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Deskripsi
                </label>
                <textarea
                  rows={4}
                  className={`w-full px-[16px] py-[12px] rounded-[2rem] border ${
                    preferences.darkMode 
                      ? 'bg-[#374151] border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Masukkan deskripsi..."
                />
              </div>
              {modalType === 'assignment' && (
                <div>
                  <label className={`block text-[14px] font-medium mb-[8px] ${
                    preferences.darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t.dueDate}
                  </label>
                  <input
                    type="datetime-local"
                    className={`w-full px-[16px] py-[12px] rounded-[2rem] border ${
                      preferences.darkMode 
                        ? 'bg-[#374151] border-gray-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-[12px] mt-[24px]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 px-[16px] py-[12px] rounded-[2rem] font-['Poppins'] text-[14px] transition-colors ${
                  preferences.darkMode 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Batal
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-[16px] py-[12px] bg-[#0077B6] text-white rounded-[2rem] hover:bg-[#023E8A] font-['Poppins'] text-[14px] transition-colors"
              >
                Simpan
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
);
}
