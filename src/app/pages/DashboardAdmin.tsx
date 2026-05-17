"use client";

import { useState, useEffect } from "react";
import { AccountModal } from "../components/AccountModal";
import { ProfileHeader } from "../components/ProfileHeader";
import {
  Users,
  BookOpen,
  Activity as ActivityIcon,
  Menu,
  X,
  GraduationCap,
  MoreHorizontal,
  Clock,
  Search,
  SlidersHorizontal,
  Sparkles,
  LayoutDashboard,
  LogOut,
  AlertCircle,
  TrendingUp,
  type LucideIcon
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { userAPI, classAPI, statsAPI } from "../utils/api";
import { supabase } from "../utils/supabase";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface Stats {
  totalSiswa: number;
  totalGuru: number;
  totalMateri: number;
  totalProject: number;
  totalKelas: number;
  totalAttention: number;
}

interface RecentActivity {
  id: string;
  type: "user" | "material" | "project";
  title: string;
  description: string;
  time: string;
  color: string;
  avatarColor: string;
  status: "Aktif" | "Pending" | "Offline";
  isOnline?: boolean;
  timestamp?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: "primary" | "secondary" | "tertiary" | "warning";
  onClick?: () => void;
  trend?: { value: string; positive: boolean };
}

type TabType = "aktivitas" | "online" | "semua";

export default function DashboardAdmin() {
  const { preferences } = useSettings();
  const { session, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalSiswa: 0,
    totalGuru: 0,
    totalMateri: 0,
    totalProject: 0,
    totalKelas: 0,
    totalAttention: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<"activities" | "online">("activities");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.avatar || null
  );

  useEffect(() => {
    if (user?.avatar) {
      setProfileImage(user.avatar);
    }
  }, [user?.avatar]);

  // Use user from AuthContext (already mapped to CustomUser)
  const profileData = user ? {
    name: user.name,
    email: user.email,
    role: user.role,
    statistics: {
      totalClasses: 0,
      totalTeachers: 0,
      totalStudents: 0
    }
  } : null;
  const [activeItem, setActiveItem] = useState("dashboard");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleProfileClick = () => {
    setIsAccountModalOpen(true);
  };

  const fetchStats = async () => {
    // Get token from session or localStorage
    const token = session?.access_token || localStorage.getItem('access_token');
    if (!token) {
      console.error("❌ No access token available");
      return;
    }

    try {
      setLoading(true);

      const [siswaRes, guruRes, kelasRes, monitorRes] = await Promise.all([
        userAPI.getByRole("siswa", token),
        userAPI.getByRole("guru", token),
        classAPI.getAll(token),
        statsAPI.getMonitoring(token),
      ]);

      console.log("📊 Dashboard Stats - Siswa:", siswaRes);
      console.log("📊 Dashboard Stats - Guru:", guruRes);
      console.log("📊 Dashboard Stats - Kelas:", kelasRes);

      const siswaCount = siswaRes.users?.length || 0;
      const guruCount = guruRes.users?.length || 0;
      const kelasCount = kelasRes.kelas?.length || 0;

      const attentionCount = monitorRes.totalSiswaButuhPerhatian || 0;

      setStats({
        totalSiswa: siswaCount,
        totalGuru: guruCount,
        totalMateri: monitorRes.totalPembelajaran || 0,
        totalProject: monitorRes.totalProjects || 0,
        totalKelas: kelasCount,
        totalAttention: attentionCount,
      });

      console.log("📊 Final Stats:", { siswaCount, guruCount, attentionCount, kelasCount });

      const newActivities: RecentActivity[] = [];
      const now = new Date().getTime();

      const checkOnline = (updatedAt: string | undefined | null) => {
        if (!updatedAt) return false;
        const lastUpdate = new Date(updatedAt).getTime();
        return (now - lastUpdate) < 60000;
      };

      const getTimeAgo = (dateString: string | undefined | null) => {
        if (!dateString) return "Baru saja";
        const date = new Date(dateString).getTime();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return "Baru saja";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
        return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
      };

      guruRes.users?.slice(0, 2).forEach((guru: any) => {
        const timestamp = guru.updated_at || guru.updatedAt || guru.created_at || guru.createdAt;
        const online = checkOnline(timestamp);
        newActivities.push({
          id: `guru-${guru.id}`,
          type: "user",
          title: `Guru: ${guru.name}`,
          description: "Guru terdaftar dalam sistem",
          time: "", // calculated in render
          timestamp: timestamp,
          color: "from-blue-400 to-blue-600",
          avatarColor: "bg-gradient-to-br from-[#0077B6] to-[#00B4D8]",
          status: online ? "Aktif" : "Offline",
          isOnline: online,
        });
      });

      siswaRes.users?.slice(0, 3).forEach((siswa: any) => {
        const timestamp = siswa.updated_at || siswa.updatedAt || siswa.created_at || siswa.createdAt;
        const online = checkOnline(timestamp);
        newActivities.push({
          id: `siswa-${siswa.id}`,
          type: "user",
          title: `Siswa: ${siswa.name}`,
          description: "Siswa terdaftar dalam sistem",
          time: "", // calculated in render
          timestamp: timestamp,
          color: "from-blue-400 to-blue-600",
          avatarColor: "bg-gradient-to-br from-[#0077B6] to-[#0077B6]",
          status: online ? "Aktif" : "Offline",
          isOnline: online,
        });
      });

      kelasRes.kelas?.slice(0, 2).forEach((kelas: any) => {
        const timestamp = kelas.updated_at || kelas.updatedAt || kelas.created_at || kelas.createdAt;
        newActivities.push({
          id: `kelas-${kelas.id}`,
          type: "project",
          title: `Kelas: ${kelas.name}`,
          description: kelas.subject || "Kelas tersedia",
          time: "", // calculated in render
          timestamp: timestamp,
          color: "from-blue-400 to-blue-600",
          avatarColor: "bg-gradient-to-br from-[#90E0EF] to-[#00B4D8]",
          status: "Pending",
          isOnline: false,
        });
      });

      // Sort activities based on the most recent first
      newActivities.sort((a, b) => {
        const getMs = (timeStr: string) => {
          if (timeStr === "Baru saja") return 0;
          const val = parseInt(timeStr);
          if (timeStr.includes("menit")) return val * 60;
          if (timeStr.includes("jam")) return val * 3600;
          if (timeStr.includes("hari")) return val * 86400;
          return 999999;
        };
        return getMs(a.time) - getMs(b.time);
      });

      setActivities(newActivities);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [session]);

  // Real-time synchronization for Admin Dashboard
  useEffect(() => {
    const token = session?.access_token || localStorage.getItem("access_token");
    if (!token) return;

    const channel = supabase
      .channel("admin-dashboard-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          console.log("🔄 Realtime: Profiles changed, updating stats...");
          void fetchStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        () => {
          console.log("🔄 Realtime: Classes changed, updating stats...");
          void fetchStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pembelajaran" },
        () => {
          console.log("🔄 Realtime: Pembelajaran changed, updating stats...");
          void fetchStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          console.log("🔄 Realtime: Projects changed, updating stats...");
          void fetchStats();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session]);

  const handleProfileImageUpdate = async (imageUrl: string) => {
    try {
      setProfileImage(imageUrl);
      // imageUrl saved locally (Supabase storage upload not yet configured)
    } catch (error) {
      console.error("Profile image update failed:", error);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-admin" },
    { id: "kelas", label: "Kelola Kelas", icon: BookOpen, path: "/dashboard-admin/kelola-kelas" },
    { id: "guru", label: "Kelola Guru", icon: GraduationCap, path: "/dashboard-admin/kelola-guru" },
    { id: "siswa", label: "Kelola Siswa", icon: Users, path: "/dashboard-admin/kelola-siswa" },
    { id: "monitoring", label: "Monitoring", icon: ActivityIcon, path: "/dashboard-admin/monitoring" },
  ];

  const statusStyles = {
    "Aktif": "bg-[#DCFCE7] text-[#16A34A]",
    "Pending": "bg-[#FEF3C7] text-[#D97706]",
    "Offline": "bg-[#F1F5F9] text-[#64748B]"
  };

  const variants = {
    primary: {
      iconBg: "bg-[#C8B6E2]",
      iconColor: "text-[#4A3B69]",
      shadow: "",
    },
    secondary: {
      iconBg: "bg-[#B8E8C8]",
      iconColor: "text-[#2B593F]",
      shadow: "",
    },
    tertiary: {
      iconBg: "bg-[#FFE4B5]",
      iconColor: "text-[#8A6327]",
      shadow: "",
    },
    warning: {
      iconBg: "bg-[#FFB3C1]",
      iconColor: "text-[#8A2B3D]",
      shadow: "",
    }
  };

  function StatCard({ title, value, icon: Icon, variant, onClick, trend }: StatCardProps) {
    const style = variants[variant];

    return (
      <div 
        onClick={onClick}
        className="relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
      >
        <div className="relative">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl mb-4",
            style.iconBg, style.shadow
          )}>
            <Icon className={cn("h-6 w-6", style.iconColor)} />
          </div>
          <h3 className="text-3xl font-bold text-[#1A1A2E] mb-1">
            {loading ? "—" : (typeof value === 'number' ? value.toLocaleString() : value)}
          </h3>
          <p className="text-sm text-[#64748B] font-medium">{title}</p>
          {trend && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-[#F4F8FF] text-xs font-semibold text-[#0077B6]">
              <span>{trend.positive ? '+' : ''}{trend.value}</span>
              <span className="text-[#64748B] font-normal">dari bulan lalu</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const texts = {
    id: {
      title: "Dashboard Admin",
      subtitle: "Kelola Sistem LMS Secara Menyeluruh",
      recentActivity: "Aktivitas",
      viewAll: "Lihat Semua",
      welcome: "Selamat Datang, Admin!",
      description: "Kelola guru, siswa, kelas, dan pantau aktivitas pembelajaran.",
      overview: "Ringkasan",
      monthly: "Bulanan",
      addData: "Tambah data",
      filters: "Filter",
      entity: "Entitas",
      detail: "Detail",
      status: "Status",
      time: "Waktu",
    },
    en: {
      title: "Admin Dashboard",
      subtitle: "Manage LMS System Comprehensively",
      recentActivity: "Activity",
      viewAll: "View All",
      welcome: "Welcome, Admin!",
      description: "Manage teachers, students, classes, and monitor learning activities.",
      overview: "Overview",
      monthly: "Monthly",
      addData: "Add data",
      filters: "Filters",
      entity: "Entity",
      detail: "Detail",
      status: "Status",
      time: "Time",
    },
  };

  const t = texts[preferences.language];
  const tabs: { id: TabType; label: string }[] = [
    { id: "aktivitas", label: "Aktivitas" },
    { id: "online", label: "Online" },
    { id: "semua", label: "Semua" }
  ];

  return (
    <div className="min-h-screen w-full m-0 p-0 relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
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
            className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2rem] border border-gray-200/30 bg-white/75 backdrop-blur-16 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#0077B6]">Menu</h2>
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
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
                  <Sparkles className="h-4 w-4 text-[#00B4D8]" />
                  <span className="text-sm font-semibold text-[#00B4D8]">{t.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 text-[#64748B] hover:text-[#0077B6] transition-colors shadow-sm">
                    <AlertCircle className="w-5 h-5" />
                  </button>
                  <div className="cursor-pointer" onClick={handleProfileClick}>
                    <ProfileHeader />
                  </div>
                </div>
              </div>

              {/* Welcome Section */}
              <div className="mb-8 animate-slideIn">
                <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[3rem] p-10 shadow-lg flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {t.welcome}
                    </h1>
                    <p className="text-blue-100 text-sm">
                      {t.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-scaleIn">
                <StatCard
                  title={preferences.language === "id" ? "Total Siswa" : "Total students"}
                  value={stats.totalSiswa}
                  icon={Users}
                  variant="primary"
                  onClick={() => navigate("/dashboard-admin/kelola-siswa")}
                  trend={{ value: "12%", positive: true }}
                />
                <StatCard
                  title={preferences.language === "id" ? "Total Guru" : "Teachers"}
                  value={stats.totalGuru}
                  icon={GraduationCap}
                  variant="secondary"
                  onClick={() => navigate("/dashboard-admin/kelola-guru")}
                  trend={{ value: "3%", positive: true }}
                />
                <StatCard
                  title={preferences.language === "id" ? "Total Kelas" : "Classes"}
                  value={stats.totalKelas}
                  icon={BookOpen}
                  variant="tertiary"
                  onClick={() => navigate("/dashboard-admin/kelola-kelas")}
                />
                <StatCard
                  title="Butuh Perhatian"
                  value={stats.totalAttention}
                  icon={AlertCircle}
                  variant="warning"
                  onClick={() => navigate("/dashboard-admin/monitoring")}
                />
              </div>

              {/* Activity Table */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm animate-slideIn">
                {/* Filter Row */}
                <div className="px-5 py-4 border-b border-[#E2E8F0]/50">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-semibold text-[#0077B6]">Filter:</span>

                    {/* Search Name */}
                    <div className="relative flex-1 max-w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <input
                        placeholder={preferences.language === "id" ? "Cari nama..." : "Search name..."}
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/70 border border-gray-200 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Search Email */}
                    <div className="relative flex-1 max-w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <input
                        placeholder="Email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/70 border border-[#E2E8F0] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Dropdown Filters */}
                    <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/70 border border-[rgba(0,119,182,0.2)] text-sm text-[#64748B] hover:bg-white hover:border-[rgba(0,119,182,0.4)] transition-all duration-200">
                      {preferences.language === "id" ? "Peran" : "Role"}
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/70 border border-[rgba(0,119,182,0.2)] text-sm text-[#64748B] hover:bg-white hover:border-[rgba(0,119,182,0.4)] transition-all duration-200">
                      {preferences.language === "id" ? "Status" : "Status"}
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 border border-[rgba(0,119,182,0.2)] text-[#64748B] hover:bg-white hover:border-[rgba(0,119,182,0.4)] hover:text-[#0077B6] transition-all duration-200">
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Header with Tabs */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-[#E2E8F0]/50">
                  <h2 className="text-base font-semibold text-[#0077B6]">{t.recentActivity}</h2>

                  {/* Tabs */}
                  <div className="flex items-center p-1 rounded-xl bg-[#F1F5F9]">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActivityTab(tab.id as "activities" | "online")}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          activityTab === tab.id
                            ? "bg-[#0077B6] text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]"
                            : "text-[#64748B] hover:text-[#0077B6]"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Header */}
                <div className="px-5 py-3 grid grid-cols-12 gap-4 border-b border-[#E2E8F0]/50 bg-[#F8FAFC]/50">
                  <div className="col-span-4">
                    <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t.entity}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t.detail}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t.status}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t.time}</span>
                  </div>
                </div>

                {/* Table Body */}
                <div>
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#0077B6]" />
                    </div>
                  ) : activityTab === "online" ? (
                    <p className="py-12 text-center text-sm text-[#94A3B8]">
                      {preferences.language === "id" ? "Tidak ada data online." : "No online data."}
                    </p>
                    ) : activities.length === 0 ? (
                      <div className="flex flex-col items-center py-14">
                        <ActivityIcon className="mb-3 h-12 w-12 text-[#CBD5E1]" />
                        <p className="text-sm text-[#94A3B8]">
                          {preferences.language === "id" ? "Belum ada aktivitas" : "No activity yet"}
                        </p>
                      </div>
                    ) : (
                      activities.slice(0, 8).map((activity) => {
                        const now = new Date().getTime();
                        const activityTime = activity.timestamp ? new Date(activity.timestamp).getTime() : now;
                        const diffInSeconds = Math.floor((now - activityTime) / 1000);
                        
                        let timeAgo = "Baru saja";
                        if (diffInSeconds >= 86400) timeAgo = `${Math.floor(diffInSeconds / 86400)} hari lalu`;
                        else if (diffInSeconds >= 3600) timeAgo = `${Math.floor(diffInSeconds / 3600)} jam lalu`;
                        else if (diffInSeconds >= 60) timeAgo = `${Math.floor(diffInSeconds / 60)} menit lalu`;

                        const roleLabel = activity.title.startsWith("Guru")
                        ? preferences.language === "id"
                          ? "Guru"
                          : "Teacher"
                        : activity.title.startsWith("Siswa")
                          ? preferences.language === "id"
                            ? "Siswa"
                            : "Student"
                          : preferences.language === "id"
                            ? "Kelas"
                            : "Class";

                      return (
                        <div
                          key={activity.id}
                          className="px-5 py-4 grid grid-cols-12 gap-4 items-center border-b border-[#E2E8F0]/30 hover:bg-[#F8FAFC]/50 transition-all duration-200 group"
                        >
                          {/* Entity */}
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="relative">
                              <div className={`h-10 w-10 rounded-full ring-2 ring-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] ${activity.avatarColor} flex items-center justify-center text-white text-sm font-semibold`}>
                                {activity.title.split(': ')[1]?.charAt(0) || 'U'}
                              </div>
                              {activity.isOnline ? (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#4ADE80] ring-2 ring-white" title="Online" />
                              ) : (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#94A3B8] ring-2 ring-white" title="Offline" />
                              )}
                            </div>
                            <span className="font-medium text-[#0077B6] text-sm">{activity.title}</span>
                          </div>

                          {/* Detail */}
                          <div className="col-span-4">
                            <span className="text-sm text-[#64748B]">{activity.description}</span>
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span className={cn(
                              "inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold",
                              statusStyles[activity.status]
                            )}>
                              {roleLabel}
                            </span>
                          </div>

                          {/* Time & Actions */}
                          <div className="col-span-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sm text-[#94A3B8]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{timeAgo}</span>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-blue-50 hover:text-[#0077B6] transition-all duration-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </main>

      {/* Global Account Modal */}
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)}
        onImageUpdate={handleProfileImageUpdate}
        storageKey="profileImageAdmin"
        profileData={profileData}
        userRole="admin"
      />
    </div>
  );
}
