"use client";

import { useState, useEffect } from "react";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { Search, Plus, Users, User, Edit2, Trash2, X, Eye, EyeOff, UserCheck, BookOpen, Sparkles, LayoutDashboard, LogOut, Menu, Activity as ActivityIcon, GraduationCap } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { ProfileHeader } from "../components/ProfileHeader";
import { toast } from "sonner";
import { userAPI, classAPI, authAPI } from "../utils/api";
import { customPopup } from "../context/PopupContext";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface Siswa {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  classId?: string;
  className?: string;
}

interface Kelas {
  id: string;
  name: string;
  grade: string;
  subject: string;
}

export default function KelolaSiswa() {
  const { preferences } = useSettings();
  const { session, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    classId: "",
  });

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>("all");

  // Fetch siswa list from backend
  const fetchSiswaList = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      console.error("❌ No access token available");
      return;
    }
    
    try {
      setLoading(true);
      const response = await userAPI.getByRole("siswa", token);
      console.log("📋 Raw siswa response:", response);
      
      // Pastikan mapping className dan ID dari backend
      const users = Array.isArray(response?.users)
        ? response.users.map((siswa) => {
            console.log("👤 Siswa data:", siswa);
            return {
              ...siswa,
              // Ensure ID is properly mapped - try multiple field names
              id: siswa.id || siswa.user_id || siswa.uuid || siswa.profile_id,
              className: siswa.className || siswa.class_name || siswa.kelas_name || "-",
              classId: siswa.class_id || siswa.classId || null,
            };
          })
        : [];
      
      console.log("📋 Processed siswa list:", users);
      setSiswaList(users);
    } catch (error: any) {
      console.error("Error fetching siswa:", error);
      toast.error("Gagal memuat daftar siswa");
      setSiswaList([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch kelas list for student assignment
  const fetchKelasList = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      console.error("❌ No access token available");
      return;
    }
    
    try {
      const response = await classAPI.getAll(token);
      setKelasList(response.kelas || []);
    } catch (error: any) {
      console.error("Error fetching kelas:", error);
    }
  };

  useEffect(() => {
    fetchSiswaList();
    fetchKelasList();
  }, [session]);

  const filteredSiswa = siswaList.filter((siswa) => {
    const matchesSearch = 
      siswa.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      siswa.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = 
      selectedKelasFilter === "all" || 
      siswa.classId === selectedKelasFilter;
    
    return matchesSearch && matchesClass;
  });

  const handleAddSiswa = () => {
    setEditingSiswa(null);
    setFormData({ name: "", email: "", password: "", classId: "" });
    setShowModal(true);
  };

  const handleEditSiswa = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormData({
      name: siswa.name,
      email: siswa.email,
      password: "",
      classId: siswa.classId || "",
    });
    setShowModal(true);
  };

  const handleDeleteSiswa = async (id: string) => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      toast.error("Sesi tidak valid, silakan login kembali");
      return;
    }
    
    console.log("🗑️ Attempting to delete siswa with ID:", id);
    
    if (!id || id === "undefined") {
      console.error("❌ Invalid ID:", id);
      toast.error("ID siswa tidak valid");
      return;
    }
    
    const isConfirmed = await customPopup.confirm("Apakah Anda yakin ingin menghapus siswa ini?", 'warning');
    if (!isConfirmed) return;
    
    try {
      await userAPI.delete(id, token);
      toast.success("Siswa berhasil dihapus!");
      fetchSiswaList();
    } catch (error: any) {
      console.error("Error deleting siswa:", error);
      toast.error(error.message || "Gagal menghapus siswa");
    }
  };

  const handleSaveSiswa = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      toast.error("Sesi tidak valid, silakan login kembali");
      return;
    }

    const username = formData.email.trim();
    if (!formData.name || !username) {
      toast.error("Nama dan username harus diisi!");
      return;
    }

    // For new students, require password
    if (!editingSiswa && !formData.password) {
      toast.error("Password harus diisi untuk siswa baru!");
      return;
    }

    // Derive a clean, valid email from username
    const derivedEmail = username.includes("@")
      ? username
      : `${username.toLowerCase().replace(/\s+/g, "")}@studywithme.id`;

    try {
      setSaving(true);
      if (editingSiswa) {
        // Update existing siswa
        console.log("📝 Updating siswa:", editingSiswa.id, formData);
        const updateData = {
          name: formData.name,
          email: derivedEmail,
          classId: formData.classId || null, // camelCase - sesuai dengan backend
        };
        console.log("📤 Update data:", updateData);
        await userAPI.update(editingSiswa.id, updateData, token);
        console.log("✅ Siswa updated successfully");
        toast.success("Data siswa berhasil diupdate!");
      } else {
        // Create new siswa
        console.log("➕ Creating new siswa:", formData);
        const response = await authAPI.createUser({
          email: derivedEmail,
          password: formData.password,
          name: formData.name,
          role: "siswa",
          classId: formData.classId || undefined,
        }, token);
        console.log("✅ Siswa created successfully:", response);
        toast.success("Siswa baru berhasil ditambahkan!");
      }
      setShowModal(false);
      await fetchSiswaList();
    } catch (error: any) {
      console.error("❌ Error saving siswa:", error);
      toast.error(error.message || "Gagal menyimpan siswa. Cek console untuk detail.");
    } finally {
      setSaving(false);
    }
  };

  const texts = {
    id: {
      title: "Kelola Siswa",
      subtitle: "Daftar Dan Kelola Akun Siswa",
      search: "Cari siswa...",
      addButton: "Tambah Siswa Baru",
      noStudent: "Belum ada siswa",
      clickAdd: 'Klik tombol "Tambah Siswa Baru"',
      modalTitleAdd: "Tambah Siswa",
      modalTitleEdit: "Edit Siswa",
      fullName: "Nama Lengkap",
      email: "Username",
      password: "Password",
      assignClass: "Assign ke Kelas",
      cancel: "Batal",
      save: "Simpan",
      placeholderName: "Contoh: Ahmad Fadli",
      placeholderEmail: "Contoh: budi",
      placeholderPassword: "••••••••",
      selectClass: "Pilih Kelas",
      loading: "Memuat data...",
    },
    en: {
      title: "Manage Students",
      subtitle: "List And Manage Student Accounts",
      search: "Search students...",
      addButton: "Add New Student",
      noStudent: "No students yet",
      clickAdd: 'Click "Add New Student" button',
      modalTitleAdd: "Add Student",
      modalTitleEdit: "Edit Student",
      fullName: "Full Name",
      email: "Username",
      password: "Password",
      assignClass: "Assign to Class",
      cancel: "Cancel",
      save: "Save",
      placeholderName: "Example: Ahmad Fadli",
      placeholderEmail: "Example: budi",
      placeholderPassword: "••••••••",
      selectClass: "Select Class",
      loading: "Loading...",
    },
  };

  const t = texts[preferences.language];
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("siswa");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-admin" },
    { id: "kelas", label: "Kelola Kelas", icon: BookOpen, path: "/dashboard-admin/kelola-kelas" },
    { id: "guru", label: "Kelola Guru", icon: GraduationCap, path: "/dashboard-admin/kelola-guru" },
    { id: "siswa", label: "Kelola Siswa", icon: Users, path: "/dashboard-admin/kelola-siswa" },
    { id: "monitoring", label: "Monitoring", icon: ActivityIcon, path: "/dashboard-admin/monitoring" },
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
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#CAF0F8]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#CAF0F8]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#DCFCE7]/30 blur-3xl" />
      </div>

      {/* Mobile: floating menu button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#00B4D8] hover:bg-white transition-all duration-200 lg:hidden"
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

      {/* Sidebar */}
      <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
        <SideBarAdmin />
      </div>

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Left - Kelola Siswa Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <Sparkles className="h-4 w-4 text-[#0077B6]" />
              <span className="text-sm font-semibold text-[#00B4D8]">{t.title}</span>
            </div>

            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <h1 className="text-3xl font-bold text-[#00B4D8] mb-3">
                {t.subtitle}
              </h1>
              <p className="text-base text-[#64748B]">
                Kelola akun siswa, assign ke kelas, dan pantau aktivitas belajar.
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn">
            {/* Search, Filter and Add Button */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/70 border border-[#E2E8F0] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                {/* Class Filter Dropdown */}
                <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 border border-[#E2E8F0]">
                  <BookOpen className="w-4 h-4 text-[#64748B]" />
                  <select
                    value={selectedKelasFilter}
                    onChange={(e) => setSelectedKelasFilter(e.target.value)}
                    className="bg-transparent text-sm text-[#00B4D8] outline-none cursor-pointer pr-8"
                  >
                    <option value="all">Semua Kelas</option>
                    {kelasList.map((kelas) => (
                      <option key={kelas.id} value={kelas.id}>
                        {kelas.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleAddSiswa}
                className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center gap-2 hover:shadow-[0_8px_24px_-4px_rgba(86,182,198,0.2)] transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                {t.addButton}
              </button>
            </div>

            {/* Student List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#0077B6]" />
                  <p className="text-sm text-[#94A3B8] mt-4">
                    {t.loading}
                  </p>
                </div>
              ) : filteredSiswa.length === 0 && !searchQuery ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <Users className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                  <h3 className="text-sm font-semibold text-[#94A3B8] mb-1">
                    {t.noStudent}
                  </h3>
                  <p className="text-sm text-[#94A3B8]">
                    {t.clickAdd}
                  </p>
                </div>
            ) : filteredSiswa.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Search className={`w-[64px] h-[64px] mb-[16px] ${preferences.darkMode ? "text-[#64748b]" : "text-[#94a3b8]"}`} />
                <h3 className={`font-['Poppins'] font-semibold text-[18px] mb-[8px] ${
                  preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                }`}>
                  {searchQuery ? "Siswa tidak ditemukan" : "Tidak ada siswa di kelas ini"}
                </h3>
                {selectedKelasFilter !== "all" && (
                  <p className={`font-['Poppins'] text-[14px] ${
                    preferences.darkMode ? "text-[#64748b]" : "text-[#94a3b8]"
                  }`}>
                    Coba filter kelas lain atau tambah siswa baru
                  </p>
                )}
              </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredSiswa.map((siswa) => (
                    <div
                      key={siswa.id}
                      className="flex items-center justify-between p-4 rounded-[2rem] bg-white/70 border border-[#E2E8F0]/50 hover:bg-white/90 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#C8B6E2] flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-[#4A3B69]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00B4D8] text-base mb-1">
                            {siswa.name}
                          </h3>
                          <p className="text-sm text-[#64748B] mb-1">
                            {siswa.email.includes("@studywithme.id") || siswa.email.includes("@edulearn.com") ? siswa.email.split("@")[0] : siswa.email}
                          </p>
                          {siswa.className && (
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                              <p className="text-xs text-[#64748B]">
                                {siswa.className}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSiswa(siswa)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#CAF0F8] transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-[#0077B6]" />
                        </button>
                        <button
                          onClick={() => handleDeleteSiswa(siswa.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#FEE2E2] transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-[#EF4444]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-8 w-[520px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-2xl text-[#00B4D8]">
                {editingSiswa ? t.modalTitleEdit : t.modalTitleAdd}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            <div className="flex flex-col gap-5 mb-6">
              <div>
                <label className="font-semibold text-sm text-[#00B4D8] mb-2 block">
                  {t.fullName} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t.placeholderName}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm text-[#00B4D8] placeholder:text-[#94A3B8] bg-white/70 border border-[#E2E8F0] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="font-semibold text-sm text-[#00B4D8] mb-2 block">
                  {t.email} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t.placeholderEmail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm text-[#00B4D8] placeholder:text-[#94A3B8] bg-white/70 border border-[#E2E8F0] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="font-semibold text-sm text-[#00B4D8] mb-2 block">
                  {t.password} {!editingSiswa && <span className="text-[#EF4444]">*</span>}
                  {editingSiswa && <span className="text-[#64748B] text-xs font-normal"> (Kosongkan jika tidak ingin mengubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t.placeholderPassword}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-sm text-[#00B4D8] placeholder:text-[#94A3B8] bg-white/70 border border-[#E2E8F0] rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0077B6] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-sm text-[#00B4D8] mb-2 block">
                  {t.assignClass}
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full text-sm text-[#00B4D8] bg-white/70 border border-[#E2E8F0] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
                >
                  <option value="">{t.selectClass}</option>
                  {kelasList.map((kelas) => (
                    <option key={kelas.id} value={kelas.id}>
                      {kelas.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border-2 border-[#0077B6] text-[#0077B6] font-semibold text-sm py-3 rounded-[2rem] hover:bg-[#CAF0F8] transition-colors"
                disabled={saving}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveSiswa}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white font-semibold text-sm py-3 rounded-[2rem] hover:shadow-[0_8px_24px_-4px_rgba(86,182,198,0.2)] transition-all disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
