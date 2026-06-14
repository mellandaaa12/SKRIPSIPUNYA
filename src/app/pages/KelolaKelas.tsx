"use client";

import { useState, useEffect } from "react";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { Search, Plus, Users, Edit2, Trash2, X, UserCheck, BookOpen, Sparkles, LayoutDashboard, LogOut, Menu, Activity as ActivityIcon, FileText, ChevronLeft, ArrowRight, UserPlus, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ProfileHeader } from "../components/ProfileHeader";
import { toast } from "sonner";
import { classAPI, userAPI, scheduleAPI, formatClassDisplayName } from "../utils/api";
import { supabase } from "../utils/supabase";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { CuteClassCard } from "../components/CuteClassCard";
import { MacFolderVisual } from "../components/MacFolderVisual";
import { customPopup } from "../context/PopupContext";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface Kelas {
  id: string;
  name: string;
  grade: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
  studentCount?: number;
}

interface Guru {
  id: string;
  name: string;
  email: string;
}

export default function KelolaKelas() {
  const { session, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",      // Rombel (Kelas Ke-berapa)
    grade: "",     // Tingkat (Kelas Berapa)
    subject: "",   // Jurusan
    teacherId: "",
  });

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);

  // States for Detail View
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeTab, setActiveTab] = useState<"siswa" | "materi" | "guru" | "jadwal">("siswa");
  const [selectedClass, setSelectedClass] = useState<Kelas | null>(null);
  const [classDetails, setClassDetails] = useState<{
    students: any[];
    materials: any[];
    projects: any[];
    otherTeachers: any[];
    schedules: any[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    day: "Senin",
    start_time: "07:00",
    end_time: "08:30",
    subject: ""
  });

  // States for Teacher Modal
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherFormData, setTeacherFormData] = useState({
    teacherId: "",
    subjectId: ""
  });
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  const [showAddSiswaModal, setShowAddSiswaModal] = useState(false);
  const [siswaPickerSearch, setSiswaPickerSearch] = useState("");
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<Set<string>>(new Set());
  const [siswaCandidates, setSiswaCandidates] = useState<any[]>([]);
  const [guruSearchKelasModal, setGuruSearchKelasModal] = useState("");
  const [guruSearchPengampuModal, setGuruSearchPengampuModal] = useState("");

  // Fetch kelas list from backend
  const fetchKelasList = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await classAPI.getAll(token);
      const classes = Array.isArray(response?.kelas)
        ? response.kelas.map((kelas) => ({
            ...kelas,
            id: kelas.id || kelas.class_id || kelas.uuid || kelas.kelas_id,
            teacherName: kelas.teacherName || kelas.teacher_name || kelas.guru_name || "-",
            teacherId: kelas.teacherId || kelas.teacher_id || kelas.guru_id || null,
          }))
        : [];
      setKelasList(classes);
    } catch (error: any) {
      toast.error("Gagal memuat daftar kelas");
      setKelasList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuruList = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) return;
    try {
      const response = await userAPI.getByRole("guru", token);
      const users = Array.isArray(response?.users) ? response.users : [];
      setGuruList(users);
    } catch (error: any) {
      setGuruList([]);
    }
  };

  const fetchSubjectsList = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) return;
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,name")
        .order("name", { ascending: true });
      if (error) throw error;
      setSubjectsList(data || []);
    } catch (error: any) {
      setSubjectsList([]);
    }
  };

  const fetchClassDetails = async (classId: string) => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) return;

    try {
      setLoadingDetails(true);
      const [response, scheduleRes] = await Promise.all([
        classAPI.getDetails(classId, token),
        scheduleAPI.getClassSchedules(classId, token)
      ]);
      
      if (response && response.classDetails) {
        setClassDetails({
          students: response.classDetails.students || [],
          materials: response.classDetails.materials || [],
          projects: response.classDetails.projects || [],
          otherTeachers: response.classDetails.otherTeachers || [],
          schedules: scheduleRes.schedules || []
        });
      }
    } catch (error: any) {
      console.error("❌ Detail Error:", error.message || error);
      toast.error("Gagal memuat detail kelas: " + (error.message || "Unknown Error"));
      setClassDetails({ students: [], materials: [], projects: [], otherTeachers: [], schedules: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchKelasList();
    fetchGuruList();
    fetchSubjectsList();
  }, [session]);

  useEffect(() => {
    const token = session?.access_token || localStorage.getItem("access_token");
    if (!token) return;
    const channel = supabase
      .channel("admin-kelas-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => {
        void fetchKelasList();
        if (viewMode === "detail" && selectedClass?.id) void fetchClassDetails(selectedClass.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void fetchKelasList();
        if (viewMode === "detail" && selectedClass?.id) void fetchClassDetails(selectedClass.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "class_subjects" }, () => {
        void fetchKelasList();
        if (viewMode === "detail" && selectedClass?.id) void fetchClassDetails(selectedClass.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pembelajaran" }, () => {
        if (viewMode === "detail" && selectedClass?.id) void fetchClassDetails(selectedClass.id);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.access_token, viewMode, selectedClass?.id]);

  const openAddSiswaModal = async () => {
    if (!selectedClass?.id) return;
    const token = session?.access_token || localStorage.getItem("access_token");
    if (!token) return;
    setSiswaPickerSearch("");
    setSelectedSiswaIds(new Set());
    try {
      const res = await userAPI.getByRole("siswa", token);
      const all = res.users || [];
      const candidates = all.filter((s: any) => s.class_id !== selectedClass.id);
      setSiswaCandidates(candidates);
      setShowAddSiswaModal(true);
    } catch {
      toast.error("Gagal memuat daftar siswa");
    }
  };

  const toggleSiswaPick = (id: string) => {
    setSelectedSiswaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAssignSiswa = async () => {
    if (!selectedClass?.id || selectedSiswaIds.size === 0) {
      toast.error("Pilih minimal satu siswa");
      return;
    }
    const token = session?.access_token || localStorage.getItem("access_token");
    if (!token) return;
    try {
      setSaving(true);
      const { updated } = await userAPI.assignStudentsToClass(selectedClass.id, [...selectedSiswaIds], token);
      toast.success(`${updated} siswa ditambahkan ke kelas`);
      setShowAddSiswaModal(false);
      setSelectedSiswaIds(new Set());
      await fetchKelasList();
      await fetchClassDetails(selectedClass.id);
    } catch (e: any) {
      toast.error(e.message || "Gagal menambahkan siswa");
    } finally {
      setSaving(false);
    }
  };

  const filteredGuruForKelasModal = guruList.filter(
    (g) =>
      !guruSearchKelasModal.trim() ||
      g.name?.toLowerCase().includes(guruSearchKelasModal.toLowerCase()) ||
      g.email?.toLowerCase().includes(guruSearchKelasModal.toLowerCase())
  );

  const filteredGuruForPengampuModal = guruList.filter(
    (g) =>
      !guruSearchPengampuModal.trim() ||
      g.name?.toLowerCase().includes(guruSearchPengampuModal.toLowerCase()) ||
      g.email?.toLowerCase().includes(guruSearchPengampuModal.toLowerCase())
  );

  const filteredSiswaCandidates = siswaCandidates.filter(
    (s) =>
      !siswaPickerSearch.trim() ||
      s.name?.toLowerCase().includes(siswaPickerSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(siswaPickerSearch.toLowerCase())
  );

  const openTeacherModal = () => {
    setGuruSearchPengampuModal("");
    setShowTeacherModal(true);
  };

  const openScheduleModal = () => {
    // Reset form data to defaults when opening modal
    setScheduleFormData({
      day: "Senin",
      start_time: "07:00",
      end_time: "08:30",
      subject: ""
    });
    setShowScheduleModal(true);
  };

  const filteredKelas = kelasList.filter((kelas) => {
    const q = searchQuery.toLowerCase();
    const disp = ((kelas as any).displayName || formatClassDisplayName(kelas)).toLowerCase();
    return (
      disp.includes(q) ||
      kelas.name?.toLowerCase().includes(q) ||
      kelas.subject?.toLowerCase().includes(q) ||
      kelas.grade?.toLowerCase().includes(q)
    );
  });

  const handleAddKelas = () => {
    setEditingKelas(null);
    setFormData({ name: "", grade: "", subject: "", teacherId: "" });
    setGuruSearchKelasModal("");
    setShowModal(true);
  };

  const handleEditKelas = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setFormData({
      name: kelas.name,
      grade: kelas.grade || "",
      subject: kelas.subject || "",
      teacherId: kelas.teacherId || "",
    });
    setGuruSearchKelasModal("");
    setShowModal(true);
  };

  const handleDeleteKelas = async (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) return;
    
    const isConfirmed = await customPopup.confirm("Apakah Anda yakin ingin menghapus kelas ini?", 'warning');
    if (!isConfirmed) return;
    
    try {
      await classAPI.delete(id, token);
      toast.success("Kelas berhasil dihapus!");
      if (viewMode === "detail" && selectedClass?.id === id) {
        setViewMode("list");
        setSelectedClass(null);
      }
      fetchKelasList();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kelas");
    }
  };

  const handleSaveKelas = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) return;

    if (!formData.name || !formData.subject || !formData.grade) {
      toast.error("Semua field harus diisi!");
      return;
    }

    try {
      setSaving(true);
      if (editingKelas) {
        await classAPI.update(editingKelas.id, {
          name: formData.name,
          grade: formData.grade,
          subject: formData.subject,
          teacherId: formData.teacherId || null,
        }, token);
        toast.success("Kelas berhasil diupdate!");
      } else {
        await classAPI.create({
          name: formData.name,
          grade: formData.grade,
          subject: formData.subject,
          teacherId: formData.teacherId || null,
        }, token);
        toast.success("Kelas baru berhasil ditambahkan!");
      }
      setShowModal(false);
      await fetchKelasList();
      
      // If we are editing the class that is currently viewed in detail, refresh its details
      if (editingKelas && selectedClass?.id === editingKelas.id) {
        await fetchClassDetails(selectedClass.id);
        // Update selectedClass with new teacher info from the refreshed list
        const response = await classAPI.getAll(token);
        const updatedClass = response?.kelas?.find((c: any) => c.id === editingKelas.id);
        if(updatedClass) {
           setSelectedClass({
              ...selectedClass,
              teacherName: updatedClass.teacherName || updatedClass.teacher_name || "-",
              teacherId: updatedClass.teacherId || updatedClass.teacher_id || null,
           });
        }
      }

    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan kelas");
    } finally {
      setSaving(false);
    }
  };

  const openClassDetail = (kelas: Kelas) => {
    setSelectedClass(kelas);
    setViewMode("detail");
    setActiveTab("siswa");
    setClassDetails(null);
    fetchClassDetails(kelas.id);
  };

  const backToList = () => {
    setViewMode("list");
    setSelectedClass(null);
    setClassDetails(null);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token || !selectedClass?.id) return;

    // Validate that end_time is after start_time
    if (scheduleFormData.end_time <= scheduleFormData.start_time) {
      toast.error("Waktu selesai harus lebih besar dari waktu mulai!");
      return;
    }

    // Validate subject is not empty
    if (!scheduleFormData.subject.trim()) {
      toast.error("Mata pelajaran tidak boleh kosong!");
      return;
    }

    try {
      setSaving(true);
      await scheduleAPI.addClassSchedule(selectedClass.id, scheduleFormData, token);
      // Reset form after successful submission
      setScheduleFormData({
        day: "Senin",
        start_time: "07:00",
        end_time: "08:30",
        subject: ""
      });
      setShowScheduleModal(false);
      toast.success("Jadwal belajar berhasil ditambahkan!");
      fetchClassDetails(selectedClass.id);
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan jadwal");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token || !selectedClass?.id) return;
    
    const isConfirmed = await customPopup.confirm("Apakah Anda yakin ingin menghapus jadwal ini?", 'warning');
    if (isConfirmed) {
      try {
        await scheduleAPI.deleteClassSchedule(id, token);
        toast.success("Jadwal berhasil dihapus!");
        fetchClassDetails(selectedClass.id);
      } catch (error: any) {
        toast.error("Gagal menghapus jadwal");
      }
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token || !selectedClass?.id) return;

    if (!teacherFormData.teacherId || !teacherFormData.subjectId) {
      toast.error("Pilih guru dan mata pelajaran!");
      return;
    }

    try {
      setSaving(true);
      await classAPI.addClassSubject({
        classId: selectedClass.id,
        subjectId: teacherFormData.subjectId,
        teacherId: teacherFormData.teacherId,
      }, token);
      toast.success("Guru pengampu berhasil ditambahkan!");
      setShowTeacherModal(false);
      setTeacherFormData({ teacherId: "", subjectId: "" });
      fetchClassDetails(selectedClass.id);
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan guru pengampu");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTeacher = async (classSubjectId: string) => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) return;

    const isConfirmed = await customPopup.confirm("Apakah Anda yakin ingin menghapus guru pengampu ini?", 'warning');
    if (!isConfirmed) return;

    try {
      await classAPI.deleteClassSubject(classSubjectId, token);
      toast.success("Guru pengampu berhasil dihapus!");
      if (selectedClass?.id) {
        fetchClassDetails(selectedClass.id);
      }
    } catch (error: any) {
      toast.error("Gagal menghapus guru pengampu");
    }
  };

  const t = {
    title: "Kelola Kelas",
    subtitle: "Kelola Kelas",
    search: "Cari kelas...",
    addButton: "Buat Kelas Baru",
    noClass: "Belum ada kelas",
    clickAdd: 'Klik tombol "Buat Kelas Baru"',
    teacher: "Wali/Guru:",
    modalTitleAdd: "Buat Kelas Baru",
    modalTitleEdit: "Edit Kelas",
    className: "Rombel / Kelas Ke-berapa",
    classGrade: "Tingkat (Kelas Berapa)",
    classSubject: "Jurusan",
    assignTeacher: "Assign Guru",
    cancel: "Batal",
    save: "Buat Kelas",
    update: "Simpan Perubahan",
    placeholderClass: "Contoh: 1 (untuk RPL 1)",
    placeholderGrade: "Contoh: XI",
    placeholderSubject: "Contoh: Rekayasa Perangkat Lunak",
    selectTeacher: "Pilih Guru (Opsional)",
    loading: "Memuat data...",
  };

  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("kelas");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-admin" },
    { id: "kelas", label: "Kelola Kelas", icon: BookOpen, path: "/dashboard-admin/kelola-kelas" },
    { id: "guru", label: "Kelola Guru", icon: Users, path: "/dashboard-admin/kelola-guru" },
    { id: "siswa", label: "Kelola Siswa", icon: Users, path: "/dashboard-admin/kelola-siswa" },
    { id: "monitoring", label: "Monitor", icon: ActivityIcon, path: "/dashboard-admin/monitoring" },
  ];

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
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#0077B6]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#0077B6]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
      </div>
      
      {/* Mobile Menu Btn */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#1A1A2E] hover:bg-white transition-all duration-200 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2rem] border border-[#E2E8F0]/30 bg-white/75 backdrop-blur-16 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1A1A2E]">Menu</h2>
                <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 rounded-xl p-3 text-left text-sm font-medium text-[#1A1A2E] hover:bg-white/60">
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

      {/* Sidebar */}
      <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
        <SideBarAdmin />
      </div>

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {viewMode === "list" ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Sparkles className="h-4 w-4 text-[#0077B6]" />
                <span className="text-sm font-semibold text-[#0077B6]">{t.title}</span>
              </div>
            ) : (
              <button onClick={backToList} className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white hover:bg-white/90 border border-[#E2E8F0] shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] transition-colors group cursor-pointer">
                <ChevronLeft className="h-4 w-4 text-[#0077B6] group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-semibold text-[#1A1A2E]">Kembali ke Daftar Kelas</span>
              </button>
            )}
            <ProfileHeader />
          </div>

          {viewMode === "list" ? (
            <>
              {/* Welcome Section */}
              <div className="mb-8 animate-slideIn">
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-[#0077B6] mb-3">{t.subtitle}</h1>
                    <p className="text-base font-medium text-[#64748B]">
                      Pantau siswa dan materi.
                    </p>
                  </div>
                  <button onClick={handleAddKelas} className="bg-[#FFB703] text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#F59E0B] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap">
                    <Plus className="w-4 h-4" />
                    {t.addButton}
                  </button>
                </div>
              </div>

              {/* Class List Panel */}
              <div className="bg-white border border-gray-100 rounded-[3rem] p-5 md:p-6 mb-8 shadow-sm animate-scaleIn">
                {/* Tools */}
                <div className="flex flex-col gap-4 border-b border-[#E2E8F0]/70 pb-5 mb-7 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder={t.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#90E0EF] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="text-sm text-[#64748B] font-medium sm:px-4">
                    Total {filteredKelas.length} Kelas
                  </div>
                </div>

                {/* Grid Cards */}
                <div className="animate-fadeIn">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#0077B6]" />
                      <p className="text-sm text-[#94A3B8] mt-4 font-medium">{t.loading}</p>
                    </div>
                  ) : filteredKelas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#F8FAFC] rounded-[2.5rem] border border-[#E2E8F0]">
                      <BookOpen className="w-16 h-16 mb-4 text-[#CBD5E1]" />
                      <h3 className="text-lg font-bold text-[#1A1A2E] mb-1">{searchQuery ? "Kelas tidak ditemukan" : t.noClass}</h3>
                      <p className="text-sm text-[#64748B]">{searchQuery ? "Coba kata kunci pencarian yang lain." : t.clickAdd}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredKelas.map((kelas, idx) => {
                      return (
                        <CuteClassCard
                          key={kelas.id}
                          kelas={kelas}
                          index={idx}
                          onClick={() => openClassDetail(kelas)}
                          footerLabel="Detail Kelas"
                          actionSlot={
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditKelas(kelas); }}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/85 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
                                title="Edit Kelas"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => { handleDeleteKelas(kelas.id, e); }}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/85 text-red-600 shadow-sm backdrop-blur hover:bg-red-50"
                                title="Hapus Kelas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          }
                        />
                      );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : selectedClass && (
            // Detail View
            <div className="animate-slideIn">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5 flex-1">
                   <div className="w-16 h-16 bg-[#0077B6] rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                     <BookOpen className="w-8 h-8 text-white" />
                   </div>
                   <div>
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                       <span className="px-3 py-1 bg-[#F1F5F9] rounded-full text-[#64748B] text-xs font-semibold">
                         {selectedClass.grade} • {selectedClass.subject}
                       </span>
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                         Dibuat oleh: Admin
                       </span>
                     </div>
                     <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">
                       {(classDetails as any)?.displayName || formatClassDisplayName(selectedClass)}
                     </h1>
                     <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                       <p><strong className="text-[#1A1A2E]">Wali / Guru Utama:</strong> {selectedClass.teacherName && selectedClass.teacherName !== "-" ? selectedClass.teacherName : "Belum Ditugaskan"}</p>
                       <p>•</p>
                       <p><strong className="text-[#1A1A2E]">Total Terdaftar:</strong> {selectedClass.studentCount || 0} Siswa</p>
                     </div>
                   </div>
                </div>
                <button onClick={() => handleEditKelas(selectedClass)} className="bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1A1A2E] font-medium text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all flex-shrink-0">
                  <Edit2 className="w-4 h-4 text-[#0077B6]" /> Edit Kelas
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                 {['siswa', 'materi', 'guru', 'jadwal'].map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={cn("px-6 py-3 rounded-[1.5rem] text-sm font-semibold transition-all whitespace-nowrap", activeTab === tab ? "bg-[#0077B6] text-white shadow-md" : "bg-white text-[#64748B] hover:bg-gray-50 border border-gray-100 shadow-sm")}
                   >
                     {tab === 'siswa' && 'Daftar Siswa'}
                     {tab === 'materi' && 'Materi Pembelajaran'}
                     {tab === 'guru' && 'Guru Pengampu'}
                     {tab === 'jadwal' && 'Jadwal Belajar'}
                   </button>
                 ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm min-h-[400px]">
                 {loadingDetails ? (
                     <div className="flex justify-center items-center h-full py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E2E8F0] border-t-[#0077B6]" /></div>
                 ) : (
                    <>
                       {activeTab === 'siswa' && (
                          <div className="animate-fadeIn">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                              <h3 className="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#0077B6]" /> Daftar Siswa
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="bg-[#F1F5F9] text-[#64748B] text-xs font-bold px-3 py-1 rounded-full">
                                  {classDetails?.students.length || 0} Terdaftar
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void openAddSiswaModal()}
                                  className="text-xs px-4 py-2 bg-[#0077B6] text-white rounded-xl font-semibold hover:bg-[#023E8A] transition-colors flex items-center gap-1"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Tambah siswa
                                </button>
                              </div>
                            </div>
                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-2 max-h-[500px] overflow-y-auto">
                              {classDetails?.students && classDetails.students.length > 0 ? (
                                <div className="space-y-1">
                                  {classDetails.students.map((siswa, i) => (
                                    <div key={siswa.id} className="flex items-center gap-4 p-4 hover:bg-white rounded-xl transition-colors">
                                      <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-sm font-bold text-[#64748B]">
                                        {i + 1}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-[#1A1A2E]">{siswa.name}</p>
                                        <p className="text-xs text-[#94A3B8]">{siswa.email}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-16 flex flex-col items-center justify-center text-center">
                                   <UserPlus className="w-12 h-12 text-[#CBD5E1] mb-3" />
                                   <p className="text-sm font-semibold text-[#64748B]">Belum ada siswa.</p>
                                   <p className="text-xs text-[#94A3B8] mt-1 max-w-sm">Admin dapat mendaftarkan siswa ke kelas ini dari menu Kelola Siswa, kemudian pilih nama siswa dan update kelasnya.</p>
                                </div>
                              )}
                            </div>
                          </div>
                       )}

                       {activeTab === 'materi' && (
                          <div className="animate-fadeIn space-y-8">
                            <div>
                              <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-[#10B981]" /> Materi &amp; quiz (pembelajaran)
                                </h3>
                                <span className="bg-[#DCFCE7] text-[#10B981] text-xs font-bold px-3 py-1 rounded-full">
                                  {classDetails?.materials.length || 0} modul
                                </span>
                              </div>
                              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 max-h-[520px] overflow-y-auto">
                                 {classDetails?.materials && classDetails.materials.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {classDetails.materials.map((materi, idx) => (
                                      <MacFolderVisual
                                        key={materi.id}
                                        title={materi.judul || materi.title || "Materi Tanpa Judul"}
                                        badge={`${materi.steps?.length || 0} Materi`}
                                        status={(materi.status || "published") === "published" ? "published" : "draft"}
                                        themeIndex={idx}
                                        folderSubtitle={materi.deskripsi || materi.description || "Materi Pembelajaran"}
                                      />
                                    ))}
                                  </div>
                                 ) : (
                                   <div className="py-12 flex flex-col items-center justify-center text-center">
                                     <BookOpen className="w-12 h-12 text-[#CBD5E1] mb-3" />
                                     <p className="text-sm font-semibold text-[#64748B]">Belum ada pembelajaran.</p>
                                     <p className="text-xs text-[#94A3B8] mt-1 max-w-sm">Guru kelas ini akan menambahkan materi dan quiz di sini.</p>
                                   </div>
                                 )}
                              </div>
                            </div>
                          </div>
                       )}

                       {activeTab === 'guru' && (
                          <div className="animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-[#8B5CF6]" /> Guru Pengampu
                              </h3>
                              <div className="flex gap-2">
                                <span className="bg-[#EDE9FE] text-[#8B5CF6] text-xs font-bold px-3 py-1 rounded-full">
                                  {classDetails?.otherTeachers?.length ? classDetails.otherTeachers.length + (selectedClass.teacherId ? 1 : 0) : (selectedClass.teacherId ? 1 : 0)} Guru
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 max-h-[500px] overflow-y-auto space-y-4">
                               {/* Wali Kelas / Guru Utama */}
                               <div>
                                 <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Wali / Guru Utama</h4>
                                 {selectedClass?.teacherId && selectedClass?.teacherName ? (
                                    <div className="bg-white border border-[#0077B6]/30 shadow-[0_4px_12px_rgba(86,182,198,0.05)] p-4 rounded-xl flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0077B6] to-[#00B4D8] flex items-center justify-center text-white font-bold shadow-md">
                                          {selectedClass.teacherName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-[#1A1A2E]">{selectedClass.teacherName}</p>
                                          <div className="flex items-center gap-1 mt-0.5">
                                             <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                                             <p className="text-xs text-[#F59E0B] font-semibold">Guru Utama</p>
                                          </div>
                                        </div>
                                      </div>
                                      <button onClick={() => handleEditKelas(selectedClass)} className="text-xs text-[#0077B6] font-semibold hover:underline">
                                        Ubah
                                      </button>
                                    </div>
                                 ) : (
                                    <div className="bg-white border border-dashed border-[#CBD5E1] p-4 rounded-xl flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
                                          <UserCheck className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-medium text-[#64748B]">Belum ada guru utama</p>
                                      </div>
                                      <button onClick={() => handleEditKelas(selectedClass)} className="text-xs px-3 py-1.5 bg-[#0077B6] text-white rounded-lg font-semibold hover:bg-[#023E8A] transition-colors">
                                        Tugaskan
                                      </button>
                                    </div>
                                 )}
                               </div>

                               {/* Guru Pengampu Lainnya */}
                               <div className="pt-2">
                                 <div className="flex items-center justify-between mb-2">
                                   <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Guru Pengampu (Mapel)</h4>
                                   <button 
                                     onClick={openTeacherModal}
                                     className="text-xs px-3 py-1.5 bg-[#8B5CF6] text-white rounded-lg font-semibold hover:bg-[#7C3AED] transition-colors flex items-center gap-1"
                                   >
                                     <Plus className="w-3 h-3" /> Tambah Guru
                                   </button>
                                 </div>
                                 {classDetails?.otherTeachers && classDetails.otherTeachers.length > 0 ? (
                                   <div className="space-y-2">
                                      {classDetails.otherTeachers.map(guru => (
                                        <div key={guru.id} className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] font-bold">
                                              {guru.name?.charAt(0).toUpperCase() || 'G'}
                                            </div>
                                            <div>
                                              <p className="text-sm font-bold text-[#1A1A2E]">{guru.name}</p>
                                              <p className="text-xs text-[#64748B]">{guru.email}</p>
                                            </div>
                                          </div>
                                          <button 
                                            onClick={() => handleRemoveTeacher(guru.class_subject_id || guru.id)}
                                            className="text-xs px-2 py-1 bg-[#FEE2E2] text-[#EF4444] rounded-lg font-semibold hover:bg-[#FECACA] transition-colors"
                                          >
                                            Hapus
                                          </button>
                                        </div>
                                      ))}
                                   </div>
                                 ) : (
                                   <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between gap-3">
                                      <p className="text-sm text-[#94A3B8]">Tidak ada guru pengampu tambahan.</p>
                                      <button 
                                        onClick={openTeacherModal}
                                        className="text-xs px-3 py-1.5 bg-[#8B5CF6] text-white rounded-lg font-semibold hover:bg-[#7C3AED] transition-colors"
                                      >
                                        Tambah Sekarang
                                      </button>
                                   </div>
                                 )}
                               </div>
                            </div>
                          </div>
                       )}

                       {activeTab === 'jadwal' && (
                          <div className="animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#F59E0B]" /> Jadwal Belajar Kelas
                              </h3>
                              <button
                                onClick={openScheduleModal}
                                className="px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white text-sm font-bold rounded-xl shadow hover:shadow-lg transition flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" /> Tambah Jadwal
                              </button>
                            </div>
                            
                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 max-h-[500px] overflow-y-auto space-y-6">
                              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(day => {
                                const daySchedules = classDetails?.schedules?.filter(s => s.day === day) || [];
                                if (daySchedules.length === 0) return null;
                                
                                return (
                                  <div key={day} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                                    <div className="bg-[#FEF3C7] border-b border-[#FDE68A] px-4 py-2">
                                      <h4 className="font-bold text-[#92400E] flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> {day}
                                      </h4>
                                    </div>
                                    <div className="divide-y divide-[#E2E8F0]">
                                      {daySchedules.map(schedule => (
                                        <div key={schedule.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC]">
                                          <div className="flex items-center gap-4">
                                            <div className="bg-[#FFFBEB] text-[#D97706] px-3 py-1.5 rounded-lg font-bold text-sm">
                                              {schedule.start_time} - {schedule.end_time}
                                            </div>
                                            <div>
                                              <p className="font-bold text-[#1A1A2E]">{schedule.subject}</p>
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
                              })}

                              {(!classDetails?.schedules || classDetails.schedules.length === 0) && (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                  <Calendar className="w-12 h-12 text-[#CBD5E1] mb-3" />
                                  <p className="text-sm font-semibold text-[#64748B]">Belum ada jadwal belajar.</p>
                                  <p className="text-xs text-[#94A3B8] mt-1">Tambahkan jadwal belajar untuk menginformasikan siswa.</p>
                                </div>
                              )}
                            </div>
                          </div>
                       )}
                    </>
                 )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Add/Edit Kelas */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white border border-gray-100 rounded-2xl p-8 w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-[#0077B6] rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                 </div>
                 <h2 className="font-bold text-2xl text-[#1A1A2E]">
                   {editingKelas ? t.modalTitleEdit : t.modalTitleAdd}
                 </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-5 mb-8">
              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">
                  {t.classSubject} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t.placeholderSubject}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-sm text-[#1A1A2E] placeholder:text-[#94A3B8] bg-white border-2 border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-[#90E0EF] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">
                    {t.classGrade} <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t.placeholderGrade}
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full text-sm text-[#1A1A2E] placeholder:text-[#94A3B8] bg-white border-2 border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-[#90E0EF] transition-all"
                  />
                </div>
                <div>
                  <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">
                    {t.className} <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t.placeholderClass}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm text-[#1A1A2E] placeholder:text-[#94A3B8] bg-white border-2 border-[#E2E8F0] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#0077B6] focus:ring-4 focus:ring-[#90E0EF] transition-all"
                  />
                </div>
              </div>
              
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mt-2">
                 <p className="text-xs text-[#64748B] font-medium flex items-center gap-2">
                   <ActivityIcon className="w-4 h-4 text-[#0077B6]" />
                   Preview Nama Kelas: <strong className="text-[#1A1A2E]">{formData.grade} {formData.subject} {formData.name}</strong>
                 </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">{t.assignTeacher}</label>
                <input
                  type="search"
                  placeholder="Cari nama atau email guru..."
                  value={guruSearchKelasModal}
                  onChange={(e) => setGuruSearchKelasModal(e.target.value)}
                  className="w-full px-4 py-2.5 mb-2 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none text-[#1A1A2E]"
                />
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0077B6] focus:border-[#0077B6] outline-none transition-all text-[#1A1A2E] appearance-none"
                  value={formData.teacherId || ""}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                >
                  <option value="">-- {t.selectTeacher} --</option>
                  {filteredGuruForKelasModal.map((guru) => (
                    <option key={guru.id} value={guru.id}>
                      {guru.name} ({guru.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-[#E2E8F0] text-[#64748B] px-4 py-3 rounded-xl font-bold hover:bg-[#F8FAFC] transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveKelas}
                disabled={saving}
                className="flex-1 bg-[#0077B6] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#023E8A] transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {saving ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   editingKelas ? t.update : t.save
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1A1A2E]">Tambah Jadwal Kelas</h2>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">Hari</label>
                <select value={scheduleFormData.day} onChange={e => setScheduleFormData({...scheduleFormData, day: e.target.value})} className="w-full p-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0077B6] outline-none text-black">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">Mulai</label>
                  <input type="time" required value={scheduleFormData.start_time} onChange={e => setScheduleFormData({...scheduleFormData, start_time: e.target.value})} className="w-full p-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0077B6] outline-none text-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">Selesai</label>
                  <input type="time" required value={scheduleFormData.end_time} onChange={e => setScheduleFormData({...scheduleFormData, end_time: e.target.value})} className="w-full p-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0077B6] outline-none text-black" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">Mata Pelajaran</label>
                <input type="text" required placeholder="Contoh: Matematika" value={scheduleFormData.subject} onChange={e => setScheduleFormData({...scheduleFormData, subject: e.target.value})} className="w-full p-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0077B6] outline-none text-black placeholder:text-gray-400" />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-[#0077B6] hover:bg-[#023E8A] transition w-full disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1A1A2E]">Tambah Guru Pengampu</h2>
              <button onClick={() => setShowTeacherModal(false)} className="p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">Mata Pelajaran</label>
                <select 
                  value={teacherFormData.subjectId} 
                  onChange={e => setTeacherFormData({...teacherFormData, subjectId: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0077B6] outline-none"
                  required
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjectsList.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">Guru Pengampu</label>
                <input
                  type="search"
                  placeholder="Cari guru..."
                  value={guruSearchPengampuModal}
                  onChange={(e) => setGuruSearchPengampuModal(e.target.value)}
                  className="w-full p-3 mb-2 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0077B6] outline-none text-sm"
                />
                <select 
                  value={teacherFormData.teacherId} 
                  onChange={e => setTeacherFormData({...teacherFormData, teacherId: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0077B6] outline-none"
                  required
                >
                  <option value="">-- Pilih Guru --</option>
                  {filteredGuruForPengampuModal.map(guru => (
                    <option key={guru.id} value={guru.id}>{guru.name} ({guru.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition w-full disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Tambah Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddSiswaModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#1A1A2E]">Tambah siswa ke kelas</h2>
              <button
                type="button"
                onClick={() => { setShowAddSiswaModal(false); setSelectedSiswaIds(new Set()); }}
                className="p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-[#64748B] mb-3">
              Kelas: <strong>{formatClassDisplayName(selectedClass)}</strong>. Pilih satu atau lebih siswa (bisa pindah dari kelas lain).
            </p>
            <input
              type="search"
              placeholder="Cari nama atau email..."
              value={siswaPickerSearch}
              onChange={(e) => setSiswaPickerSearch(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#E2E8F0] mb-3 text-sm"
            />
            <div className="flex gap-2 mb-3 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#1E293B] font-medium"
                onClick={() => setSelectedSiswaIds(new Set(filteredSiswaCandidates.map((s: any) => s.id)))}
              >
                Pilih semua tampil
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#64748B] font-medium"
                onClick={() => setSelectedSiswaIds(new Set())}
              >
                Reset
              </button>
            </div>
            <div className="flex-1 overflow-y-auto border border-[#E2E8F0] rounded-xl min-h-[200px] max-h-[320px]">
              {filteredSiswaCandidates.length === 0 ? (
                <p className="p-6 text-sm text-[#94A3B8] text-center">Tidak ada siswa yang bisa ditambahkan.</p>
              ) : (
                <ul className="divide-y divide-[#E2E8F0]">
                  {filteredSiswaCandidates.map((s: any) => (
                    <li key={s.id} className="flex items-center gap-3 p-3 hover:bg-[#F8FAFC]">
                      <input
                        type="checkbox"
                        className="rounded border-[#CBD5E1] w-4 h-4"
                        checked={selectedSiswaIds.has(s.id)}
                        onChange={() => toggleSiswaPick(s.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B] truncate">{s.name}</p>
                        <p className="text-xs text-[#94A3B8] truncate">{s.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowAddSiswaModal(false); setSelectedSiswaIds(new Set()); }}
                className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving || selectedSiswaIds.size === 0}
                onClick={() => void handleBulkAssignSiswa()}
                className="flex-1 py-3 rounded-xl bg-[#0077B6] text-white font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : `Simpan (${selectedSiswaIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
