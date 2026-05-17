"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon, Calendar, CheckCircle, Circle, Plus, Trash2, Lightbulb, BookOpen } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { getProgress, getPembelajaranByClass } from "../utils/api";
import { startOnboarding } from "../utils/onboarding";

export default function Dashboard() {
  const navigate = useNavigate();
  const { preferences } = useSettings();
  const { user, refreshUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const [streakClaimedToday, setStreakClaimedToday] = useState(false);
  const [claimingStreak, setClaimingStreak] = useState(false);
  const [className, setClassName] = useState("-");
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [pembelajaranList, setPembelajaranList] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  // Get current day in Indonesian
  useEffect(() => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const today = days[new Date().getDay()];
    setCurrentDay(today);
  }, []);

  const loadClassInfo = async () => {
    if (!user?.classId) {
      setClassName("-");
      return;
    }
    try {
      const { data: classData } = await supabase
        .from("classes")
        .select("name,grade,subject")
        .eq("id", user.classId)
        .single();
      
      // Build full class name
      const fullName = classData?.name 
        ? (classData.grade && classData.subject 
            ? `${classData.name} - ${classData.grade} ${classData.subject}`
            : classData.name)
        : "-";
      
      setClassName(fullName);
      console.log("📚 Student class loaded:", fullName);
    } catch (error) {
      console.error("Failed to load class info:", error);
    }
  };

  const checkStreakStatus = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_streak_date, streak")
        .eq("id", user.id)
        .single();
      const today = new Date().toISOString().split("T")[0];
      setStreakClaimedToday(profile?.last_streak_date === today);
    } catch (error) {
      console.error("Failed to check streak status:", error);
    }
  };

  const loadProgress = async () => {
    if (!user) return;
    try {
      console.log("Loading progress for user:", user.id);
      console.log("User classId:", user.classId);
      
      // Load progress data
      const progress = await getProgress(user.id);
      setProgressData(progress || []);
      console.log("Progress data loaded:", progress);

      // Load pembelajaran data from class using API
      if (user.classId) {
        const response = await getPembelajaranByClass(user.classId);
        const pembelajaranData = response?.pembelajaran || [];
        console.log("Pembelajaran data loaded:", pembelajaranData);
        setPembelajaranList(pembelajaranData);
      } else {
        console.warn("User has no classId");
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshUser();
      loadClassInfo();
      loadProgress();
      checkStreakStatus();

      // Check if user has seen the interactive onboarding
      const hasSeenOnboarding = localStorage.getItem("onboarding_siswa_done");
      if (!hasSeenOnboarding) {
        // Short delay to ensure elements are rendered
        setTimeout(() => {
          startOnboarding(navigate);
        }, 1000);
      }
    }
  }, [user?.id]);

  // Real-time synchronization for Student Dashboard
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`student-dashboard-sync-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => {
          console.log("🔄 Realtime: User profile changed, refreshing...");
          refreshUser();
          checkStreakStatus();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pembelajaran" },
        () => {
          console.log("🔄 Realtime: Pembelajaran changed, updating list...");
          void loadProgress();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progress", filter: `user_id=eq.${user.id}` },
        () => {
          console.log("🔄 Realtime: Progress changed, updating task progress...");
          void loadProgress();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes", filter: `id=eq.${user?.classId}` },
        () => {
          console.log("🔄 Realtime: Class info changed, refreshing...");
          void loadClassInfo();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, user?.classId]);

  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const claimDailyStreak = async () => {
    if (!user || streakClaimedToday || claimingStreak) return;
    setClaimingStreak(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak,hint_points,last_streak_date")
        .eq("id", user.id)
        .single();
      const today = new Date().toISOString().split("T")[0];
      if (profile?.last_streak_date === today) {
        setStreakClaimedToday(true);
        return;
      }
      const newStreak = (profile?.streak || 0) + 1;
      const newHintPoints = Math.min((profile?.hint_points || 0) + 1, 10);
      await supabase
        .from("profiles")
        .update({
          streak: newStreak,
          hint_points: newHintPoints,
          last_streak_date: today,
        })
        .eq("id", user.id);
      setStreakClaimedToday(true);
      await refreshUser();
      
      // Show celebration
      setShowStreakCelebration(true);
      setTimeout(() => setShowStreakCelebration(false), 3000);
      
      // Show toast notification
      showToastNotification(`🎉 Streak ${newStreak} hari! +1 poin bantuan`, 'success');
    } catch (error) {
      console.error("Failed to claim streak:", error);
      showToastNotification("Gagal mengklaim streak. Silakan coba lagi.", 'error');
    } finally {
      setClaimingStreak(false);
    }
  };

  const schedules: Record<string, Array<{ subject: string; time: string; duration: string; color: string; bgColor: string; borderColor: string }>> = {
    Senin: [],
    Selasa: [],
    Rabu: [],
    Kamis: [],
    "Jumat": [],
    Sabtu: [],
    Minggu: [],
  };

  const todaySchedule = schedules[currentDay] || [];

  // Calculate actual task progress from pembelajaran
  const calculateTaskProgress = () => {
    let totalSteps = 0;
    let completedSteps = 0;

    pembelajaranList.forEach((pembelajaran: any) => {
      if (pembelajaran.steps && Array.isArray(pembelajaran.steps)) {
        const progress = progressData.find((p: any) => p.pembelajaranId === pembelajaran.id);
        if (progress && progress.steps) {
          Object.keys(progress.steps).forEach((stepId: string) => {
            totalSteps++;
            if (progress.steps[stepId]?.completed) {
              completedSteps++;
            }
          });
        } else {
          // If no progress, count all steps as not completed
          pembelajaran.steps.forEach(() => {
            totalSteps++;
          });
        }
      }
    });

    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
    };
  };

  const taskProgress = calculateTaskProgress();

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask("");
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const texts = {
    id: {
      title: "Dashboard Siswa",
      subtitle: "Kelola pembelajaran dan tugas harian",
      todaySchedule: "Jadwal Hari Ini",
      noSchedule: "Tidak ada jadwal untuk hari ini",
      taskProgress: "Progress Tugas",
      todoList: "To Do List",
      addTask: "Tambah tugas baru...",
      completed: "Selesai",
      of: "dari",
    },
    en: {
      title: "Student Dashboard",
      subtitle: "Manage daily learning and tasks",
      todaySchedule: "Today's Schedule",
      noSchedule: "No schedule for today",
      taskProgress: "Task Progress",
      todoList: "To Do List",
      addTask: "Add new task...",
      completed: "Completed",
      of: "of",
    },
  };

  const t = texts[preferences.language];

  return (
    <div style={{ minHeight: "100vh", background: "transparent", backgroundAttachment: "fixed", position: "relative", overflowX: "hidden" }}>
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
            {/* Left - Dashboard Badge */}
            <div id="onboarding-dashboard-badge" className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#00B4D8]" />
              <span className="text-sm font-semibold text-[#0077B6]">{t.title}</span>
            </div>

            <div id="onboarding-profile-header">
              <ProfileHeader />
            </div>
          </div>

          {/* Welcome Section */}
          <div id="onboarding-welcome-card" className="mb-8 animate-slideIn">
            <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.15)] text-white">
              <h1 id="onboarding-welcome" className="text-3xl font-bold text-white mb-3">
                {t.title}
              </h1>
              <p className="text-base text-blue-100">
                {t.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-semibold border border-white/10">
                  Kelas: {className}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-semibold border border-white/10">
                  Streak: {user?.streak || 0} hari
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-semibold border border-white/10 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-[#CAF0F8]" />
                  Poin Bantuan: {user?.hintPoints ?? 3}
                </span>
                <button
                  onClick={claimDailyStreak}
                  disabled={streakClaimedToday || claimingStreak}
                  className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                    streakClaimedToday
                      ? "bg-emerald-500/20 text-[#D1FAE5] border border-emerald-500/30 cursor-not-allowed"
                      : "bg-[#FFB703] text-[#023E8A] hover:bg-[#FFD166] hover:shadow-lg hover:scale-105"
                  }`}
                >
                  {!streakClaimedToday && <span className="text-lg">🔥</span>}
                  {streakClaimedToday ? "Streak hari ini aktif" : claimingStreak ? "Mengklaim..." : "Nyalakan streak (+1 bantuan)"}
                </button>
              </div>
            </div>
          </div>

          {/* Content Cards - 4 Cards in 2x2 Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-scaleIn">
            {/* Top Row */}
            
            {/* Jadwal Hari Ini Card - Left (Bigger, spans 2 columns) */}
            <div id="onboarding-schedule-card" className="lg:col-span-2 bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#FFE4B5] rounded-[1.5rem] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-[#8A6327]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0077B6]">{t.todaySchedule}</h3>
                  <p className="text-sm text-[#64748B]">{currentDay}</p>
                </div>
              </div>
              
              {todaySchedule.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.map((schedule, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: schedule.bgColor,
                        borderColor: schedule.borderColor,
                      }}
                      className="border rounded-[2rem] p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-[1.5rem] bg-white/50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5" style={{ color: schedule.color }} />
                        </div>
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
                <div className="flex flex-col items-center justify-center py-8">
                  <Calendar className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                  <p className="text-sm text-[#94A3B8]">{t.noSchedule}</p>
                </div>
              )}
            </div>

            {/* Streak Card - Right (Smaller) */}
            <div id="onboarding-streak-card" className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex flex-col justify-center">
              <div className="flex flex-col items-center mb-6">
                <h3 className="text-base font-semibold text-[#0077B6]">Check-in Harian</h3>
                <p className="text-xs text-[#64748B]">Streak: {user?.streak || 0} hari</p>
              </div>
              
              <div className="relative flex justify-between items-center w-full mb-8">
                {/* Dashed line background */}
                <div className="absolute top-[12px] left-[5%] right-[5%] h-[2px] border-t-2 border-dashed border-[#EF4444]/50 z-0"></div>
                
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, idx) => {
                  const todayJsDay = new Date().getDay();
                  const todayIdx = todayJsDay === 0 ? 6 : todayJsDay - 1; // 0 = Mon, 6 = Sun
                  
                  const isCurrent = !streakClaimedToday && idx === todayIdx;
                  
                  let isClaimed = false;
                  const streakCount = user?.streak || 0;
                  
                  if (idx === todayIdx) {
                    isClaimed = streakClaimedToday;
                  } else if (idx < todayIdx) {
                    const daysAgo = todayIdx - idx;
                    isClaimed = streakClaimedToday 
                      ? daysAgo < streakCount 
                      : daysAgo <= streakCount;
                  } else {
                    isClaimed = false;
                  }

                  return (
                    <div key={day} className="flex flex-col items-center relative z-10 gap-1.5 w-8">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                        transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
                        className={`text-lg sm:text-xl bg-white rounded-full leading-none shadow-[0_0_10px_rgba(255,255,255,0.8)] ${isClaimed ? 'opacity-100 grayscale-0' : isCurrent ? 'opacity-100' : 'opacity-30 grayscale'}`}
                      >
                        🔥
                      </motion.div>
                      <span className="text-[10px] font-bold text-[#0077B6]">{day}</span>
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={claimDailyStreak}
                disabled={streakClaimedToday || claimingStreak}
                className={`w-full py-3 rounded-full font-bold transition-all text-sm flex justify-center items-center shadow-lg ${
                  streakClaimedToday
                    ? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white hover:shadow-xl hover:scale-105"
                }`}
              >
                {streakClaimedToday ? "Sudah Check - in" : claimingStreak ? "..." : "Check - in"}
              </button>
            </div>

            {/* Bottom Row */}

            {/* Progress Tugas Card - Left (Same size as Jadwal) */}
            <div id="onboarding-progress-card" className="lg:col-span-2 bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#B8E8C8] rounded-[1.5rem] flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-[#2B593F]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0077B6]">{t.taskProgress}</h3>
                  <p className="text-sm text-[#64748B]">{t.completed} {taskProgress.completed} {t.of} {taskProgress.total}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-4 bg-[#E8F4FD] rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${taskProgress.percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#B8E8C8] to-[#2B593F] rounded-full"
                />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl font-bold text-[#2B593F]">{taskProgress.percentage}%</p>
                <p className="text-sm text-[#64748B]">Progress pembelajaran</p>
              </div>

              {/* List Pembelajaran dari Guru */}
              {pembelajaranList.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pembelajaranList.map((pembelajaran: any) => {
                    const progress = progressData.find((p: any) => p.pembelajaranId === pembelajaran.id);
                    const totalSteps = pembelajaran.steps?.length || 0;
                    const completedSteps = progress?.steps ? Object.values(progress.steps).filter((s: any) => s?.completed).length : 0;
                    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
                    
                    return (
                      <div
                        key={pembelajaran.id}
                        className="flex items-center justify-between p-3 rounded-[1.5rem] bg-[#B8E8C8]/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#B8E8C8] flex items-center justify-center text-sm">
                            {pembelajaran.icon === 'BookOpen' || pembelajaran.icon === 'book-open' ? (
                              <BookOpen className="w-4 h-4 text-[#2B593F]" />
                            ) : (
                              pembelajaran.icon || '📚'
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0077B6]">{pembelajaran.title || pembelajaran.judul}</p>
                            <p className="text-xs text-[#64748B]">{completedSteps}/{totalSteps} step</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2B593F] rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#2B593F]">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#94A3B8] text-center py-4">Belum ada pembelajaran dari guru</p>
              )}
            </div>

            {/* Todo List Card - Right (Same size as Streak) */}
            <div id="onboarding-todo-card" className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#C8B6E2] rounded-[1.5rem] flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-[#4A3B69]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0077B6]">{t.todoList}</h3>
                  <p className="text-xs text-[#64748B]">{tasks.filter(t => !t.completed).length} tersisa</p>
                </div>
              </div>
              
              {/* Add Task Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder={t.addTask}
                  className="flex-1 min-w-0 px-4 py-2 rounded-[1.5rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] focus:border-transparent transition-all"
                />
                <button
                  onClick={addTask}
                  className="w-10 h-10 flex-shrink-0 rounded-[1.5rem] bg-[#4A3B69] text-white flex items-center justify-center hover:bg-[#5b4b7d] transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Task List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0"
                    >
                      {task.completed ? (
                        <Circle className="w-5 h-5 text-[#10B981] fill-[#10B981]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#94A3B8]" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${task.completed ? 'text-[#94A3B8] line-through' : 'text-[#0077B6]'}`}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-[#EF4444] hover:bg-[#FEE2E2] w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-sm text-[#94A3B8] text-center py-4">Tidak ada tugas</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-[2rem] shadow-2xl z-50 ${
            toastType === 'success' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#DC2626]'
          }`}
        >
          <p className="font-semibold text-sm">{toastMessage}</p>
        </motion.div>
      )}

      {/* Streak Celebration Modal */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowStreakCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="text-6xl mb-4"
                >
                  🔥
                </motion.div>
                <h3 className="text-2xl font-bold text-[#0077B6] mb-2">Streak Aktif!</h3>
                <p className="text-[#64748B] mb-4">Kamu berhasil check-in hari ini</p>
                <p className="text-sm text-[#F97316] font-semibold">+1 poin bantuan</p>
                <button
                  onClick={() => setShowStreakCelebration(false)}
                  className="mt-6 px-8 py-3 rounded-[2rem] bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-semibold hover:opacity-90 transition-all"
                >
                  Mantap!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}