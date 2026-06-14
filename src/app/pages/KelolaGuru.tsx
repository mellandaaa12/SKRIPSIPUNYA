"use client";

import { useState, useEffect } from "react";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { Search, Plus, Mail, User, Edit2, Trash2, X, Eye, EyeOff, UserCheck, BookOpen, Sparkles, LayoutDashboard, LogOut, Menu, Activity as ActivityIcon, GraduationCap } from "lucide-react";
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

interface Guru {
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
}

export default function KelolaGuru() {
  const { preferences } = useSettings();
  const { session, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    classId: "",
  });

  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  // Fetch guru list from backend
  const fetchGuruList = async () => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      console.error("❌ No access token available");
      return;
    }
    
    try {
      setLoading(true);
      const response = await userAPI.getByRole("guru", token);
      console.log("📋 Raw guru response:", response);
      
      // Pastikan mapping className dan ID dari backend
      const users = Array.isArray(response?.users)
        ? response.users.map((guru) => {
            console.log("👨‍🏫 Guru data:", guru);
            return {
              ...guru,
              // Ensure ID is properly mapped - try multiple field names
              id: guru.id || guru.user_id || guru.uuid || guru.profile_id,
              className: guru.className || guru.class_name || guru.kelas_name || "-",
              classId: guru.class_id || guru.classId || null,
            };
          })
        : [];
      
      console.log("📋 Processed guru list:", users);
      setGuruList(users);
    } catch (error: any) {
      console.error("Error fetching guru:", error);
      toast.error("Gagal memuat daftar guru");
      setGuruList([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch kelas list
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
    fetchGuruList();
    fetchKelasList();
  }, [session]);

  const filteredGuru = guruList.filter((guru) =>
    guru.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guru.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddGuru = () => {
    setEditingGuru(null);
    setFormData({ name: "", email: "", password: "", classId: "" });
    setShowModal(true);
  };

  const handleEditGuru = (guru: Guru) => {
    setEditingGuru(guru);
    setFormData({
      name: guru.name,
      email: guru.email,
      password: "",
      classId: guru.classId || "",
    });
    setShowModal(true);
  };

  const handleDeleteGuru = async (id: string) => {
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      toast.error("Sesi tidak valid, silakan login kembali");
      return;
    }
    
    console.log("🗑️ Attempting to delete guru with ID:", id);
    
    if (!id || id === "undefined") {
      console.error("❌ Invalid ID:", id);
      toast.error("ID guru tidak valid");
      return;
    }
    
    const isConfirmed = await customPopup.confirm("Apakah Anda yakin ingin menghapus guru ini?", 'warning');
    if (!isConfirmed) return;
    
    try {
      await userAPI.delete(id, token);
      toast.success("Guru berhasil dihapus!");
      fetchGuruList();
    } catch (error: any) {
      console.error("Error deleting guru:", error);
      toast.error(error.message || "Gagal menghapus guru");
    }
  };

  const handleSaveGuru = async () => {
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

    if (!editingGuru && !formData.password) {
      toast.error("Password harus diisi untuk guru baru!");
      return;
    }

    // Derive a clean, valid email from username
    const derivedEmail = username.includes("@")
      ? username
      : `${username.toLowerCase().replace(/\s+/g, "")}@studywithme.id`;

    try {
      setSaving(true);
      if (editingGuru) {
        // Update existing guru
        console.log("📝 Updating guru:", editingGuru.id, formData);
        await userAPI.update(editingGuru.id, {
          name: formData.name,
          email: derivedEmail,
          classId: formData.classId || null, // camelCase - sesuai dengan backend
        }, token);
        console.log("✅ Guru updated successfully");
        toast.success("Data guru berhasil diupdate!");
      } else {
        // Create new guru
        console.log("➕ Creating new guru:", formData);
        const response = await authAPI.createUser({
          name: formData.name,
          email: derivedEmail,
          password: formData.password,
          role: "guru",
          classId: formData.classId || undefined,
        }, token);
        console.log("✅ Guru created successfully:", response);
        toast.success("Guru baru berhasil ditambahkan!");
      }

      setShowModal(false);
      fetchGuruList();
    } catch (error: any) {
      console.error("Error saving guru:", error);
      toast.error(error.message || "Gagal menyimpan data guru");
    } finally {
      setSaving(false);
    }
  };

  const texts = {
    id: {
      title: "Kelola Guru",
      subtitle: "Daftar Dan Kelola Akun Guru",
      search: "Cari guru...",
      addButton: "Tambah Guru Baru",
      noTeacher: "Belum ada guru",
      clickAdd: 'Klik tombol "Tambah Guru Baru"',
      modalTitleAdd: "Tambah Guru",
      modalTitleEdit: "Edit Guru",
      fullName: "Nama Lengkap",
      email: "Username",
      password: "Password",
      assignClass: "Assign ke Kelas",
      cancel: "Batal",
      save: "Simpan",
      placeholderName: "Contoh: Mr. Mark Jefferson",
      placeholderEmail: "Contoh: budi",
      placeholderPassword: "••••••••",
      selectClass: "Pilih Kelas (Opsional)",
      loading: "Memuat data...",
    },
    en: {
      title: "Manage Teachers",
      subtitle: "List And Manage Teacher Accounts",
      search: "Search teachers...",
      addButton: "Add New Teacher",
      noTeacher: "No teachers yet",
      clickAdd: 'Click "Add New Teacher" button',
      modalTitleAdd: "Add Teacher",
      modalTitleEdit: "Edit Teacher",
      fullName: "Full Name",
      email: "Username",
      password: "Password",
      assignClass: "Assign to Class",
      cancel: "Cancel",
      save: "Save",
      placeholderName: "Example: Mr. Mark Jefferson",
      placeholderEmail: "Example: budi",
      placeholderPassword: "••••••••",
      selectClass: "Select Class (Optional)",
      loading: "Loading...",
    },
  };

  const t = texts[preferences.language];
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("guru");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-admin" },
    { id: "kelas", label: "Kelola Kelas", icon: BookOpen, path: "/dashboard-admin/kelola-kelas" },
    { id: "guru", label: "Kelola Guru", icon: GraduationCap, path: "/dashboard-admin/kelola-guru" },
    { id: "siswa", label: "Kelola Siswa", icon: UserCheck, path: "/dashboard-admin/kelola-siswa" },
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
            className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2rem] border border-[#90E0EF]/30 bg-white/75 backdrop-blur-16 shadow-2xl"
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
            {/* Left - Kelola Guru Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#00B4D8]" />
              <span className="text-sm font-semibold text-[#00B4D8]">{t.title}</span>
            </div>

            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <h1 className="text-3xl font-bold text-[#00B4D8] mb-3">
                {t.subtitle}
              </h1>
              <p className="text-base text-[#64748B]">
                Kelola akun guru, assign ke kelas, dan pantau aktivitas mengajar.
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            {/* Search and Add Button */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/70 border border-[#90E0EF] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                onClick={handleAddGuru}
                className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center gap-2 hover:shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)] transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                {t.addButton}
              </button>
            </div>

            {/* Teacher List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#0077B6]" />
                  <p className="text-sm text-[#94A3B8] mt-4">
                    {t.loading}
                  </p>
                </div>
              ) : filteredGuru.length === 0 && !searchQuery ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <Mail className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                  <h3 className="text-sm font-semibold text-[#94A3B8] mb-1">
                    {t.noTeacher}
                  </h3>
                  <p className="text-sm text-[#94A3B8]">
                    {t.clickAdd}
                  </p>
                </div>
              ) : filteredGuru.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <Search className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                  <h3 className="text-sm font-semibold text-[#94A3B8] mb-1">
                    Guru tidak ditemukan
                  </h3>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredGuru.map((guru) => (
                    <div
                      key={guru.id}
                      className="flex items-center justify-between p-4 rounded-[2rem] bg-white/70 border border-[#90E0EF]/50 hover:bg-white/90 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#B8E8C8] flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-6 h-6 text-[#2B593F]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00B4D8] text-base mb-1">
                            {guru.name}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#64748B]" />
                            <p className="text-sm text-[#64748B]">
                              {guru.email.includes("@studywithme.id") || guru.email.includes("@edulearn.com") ? guru.email.split("@")[0] : guru.email}
                            </p>
                          </div>
                          {guru.className && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                              <p className="text-xs text-[#64748B]">
                                {guru.className}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditGuru(guru)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#90E0EF] transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-[#00B4D8]" />
                        </button>
                        <button
                          onClick={() => handleDeleteGuru(guru.id)}
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
            className="bg-white/90 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-8 w-[520px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-2xl text-[#00B4D8]">
                {editingGuru ? t.modalTitleEdit : t.modalTitleAdd}
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
                  className="w-full text-sm text-[#00B4D8] placeholder:text-[#94A3B8] bg-white/70 border border-[#90E0EF] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
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
                  className="w-full text-sm text-[#00B4D8] placeholder:text-[#94A3B8] bg-white/70 border border-[#90E0EF] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="font-semibold text-sm text-[#00B4D8] mb-2 block">
                  {t.password} {!editingGuru && <span className="text-[#EF4444]">*</span>}
                  {editingGuru && <span className="text-[#64748B] text-xs font-normal"> (Kosongkan jika tidak ingin mengubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t.placeholderPassword}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-sm text-[#00B4D8] placeholder:text-[#94A3B8] bg-white/70 border border-[#90E0EF] rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#00B4D8] transition-colors"
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
                <label className="font-semibold text-sm text-[#1E293B] mb-2 block">
                  {t.assignClass}
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full text-sm text-[#1E293B] bg-white/70 border border-[#90E0EF] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
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
                className="flex-1 border-2 border-[#0077B6] text-[#1E293B] font-semibold text-sm py-3 rounded-[2rem] hover:bg-[#90E0EF] transition-colors"
                disabled={saving}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveGuru}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#0077B6] to-[#0077B6] text-white font-semibold text-sm py-3 rounded-[2rem] hover:shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)] transition-all disabled:opacity-50"
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
