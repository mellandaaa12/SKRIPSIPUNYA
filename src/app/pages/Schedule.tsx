"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon, Calendar } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { scheduleAPI } from "../utils/api";

interface ScheduleItem {
  subject: string;
  time: string;
  duration: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export default function Schedule() {
  const navigate = useNavigate();
  const { preferences } = useSettings();
  const { session, user } = useAuth();
  const [activeDay, setActiveDay] = useState("Senin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [schedules, setSchedules] = useState<Record<string, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const fetchSchedules = async () => {
    if (!user?.classId) {
      setLoading(false);
      setHasSchedule(false);
      return;
    }

    try {
      setLoading(true);
      const { schedules: classSchedules } = await scheduleAPI.getClassSchedules(user.classId, session?.access_token || "");
      
      if (!classSchedules || classSchedules.length === 0) {
        setHasSchedule(false);
        setSchedules({});
        setLoading(false);
        return;
      }

      setHasSchedule(true);

      // Transform backend data to frontend format
      const transformedSchedules: Record<string, ScheduleItem[]> = {
        Senin: [],
        Selasa: [],
        Rabu: [],
        Kamis: [],
        "Jum'at": [],
        Sabtu: [],
      };

      const colorMap: Record<string, { color: string; bgColor: string; borderColor: string }> = {
        "Matematika": { color: "#0369a1", bgColor: "#dbeafe", borderColor: "#93c5fd" },
        "Biologi": { color: "#9333ea", bgColor: "#f3e8ff", borderColor: "#d8b4fe" },
        "Kimia": { color: "#008236", bgColor: "#dcfce7", borderColor: "#b9f8cf" },
        "Fisika": { color: "#dc2626", bgColor: "#fee2e2", borderColor: "#fca5a5" },
        "Bahasa Indonesia": { color: "#ea580c", bgColor: "#ffedd5", borderColor: "#fdba74" },
        "Bahasa Inggris": { color: "#a65f00", bgColor: "#fef9c2", borderColor: "#fff085" },
        "Sejarah": { color: "#7c3aed", bgColor: "#ede9fe", borderColor: "#c4b5fd" },
        "Geografi": { color: "#0891b2", bgColor: "#ecfeff", borderColor: "#67e8f9" },
        "Ekonomi": { color: "#ca8a04", bgColor: "#fef9c3", borderColor: "#fde047" },
        "Sosiologi": { color: "#be185d", bgColor: "#fce7f3", borderColor: "#f9a8d4" },
      };

      for (const schedule of classSchedules) {
        const dayKey = schedule.day;
        if (transformedSchedules[dayKey]) {
          const colors = colorMap[schedule.subject] || { 
            color: "#4a5568", 
            bgColor: "#f3f4f6", 
            borderColor: "#e5e7eb" 
          };

          // Calculate duration
          const startTime = new Date(`2000-01-01T${schedule.start_time}`);
          const endTime = new Date(`2000-01-01T${schedule.end_time}`);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          let durationStr = "";
          if (durationHours > 0) {
            durationStr += `${durationHours}h`;
          }
          if (durationMinutes > 0) {
            durationStr += ` ${durationMinutes}m`;
          }
          if (durationStr === "") durationStr = "0m";

          transformedSchedules[dayKey].push({
            subject: schedule.subject,
            time: schedule.start_time,
            duration: durationStr.trim(),
            color: colors.color,
            bgColor: colors.bgColor,
            borderColor: colors.borderColor,
          });
        }
      }

      setSchedules(transformedSchedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setHasSchedule(false);
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    id: {
      title: "Jadwal Kelas",
      subtitle: "Lihat Jadwal Kelas Anda Minggu Ini",
      noSchedule: "Tidak Ada Jadwal",
      noScheduleDesc: "Tidak ada kelas di hari",
      noScheduleAssigned: "Belum Ada Jadwal",
      noScheduleAssignedDesc: "Admin belum memberikan jadwal untuk kelas Anda",
      loading: "Memuat Jadwal...",
    },
    en: {
      title: "Class Schedule",
      subtitle: "View Your Class Schedule This Week",
      noSchedule: "No Schedule",
      noScheduleDesc: "No classes on",
      noScheduleAssigned: "No Schedule Assigned",
      noScheduleAssignedDesc: "Admin has not assigned a schedule for your class yet",
      loading: "Loading Schedule...",
    },
  };

  const t = texts[preferences.language];

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
            {/* Left - Schedule Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#00B4D8]" />
              <span className="text-sm font-semibold text-[#0077B6]">{t.title}</span>
            </div>

            {/* Right - User Profile */}
            <div id="onboarding-profile-header">
              <ProfileHeader />
            </div>
          </div>

          {/* Welcome Section */}
          <div id="onboarding-welcome-card" className="mb-8 animate-slideIn">
            <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.15)] text-white">
              <h1 className="text-3xl font-bold text-white mb-3">
                {t.title}
              </h1>
              <p className="text-base text-blue-100">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            {/* Day Tabs */}
            <div id="onboarding-schedule-tabs" className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-5 py-3 rounded-[2rem] text-sm font-medium transition-all whitespace-nowrap ${
                    activeDay === day
                      ? "bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white shadow-[0_4px_16px_-4px_rgba(0,119,182,0.25)]"
                      : "bg-white/70 text-[#64748B] hover:bg-white/90 hover:text-[#0077B6]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Schedule List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-4 animate-pulse">
                  <Calendar className="w-8 h-8 text-[#CBD5E1]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8] mb-1">
                  {t.loading}
                </p>
              </div>
            ) : !hasSchedule ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-[#CBD5E1]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8] mb-1">
                  {t.noScheduleAssigned}
                </p>
                <p className="text-xs text-[#94A3B8] text-center max-w-sm">
                  {t.noScheduleAssignedDesc}
                </p>
              </div>
            ) : schedules[activeDay] && schedules[activeDay].length > 0 ? (
              <div id="onboarding-schedule-list" className="space-y-3">
                {schedules[activeDay].map((schedule, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: schedule.bgColor,
                      borderColor: schedule.borderColor,
                    }}
                    className="border rounded-[2rem] p-5 cursor-pointer hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-[1.5rem] bg-white/50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5" style={{ color: schedule.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <p
                          style={{ color: schedule.color }}
                          className="font-semibold text-base mb-1"
                        >
                          {schedule.subject}
                        </p>
                        <div className="flex items-center gap-2 opacity-75">
                          <span style={{ color: schedule.color }} className="text-xs">
                            {schedule.time}
                          </span>
                          <span style={{ color: schedule.color }} className="text-xs">
                            • {schedule.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-[#CBD5E1]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8] mb-1">
                  {t.noSchedule}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {t.noScheduleDesc} {activeDay}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}