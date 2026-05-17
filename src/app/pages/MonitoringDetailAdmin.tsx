"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { SideBarAdmin } from "../components/SideBarAdmin";
import { ProfileHeader } from "../components/ProfileHeader";
import { Search, Users, UserCheck, Activity, Clock, AlertCircle, BarChart3, Eye, BookOpen, TrendingUp, Filter, RefreshCw, ChevronRight } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { getMonitoringData } from "../utils/api";
import { useNavigate } from "react-router";

interface MonitoringData {
  summary: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeToday: number;
    newUsersThisWeek: number;
  };
  recentActivities: Array<{
    id: string;
    type: 'student' | 'teacher';
    name: string;
    email: string;
    role: string;
    status: string;
    lastLogin: string;
    className: string | null;
  }>;
  classOverview: Array<{
    id: string;
    name: string;
    subject: string;
    studentCount: number;
    teacherCount: number;
  }>;
}

export default function MonitoringDetailAdmin() {
  const { preferences } = useSettings();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'student' | 'teacher'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitoringData = async () => {
    if (!session?.access_token) return;
    
    try {
      setRefreshing(true);
      const response = await getMonitoringData(session.access_token);
      setMonitoringData(response as unknown as MonitoringData);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [session]);

  const filteredActivities = monitoringData?.recentActivities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'student' && activity.type === 'student') ||
                         (filterType === 'teacher' && activity.type === 'teacher');
    return matchesSearch && matchesFilter;
  }) || [];

  const texts = {
    id: {
      title: "Monitoring Aktivitas",
      subtitle: "Pantau aktivitas guru dan siswa secara real-time",
      recentActivity: "Aktivitas Terkini",
      viewAll: "Lihat Semua",
      welcome: "Monitoring Detail",
      description: "Kelola dan pantau semua aktivitas pengguna sistem.",
      totalUsers: "Total Pengguna",
      activeToday: "Aktif Hari Ini",
      newUsers: "Pengguna Baru (Minggu Ini)",
      searchPlaceholder: "Cari nama atau email...",
      allActivities: "Semua Aktivitas",
      students: "Siswa",
      teachers: "Guru",
      refresh: "Refresh",
      activities: "aktivitas",
      noActivities: "Tidak ada aktivitas terkini",
      noSearchResults: "Tidak ada aktivitas yang cocok dengan pencarian",
    },
    en: {
      title: "Activity Monitoring",
      subtitle: "Monitor teacher and student activities in real-time",
      recentActivity: "Recent Activities",
      viewAll: "View All",
      welcome: "Monitoring Detail",
      description: "Manage and monitor all system user activities.",
      totalUsers: "Total Users",
      activeToday: "Active Today",
      newUsers: "New Users (This Week)",
      searchPlaceholder: "Search name or email...",
      allActivities: "All Activities",
      students: "Students",
      teachers: "Teachers",
      refresh: "Refresh",
      activities: "activities",
      noActivities: "No recent activities",
      noSearchResults: "No activities match your search",
    },
  };

  const t = texts[preferences.language];

  const statCardStyles = {
    primary: {
      iconBg: "bg-[#C8B6E2]",
      iconColor: "text-[#4A3B69]",
    },
    secondary: {
      iconBg: "bg-[#B8E8C8]",
      iconColor: "text-[#2B593F]",
    },
    tertiary: {
      iconBg: "bg-[#FFE4B5]",
      iconColor: "text-[#8A6327]",
    },
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, variant = "primary", trend }: any) => {
    const style = statCardStyles[variant as keyof typeof statCardStyles] || statCardStyles.primary;
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className={`bg-white rounded-[20px] p-[24px] shadow-md border-2 border-[#e2e8f0] cursor-pointer hover:border-[#90E0EF] transition-all ${
          preferences.darkMode ? "bg-[#334155] border-[#64748b]" : ""
        }`}
      >
        <div className={`w-[48px] h-[48px] ${style.iconBg} rounded-[12px] flex items-center justify-center mb-[16px]`}>
          <Icon className={`w-[24px] h-[24px] ${style.iconColor}`} />
        </div>
        <div className="flex items-center justify-between mb-[4px]">
          <h3 className={`font-['Poppins'] font-bold text-[32px] ${
            preferences.darkMode ? "text-white" : "text-[#00B4D8]"
          }`}>
            {loading ? "..." : value}
          </h3>
          {trend && (
            <div className={`flex items-center text-[12px] ${trend > 0 ? 'text-[#0077B6]' : 'text-[#DC2626]'}`}>
              <TrendingUp className="w-[14px] h-[14px] mr-[4px]" />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className={`font-['Poppins'] text-[13px] ${
          preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
        }`}>
          {subtitle}
        </p>
      </motion.div>
    );
  };

  const ActivityRow = ({ activity }: { activity: any }) => (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-[16px] p-[16px] rounded-[12px] transition-colors duration-300 ${
        preferences.darkMode ? "bg-[#475569]" : "bg-[#f8fafc]"
      }`}
    >
      <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0 ${
        activity.type === 'student' ? 'bg-[#C8B6E2]' : 'bg-[#B8E8C8]'
      }`}>
        {activity.type === 'student' ? (
          <Users className="w-[20px] h-[20px] text-[#4A3B69]" />
        ) : (
          <UserCheck className="w-[20px] h-[20px] text-[#2B593F]" />
        )}
      </div>
      <div className="flex-1">
        <div className={`font-semibold text-[14px] mb-[4px] ${
          preferences.darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {activity.name}
        </div>
        <div className={`text-[12px] ${
          preferences.darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {activity.email} • {activity.role}
        </div>
        {activity.className && (
          <div className={`text-[11px] ${
            preferences.darkMode ? 'text-[#90E0EF]' : 'text-[#0077B6]'
          }`}>
            Kelas: {activity.className}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className={`text-[12px] ${
          preferences.darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {new Date(activity.lastLogin).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className={`flex items-center gap-[4px] mt-[4px] text-[11px] ${
          activity.status === 'Active' ? 'text-[#2B593F]' : 'text-[#DC2626]'
        }`}>
          <div className={`w-[8px] h-[8px] rounded-full ${
            activity.status === 'Active' ? 'bg-[#2B593F]' : 'bg-[#DC2626]'
          }`} />
          {activity.status}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#90E0EF]/40 blur-3xl" />
          <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#90E0EF]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#CAF0F8]/30 blur-3xl" />
        </div>
        
        <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
          <SideBarAdmin />
        </div>
        
        <main className="ml-0 lg:ml-80 min-h-screen relative flex items-center justify-center">
          <div className="text-center bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] shadow-xl border border-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B4D8] mx-auto mb-4" />
            <div className="font-poppins text-lg text-[#0077B6]">
              Memuat data monitoring...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#90E0EF]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#90E0EF]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#CAF0F8]/30 blur-3xl" />
      </div>

      <div className="fixed left-8 top-4 bottom-4 z-30 hidden lg:block">
        <SideBarAdmin />
      </div>

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative p-8">
        {/* Profile Header at top right */}
        <div className="flex justify-end mb-6">
          <ProfileHeader />
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[35px] p-[42px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)] mb-[20px]"
        >
          <h1 className="font-['Lato'] font-extrabold text-[40px] text-white uppercase tracking-[1.6px] leading-[1.4]">
            {t.title}
          </h1>
          <p className="font-['Poppins'] text-[18px] text-white/90 leading-[27px] capitalize">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-3 gap-[20px] mb-[20px]"
        >
          <StatCard
            icon={Users}
            title={monitoringData?.summary.totalUsers.toString() || "0"}
            subtitle={t.totalUsers}
            variant="primary"
            trend={12}
          />
          <StatCard
            icon={Activity}
            title={monitoringData?.summary.activeToday.toString() || "0"}
            subtitle={t.activeToday}
            variant="secondary"
            trend={8}
          />
          <StatCard
            icon={TrendingUp}
            title={monitoringData?.summary.newUsersThisWeek.toString() || "0"}
            subtitle={t.newUsers}
            variant="tertiary"
            trend={15}
          />
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={`rounded-[20px] p-[24px] mb-[20px] border-2 transition-colors duration-300 ${
            preferences.darkMode 
              ? "bg-[#334155] border-[#64748b]" 
              : "bg-white border-[#e2e8f0]"
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-[16px] items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-[16px] top-[50%] transform -translate-y-1/2 w-[20px] h-[20px] text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-[48px] pr-[16px] py-[12px] rounded-[8px] border ${
                    preferences.darkMode 
                      ? 'bg-[#374151] border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
            <div className="flex gap-[12px] items-center">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className={`px-[16px] py-[12px] rounded-[8px] border ${
                  preferences.darkMode 
                    ? 'bg-[#374151] border-gray-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">{t.allActivities}</option>
                <option value="student">{t.students}</option>
                <option value="teacher">{t.teachers}</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchMonitoringData}
                disabled={refreshing}
                className="flex items-center gap-[8px] px-[16px] py-[12px] bg-[#8b5cf6] text-white rounded-[8px] hover:bg-[#7c3aed] disabled:opacity-50 font-['Poppins'] text-[13px] transition-colors"
              >
                <RefreshCw className={`w-[16px] h-[16px] ${refreshing ? 'animate-spin' : ''}`} />
                {t.refresh}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className={`rounded-[20px] p-[32px] shadow-md border-2 border-[#e2e8f0] transition-colors duration-300 ${
            preferences.darkMode ? "bg-[#334155] border-[#64748b]" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-[24px]">
            <h2 className={`font-['Poppins'] font-bold text-[20px] ${
              preferences.darkMode ? "text-white" : "text-[#00B4D8]"
            }`}>
              {t.recentActivity}
            </h2>
            <div className={`text-sm ${
              preferences.darkMode ? "text-[#94a3b8]" : "text-[#64748b]"
            }`}>
              {filteredActivities.length} {t.activities}
            </div>
          </div>

          <div className="flex flex-col gap-[16px] max-h-[300px] overflow-y-auto">
            <AnimatePresence>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-[48px]"
                >
                  <AlertCircle className="w-[48px] h-[48px] mb-[16px] text-gray-400" />
                  <div className={`font-['Poppins'] text-lg ${
                    preferences.darkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'
                  }`}>
                    {searchQuery ? t.noSearchResults : t.noActivities}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
