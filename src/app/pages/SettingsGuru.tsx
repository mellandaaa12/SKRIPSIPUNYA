"use client";

import { useState } from "react";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { Moon, Globe, Volume2, Bell, BookOpen, Users, Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon, Upload } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import Avatar from "../components/Avatar";
import { supabase } from "../utils/supabase";
import { customPopup } from "../context/PopupContext";

export default function SettingsGuru() {
  const { preferences, updatePreferences } = useSettings();
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.avatar || null
  );
  const { updateProfile, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-guru" },
    { id: "kelas", label: "Kelas", icon: ActivityIcon, path: "/dashboard-guru/kelas" },
    { id: "forum", label: "Forum Diskusi", icon: ActivityIcon, path: "/dashboard-guru/forum" },
  ];

  const texts = {
    id: {
      title: "Pengaturan Guru",
      subtitle: "Kelola Preferensi Dan Pengaturan Mengajar",
      preferences: "Preferensi",
      teachingSettings: "Pengaturan Mengajar",
      darkMode: "Mode Gelap",
      darkModeDesc: "Aktifkan tampilan mode gelap",
      language: "Bahasa",
      languageDesc: "Pilih bahasa tampilan aplikasi",
      soundEffects: "Efek Suara",
      soundEffectsDesc: "Aktifkan suara notifikasi dan interaksi",
      emailNotifications: "Notifikasi Email",
      emailNotificationsDesc: "Terima notifikasi tugas siswa via email",
      autoGrading: "Penilaian Otomatis",
      autoGradingDesc: "Aktifkan penilaian otomatis untuk quiz",
      studentProgress: "Laporan Progress Siswa",
      studentProgressDesc: "Kirim laporan progress mingguan",
      indonesian: "Bahasa Indonesia",
      english: "English",
    },
    en: {
      title: "Teacher Settings",
      subtitle: "Manage Preferences And Teaching Settings",
      preferences: "Preferences",
      teachingSettings: "Teaching Settings",
      darkMode: "Dark Mode",
      darkModeDesc: "Enable dark mode display",
      language: "Language",
      languageDesc: "Choose application display language",
      soundEffects: "Sound Effects",
      soundEffectsDesc: "Enable notification and interaction sounds",
      emailNotifications: "Email Notifications",
      emailNotificationsDesc: "Receive student assignment notifications via email",
      autoGrading: "Auto Grading",
      autoGradingDesc: "Enable automatic grading for quizzes",
      studentProgress: "Student Progress Report",
      studentProgressDesc: "Send weekly progress reports",
      indonesian: "Bahasa Indonesia",
      english: "English",
    },
  };

  const t = texts[preferences.language];

  const handleProfileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      // Validate file type
      if (!file.type.startsWith('image/')) {
        customPopup.alert('Hanya file gambar yang diperbolehkan', 'warning');
        setIsUploading(false);
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        customPopup.alert('Ukuran file maksimal 2MB', 'warning');
        setIsUploading(false);
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        try {
          setProfileImage(base64String);
          if (!user?.id) throw new Error("User ID tidak ditemukan");
          
          // Update avatar in Supabase profiles table
          const { error } = await supabase
            .from('profiles')
            .update({ 
              avatar: base64String,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (error) throw error;
          
          // Update local state
          await updateProfile({ avatar: base64String });
          await refreshUser();
          customPopup.alert('Foto profil berhasil disimpan', 'success');
        } catch (error) {
          console.error("Failed to update profile image:", error);
          customPopup.alert('Gagal menyimpan foto profil. Silakan coba lagi.', 'error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        console.error("Failed to read file");
        customPopup.alert('Gagal membaca file. Silakan coba lagi.', 'error');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Profile image upload failed:", error);
      customPopup.alert('Gagal menyimpan foto profil. Silakan coba lagi.', 'error');
      setIsUploading(false);
    }
  };

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
            {/* Left - Settings Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <Sparkles className="h-4 w-4 text-[#56B6C6]" />
              <span className="text-sm font-semibold text-[#0077B6]">Settings</span>
            </div>

            {/* Right - User Profile */}
            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <h1 className="text-3xl font-bold text-[#56B6C6] mb-3">
                {t.title}
              </h1>
              <p className="text-base text-[#64748B]">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Profile Section */}
          <div className="mb-8 animate-scaleIn">
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-[#0077B6]">
                  Foto Profil
                </h2>
              </div>
              <div className="flex items-center gap-6">
                <Avatar
                  src={profileImage}
                  name={session?.user?.name || session?.user?.email || "Guru"}
                  size="xl"
                  color={session?.user?.avatarColor || "#56B6C6"}
                  editable={true}
                  onUpload={handleProfileUpload}
                  isUploading={isUploading}
                />
                <div>
                  <p className="font-semibold text-base text-[#0077B6]">
                    {session?.user?.name || session?.user?.email}
                  </p>
                  <p className="text-sm text-[#64748B] mb-2">{session?.user?.email}</p>
                  <p className="text-xs text-[#94A3B8]">
                    Klik foto untuk mengganti profil
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="space-y-6">
            {/* Preferences Section */}
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn">
              <h2 className="font-bold text-xl text-[#0077B6] mb-6 flex items-center gap-3">
                <Moon className="w-6 h-6 text-[#56B6C6]" />
                {t.preferences}
              </h2>

              <div className="flex flex-col gap-6">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-[#F1F5F9] flex items-center justify-center">
                      <Moon className="w-6 h-6 text-[#64748B]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#0077B6]">
                        {t.darkMode}
                      </h3>
                      <p className="text-sm text-[#64748B]">
                        {t.darkModeDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreferences({ darkMode: !preferences.darkMode })}
                    className={`w-16 h-8 rounded-full transition-colors duration-300 relative ${
                      preferences.darkMode ? "bg-[#56B6C6]" : "bg-[#CBD5E1]"
                    }`}
                  >
                    <div
                      className="w-7 h-7 bg-white rounded-full absolute top-0.5 transition-all duration-300"
                      style={{ left: preferences.darkMode ? "calc(100% - 32px)" : "2px" }}
                    />
                  </button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-[#F1F5F9] flex items-center justify-center">
                      <Globe className="w-6 h-6 text-[#64748B]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#0077B6]">
                        {t.language}
                      </h3>
                      <p className="text-sm text-[#64748B]">
                        {t.languageDesc}
                      </p>
                    </div>
                  </div>
                  <select
                    value={preferences.language}
                    onChange={(e) =>
                      updatePreferences({ language: e.target.value as "id" | "en" })
                    }
                    className="px-4 py-2 rounded-[1.5rem] bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                  >
                    <option value="id">{t.indonesian}</option>
                    <option value="en">{t.english}</option>
                  </select>
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-[#F1F5F9] flex items-center justify-center">
                      <Volume2 className="w-6 h-6 text-[#64748B]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#0077B6]">
                        {t.soundEffects}
                      </h3>
                      <p className="text-sm text-[#64748B]">
                        {t.soundEffectsDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreferences({ soundEffects: !preferences.soundEffects })}
                    className={`w-16 h-8 rounded-full transition-colors duration-300 relative ${
                      preferences.soundEffects ? "bg-[#56B6C6]" : "bg-[#CBD5E1]"
                    }`}
                  >
                    <div
                      className="w-7 h-7 bg-white rounded-full absolute top-0.5 transition-all duration-300"
                      style={{ left: preferences.soundEffects ? "calc(100% - 32px)" : "2px" }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Teaching Settings Section */}
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn">
              <h2 className="font-bold text-xl text-[#0077B6] mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#10B981]" />
                {t.teachingSettings}
              </h2>

              <div className="flex flex-col gap-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-[#F1F5F9] flex items-center justify-center">
                      <Bell className="w-6 h-6 text-[#64748B]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#0077B6]">
                        {t.emailNotifications}
                      </h3>
                      <p className="text-sm text-[#64748B]">
                        {t.emailNotificationsDesc}
                      </p>
                    </div>
                  </div>
                  <button className="w-16 h-8 rounded-full transition-colors duration-300 relative bg-[#56B6C6]">
                    <div
                      className="w-7 h-7 bg-white rounded-full absolute top-0.5 transition-all duration-300"
                      style={{ left: "calc(100% - 32px)" }}
                    />
                  </button>
                </div>

                {/* Auto Grading */}
                <div className="flex items-center justify-between p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-[#F1F5F9] flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-[#64748B]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#0077B6]">
                        {t.autoGrading}
                      </h3>
                      <p className="text-sm text-[#64748B]">
                        {t.autoGradingDesc}
                      </p>
                    </div>
                  </div>
                  <button className="w-16 h-8 rounded-full transition-colors duration-300 relative bg-[#56B6C6]">
                    <div
                      className="w-7 h-7 bg-white rounded-full absolute top-0.5 transition-all duration-300"
                      style={{ left: "calc(100% - 32px)" }}
                    />
                  </button>
                </div>

                {/* Student Progress */}
                <div className="flex items-center justify-between p-4 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-[#F1F5F9] flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#64748B]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#0077B6]">
                        {t.studentProgress}
                      </h3>
                      <p className="text-sm text-[#64748B]">
                        {t.studentProgressDesc}
                      </p>
                    </div>
                  </div>
                  <button className="w-16 h-8 rounded-full transition-colors duration-300 relative bg-[#56B6C6]">
                    <div
                      className="w-7 h-7 bg-white rounded-full absolute top-0.5 transition-all duration-300"
                      style={{ left: "calc(100% - 32px)" }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
