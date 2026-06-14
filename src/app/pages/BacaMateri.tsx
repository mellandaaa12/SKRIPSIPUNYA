"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { ChevronLeft, CheckCircle, Loader, Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon, Code, FileText, Flame, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { updateProgress } from "../utils/api";
import { customPopup } from "../context/PopupContext";
import { highlightMateriContent } from "../utils/highlighter";

export default function BacaMateri() {
  const navigate = useNavigate();
  const { pembelajaranId, stepId } = useParams();
  const { user, session } = useAuth();
  const [pembelajaran, setPembelajaran] = useState<any>(null);
  const [step, setStep] = useState<any>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  useEffect(() => {
    if (pembelajaranId) loadData();
  }, [pembelajaranId, stepId]);

  const loadData = async () => {
    if (!pembelajaranId) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('pembelajaran').select('*').eq('id', pembelajaranId).single();
      setPembelajaran(data);
      const steps = data?.steps || [];
      const currentStep = steps.find((s: any) => s.id === stepId);
      setStep(currentStep);

      // Check existing progress
      if (user) {
        const { data: prog } = await supabase.from('progress').select('*').eq('user_id', user.id).eq('pembelajaran_id', pembelajaranId).eq('step_id', stepId || '').maybeSingle();
        setIsCompleted(!!(prog?.completed || prog?.answers?.read_materi));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    if (isBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!pembelajaranId || !stepId || !session?.user) return;
    
    setSaving(true);
    try {
      await updateProgress({
        pembelajaranId,
        stepId,
        completed: true
      });
      
      setIsCompleted(true);
      
      navigate(`/pembelajaran/${pembelajaranId}`);
    } catch (error) {
      console.error("Failed to mark as complete:", error);
      customPopup.alert("Gagal menyimpan progress. Silakan coba lagi.", "error");
      setSaving(false);
    }
  };

  const handleNavigateToNext = async (type: 'quiz' | 'code-editor') => {
    if (!pembelajaranId || !stepId || !session?.user) return;
    
    // If already completed or read, just navigate
    if (isCompleted) {
      navigate(`/pembelajaran/${pembelajaranId}/${type}/${stepId}`);
      return;
    }

    setSaving(true);
    try {
      // Mark as read_materi but don't mark as completed yet!
      await updateProgress({
        pembelajaranId,
        stepId,
        answers: { read_materi: true }
      });
      
      navigate(`/pembelajaran/${pembelajaranId}/${type}/${stepId}`);
    } catch (error) {
      console.error("Failed to mark materi as read:", error);
      customPopup.alert("Gagal menyimpan progress. Silakan coba lagi.", "error");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#00B4D8]/40 blur-3xl" />
          <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#00B4D8]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-[#0077B6] animate-spin" />
            <p className="text-sm text-[#64748B]">Memuat materi...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#D4ECF0]/40 blur-3xl" />
          <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#D4ECF0]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#DCFCE7]/30 blur-3xl" />
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-[#94A3B8] mb-1">Materi tidak ditemukan</p>
            <button
              onClick={() => navigate('/pembelajaran')}
              className="text-sm text-[#0077B6] hover:underline"
            >
              Kembali ke Pembelajaran
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#00B4D8]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#00B4D8]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
      </div>

      {/* Mobile: floating menu button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#90E0EF] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#0077B6] hover:bg-white transition-all duration-200 lg:hidden"
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
            className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2rem] border border-[#90E0EF]/30 bg-white/75 backdrop-blur-16 shadow-2xl"
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
            {/* Left - Baca Materi Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#0077B6]" />
              <span className="text-sm font-semibold text-[#0077B6]">Baca Materi</span>
            </div>

            {/* Right - EXP, Streak & User Profile */}
            <div className="flex items-center gap-3">
              {/* EXP Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
                <Star className="h-4 w-4 text-[#F59E0B]" />
                <span className="text-sm font-semibold text-[#0077B6]">{user?.exp || 0} EXP</span>
              </div>

              {/* Streak Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
                <Flame className="h-4 w-4 text-[#EF4444]" />
                <span className="text-sm font-semibold text-[#0077B6]">{user?.streak || 0} Streak</span>
              </div>

              <ProfileHeader />
            </div>
          </div>

          {/* Back Button */}
          <div className="mb-6 animate-slideIn">
            <button
              onClick={() => navigate(`/pembelajaran/${pembelajaranId}`)}
              className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0077B6] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Kembali
            </button>
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <h1 className="text-3xl font-bold text-[#0077B6] mb-3">
                {step.judul || step.title}
              </h1>
              <p className="text-base text-[#64748B]">
                {pembelajaran?.judul || pembelajaran?.title}
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            {/* Content */}
            <div 
              ref={contentRef}
              onScroll={handleScroll}
              className="w-full h-[500px] overflow-y-auto mb-6 pr-4 custom-scrollbar"
            >
              <div 
                className="prose prose-sm max-w-none prose-headings:text-[#0077B6] prose-p:text-[#475569] prose-strong:text-[#0077B6] prose-code:text-[#0077B6] prose-pre:bg-[#F8FAFC] prose-pre:border prose-pre:border-[#CAF0F8] prose-ul:text-[#475569] prose-ol:text-[#475569]"
                dangerouslySetInnerHTML={{ __html: highlightMateriContent(step.content?.bacaMateri || step.content || "<p>Konten tidak tersedia</p>") }}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2 mb-4">
              {step.content?.initialCode && (
                <button
                  onClick={() => handleNavigateToNext('code-editor')}
                  disabled={(!hasScrolledToBottom && !isCompleted) || saving}
                  className={`flex-1 py-3 px-4 rounded-[2rem] font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    (hasScrolledToBottom || isCompleted) && !saving
                      ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-[0_8px_24px_-4px_rgba(245,158,11,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(245,158,11,0.3)]"
                      : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                  }`}
                >
                  <Code className="w-4 h-4" />
                  {saving ? "Menyiapkan..." : "Lanjut ke Editor Kode"}
                </button>
              )}
              {(step.content?.quiz?.aktif || step.content?.quiz?.soalList?.length > 0) && (
                <button
                  onClick={() => handleNavigateToNext('quiz')}
                  disabled={(!hasScrolledToBottom && !isCompleted) || saving}
                  className={`flex-1 py-3 px-4 rounded-[2rem] font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    (hasScrolledToBottom || isCompleted) && !saving
                      ? "bg-gradient-to-r from-[#10B981] to-[#34D399] text-white shadow-[0_8px_24px_-4px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.3)]"
                      : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {saving ? "Menyiapkan..." : "Lanjut ke Kuis"}
                </button>
              )}
            </div>

            {/* Action Button */}
            {!step.content?.initialCode && !step.content?.quiz?.aktif && (
              <div className="flex justify-end">
                {isCompleted ? (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-[#10B981] to-[#34D399] text-white text-sm font-semibold py-3 px-6 rounded-[2.5rem] shadow-[0_8px_24px_-4px_rgba(16,185,129,0.2)]">
                    <CheckCircle className="w-5 h-5" />
                    Selesai Dibaca!
                  </div>
                ) : (
                  <button
                    onClick={handleMarkAsComplete}
                    disabled={!hasScrolledToBottom || saving}
                    className={`text-sm font-semibold py-3 px-6 rounded-[2.5rem] transition-all ${
                      hasScrolledToBottom && !saving
                        ? "bg-gradient-to-r from-[#0077B6] to-[#0077B6] text-white shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(0,119,182,0.3)]"
                        : "bg-[#CAF0F8] text-[#94A3B8] cursor-not-allowed"
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </span>
                    ) : hasScrolledToBottom ? (
                      "Tandai Sudah Dibaca"
                    ) : (
                      "Gulir ke bawah untuk melanjutkan"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
