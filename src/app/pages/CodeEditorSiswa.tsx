"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { ChevronLeft, CheckCircle, Loader, Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon, Code, BookOpen, FileText, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getPembelajaran, updateProgress } from "../utils/api";
import { supabase } from "../utils/supabase";
import { customPopup } from "../context/PopupContext";

export default function CodeEditorSiswa() {
  const navigate = useNavigate();
  const { pembelajaranId, stepId } = useParams();
    const { session, user } = useAuth();
  const [pembelajaran, setPembelajaran] = useState<any>(null);
  const [step, setStep] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [autoScore, setAutoScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  // Syntax highlighting function
  const highlightCode = (code: string) => {
    if (!code) return "";
    
    // Simple syntax highlighting for common languages
    return code
      // Keywords
      .replace(/\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|default|async|await|try|catch|finally|throw|new|this|super|static|public|private|protected|readonly|abstract|interface|type|enum|namespace|module|require|from)\b/g, '<span class="keyword">$1</span>')
      // Strings
      .replace(/(["'`])((?:\\.|[^"'\\])*?)\1/g, '<span class="string">$1$2$1</span>')
      // Comments
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
      // Functions
      .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="function">$1</span>(')
      // Operators
      .replace(/([+\-*\/=<>!&|]+)/g, '<span class="operator">$1</span>')
      // Variables (simple approach - words that aren't keywords)
      .replace(/\b([a-z][a-zA-Z0-9_]*)\b(?!<[^>]*>)/gi, '<span class="variable">$1</span>');
  };

  useEffect(() => {
    if (pembelajaranId) {
      loadData();
    }
  }, [pembelajaranId, stepId]);

  const loadData = async () => {
    if (!pembelajaranId) return;
    
    setLoading(true);
    try {
      const data = await getPembelajaran(pembelajaranId);
      setPembelajaran(data);
      
      const currentStep = data.steps?.find((s: any) => s.id === stepId);
      setStep(currentStep);
      setCurrentCode(currentStep?.content?.initialCode || "");

      if (user?.id && stepId) {
        const { data: prog } = await getProgressRow(user.id, pembelajaranId, stepId);
        setAttemptCount(prog?.answers?.attempts || 0);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressRow = async (userId: string, pembelajaranIdParam: string, stepIdParam: string) => {
    return supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("pembelajaran_id", pembelajaranIdParam)
      .eq("step_id", stepIdParam)
      .maybeSingle();
  };

  const evaluateCode = () => {
    if (!step) return 0;
    const checks: string[] = step.content?.requiredChecks || [];
    if (!checks.length) {
      return currentCode.trim().length > 30 ? 80 : 40;
    }
    const passedChecks = checks.filter((needle) => currentCode.includes(needle)).length;
    return Math.round((passedChecks / checks.length) * 100);
  };

  const handleMarkAsComplete = async () => {
    if (!pembelajaranId || !stepId || !session?.user) return;
    
    setSaving(true);
    try {
      const score = evaluateCode();
      const nextAttempts = attemptCount + 1;
      const passed = score >= (step?.content?.nilaiMinimalTugas || 75);
      setAutoScore(score);
      await updateProgress({
        pembelajaranId,
        stepId,
        completed: passed,
        score,
        answers: {
          code_submitted: true,
          attempts: nextAttempts,
          needs_help: nextAttempts >= 3 && !passed,
          read_materi: true,
        }
      });
      setAttemptCount(nextAttempts);
      setIsCompleted(passed);
      if (passed) {
        navigate(`/pembelajaran/${pembelajaranId}`);
      }
    } catch (error) {
      console.error("Failed to mark as complete:", error);
      customPopup.alert("Gagal menyimpan progress. Silakan coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-12 h-12 text-[#0077B6] animate-spin" />
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm text-[#94A3B8]">Materi tidak ditemukan</p>
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
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        /* Syntax highlighting styles */
        .code-container {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 20px;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          overflow-x: auto;
        }
        .keyword { color: #c678dd; font-weight: bold; }
        .string { color: #98c379; }
        .function { color: #61afef; }
        .comment { color: #5c6370; font-style: italic; }
        .number { color: #d19a66; }
        .operator { color: #56b6c2; }
        .variable { color: #e06c75; }
        .class-name { color: #d19a66; }
        .tag { color: #e06c75; }
        .attribute { color: #d19a66; }
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
            {/* Left - Code Editor Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Code className="h-4 w-4 text-[#F59E0B]" />
              <span className="text-sm font-semibold text-[#0077B6]">Code Editor</span>
            </div>

            <ProfileHeader />
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
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-[#F59E0B]" />
                <h1 className="text-3xl font-bold text-[#F59E0B]">
                  Code Editor
                </h1>
              </div>
              <p className="text-base text-[#64748B]">
                {pembelajaran.title}
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-base text-[#0077B6]">
                  {step.judul || step.title}
                </h3>
              </div>

              {/* Task Instructions */}
              {step.content?.taskInstructions && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-[1.25rem] bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm text-[#0077B6]">
                      Perintah Tugas
                    </h4>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-[1.5rem] p-4 border border-[#E2E8F0]">
                    <p className="text-sm text-[#0077B6] whitespace-pre-wrap">
                      {step.content.taskInstructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Task Example */}
              {step.content?.taskExample && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-[1.25rem] bg-gradient-to-br from-[#0077B6] to-[#0077B6] flex items-center justify-center">
                      <Code className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm text-[#0077B6]">
                      Contoh Tugas
                    </h4>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-[1.5rem] p-4 border border-[#E2E8F0]">
                    <div className="code-container">
                      {step.content.taskExample}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-[#64748B]">
                Berikut adalah contoh kode yang diberikan oleh guru. Pelajari dan pahami struktur kode ini!
              </p>

              {/* Navigation Buttons */}
              <div className="flex gap-2 mb-4">
                {step.content?.bacaMateri && (
                  <button
                    onClick={() => navigate(`/pembelajaran/${pembelajaranId}/materi/${stepId}`)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[#0077B6] to-[#0077B6] rounded-[2rem] text-white font-semibold text-sm shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(0,119,182,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Baca Materi
                  </button>
                )}
                {step.content?.quiz?.aktif && (
                  <button
                    onClick={() => navigate(`/pembelajaran/${pembelajaranId}/quiz/${stepId}`)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[#0077B6] to-[#0077B6] rounded-[2rem] text-white font-semibold text-sm shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(0,119,182,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Quiz
                  </button>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                {isCompleted ? (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-[#0077B6] to-[#0077B6] text-white text-sm font-semibold py-3 px-6 rounded-[2.5rem] shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)]">
                    <CheckCircle className="w-5 h-5" />
                    Selesai!
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCodeModal(true)}
                    className="text-sm font-semibold py-3 px-6 rounded-[2.5rem] bg-gradient-to-r from-[#0077B6] to-[#0077B6] text-white shadow-[0_8px_24px_-4px_rgba(0,119,182,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(0,119,182,0.3)] transition-all"
                  >
                    Lihat Contoh Kode
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0077B6]">
                    {step.judul || step.title}
                  </h3>
                  <p className="text-sm text-[#64748B]">Contoh Kode dari Guru</p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div 
                className="code-container"
                dangerouslySetInnerHTML={{ 
                  __html: highlightCode(step.content?.taskExample || step.content?.initialCode || "// Tidak ada contoh kode dari guru") 
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-6 py-3 rounded-[2rem] border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
