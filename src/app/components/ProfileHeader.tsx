"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { Bell, BookOpen, MessageSquare, FolderPlus, Sparkles } from "lucide-react";
import { markAllNotificationsRead } from "../utils/api";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "materi" | "forum" | "tugas" | "like" | "comment" | "broadcast";
  time: string;
  createdAt: string;
}

export function ProfileHeader() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return "Baru saja";
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(name, avatar, avatar_color)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;

      const items: NotificationItem[] = (data || []).map(n => ({
        id: n.id,
        title: n.type === 'like' ? 'Suka Baru' : 
               n.type === 'comment' ? 'Komentar Baru' : 
               n.type === 'materi' ? 'Materi Baru' : 
               n.type === 'broadcast' ? 'Pengumuman' : 'Notifikasi',
        description: n.content,
        type: n.type as any,
        time: getTimeAgo(n.created_at),
        createdAt: n.created_at
      }));

      setNotifications(items);
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "notifications",
        filter: `user_id=eq.${user.id}`
      }, () => { void fetchNotifications(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleTogglePopover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && unreadCount > 0) {
      try {
        await markAllNotificationsRead(user.id);
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 relative" ref={popoverRef}>
      <div className="relative">
        <button
          onClick={handleTogglePopover}
          className="h-12 w-12 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex items-center justify-center text-[#0077B6] hover:bg-white transition-all duration-200 group"
          title="Notifikasi Aktivitas"
        >
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200 text-[#0077B6]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0077B6] text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-[2rem] bg-white/95 backdrop-blur-25 border border-white/90 shadow-[0_16px_40px_-4px_rgba(0,0,0,0.15)] overflow-hidden z-50"
          >
            <div className="p-4 bg-gradient-to-r from-[#0077B6]/10 to-[#0077B6]/10 border-b border-gray-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0077B6]" />
                <h3 className="font-bold text-sm text-[#0077B6]">Notifikasi Sistem</h3>
              </div>
              <span className="text-[10px] font-bold text-[#0077B6] bg-white px-2.5 py-1 rounded-full shadow-xs">
                Realtime
              </span>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 pr-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Belum ada notifikasi aktivitas terbaru.
                </div>
              ) : (
                notifications.map((item) => {
                  const isMateri = item.type === "materi";
                  const isForum = item.type === "forum" || item.type === "comment" || item.type === "like" || item.type === "broadcast";
                  return (
                    <div key={item.id} className="p-4 hover:bg-gray-50/80 transition-colors duration-150 flex gap-3 items-start">
                      <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${isMateri ? 'bg-emerald-50 text-emerald-600' : isForum ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.type === 'like' ? <Sparkles className="h-4 w-4" /> : 
                         item.type === 'materi' ? <BookOpen className="h-4 w-4" /> : 
                         <MessageSquare className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-xs font-bold text-[#0077B6] truncate">{item.title}</p>
                          <span className="text-[9px] font-medium text-gray-400 flex-shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed break-words">{item.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="h-9 w-9 rounded-full ring-2 ring-[#90E0EF] object-cover" 
          />
        ) : (
          <div 
            className="h-9 w-9 rounded-full ring-2 ring-[#90E0EF] flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: user.avatarColor || "#0077B6" }}
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#0077B6] leading-none mb-0.5">{user.name}</span>
          <span className="text-[10px] font-medium text-[#0077B6]">{user.email}</span>
        </div>
      </div>
    </div>
  );
}
