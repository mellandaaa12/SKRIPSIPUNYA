"use client";

import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { ProfileHeader } from "../components/ProfileHeader";
import { 
  Search, Users, BookOpen, FileText, Briefcase, Eye, 
  CheckCircle, Clock, TrendingUp, ChevronRight, Play,
  GraduationCap, Award, Activity
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { userAPI, classAPI, pembelajaranAPI, projectAPI, progressAPI } from "../utils/api";
import { toast } from "sonner";

interface SiswaProgress {
  id: string;
  name: string;
  email: string;
  kelas?: string;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  lastActivity: string;
}

interface MateriGuru {
  id: string;
  title: string;
  description: string;
  guruName: string;
  kelasName: string;
  stepCount: number;
  createdAt: string;
}

interface ProjectProgress {
  id: string;
  title: string;
  kelasName: string;
  guruName: string;
  studentCount: number;
  status: string;
}

export default function MonitorSemua() {
  const { preferences } = useSettings();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<"siswa" | "materi" | "project">("siswa");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [siswaProgress, setSiswaProgress] = useState<SiswaProgress[]>([]);
  const [materiGuru, setMateriGuru] = useState<MateriGuru[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);

  // Fetch all data
  const fetchAllData = async () => {
    if (!session?.access_token) return;
    
    try {
      setLoading(true);
      const token = session.access_token;

      const [kelasRes, siswaRes, guruRes] = await Promise.all([
        classAPI.getAll(token),
        userAPI.getByRole("siswa", token),
        userAPI.getByRole("guru", token),
      ]);
      const classes = kelasRes.classes || [];
      const students = siswaRes.users || [];
      const teachers = guruRes.users || [];

      setKelasList(classes);

      const kelasMap = new Map(classes.map((kelas: any) => [kelas.id, kelas]));
      const guruMap = new Map(teachers.map((guru: any) => [guru.id, guru.name]));
      const studentCountByClass = new Map<string, number>();

      for (const siswa of students) {
        const classId = siswa.classId || siswa.class_id;
        if (!classId) continue;
        studentCountByClass.set(classId, (studentCountByClass.get(classId) || 0) + 1);
      }

      const pembelajaranResults = await Promise.allSettled(
        classes.map((kelas: any) => pembelajaranAPI.getByClass(kelas.id, token))
      );
      const allPembelajaran = pembelajaranResults.flatMap((result, index) => {
        if (result.status !== "fulfilled") {
          return [];
        }

        return (result.value.pembelajaran || []).map((item: any) => ({
          ...item,
          classId: item.classId || item.class_id || classes[index].id,
        }));
      });

      const totalMateriByClass = new Map<string, number>();
      for (const materi of allPembelajaran) {
        totalMateriByClass.set(materi.classId, (totalMateriByClass.get(materi.classId) || 0) + 1);
      }

      // Process siswa with progress
      const progressResults = await Promise.allSettled(
        students.map((siswa: any) => progressAPI.getByUser(siswa.id, token))
      );
      const siswaWithProgress: SiswaProgress[] = students.map((siswa: any, index: number) => {
        const progressData = progressResults[index].status === "fulfilled"
          ? progressResults[index].value.progress || []
          : [];
        const classId = siswa.classId || siswa.class_id;
        const totalMateri = classId ? (totalMateriByClass.get(classId) || 0) : 0;
        const completedMateri = progressData.length;
        const latestActivity = progressData
          .map((item: any) => item.updated_at || item.created_at)
          .filter(Boolean)
          .sort()
          .reverse()[0];

        return {
          id: siswa.id,
          name: siswa.name,
          email: siswa.email,
          kelas: siswa.className || kelasMap.get(classId)?.name || "Belum ada kelas",
          progress: totalMateri > 0 ? Math.min(100, Math.round((completedMateri / totalMateri) * 100)) : 0,
          completedSteps: completedMateri,
          totalSteps: totalMateri,
          lastActivity: latestActivity
            ? new Date(latestActivity).toLocaleDateString("id-ID")
            : "Belum ada aktivitas",
        };
      });
      setSiswaProgress(siswaWithProgress);

      const allMateri: MateriGuru[] = allPembelajaran.map((materi: any) => ({
        id: materi.id,
        title: materi.title,
        description: materi.description || "",
        guruName: guruMap.get(materi.guruId || materi.created_by || materi.createdBy) || "Belum ada guru",
        kelasName: kelasMap.get(materi.classId)?.name || "Belum ada kelas",
        stepCount: materi.steps?.length || 0,
        createdAt: materi.created_at
          ? new Date(materi.created_at).toLocaleDateString("id-ID")
          : "-",
      }));
      setMateriGuru(allMateri);

      // Fetch projects
      const projectResults = await Promise.allSettled(
        classes.map((kelas: any) => projectAPI.getByClass(kelas.id, token))
      );
      const allProjects: ProjectProgress[] = projectResults.flatMap((result, index) => {
        if (result.status !== "fulfilled") {
          return [];
        }

        return (result.value.projects || []).map((project: any) => {
          const classId = project.classId || project.class_id || classes[index].id;
          return {
            id: project.id,
            title: project.title,
            kelasName: kelasMap.get(classId)?.name || classes[index].name,
            guruName: guruMap.get(project.guruId || project.created_by || project.createdBy) || "Belum ada guru",
            studentCount: project.studentCount || studentCountByClass.get(classId) || 0,
            status: project.status || "Aktif",
          };
        });
      });
      setProjectProgress(allProjects);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [session]);

  const filteredSiswa = siswaProgress.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMateri = materiGuru.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.guruName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProject = projectProgress.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.kelasName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "siswa", label: "Progress Siswa", icon: Users },
    { id: "materi", label: "Materi Guru", icon: BookOpen },
    { id: "project", label: "Project", icon: Briefcase },
  ] as const;

  const texts = {
    id: {
      title: "Monitor Semua",
      subtitle: "Pantau Aktivitas Guru Dan Siswa",
      search: "Cari...",
      progress: "Progress",
      completed: "Selesai",
      steps: "Langkah",
      lihatDetail: "Lihat Detail",
      noData: "Belum ada data",
      guru: "Guru",
      kelas: "Kelas",
      siswa: "Siswa",
      status: "Status",
      aktif: "Aktif",
      selesai: "Selesai",
    },
    en: {
      title: "Monitor All",
      subtitle: "Monitor Teacher And Student Activities",
      search: "Search...",
      progress: "Progress",
      completed: "Completed",
      steps: "Steps",
      lihatDetail: "View Details",
      noData: "No data yet",
      guru: "Teacher",
      kelas: "Class",
      siswa: "Students",
      status: "Status",
      aktif: "Active",
      selesai: "Completed",
    },
  };

  const t = texts[preferences.language];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden"
    >
      <SideBarAdmin />

      {/* Main Content */}
      <div className="absolute left-[426px] top-[40px] w-[894px]">
        {/* Profile Header at top right */}
        <div className="flex justify-end mb-6">
          <ProfileHeader />
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-[35px] p-[42px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)] mb-[20px]"
        >
          <h1 className="font-['Lato'] font-extrabold text-[40px] text-white uppercase tracking-[1.6px] leading-[1.4]">
            {t.title}
          </h1>
          <p className="font-['Poppins'] text-[18px] text-white/90 leading-[27px] capitalize">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-[12px] mb-[20px]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-[8px] px-[20px] py-[12px] rounded-full font-['Poppins'] text-[14px] font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#8b5cf6] text-white"
                  : preferences.darkMode 
                    ? "bg-[#334155] text-[#94a3b8]" 
                    : "bg-white text-[#64748b]"
              }`}
            >
              <tab.icon className="w-[18px] h-[18px]" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className={`flex items-center gap-[16px] px-[24px] py-[14px] rounded-full mb-[20px] transition-colors duration-300 ${
            preferences.darkMode ? "bg-[#334155]" : "bg-white"
          }`}
        >
          <Search className={`w-[18px] h-[18px] ${preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"}`} />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent font-['Poppins'] text-[14px] outline-none ${
              preferences.darkMode ? "text-white placeholder:text-[#94a3b8]" : "text-[#1e293b] placeholder:text-[#64748b]"
            }`}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={`rounded-[35px] p-[32px] shadow-md h-[480px] overflow-hidden transition-colors duration-300 ${
            preferences.darkMode ? "bg-[#334155]" : "bg-white"
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mb-[16px]" />
              <p className={`font-['Poppins'] text-[14px] ${
                preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
              }`}>
                Memuat data...
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              {/* Siswa Progress Tab */}
              {activeTab === "siswa" && (
                <div className="flex flex-col gap-[16px]">
                  {filteredSiswa.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px]">
                      <Users className={`w-[64px] h-[64px] mb-[16px] ${
                        preferences.darkMode ? "text-[#64748b]" : "text-[#94a3b8]"
                      }`} />
                      <p className={`font-['Poppins'] text-[14px] ${
                        preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                      }`}>
                        {t.noData}
                      </p>
                    </div>
                  ) : (
                    filteredSiswa.map((siswa) => (
                      <div
                        key={siswa.id}
                        className={`flex items-center justify-between p-[20px] rounded-[16px] border-2 transition-colors duration-300 ${
                          preferences.darkMode 
                            ? "bg-[#475569] border-[#64748b]" 
                            : "bg-[#f8fafc] border-[#e2e8f0]"
                        }`}
                      >
                        <div className="flex items-center gap-[16px]">
                          <div className="w-[48px] h-[48px] bg-gradient-to-br from-[#1294f2] to-[#0ea5e9] rounded-[12px] flex items-center justify-center">
                            <GraduationCap className="w-[24px] h-[24px] text-white" />
                          </div>
                          <div>
                            <h3 className={`font-['Poppins'] font-bold text-[16px] mb-[4px] ${
                              preferences.darkMode ? "text-white" : "text-[#1e293b]"
                            }`}>
                              {siswa.name}
                            </h3>
                            <p className={`font-['Poppins'] text-[13px] ${
                              preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                            }`}>
                              {siswa.email} • {siswa.kelas}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-[24px]">
                          <div className="text-right">
                            <p className={`font-['Poppins'] text-[12px] mb-[4px] ${
                              preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                            }`}>
                              {t.progress}
                            </p>
                            <div className="flex items-center gap-[8px]">
                              <div className="w-[100px] h-[8px] bg-[#e2e8f0] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#46bd84] to-[#10b981] rounded-full"
                                  style={{ width: `${siswa.progress}%` }}
                                />
                              </div>
                              <span className={`font-['Poppins'] text-[14px] font-bold ${
                                preferences.darkMode ? "text-white" : "text-[#1e293b]"
                              }`}>
                                {siswa.progress}%
                              </span>
                            </div>
                          </div>
                          <button className="flex items-center gap-[4px] text-[#8b5cf6] font-['Poppins'] text-[13px] hover:underline">
                            {t.lihatDetail}
                            <ChevronRight className="w-[16px] h-[16px]" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Materi Guru Tab */}
              {activeTab === "materi" && (
                <div className="flex flex-col gap-[16px]">
                  {filteredMateri.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px]">
                      <BookOpen className={`w-[64px] h-[64px] mb-[16px] ${
                        preferences.darkMode ? "text-[#64748b]" : "text-[#94a3b8]"
                      }`} />
                      <p className={`font-['Poppins'] text-[14px] ${
                        preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                      }`}>
                        {t.noData}
                      </p>
                    </div>
                  ) : (
                    filteredMateri.map((materi) => (
                      <div
                        key={materi.id}
                        className={`flex items-center justify-between p-[20px] rounded-[16px] border-2 transition-colors duration-300 ${
                          preferences.darkMode 
                            ? "bg-[#475569] border-[#64748b]" 
                            : "bg-[#f8fafc] border-[#e2e8f0]"
                        }`}
                      >
                        <div className="flex items-center gap-[16px]">
                          <div className="w-[48px] h-[48px] bg-gradient-to-br from-[#f59e0b] to-[#f97316] rounded-[12px] flex items-center justify-center">
                            <FileText className="w-[24px] h-[24px] text-white" />
                          </div>
                          <div>
                            <h3 className={`font-['Poppins'] font-bold text-[16px] mb-[4px] ${
                              preferences.darkMode ? "text-white" : "text-[#1e293b]"
                            }`}>
                              {materi.title}
                            </h3>
                            <p className={`font-['Poppins'] text-[13px] ${
                              preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                            }`}>
                              {t.guru}: {materi.guruName} • {materi.kelasName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-[24px]">
                          <div className="flex items-center gap-[8px]">
                            <Play className={`w-[16px] h-[16px] ${
                              preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                            }`} />
                            <span className={`font-['Poppins'] text-[14px] ${
                              preferences.darkMode ? "text-white" : "text-[#1e293b]"
                            }`}>
                              {materi.stepCount} {t.steps}
                            </span>
                          </div>
                          <button className="flex items-center gap-[4px] text-[#8b5cf6] font-['Poppins'] text-[13px] hover:underline">
                            {t.lihatDetail}
                            <ChevronRight className="w-[16px] h-[16px]" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Project Tab */}
              {activeTab === "project" && (
                <div className="flex flex-col gap-[16px]">
                  {filteredProject.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px]">
                      <Briefcase className={`w-[64px] h-[64px] mb-[16px] ${
                        preferences.darkMode ? "text-[#64748b]" : "text-[#94a3b8]"
                      }`} />
                      <p className={`font-['Poppins'] text-[14px] ${
                        preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                      }`}>
                        {t.noData}
                      </p>
                    </div>
                  ) : (
                    filteredProject.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between p-[20px] rounded-[16px] border-2 transition-colors duration-300 ${
                          preferences.darkMode 
                            ? "bg-[#475569] border-[#64748b]" 
                            : "bg-[#f8fafc] border-[#e2e8f0]"
                        }`}
                      >
                        <div className="flex items-center gap-[16px]">
                          <div className="w-[48px] h-[48px] bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-[12px] flex items-center justify-center">
                            <Briefcase className="w-[24px] h-[24px] text-white" />
                          </div>
                          <div>
                            <h3 className={`font-['Poppins'] font-bold text-[16px] mb-[4px] ${
                              preferences.darkMode ? "text-white" : "text-[#1e293b]"
                            }`}>
                              {project.title}
                            </h3>
                            <p className={`font-['Poppins'] text-[13px] ${
                              preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                            }`}>
                              {project.kelasName} • {project.guruName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-[24px]">
                          <div className="flex items-center gap-[8px]">
                            <Users className={`w-[16px] h-[16px] ${
                              preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                            }`} />
                            <span className={`font-['Poppins'] text-[14px] ${
                              preferences.darkMode ? "text-white" : "text-[#1e293b]"
                            }`}>
                              {project.studentCount} {t.siswa}
                            </span>
                          </div>
                          <span className={`px-[12px] py-[4px] rounded-full text-[12px] font-['Poppins'] ${
                            project.status === "Aktif" 
                              ? "bg-[#dcfce7] text-[#16a34a]" 
                              : "bg-[#f1f5f9] text-[#64748b]"
                          }`}>
                            {project.status}
                          </span>
                          <button className="flex items-center gap-[4px] text-[#8b5cf6] font-['Poppins'] text-[13px] hover:underline">
                            {t.lihatDetail}
                            <ChevronRight className="w-[16px] h-[16px]" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
