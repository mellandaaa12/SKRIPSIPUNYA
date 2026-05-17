"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { 
  Send, 
  MessageCircle, 
  Heart, 
  Sparkles, 
  Menu, 
  Plus, 
  X, 
  Loader, 
  Globe, 
  Users, 
  Hash, 
  Search,
  MoreVertical,
  Trash2,
  Activity as ActivityIcon,
  Smile,
  MessageSquare,
  Info
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { customPopup } from "../context/PopupContext";
import { 
  getForumPosts, 
  createForumPost, 
  likePost, 
  addComment, 
  deleteForumPost,
  deleteForumComment,
  userAPI,
  supabase,
  formatClassDisplayName,
  createNotification
} from "../utils/api";
import { motion, AnimatePresence } from "motion/react";

export default function ForumDiskusi() {
  const navigate = useNavigate();
  const { preferences } = useSettings();
  const { session, user } = useAuth();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  
  // State for Navigation & Data
  const [userClass, setUserClass] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("global");
  const [classMembers, setClassMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // New post states
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (session && user?.classId) {
      loadInitialData();
    }
  }, [session, user]);

  useEffect(() => {
    if (activeTab) {
      loadPosts();
      if (activeTab !== "global") {
        loadClassMembers(activeTab);
      } else {
        setClassMembers([]);
      }
    }
  }, [activeTab]);

  // Real-time synchronization
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("forum-realtime-siswa")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_posts" },
        () => loadPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_likes" },
        () => loadPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_comments" },
        () => loadPosts()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session]);

  const loadInitialData = async () => {
    try {
      const token = session?.access_token;
      if (!token || !user?.classId) return;
      
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', user.classId)
        .single();
      
      if (classData) {
        setUserClass({
          ...classData,
          displayName: formatClassDisplayName(classData)
        });
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const loadPosts = async () => {
    const token = session?.access_token;
    if (!token) return;
    
    try {
      const classId = activeTab === "global" ? undefined : activeTab;
      const data = await getForumPosts(token, classId);
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to load forum posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassMembers = async (classId: string) => {
    setLoadingMembers(true);
    try {
      const data = await userAPI.getStudentsByClass(classId);
      setClassMembers(data.students || []);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    const contentToPost = newPostContent;
    // Optimistic UI Update: Clear immediately and append to top
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      content: contentToPost,
      userName: user?.name || "Siswa",
      userRole: "siswa",
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      user_id: user?.id
    };
    setPosts(current => [optimisticPost, ...current]);
    setNewPostContent("");
    setIsAddPostModalOpen(false);

    setPosting(true);
    try {
      const token = session?.access_token;
      if (!token) return;
      
      const isGlobal = activeTab === "global";
      const classId = isGlobal ? undefined : activeTab;
      
      await createForumPost({ 
        content: contentToPost, 
        isGlobal, 
        classId 
      }, token);
      
    } catch (error) {
      console.error("Failed to create post:", error);
      await loadPosts();
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const isConfirmed = await customPopup.confirm("Hapus postingan ini?", 'warning');
    if (!isConfirmed) return;
    // Optimistic UI Update: remove from view immediately
    setPosts(current => current.filter(p => p.id !== postId));
    try {
      const token = session?.access_token;
      if (!token) return;
      await deleteForumPost(postId, token);
      await loadPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
      await loadPosts();
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const isConfirmed = await customPopup.confirm("Hapus balasan ini?", 'warning');
    if (!isConfirmed) return;
    // Optimistic UI update
    setPosts(current => current.map(p => 
      p.id === postId 
        ? { ...p, comments: (p.comments || []).filter((c: any) => c.id !== commentId) }
        : p
    ));
    try {
      const token = session?.access_token;
      if (!token) return;
      await deleteForumComment(commentId, token);
      await loadPosts();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      await loadPosts();
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic update for UI feel
    setPosts(current => current.map(p => 
      p.id === postId 
        ? { ...p, likes: p.likes?.includes(user?.id) ? p.likes.filter((id: string) => id !== user?.id) : [...(p.likes || []), user?.id] }
        : p
    ));
    try {
      const token = session?.access_token;
      if (!token) return;
      await likePost(postId, token);
      
      // Notify post author if liked (only if it was a 'like' action, not 'unlike')
      const post = posts.find(p => p.id === postId);
      const isLiked = post?.likes?.includes(user?.id);
      if (!isLiked && post && post.user_id !== user?.id && user?.id) {
        await createNotification({
          user_id: post.user_id,
          actor_id: user.id,
          type: "like",
          content: `${user.name} menyukai postingan Anda.`,
          link: "/forum"
        });
      }

    } catch (error) {
      console.error("Failed to like post:", error);
      await loadPosts();
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentText[postId];
    if (!content?.trim()) return;
    
    // Optimistic UI update: clear text instantly and append comment
    const optimisticComment = {
      id: `temp-comment-${Date.now()}`,
      content,
      userName: user?.name || "Siswa",
      createdAt: new Date().toISOString(),
    };
    setPosts(current => current.map(p => 
      p.id === postId 
        ? { ...p, comments: [...(p.comments || []), optimisticComment] }
        : p
    ));
    setCommentText(prev => ({ ...prev, [postId]: "" }));

    try {
      const token = session?.access_token;
      if (!token) return;
      await addComment(postId, content, token);
      
      // Notify post author
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== user?.id && user?.id) {
        await createNotification({
          user_id: post.user_id,
          actor_id: user.id,
          type: "comment",
          content: `${user.name} membalas postingan Anda.`,
          link: "/forum"
        });
      }

      await loadPosts();
    } catch (error) {
      console.error("Failed to add comment:", error);
      await loadPosts();
    }
  };

  const isOnline = (updatedAt: string) => {
    if (!updatedAt) return false;
    const lastSeen = new Date(updatedAt).getTime();
    const now = new Date().getTime();
    return (now - lastSeen) < 120000;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#0077B6]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#0077B6]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
      </div>

      <SideBarMurid />

      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <MessageSquare className="h-4 w-4 text-[#00B4D8]" />
              <span className="text-sm font-semibold text-[#0077B6]">Forum Diskusi</span>
            </div>

            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div id="onboarding-welcome-card" className="mb-8 animate-slideIn">
            <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.15)] text-white">
              <h1 className="text-3xl font-bold text-white mb-3">
                Forum Diskusi
              </h1>
              <p className="text-base text-blue-100">
                Tempat berbagi ide, bertanya, dan berdiskusi dengan teman sekelas dan gurumu.
              </p>
            </div>
          </div>

          {/* Grid Layout - Consistent with Theme */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column - Category Tabs */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-6 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-slideIn">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Kategori</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab("global")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[1.5rem] transition-all font-semibold text-sm ${activeTab === "global" ? "bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white shadow-[0_4px_16px_-4px_rgba(0,119,182,0.35)]" : "text-[#0077B6] hover:bg-white/60"}`}
                  >
                    <Globe className="w-5 h-5" />
                    Forum Global
                  </button>
                  
                  {userClass && (
                    <button 
                      onClick={() => setActiveTab(userClass.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[1.5rem] transition-all font-semibold text-sm ${activeTab === userClass.id ? "bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white shadow-[0_4px_16px_-4px_rgba(0,119,182,0.35)]" : "text-[#0077B6] hover:bg-white/60"}`}
                    >
                      <Hash className="w-5 h-5 flex-shrink-0" />
                      <div className="text-left overflow-hidden">
                        <p className="truncate leading-tight">
                          {userClass.displayName}
                        </p>
                        <p className={`text-[10px] truncate opacity-70 ${activeTab === userClass.id ? "text-white" : "text-gray-400"}`}>{userClass.subject}</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Card */}
              <div className="bg-gradient-to-br from-[#4A3B69] to-[#6C5B8B] rounded-[2.5rem] p-8 shadow-lg shadow-[rgba(74,59,105,0.15)] text-white animate-fadeIn">
                <h4 className="font-bold text-lg mb-2">Punya Pertanyaan?</h4>
                <p className="text-xs opacity-80 mb-6 leading-relaxed">Jangan ragu untuk bertanya kepada guru atau teman sekelasmu di sini.</p>
                <button 
                  onClick={() => setIsAddPostModalOpen(true)}
                  className="w-full py-4 bg-white text-[#4A3B69] rounded-[1.5rem] font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Mulai Bertanya
                </button>
              </div>
            </div>

            {/* Center Column - Feed */}
            <div className="lg:col-span-6 space-y-6">
              {loading ? (
                <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-20 flex items-center justify-center shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
                  <Loader className="w-10 h-10 text-[#0077B6] animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-[#0077B6]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0077B6]">Belum Ada Diskusi</h3>
                  <p className="text-sm text-gray-500 max-w-xs mt-2">Mulai percakapan pertama Anda hari ini!</p>
                </div>
              ) : (
                posts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]"
                  >
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${post.userRole === 'admin' ? 'from-red-400 to-red-600' : post.userRole === 'guru' ? 'from-amber-400 to-amber-600' : 'from-[#C8B6E2] to-[#4A3B69]'} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                          {post.userName?.charAt(0).toUpperCase()}
                        </div>
                        {isOnline(post.author?.updated_at) && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-[#0077B6]">{post.userName}</p>
                            <div className="flex items-center gap-2">
                              {post.userRole !== 'siswa' && (
                                <span className={`text-[9px] font-bold text-white px-2 py-0.5 rounded-full ${post.userRole === 'admin' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                  {post.userRole?.toUpperCase()}
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-gray-400">{formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.user_id === user?.id && (
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="p-2 text-gray-300 hover:text-red-500 rounded-full transition-all"
                                title="Hapus Postingan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button className="text-gray-300 hover:text-gray-500 transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[#334155] leading-relaxed mb-4 text-sm whitespace-pre-wrap">{post.content}</p>

                        <div className="flex items-center gap-6 py-4 border-t border-gray-100/50">
                          <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-2 text-xs font-bold transition-all ${post.likes?.includes(user?.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                          >
                            <Heart className={`w-4 h-4 ${post.likes?.includes(user?.id) ? "fill-current" : ""}`} />
                            {post.likes?.length || 0} Suka
                          </button>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments?.length || 0} Balasan
                          </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-3 pt-4 border-t border-gray-100/50">
                          {post.comments?.map((comment: any) => (
                            <div key={comment.id} className="flex gap-3 bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/30 relative group/comment">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                                {comment.userName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 pr-6">
                                <p className="text-xs font-bold text-[#0077B6] mb-1">{comment.userName}</p>
                                <p className="text-xs text-gray-600">{comment.content}</p>
                              </div>
                              {comment.user_id === user?.id && (
                                <button 
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="absolute right-3 top-3 p-1.5 text-gray-300 hover:text-red-500 rounded-full transition-colors"
                                  title="Hapus Balasan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          <div className="flex gap-3 mt-4">
                            <input 
                              type="text"
                              value={commentText[post.id] || ""}
                              onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                              placeholder="Tulis balasan..."
                              className="flex-1 px-5 py-2.5 rounded-full bg-gray-50/80 border border-gray-200 text-black text-xs focus:ring-2 focus:ring-[#CAF0F8] outline-none transition-all"
                              onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                            />
                            <button 
                              onClick={() => handleComment(post.id)}
                              disabled={!commentText[post.id]?.trim()}
                              className="p-2.5 bg-[#0077B6] text-white rounded-full hover:bg-[#005F91] transition-all shadow-md disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Right Column - Members Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              {activeTab !== "global" && (
                <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-fadeIn">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Teman Sekelas</h3>
                    <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#0077B6] px-3 py-1 rounded-full">
                      {classMembers.length}
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {loadingMembers ? (
                      <div className="flex justify-center py-10">
                        <Loader className="w-6 h-6 text-[#0077B6] animate-spin" />
                      </div>
                    ) : classMembers.map(member => (
                      <div key={member.id} className={`flex items-center gap-3 group ${member.id === user?.id ? 'opacity-60' : ''}`}>
                        <div className="relative flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#C8B6E2] to-[#4A3B69] border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm">
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-white rounded-full ${isOnline(member.updated_at) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-[#0077B6] truncate group-hover:text-purple-600 transition-colors">
                            {member.name} {member.id === user?.id && "(Saya)"}
                          </p>
                          <p className="text-[9px] text-gray-400 font-medium">
                            {isOnline(member.updated_at) ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-fadeIn">
                <div className="w-12 h-12 bg-[#CAF0F8] rounded-2xl flex items-center justify-center mb-6">
                  <Info className="w-6 h-6 text-[#0077B6]" />
                </div>
                <h4 className="font-bold text-[#0077B6] mb-2">Bantuan Belajar</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  "Belajar bersama lebih menyenangkan. Ayo diskusikan kesulitanmu!"
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Add Post Modal */}
      <AnimatePresence>
        {isAddPostModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0077B6]/40 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-20 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#0077B6]">Buat Pertanyaan</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Pertanyaan Anda akan terlihat di {activeTab === "global" ? "seluruh siswa" : `${userClass?.displayName}`}
                  </p>
                </div>
                <button onClick={() => setIsAddPostModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                  <div className={`h-12 w-12 rounded-2xl bg-[#0077B6] flex items-center justify-center text-white shadow-lg shadow-blue-100`}>
                    {activeTab === "global" ? <Globe className="w-6 h-6" /> : <Hash className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#0077B6] uppercase tracking-widest">Kategori</p>
                    <p className="text-base font-bold text-[#0077B6]">
                      {activeTab === "global" ? "Forum Global" : `${userClass?.displayName}`}
                    </p>
                  </div>
                </div>

                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Apa yang ingin kamu tanyakan atau bagikan?"
                  className="w-full h-48 p-8 rounded-[2rem] bg-gray-50/50 border-2 border-transparent focus:bg-white focus:border-[#0077B6] transition-all resize-none outline-none text-black text-sm shadow-inner"
                />
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={handleCreatePost}
                  disabled={posting || !newPostContent.trim()}
                  className="w-full py-5 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white rounded-[1.5rem] font-bold shadow-lg shadow-blue-100 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {posting ? <Loader className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  Kirim Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}
