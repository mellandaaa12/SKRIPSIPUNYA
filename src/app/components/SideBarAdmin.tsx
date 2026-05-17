"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import Avatar from "./Avatar";
import { AccountModal } from "./AccountModal";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Activity, 
  MessageSquare,
  LogOut
} from "lucide-react";

interface MenuItem {
  path: string;
  label: string;
  icon: any;
}

export function SideBarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { preferences } = useSettings();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  if (!user) return null;

  const menuItems: MenuItem[] = [
    {
      path: "/dashboard-admin",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/dashboard-admin/kelola-kelas",
      label: "Kelola Kelas",
      icon: BookOpen,
    },
    {
      path: "/dashboard-admin/kelola-guru",
      label: "Kelola Guru",
      icon: GraduationCap,
    },
    {
      path: "/dashboard-admin/kelola-siswa",
      label: "Kelola Siswa",
      icon: Users,
    },
    {
      path: "/dashboard-admin/monitoring",
      label: "Monitoring",
      icon: Activity,
    },
    {
      path: "/dashboard-admin/forum",
      label: "Forum Diskusi",
      icon: MessageSquare,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard-admin") {
      return location.pathname === "/dashboard-admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full w-[260px] overflow-hidden bg-white border border-[#E2E8F0] shadow-[0_18px_45px_rgba(15,23,42,0.08)] rounded-[44px] flex flex-col"
      >
        {/* Profile Section */}
        <div className="p-8 pb-4">
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="w-full group py-4 transition-all duration-300 text-center flex flex-col items-center gap-4"
          >
            <Avatar
              src={user?.avatar || null}
              name={user?.name || "Admin"}
              size="xl"
              editable={false}
            />
            <div className="w-full min-w-0">
              <p className="text-lg font-bold text-[#1A1A2E] truncate text-center">
                {user?.name || "Admin"}
              </p>
              <p className="text-sm font-medium text-[#64748B] text-center">Administrator</p>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-[#0077B6] text-white shadow-lg shadow-blue-100"
                    : "text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-white" : "text-[#64748B]"}`} />
                <span className={`text-sm font-semibold ${active ? "text-white" : "text-[#64748B]"}`}>
                  {item.label}
                </span>
                {active && (
                  <motion.div 
                    layoutId="activePill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-6 border-t border-[#F1F5F9]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">
              {preferences.language === "id" ? "Keluar" : "Logout"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        storageKey="profileImageAdmin"
        profileData={{
          name: user?.name,
          email: user?.email,
          role: user?.role
        }}
        userRole="admin"
      />
    </>
  );
}
