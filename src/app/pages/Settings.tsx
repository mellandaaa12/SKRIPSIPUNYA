"use client";

import { useState } from "react";
import { useNavigate } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { Moon, Globe, Volume2, Lock, Eye, Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon, Upload } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { supabase } from "../utils/supabase";
import { customPopup } from "../context/PopupContext";

export default function Settings() {
  const navigate = useNavigate();
  const { preferences, privacy, updatePreferences, updatePrivacy } = useSettings();
  const { user, session, refreshUser, updateProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.avatar || null
  );
  const [isUploading, setIsUploading] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  const texts = {
    id: {
      title: "Pengaturan",
      subtitle: "Sesuaikan Preferensi Dan Pengaturan Akun Anda",
      preferences: "Preferensi",
      privacy: "Privasi",
      darkMode: "Mode Gelap",
      darkModeDesc: "Aktifkan tampilan mode gelap",
      language: "Bahasa",
      languageDesc: "Pilih bahasa tampilan aplikasi",
      soundEffects: "Efek Suara",
      soundEffectsDesc: "Aktifkan suara notifikasi dan interaksi",
      onlineStatus: "Status Online",
      onlineStatusDesc: "Tampilkan status online ke pengguna lain",
      indonesian: "Bahasa Indonesia",
      english: "English",
    },
    en: {
      title: "Settings",
      subtitle: "Customize Your Preferences And Account Settings",
      preferences: "Preferences",
      privacy: "Privacy",
      darkMode: "Dark Mode",
      darkModeDesc: "Enable dark mode display",
      language: "Language",
      languageDesc: "Choose application display language",
      soundEffects: "Sound Effects",
      soundEffectsDesc: "Enable notification and interaction sounds",
      onlineStatus: "Online Status",
      onlineStatusDesc: "Show online status to other users",
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

      <SideBarMurid />

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Left - Settings Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <Sparkles className="h-4 w-4 text-[#56B6C6]" />
              <span className="text-sm font-semibold text-[#0077B6]">{t.title}</span>
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
                  src={profileImage || user?.avatar}
                  name={user?.name || user?.email || "Siswa"}
                  size="xl"
                  color={user?.avatarColor || "#8B5CF6"}
                  editable={true}
                  onUpload={handleProfileUpload}
                  isUploading={isUploading}
                />
                <div>
                  <p className="font-semibold text-base text-[#0077B6]">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-sm text-[#64748B] mb-2">{user?.email}</p>
                  <p className="text-xs text-[#94A3B8]">
                    Klik foto untuk mengganti profil
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn">
            {/* Preferences Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-[#0077B6]">
                  {t.preferences}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 rounded-[2rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-[#64748B]" />
                    <div>
                      <p className="font-medium text-sm text-[#0077B6]">
                        {t.darkMode}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {t.darkModeDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreferences({ darkMode: !preferences.darkMode })}
                    className={`w-14 h-7 rounded-full transition-all relative ${
                      preferences.darkMode ? "bg-gradient-to-r from-[#56B6C6] to-[#56B6C6]" : "bg-[#E2E8F0]"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                        preferences.darkMode ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between p-4 rounded-[2rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[#64748B]" />
                    <div>
                      <p className="font-medium text-sm text-[#0077B6]">
                        {t.language}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {t.languageDesc}
                      </p>
                    </div>
                  </div>
                  <select
                    value={preferences.language}
                    onChange={(e) => updatePreferences({ language: e.target.value as "id" | "en" })}
                    className="px-4 py-2 rounded-[2rem] bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                  >
                    <option value="id">{t.indonesian}</option>
                    <option value="en">{t.english}</option>
                  </select>
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between p-4 rounded-[2rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-[#64748B]" />
                    <div>
                      <p className="font-medium text-sm text-[#0077B6]">
                        {t.soundEffects}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {t.soundEffectsDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreferences({ soundEffects: !preferences.soundEffects })}
                    className={`w-14 h-7 rounded-full transition-all relative ${
                      preferences.soundEffects ? "bg-gradient-to-r from-[#56B6C6] to-[#56B6C6]" : "bg-[#E2E8F0]"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                        preferences.soundEffects ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-[#0077B6]">
                  {t.privacy}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Online Status */}
                <div className="flex items-center justify-between p-4 rounded-[2rem] bg-white/70 border border-[#E2E8F0]/50">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-[#64748B]" />
                    <div>
                      <p className="font-medium text-sm text-[#0077B6]">
                        {t.onlineStatus}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {t.onlineStatusDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePrivacy({ showOnlineStatus: !privacy.showOnlineStatus })}
                    className={`w-14 h-7 rounded-full transition-all relative ${
                      privacy.showOnlineStatus ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706]" : "bg-[#E2E8F0]"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                        privacy.showOnlineStatus ? "translate-x-7" : "translate-x-1"
                      }`}
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