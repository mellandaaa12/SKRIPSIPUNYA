"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { LayoutDashboard, BookOpen, MessageSquare, Settings, LogOut, Calendar } from "lucide-react";
import { AccountModal } from "./AccountModal";
import { useAuth } from "../context/AuthContext";

export function SideBarGuru() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  if (!user) return null;

  // Use user from AuthContext (already mapped to CustomUser)
  const profileData = user ? {
    name: user.name,
    email: user.email,
    role: user.role,
    classId: user.classId,
    classesCount: 0
  } : null;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleAvatarUpdate = () => {
    // Handled by AuthContext
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard-guru"
    },
    {
      id: "kelas",
      label: "Kelas",
      icon: BookOpen,
      path: "/dashboard-guru/kelas"
    },
    {
      id: "forum",
      label: "Forum Diskusi",
      icon: MessageSquare,
      path: "/dashboard-guru/forum"
    },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard-guru") {
      return location.pathname === "/dashboard-guru";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <aside className="fixed left-8 top-4 bottom-4 w-64 hidden lg:flex flex-col bg-white backdrop-blur-20 border border-[#E2E8F0] rounded-[44px] shadow-[0_18px_45px_rgba(15,23,42,0.08)] overflow-hidden">
        {/* Profile Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-[#E2E8F0]/30">
          <div className="relative mb-3 cursor-pointer" onClick={() => setIsAccountModalOpen(true)}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="h-20 w-20 rounded-full ring-4 ring-[#90E0EF]/50 object-cover" />
            ) : (
              <div 
                className="h-20 w-20 rounded-full ring-4 ring-[#90E0EF]/50 flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: user?.avatarColor || "#0077B6" }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'G'}
              </div>
            )}
          </div>
          <h3 className="text-[#1E293B] font-semibold text-base">{user?.name}</h3>
          <p className="text-[#64748B] text-sm">Guru</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 hover:scale-[1.02] ${
                  active
                    ? "bg-[#0077B6] text-white font-semibold shadow-lg shadow-blue-100"
                    : "text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-white" : "text-[#64748B]"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>


        {/* Logout */}
        <div className="px-3 pb-6 mt-auto border-t border-[#E2E8F0]/30 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-[#DC2626] transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onImageUpdate={handleAvatarUpdate}
        profileData={profileData}
        userRole="guru"
      />
    </>
  );
}
