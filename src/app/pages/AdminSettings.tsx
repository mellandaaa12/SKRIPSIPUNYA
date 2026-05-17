"use client";

import { motion } from "motion/react";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { ProfileHeader } from "../components/ProfileHeader";
import { Moon, Globe, Volume2, Shield, Bell, Database, Mail, Lock } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

export default function AdminSettings() {
  const { preferences, privacy, updatePreferences, updatePrivacy } = useSettings();

  const texts = {
    id: {
      title: "PENGATURAN ADMIN",
      subtitle: "Kelola Preferensi Dan Konfigurasi Sistem",
      preferences: "Preferensi",
      systemSettings: "Pengaturan Sistem",
      darkMode: "Mode Gelap",
      darkModeDesc: "Aktifkan tampilan mode gelap",
      language: "Bahasa",
      languageDesc: "Pilih bahasa tampilan aplikasi",
      soundEffects: "Efek Suara",
      soundEffectsDesc: "Aktifkan suara notifikasi dan interaksi",
      emailNotifications: "Notifikasi Email",
      emailNotificationsDesc: "Terima notifikasi melalui email",
      systemBackup: "Backup Otomatis",
      systemBackupDesc: "Aktifkan backup data otomatis",
      dataEncryption: "Enkripsi Data",
      dataEncryptionDesc: "Enkripsi data sensitif sistem",
      indonesian: "Bahasa Indonesia",
      english: "English",
    },
    en: {
      title: "ADMIN SETTINGS",
      subtitle: "Manage Preferences And System Configuration",
      preferences: "Preferences",
      systemSettings: "System Settings",
      darkMode: "Dark Mode",
      darkModeDesc: "Enable dark mode display",
      language: "Language",
      languageDesc: "Choose application display language",
      soundEffects: "Sound Effects",
      soundEffectsDesc: "Enable notification and interaction sounds",
      emailNotifications: "Email Notifications",
      emailNotificationsDesc: "Receive notifications via email",
      systemBackup: "Auto Backup",
      systemBackupDesc: "Enable automatic data backup",
      dataEncryption: "Data Encryption",
      dataEncryptionDesc: "Encrypt sensitive system data",
      indonesian: "Bahasa Indonesia",
      english: "English",
    },
  };

  const t = texts[preferences.language];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background relative overflow-hidden"
    >
      <aside className="fixed left-4 top-4 bottom-4 z-50 hidden lg:block">
        <SideBarAdmin />
      </aside>

      {/* Main Content */}
      <div className="ml-0 min-h-screen p-4 lg:ml-80 lg:p-6">
        {/* Header Banner */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex-1 bg-card rounded-3xl border border-border/50 p-8 shadow-sm"
          >
            <h1 className="text-3xl font-bold text-primary mb-2">
              {t.title}
            </h1>
            <p className="text-muted-foreground">
              {t.subtitle}
            </p>
          </motion.div>
          <div className="ml-4">
            <ProfileHeader />
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex flex-col gap-[20px] h-[565px] overflow-y-auto">
          {/* Preferences Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className={`rounded-[20px] p-[32px] shadow-md transition-colors duration-300 ${
              preferences.darkMode ? "bg-[#334155]" : "bg-white"
            }`}
          >
            <h2 className={`font-['Poppins'] font-bold text-[20px] mb-[24px] flex items-center gap-[12px] ${
              preferences.darkMode ? "text-white" : "text-[#1e293b]"
            }`}>
              <Shield className="w-[24px] h-[24px] text-[#1294f2]" />
              {t.preferences}
            </h2>

            <div className="flex flex-col gap-[24px]">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center ${
                    preferences.darkMode ? "bg-[#475569]" : "bg-[#f1f5f9]"
                  }`}>
                    <Moon className={`w-[24px] h-[24px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-['Poppins'] font-semibold text-[16px] ${
                      preferences.darkMode ? "text-white" : "text-[#1e293b]"
                    }`}>
                      {t.darkMode}
                    </h3>
                    <p className={`font-['Poppins'] text-[13px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`}>
                      {t.darkModeDesc}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ darkMode: !preferences.darkMode })}
                  className={`w-[60px] h-[32px] rounded-full transition-colors duration-300 relative ${
                    preferences.darkMode ? "bg-[#1294f2]" : "bg-[#cbd5e1]"
                  }`}
                >
                  <motion.div
                    className="w-[28px] h-[28px] bg-white rounded-full absolute top-[2px]"
                    animate={{ left: preferences.darkMode ? "30px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center ${
                    preferences.darkMode ? "bg-[#475569]" : "bg-[#f1f5f9]"
                  }`}>
                    <Globe className={`w-[24px] h-[24px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-['Poppins'] font-semibold text-[16px] ${
                      preferences.darkMode ? "text-white" : "text-[#1e293b]"
                    }`}>
                      {t.language}
                    </h3>
                    <p className={`font-['Poppins'] text-[13px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`}>
                      {t.languageDesc}
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreferences({ language: e.target.value as "id" | "en" })}
                  className={`font-['Poppins'] text-[14px] px-[16px] py-[8px] rounded-[12px] border-2 outline-none transition-colors duration-300 ${
                    preferences.darkMode
                      ? "bg-[#475569] border-[#64748b] text-white"
                      : "bg-white border-[#e2e8f0] text-[#1e293b]"
                  }`}
                >
                  <option value="id">{t.indonesian}</option>
                  <option value="en">{t.english}</option>
                </select>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center ${
                    preferences.darkMode ? "bg-[#475569]" : "bg-[#f1f5f9]"
                  }`}>
                    <Volume2 className={`w-[24px] h-[24px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-['Poppins'] font-semibold text-[16px] ${
                      preferences.darkMode ? "text-white" : "text-[#1e293b]"
                    }`}>
                      {t.soundEffects}
                    </h3>
                    <p className={`font-['Poppins'] text-[13px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`}>
                      {t.soundEffectsDesc}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ soundEffects: !preferences.soundEffects })}
                  className={`w-[60px] h-[32px] rounded-full transition-colors duration-300 relative ${
                    preferences.soundEffects ? "bg-[#1294f2]" : "bg-[#cbd5e1]"
                  }`}
                >
                  <motion.div
                    className="w-[28px] h-[28px] bg-white rounded-full absolute top-[2px]"
                    animate={{ left: preferences.soundEffects ? "30px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* System Settings Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className={`rounded-[20px] p-[32px] shadow-md transition-colors duration-300 ${
              preferences.darkMode ? "bg-[#334155]" : "bg-white"
            }`}
          >
            <h2 className={`font-['Poppins'] font-bold text-[20px] mb-[24px] flex items-center gap-[12px] ${
              preferences.darkMode ? "text-white" : "text-[#1e293b]"
            }`}>
              <Database className="w-[24px] h-[24px] text-[#10b981]" />
              {t.systemSettings}
            </h2>

            <div className="flex flex-col gap-[24px]">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center ${
                    preferences.darkMode ? "bg-[#475569]" : "bg-[#f1f5f9]"
                  }`}>
                    <Mail className={`w-[24px] h-[24px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-['Poppins'] font-semibold text-[16px] ${
                      preferences.darkMode ? "text-white" : "text-[#1e293b]"
                    }`}>
                      {t.emailNotifications}
                    </h3>
                    <p className={`font-['Poppins'] text-[13px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`}>
                      {t.emailNotificationsDesc}
                    </p>
                  </div>
                </div>
                <button
                  className="w-[60px] h-[32px] rounded-full transition-colors duration-300 relative bg-[#1294f2]"
                >
                  <motion.div
                    className="w-[28px] h-[28px] bg-white rounded-full absolute top-[2px]"
                    animate={{ left: "30px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* System Backup */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center ${
                    preferences.darkMode ? "bg-[#475569]" : "bg-[#f1f5f9]"
                  }`}>
                    <Database className={`w-[24px] h-[24px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-['Poppins'] font-semibold text-[16px] ${
                      preferences.darkMode ? "text-white" : "text-[#1e293b]"
                    }`}>
                      {t.systemBackup}
                    </h3>
                    <p className={`font-['Poppins'] text-[13px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`}>
                      {t.systemBackupDesc}
                    </p>
                  </div>
                </div>
                <button
                  className="w-[60px] h-[32px] rounded-full transition-colors duration-300 relative bg-[#1294f2]"
                >
                  <motion.div
                    className="w-[28px] h-[28px] bg-white rounded-full absolute top-[2px]"
                    animate={{ left: "30px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Data Encryption */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center ${
                    preferences.darkMode ? "bg-[#475569]" : "bg-[#f1f5f9]"
                  }`}>
                    <Lock className={`w-[24px] h-[24px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-['Poppins'] font-semibold text-[16px] ${
                      preferences.darkMode ? "text-white" : "text-[#1e293b]"
                    }`}>
                      {t.dataEncryption}
                    </h3>
                    <p className={`font-['Poppins'] text-[13px] ${
                      preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
                    }`}>
                      {t.dataEncryptionDesc}
                    </p>
                  </div>
                </div>
                <button
                  className="w-[60px] h-[32px] rounded-full transition-colors duration-300 relative bg-[#1294f2]"
                >
                  <motion.div
                    className="w-[28px] h-[28px] bg-white rounded-full absolute top-[2px]"
                    animate={{ left: "30px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
