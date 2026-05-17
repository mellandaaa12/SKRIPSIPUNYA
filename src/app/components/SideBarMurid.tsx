import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { AccountModal } from "./AccountModal";
import { HelpCenterModal } from "./HelpCenterModal";
import { BookOpen, Calendar, MessageCircle, LogOut, LayoutDashboard, HelpCircle, Info } from "lucide-react";
import { resetOnboarding } from "../utils/onboarding";

interface MenuItem {
  id?: string;
  path: string;
  label: string;
  icon: any;
}

export function SideBarMurid() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "siswa") return;
    
    const updateActiveStatus = async () => {
      let currentActivity = "Online";
      const path = location.pathname;
      
      if (path.includes("/materi/")) {
        currentActivity = "Membaca Materi";
      } else if (path.includes("/code-editor/")) {
        currentActivity = "Mengerjakan Code Editor";
      } else if (path.includes("/quiz/")) {
        currentActivity = "Mengerjakan Quiz";
      } else if (path.includes("/pembelajaran/")) {
        currentActivity = "Membuka Progressive Learning";
      } else if (path.includes("/pembelajaran")) {
        currentActivity = "Melihat Daftar Materi";
      } else if (path.includes("/forum")) {
        currentActivity = "Membuka Forum Diskusi";
      } else if (path.includes("/schedule")) {
        currentActivity = "Melihat Jadwal";
      } else if (path.includes("/dashboard")) {
        currentActivity = "Membuka Dashboard";
      }

      try {
        await supabase
          .from("profiles")
          .update({ 
            updated_at: new Date().toISOString(),
            status: currentActivity 
          })
          .eq("id", user.id);
      } catch (err) {
        console.warn("Failed to update active status:", err);
      }
    };

    void updateActiveStatus();
  }, [location.pathname, user?.id]);

  if (!user) return null;

  // Use user from AuthContext (already mapped to CustomUser)
  const profileData = user ? {
    name: user.name,
    email: user.email,
    role: user.role,
    classId: user.classId
  } : null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleAvatarUpdate = () => {
    // Handled by AuthContext
  };

  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/pembelajaran",
      label: "Pembelajaran",
      icon: BookOpen,
    },
    {
      path: "/schedule",
      label: "Schedule",
      icon: Calendar,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div id="onboarding-sidebar" className="fixed left-8 top-4 bottom-4 w-64 bg-white backdrop-blur-20 rounded-[44px] shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-[#E2E8F0] flex flex-col overflow-hidden z-20">
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
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
            )}
          </div>
          <h3 className="text-[#1E293B] font-semibold text-base text-center">{user?.name}</h3>
          <p className="text-[#64748B] text-sm">Siswa</p>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 px-6 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                id={`onboarding-menu-${item.id || item.label.toLowerCase()}`}
                onClick={() => navigate(item.path)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${active
                  ? "bg-[#0077B6] text-white font-semibold shadow-lg shadow-blue-100"
                  : "text-[#1E293B]/80 hover:bg-[#E8F4FD] hover:text-[#0077B6]"
                  }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-white" : "text-[#1E293B]/80 group-hover:text-[#0077B6]"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-px bg-[#E2E8F0] my-2" />

          {/* Forum Diskusi */}
          <button
            onClick={() => navigate("/forum")}
            id="onboarding-menu-forum"
            className={`flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${isActive("/forum")
              ? "bg-[#0077B6] text-white font-semibold shadow-lg shadow-blue-100"
              : "text-[#1E293B]/80 hover:bg-[#E8F4FD] hover:text-[#0077B6]"
              }`}
          >
            <MessageCircle className={`w-5 h-5 ${isActive("/forum") ? "text-white" : "text-[#1E293B]/80"}`} />
            <span>Forum Diskusi</span>
          </button>

          <div className="h-px bg-[#E2E8F0] my-2" />

          {/* User Guide Tour Trigger */}
          <button
            onClick={() => resetOnboarding(navigate)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-[2rem] text-[13px] font-medium text-[#1E293B]/80 hover:bg-[#E8F4FD] hover:text-[#0077B6] transition-all duration-200"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tour Panduan</span>
          </button>

          {/* Help Center Trigger */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-[2rem] text-[13px] font-medium text-[#1E293B]/80 hover:bg-[#E8F4FD] hover:text-[#0077B6] transition-all duration-200"
          >
            <Info className="w-4 h-4" />
            <span>Pusat Bantuan (Baca)</span>
          </button>

          {/* Log Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-[#DC2626] transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onImageUpdate={handleAvatarUpdate}
        storageKey="profileImage"
        profileData={profileData}
        userRole="siswa"
      />
      <HelpCenterModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
}
