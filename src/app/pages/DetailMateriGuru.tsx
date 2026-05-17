"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Sparkles, BookOpen, Users, AlertTriangle, TrendingUp, CheckCircle, Upload, Archive, MessageSquare, XCircle, X, Eye, Code } from "lucide-react";
import { usePembelajaran } from "../context/PembelajaranContext";
import { useAuth } from "../context/AuthContext";
import { userAPI, progressAPI, pembelajaranAPI } from "../utils/api";
import { supabase } from "../utils/supabase";
import { buildSegmentsForPembelajaran } from "../utils/learningProgress";
import { LearningStepProgressBar } from "../components/LearningStepProgressBar";
import { toast } from "sonner";
import { highlightMateriContent } from "../utils/highlighter";

export default function DetailMateriGuru() {
  const navigate = useNavigate();
  const { kelasId, materiId } = useParams();
  const { session, user } = useAuth();
  const { getPembelajaranById, getPembelajaranByKelasId } = usePembelajaran();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<{ [key: string]: any[] }>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"materi" | "nilai">("materi");
  const [showMateriModal, setShowMateriModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!selectedStudentDetails) {
      setExpandedAnswers({});
    }
  }, [selectedStudentDetails]);
  
  const [enableReflection, setEnableReflection] = useState(false);
  const [reflectionTemplate, setReflectionTemplate] = useState("Standar");
  const [pertanyaanKendala, setPertanyaanKendala] = useState("Apa kendala yang kamu alami?");
  const [pertanyaanKesan, setPertanyaanKesan] = useState("Bagaimana pendapatmu tentang pembelajaran hari ini?");
  const [savingReflection, setSavingReflection] = useState(false);
  const [savedReflectionSuccess, setSavedReflectionSuccess] = useState(false);

  // UEQ kuesioner states
  const [ueqActive, setUeqActive] = useState(false);
  const [ueqUrl, setUeqUrl] = useState("");
  const [ueqDescription, setUeqDescription] = useState("");

  // Refresh data from Supabase on mount
  useEffect(() => {
    if (kelasId) {
      getPembelajaranByKelasId(kelasId);
    }
  }, [kelasId]);

  const pembelajaran = materiId ? getPembelajaranById(materiId) : undefined;

  useEffect(() => {
    if (pembelajaran) {
      setEnableReflection(pembelajaran.enableReflection || false);
      
      const rawTemplate = pembelajaran.reflectionTemplate || "Standar";
      const parts = rawTemplate.split("|||");
      setReflectionTemplate(parts[0] || "Standar");
      setUeqActive(parts[1] === "true");
      setUeqUrl(parts[2] || "");
      setUeqDescription(parts[3] || "");

      setPertanyaanKendala(pembelajaran.pertanyaanKendala || "Apa kendala yang kamu alami?");
      setPertanyaanKesan(pembelajaran.pertanyaanKesan || "Bagaimana pendapatmu tentang pembelajaran hari ini?");
    }
  }, [pembelajaran]);

  const handleSaveReflection = async () => {
    if (!materiId || !kelasId) return;
    setSavingReflection(true);
    
    // Compile template string with UEQ parameters using a delimiter
    const compiledTemplate = `${reflectionTemplate}|||${ueqActive ? 'true' : 'false'}|||${ueqUrl}|||${ueqDescription}`;
    
    try {
      await pembelajaranAPI.update(materiId, {
        enable_reflection: enableReflection,
        reflection_template: compiledTemplate,
        pertanyaan_kendala: pertanyaanKendala,
        pertanyaan_kesan: pertanyaanKesan
      });
      await getPembelajaranByKelasId(kelasId);
      toast.success("Pengaturan refleksi berhasil disimpan!");
      setSavedReflectionSuccess(true);
      setTimeout(() => setSavedReflectionSuccess(false), 3000);
    } catch (error: any) {
      toast.error(`Gagal menyimpan refleksi: ${error.message}`);
    } finally {
      setSavingReflection(false);
    }
  };

  useEffect(() => {
    if (session?.access_token && kelasId && materiId && pembelajaran?.status === "published") {
      void fetchStudentData();
    }
  }, [session, kelasId, materiId, pembelajaran?.status]);

  useEffect(() => {
    if (!materiId || pembelajaran?.status !== "published") return;
    let tm: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (tm) clearTimeout(tm);
      tm = setTimeout(() => void fetchStudentData(), 450);
    };
    const channel = supabase
      .channel(`guru-detail-materi-progress-${materiId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, schedule)
      .subscribe();
    return () => {
      if (tm) clearTimeout(tm);
      void supabase.removeChannel(channel);
    };
  }, [materiId, pembelajaran?.status]);

  const fetchStudentData = async () => {
    if (!session?.access_token || !kelasId) return;
    try {
      setLoadingStudents(true);
      const usersResponse = await userAPI.getByRole("siswa", session.access_token);
      const students = usersResponse.users?.filter((u: any) => u.class_id === kelasId) || [];
      setSiswaList(students);
      const progressData: { [key: string]: any[] } = {};
      await Promise.all(
        students.map(async (siswa: any) => {
          try {
            const raw = await progressAPI.getRawByUser(siswa.id);
            progressData[siswa.id] = (raw || []).filter((r: any) => r.pembelajaran_id === materiId);
          } catch {
            progressData[siswa.id] = [];
          }
        })
      );
      setStudentProgress(progressData);
    } catch (error: any) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Validasi sebelum publish
  const validateForPublish = () => {
    if (!pembelajaran) return { valid: false, message: "Materi tidak ditemukan" };
    if (!pembelajaran.steps || pembelajaran.steps.length < 2) {
      return { valid: false, message: "Materi harus memiliki minimal 2 step sebelum dipublish!" };
    }
    for (const step of pembelajaran.steps) {
      if (!step.content?.bacaMateri) {
        return { valid: false, message: `Step "${step.judul}" belum memiliki konten materi. Tambahkan konten baca materi terlebih dahulu!` };
      }
    }
    return { valid: true, message: "" };
  };

  const handlePublishAttempt = () => {
    const { valid, message } = validateForPublish();
    if (!valid) {
      toast.error(message);
      return;
    }
    setShowPublishModal(true);
  };

  const handlePublish = async (arsip: boolean) => {
    if (!materiId) return;
    setPublishing(true);
    try {
      const newStatus = arsip ? "draft" : "published";
      await pembelajaranAPI.update(materiId, { status: newStatus });
      await getPembelajaranByKelasId(kelasId!);
      setShowPublishModal(false);
      toast.success(arsip ? "Materi diarsipkan (Unpublish)" : "Materi berhasil dipublish! Siswa kini bisa mengakses materi ini.");
    } catch (error: any) {
      toast.error("Gagal mengubah status materi.");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!materiId) return;
    setPublishing(true);
    try {
      await pembelajaranAPI.update(materiId, { status: "draft" });
      await getPembelajaranByKelasId(kelasId!);
      toast.success("Materi berhasil di-unpublish.");
    } catch {
      toast.error("Gagal mengubah status materi.");
    } finally {
      setPublishing(false);
    }
  };

  if (!pembelajaran) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "transparent" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56B6C6] mx-auto mb-4" />
          <p className="text-sm text-[#64748B]">Memuat materi...</p>
        </div>
      </div>
    );
  }

  const stepCount = pembelajaran.steps?.length || 0;
  const canPublish = stepCount >= 2;

  const handleOpenMateri = (step: any) => {
    setSelectedStep(step);
    setShowMateriModal(true);
  };

  const handleCloseMateriModal = () => {
    setShowMateriModal(false);
    setSelectedStep(null);
  };

  const handleOpenQuiz = (step: any) => {
    setSelectedStep(step);
    setShowQuizModal(true);
  };

  const handleCloseQuizModal = () => {
    setShowQuizModal(false);
    setSelectedStep(null);
  };

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .materi-content {
          color: #000000 !important;
          font-size: 14px;
          line-height: 1.75;
        }
        .materi-content * {
          color: #000000 !important;
        }
        .materi-content *[style] {
          color: #000000 !important;
        }
        .materi-content p,
        .materi-content span,
        .materi-content div:not([class*="bg-"]),
        .materi-content li,
        .materi-content td,
        .materi-content th,
        .materi-content h1,
        .materi-content h2,
        .materi-content h3,
        .materi-content h4,
        .materi-content h5,
        .materi-content h6 {
          color: #000000 !important;
        }
        .materi-content strong,
        .materi-content b {
          color: #000000 !important;
        }
        .materi-content em,
        .materi-content i {
          color: #000000 !important;
        }
        .materi-content a {
          color: #56B6C6 !important;
        }
        .materi-content code {
          color: #000000 !important;
          background-color: #F1F5F9;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .materi-content pre {
          color: #000000 !important;
          background-color: #F8FAFC;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
        }
        .materi-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .materi-content blockquote {
          color: #000000 !important;
          border-left: 4px solid #E2E8F0;
          padding-left: 16px;
          margin-left: 0;
        }
        .materi-content ul,
        .materi-content ol {
          color: #000000 !important;
        }
        .materi-content li {
          color: #000000 !important;
        }
        .materi-content table {
          color: #000000 !important;
        }
        .materi-content td,
        .materi-content th {
          color: #000000 !important;
          border-color: #E2E8F0;
        }
      `}</style>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[2.5rem] w-[500px] p-8 shadow-2xl">
            <h3 className="font-bold text-2xl text-[#0077B6] mb-2">Pilih Tindakan</h3>
            <p className="text-sm text-[#64748B] mb-6">Apa yang ingin Anda lakukan dengan materi <strong>{pembelajaran.judul}</strong>?</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handlePublish(false)}
                disabled={publishing}
                className="flex items-center gap-4 p-5 rounded-[2rem] bg-gradient-to-r from-[#10B981] to-[#34D399] text-white hover:opacity-90 transition-all"
              >
                <Upload className="w-6 h-6 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-base">Upload & Publish Langsung</p>
                  <p className="text-sm text-white/80">Materi langsung terlihat oleh siswa di kelas ini. Status: <strong>Published</strong></p>
                </div>
              </button>
              <button
                onClick={() => handlePublish(true)}
                disabled={publishing}
                className="flex items-center gap-4 p-5 rounded-[2rem] bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white hover:opacity-90 transition-all"
              >
                <Archive className="w-6 h-6 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-base">Simpan sebagai Arsip (Draft)</p>
                  <p className="text-sm text-white/80">Materi belum terlihat siswa. Status: <strong>Unpublish</strong></p>
                </div>
              </button>
              <button onClick={() => setShowPublishModal(false)} className="py-3 rounded-[2rem] border-2 border-[#E2E8F0] text-[#64748B] font-semibold hover:bg-[#F8FAFC] transition-all">Batal</button>
            </div>
          </div>
        </div>
      )}

      <SideBarGuru />
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-2 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            <button
              onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}`)}
              className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] hover:bg-[#0077B6] hover:border-[#0077B6] transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 text-[#0077B6] group-hover:text-white transition-colors" />
              <span className="text-sm font-bold text-[#0077B6] group-hover:text-white transition-colors">Kembali</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#0077B6] group-hover:bg-white transition-colors" />
            </button>
            <ProfileHeader />
          </div>

          {/* Materi Header */}
          <div className="mb-8">
            <div className="bg-white/85 border border-white/95 rounded-[2.5rem] p-8 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-[#56B6C6]" />
                  <h1 className="text-3xl font-bold text-[#56B6C6]">{pembelajaran.judul}</h1>
                </div>
                <div className="flex items-center gap-3">
                  {pembelajaran.status === "published" ? (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-[#D1FAE5] rounded-full text-xs font-bold text-[#065F46] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Published
                      </span>
                      <button
                        onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/edit`)}
                        className="px-4 py-2 rounded-[2rem] text-sm font-semibold border-2 border-[#56B6C6] text-[#56B6C6] hover:bg-[#F0F9FF] transition-all"
                      >
                        Edit Materi
                      </button>
                      <button onClick={handleUnpublish} disabled={publishing} className="px-4 py-2 rounded-[2rem] bg-[#FEF3C7] text-[#92400E] text-sm font-semibold hover:bg-[#FDE68A] transition-all">
                        Unpublish
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#FEF3C7] rounded-full text-xs font-bold text-[#92400E]">Draft</span>

                      <button
                        onClick={handlePublishAttempt}
                        disabled={publishing || !canPublish}
                        className={`px-4 py-2 rounded-[2rem] text-sm font-semibold transition-all flex items-center gap-2 ${canPublish ? 'bg-gradient-to-r from-[#10B981] to-[#34D399] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'}`}
                        title={!canPublish ? "Tambahkan minimal 2 step terlebih dahulu" : ""}
                      >
                        <TrendingUp className="w-4 h-4" />
                        {canPublish ? "Publish Materi" : `Butuh ${2 - stepCount} step lagi`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-base text-[#64748B]">{pembelajaran.deskripsi}</p>
              {!canPublish && (
                <div className="mt-4 p-4 bg-[#FEF3C7] rounded-[1.5rem] flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#92400E] flex-shrink-0" />
                  <p className="text-sm text-[#92400E]">
                    Tambahkan minimal <strong>2 step</strong> sebelum bisa publish. Saat ini: <strong>{stepCount} step</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab("materi")}
              className={`px-6 py-3 rounded-[1.5rem] flex items-center justify-center gap-2 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "materi"
                ? "bg-gradient-to-r from-[#56B6C6] to-[#3E8A96] text-white shadow-[0_8px_24px_-4px_rgba(86,182,198,0.2)]"
                : "bg-white/85 text-[#64748B] hover:bg-white border border-white/95 shadow-sm"
                }`}
            >
              <BookOpen className="w-5 h-5" />
              Materi Pembelajaran
            </button>
            {pembelajaran.status === "published" && (
              <button
                onClick={() => setActiveTab("nilai")}
                className={`px-6 py-3 rounded-[1.5rem] flex items-center justify-center gap-2 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "nilai"
                  ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-[0_8px_24px_-4px_rgba(139,92,246,0.2)]"
                  : "bg-white/85 text-[#64748B] hover:bg-white border border-white/95 shadow-sm"
                  }`}
              >
                <Users className="w-5 h-5" />
                Nilai Siswa
              </button>
            )}
            {pembelajaran.enableReflection && (
              <button
                onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/refleksi`)}
                className={`px-6 py-3 rounded-[1.5rem] flex items-center justify-center gap-2 text-sm font-semibold transition-all whitespace-nowrap bg-white/85 text-[#10B981] hover:bg-[#D1FAE5] border border-[#10B981]/30 shadow-sm`}
              >
                <MessageSquare className="w-5 h-5" />
                Hasil Refleksi
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === "materi" && (
            <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              {pembelajaran.steps?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-[#CBD5E1]" />
                  </div>
                  <p className="text-sm font-medium text-[#94A3B8]">Belum ada materi</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(pembelajaran.steps || []).map((step: any, index: number) => {
                    const hasMateri = !!step.content?.bacaMateri;
                    const hasQuiz = !!(step.content?.quiz?.aktif);
                    const hasCode = !!(step.content?.initialCode || step.content?.taskInstructions);

                    return (
                      <div
                        key={step.id}
                        className="group relative overflow-hidden rounded-[2rem] p-5 transition-all duration-300 bg-white/70 border border-[#E2E8F0]/50 hover:bg-white/90 hover:border-[#56B6C6] hover:shadow-[0_8px_32px_-4px_rgba(86,182,198,0.15)]"
                      >
                        <div className="flex items-center gap-4">
                          {/* Number & Icon */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#56B6C6] to-[#56B6C6]">
                              <span className="text-white font-semibold text-sm">{index + 1}</span>
                            </div>

                            {step.content?.bacaMateri ? (
                              <BookOpen className="w-6 h-6 text-[#56B6C6]" />
                            ) : step.content?.initialCode ? (
                              <Plus className="w-6 h-6 text-[#56B6C6]" />
                            ) : (
                              <BookOpen className="w-6 h-6 text-[#56B6C6]" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-base text-[#0077B6] mb-1">
                              {step.judul || step.title}
                            </h3>
                            
                            <p className="text-sm text-[#64748B] mb-2">
                              {step.deskripsi || step.description}
                            </p>

                            {/* Status badges */}
                            <div className="flex gap-2 mb-2">
                              {hasMateri && (
                                <span className="px-2 py-0.5 bg-[#DBEAFE] rounded-full text-xs font-semibold text-[#1E40AF]">📖 Materi</span>
                              )}
                              {hasQuiz && (
                                <span className="px-2 py-0.5 bg-[#D1FAE5] rounded-full text-xs font-semibold text-[#065F46]">📝 Quiz</span>
                              )}
                              {hasCode && (
                                <span className="px-2 py-0.5 bg-[#F3E8FF] rounded-full text-xs font-semibold text-[#7C3AED]">� Code Editor</span>
                              )}
                            </div>
                          </div>

                          {/* Chevron Down Toggle */}
                          <button
                            onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                            className="w-10 h-10 flex items-center justify-center text-[#686868] hover:bg-[#F8FAFC] rounded-full"
                          >
                            <ChevronDown className={`w-5 h-5 transition-transform ${expandedStep === step.id ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {/* Dropdown Content */}
                        {expandedStep === step.id && (
                          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                            <div className="flex flex-col sm:flex-row gap-5">
                              {/* Materi Button */}
                              <button
                                onClick={() => hasMateri ? handleOpenMateri(step) : navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/baca-materi`)}
                                className={`flex-1 rounded-[2rem] p-4 flex items-center gap-3 transition-all ${hasMateri ? 'bg-gradient-to-r from-[#56B6C6] to-[#56B6C6] hover:opacity-90' : 'bg-white border-2 border-dashed border-[#56B6C6] hover:bg-[#F0F9FF]'}`}
                              >
                                <span className="text-lg">📖</span>
                                <div className="flex-1 text-left">
                                  <p className={`font-semibold text-sm ${hasMateri ? 'text-white' : 'text-[#56B6C6]'}`}>
                                    {hasMateri ? 'Baca Materi' : 'Buat Materi'}
                                  </p>
                                  <p className={`text-xs ${hasMateri ? 'text-white/80' : 'text-[#64748B]'}`}>
                                    {hasMateri ? 'Lihat konten materi' : 'Wajib diisi pertama'}
                                  </p>
                                </div>
                                {hasMateri && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/baca-materi`);
                                    }}
                                    className="px-2 py-1 bg-white/20 rounded-[1rem] text-xs text-white hover:bg-white/30 transition-all"
                                  >
                                    Edit
                                  </button>
                                )}
                              </button>

                              {/* Quiz Button */}
                              <button
                                onClick={() => {
                                  if (!hasMateri) {
                                    toast.error("Silakan buat materi terlebih dahulu!");
                                    return;
                                  }
                                  if (hasQuiz) {
                                    handleOpenQuiz(step);
                                  } else {
                                    navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/quiz`);
                                  }
                                }}
                                className={`flex-1 rounded-[2rem] p-4 flex items-center gap-3 transition-all ${!hasMateri ? 'bg-[#F1F5F9] opacity-50 cursor-not-allowed' : hasQuiz ? 'bg-gradient-to-r from-[#10B981] to-[#34D399] hover:opacity-90' : 'bg-white border-2 border-dashed border-[#10B981] hover:bg-[#ECFDF5]'}`}
                              >
                                <span className="text-lg">📝</span>
                                <div className="flex-1 text-left">
                                  <p className={`font-semibold text-sm ${!hasMateri ? 'text-[#94A3B8]' : hasQuiz ? 'text-white' : 'text-[#10B981]'}`}>
                                    {hasQuiz ? 'Quiz' : 'Buat Quiz'}
                                  </p>
                                  <p className={`text-xs ${!hasMateri ? 'text-[#94A3B8]' : hasQuiz ? 'text-white/80' : 'text-[#64748B]'}`}>
                                    {hasQuiz ? `${step.content?.quiz?.soalList?.length || 0} soal` : 'Opsional'}
                                  </p>
                                </div>
                                {hasQuiz && hasMateri && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/quiz`);
                                    }}
                                    className="px-2 py-1 bg-white/20 rounded-[1rem] text-xs text-white hover:bg-white/30 transition-all"
                                  >
                                    Edit
                                  </button>
                                )}
                              </button>

                              {/* Code Editor Button */}
                              <button
                                onClick={() => {
                                  if (!hasMateri) {
                                    toast.error("Silakan buat materi terlebih dahulu!");
                                    return;
                                  }
                                  navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/code-editor`);
                                }}
                                className={`flex-1 rounded-[2rem] p-4 flex items-center gap-3 transition-all ${!hasMateri ? 'bg-[#F1F5F9] opacity-50 cursor-not-allowed' : hasCode ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:opacity-90' : 'bg-white border-2 border-dashed border-[#8B5CF6] hover:bg-[#F5F3FF]'}`}
                              >
                                <span className="text-lg">💻</span>
                                <div className="flex-1 text-left">
                                  <p className={`font-semibold text-sm ${!hasMateri ? 'text-[#94A3B8]' : hasCode ? 'text-white' : 'text-[#8B5CF6]'}`}>
                                    {hasCode ? 'Code Editor' : 'Buat Tugas Code'}
                                  </p>
                                  <p className={`text-xs ${!hasMateri ? 'text-[#94A3B8]' : hasCode ? 'text-white/80' : 'text-[#64748B]'}`}>
                                    {hasCode ? 'Tugas coding' : 'Opsional'}
                                  </p>
                                </div>
                                {hasCode && hasMateri && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/code-editor`);
                                    }}
                                    className="px-2 py-1 bg-white/20 rounded-[1rem] text-xs text-white hover:bg-white/30 transition-all"
                                  >
                                    Edit
                                  </button>
                                )}
                              </button>
                            </div>

                            {/* Edit Materi Button - hanya untuk published */}
                            {pembelajaran.status === "published" && (
                              <div className="mt-3 flex gap-3">
                                <button
                                  onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/edit`)}
                                  className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-[2rem] p-4 flex items-center gap-3 hover:opacity-90 transition-all"
                                >
                                  <Plus className="w-5 h-5 text-white" />
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold text-sm text-white">Edit Materi & Tambah Step</p>
                                    <p className="text-xs text-white/80">Ubah konten atau tambah step pembelajaran baru</p>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Step Button - Hanya tampil jika belum dipublish */}
              {pembelajaran.status !== "published" && (
                <button 
                  onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/buat`)} 
                  className="w-full mt-8 bg-white/70 border-2 border-dashed border-[#56B6C6] rounded-[2.5rem] p-6 flex items-center justify-center gap-4 hover:bg-white/90 transition-all"
                >
                  <div className="w-12 h-12 border-2 border-dashed border-[#56B6C6] rounded-[1.5rem] flex items-center justify-center">
                    <Plus className="w-6 h-6 text-[#56B6C6]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-base text-[#0077B6]">Tambah Step Pembelajaran</p>
                    <p className="text-sm text-[#64748B]">{stepCount < 2 ? `Butuh ${2 - stepCount} step lagi sebelum bisa publish` : "Tambah step baru"}</p>
                  </div>
                </button>
              )}

              {/* Pengaturan Refleksi Pembelajaran - Khusus Draft */}
              {pembelajaran.status !== "published" && (
                <div className="mt-8 bg-white/70 border border-[#E2E8F0] rounded-[2.5rem] p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[#0077B6]">Refleksi Pembelajaran</h3>
                      <p className="text-sm text-[#64748B]">Atur form refleksi yang akan muncul di akhir materi</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={enableReflection}
                        onChange={(e) => setEnableReflection(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                    </label>
                  </div>

                  {enableReflection && (
                    <div className="flex flex-col gap-4 pt-4 border-t border-[#E2E8F0]">
                      <div>
                        <label className="font-semibold text-sm text-[#0077B6] mb-1 block">
                          Pilih Template Refleksi
                        </label>
                        <select
                          value={reflectionTemplate}
                          onChange={(e) => setReflectionTemplate(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] transition-all"
                        >
                          <option value="Standar">Standar (Emoji + 2 Pertanyaan)</option>
                          <option value="Singkat">Singkat (Emoji + 1 Pertanyaan)</option>
                          <option value="Emoji Only">Emoji Only (Hanya Emoji)</option>
                        </select>
                      </div>

                      {/* Preview Emoji */}
                      <div className="mb-2">
                        <label className="font-semibold text-sm text-[#0077B6] mb-3 block">
                          Preview Penilaian Perasaan (Otomatis)
                        </label>
                        <div className="flex gap-4">
                          {[
                            { emoji: "😄", label: "Sangat Paham" },
                            { emoji: "🙂", label: "Cukup Paham" },
                            { emoji: "😕", label: "Kurang Paham" },
                          ].map((item) => (
                            <div key={item.label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#f8fafc] border-2 border-transparent">
                              <span className="text-4xl">{item.emoji}</span>
                              <span className="text-xs font-semibold text-[#64748b]">{item.label}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[#64748B] mt-2 italic">*Bagian ini akan otomatis muncul dan tidak dapat diubah teksnya</p>
                      </div>

                      {reflectionTemplate !== "Emoji Only" && (
                        <div>
                          <label className="font-semibold text-sm text-[#0077B6] mb-1 block">
                            Pertanyaan 1 (Kendala)
                          </label>
                          <input
                            type="text"
                            value={pertanyaanKendala}
                            onChange={(e) => setPertanyaanKendala(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0]"
                          />
                        </div>
                      )}

                      {reflectionTemplate === "Standar" && (
                        <div>
                          <label className="font-semibold text-sm text-[#0077B6] mb-1 block">
                            Pertanyaan 2 (Kesan/Pendapat)
                          </label>
                          <input
                            type="text"
                            value={pertanyaanKesan}
                            onChange={(e) => setPertanyaanKesan(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0]"
                          />
                        </div>
                      )}

                      {/* ── SEKSI EVALUASI UEQ (GOOGLE FORM) ── */}
                      <div className="mt-4 pt-4 border-t-2 border-dashed border-[#E2E8F0] flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 pr-4">
                            <h4 className="font-bold text-sm text-[#0077B6]">Pengukuran UEQ (Google Form)</h4>
                            <p className="text-xs text-[#64748B]">Wajibkan siswa mengisi kuesioner evaluasi UEQ di Google Form di akhir materi sebelum dapat keluar dari modal refleksi</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={ueqActive}
                              onChange={(e) => setUeqActive(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0077B6]"></div>
                          </label>
                        </div>

                        {ueqActive && (
                          <div className="flex flex-col gap-4 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] animate-fadeIn">
                            <div>
                              <label className="font-semibold text-xs text-[#0077B6] mb-1.5 block">
                                Link Google Form UEQ <span className="text-[#EF4444]">*</span>
                              </label>
                              <input
                                type="url"
                                value={ueqUrl}
                                onChange={(e) => setUeqUrl(e.target.value)}
                                placeholder="https://forms.gle/..."
                                className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0]"
                              />
                            </div>

                            <div>
                              <label className="font-semibold text-xs text-[#0077B6] mb-1.5 block">
                                Deskripsi / Pengarahan Pengisian UEQ <span className="text-[#EF4444]">*</span>
                              </label>
                              <textarea
                                value={ueqDescription}
                                onChange={(e) => setUeqDescription(e.target.value)}
                                placeholder="Mohon luangkan waktu Anda sejenak untuk mengisi kuesioner UEQ guna mengevaluasi pengalaman penggunaan media pembelajaran ini."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSaveReflection}
                          disabled={savingReflection || savedReflectionSuccess}
                          className={`px-6 py-2.5 text-white rounded-full font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2 ${
                            savedReflectionSuccess 
                              ? 'bg-gradient-to-r from-[#059669] to-[#10B981]' 
                              : 'bg-gradient-to-r from-[#56B6C6] to-[#0EA5E9]'
                          }`}
                        >
                          {savingReflection ? (
                            "Menyimpan..."
                          ) : savedReflectionSuccess ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Berhasil Tersimpan
                            </>
                          ) : (
                            "Simpan Pengaturan Refleksi"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nilai Siswa Tab */}
          {activeTab === "nilai" && pembelajaran.status === "published" && (
            <div className="bg-white/85 border border-white/95 rounded-[2.5rem] p-8 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-[#0077B6]">Nilai Siswa</h3>
              </div>
              {loadingStudents ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56B6C6]" /></div>
              ) : siswaList.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {siswaList.map((siswa) => {
                    const rows = studentProgress[siswa.id] || [];
                    const scores = rows.filter((p: any) => p.score !== null && p.score !== undefined);
                    const avg = scores.length > 0 ? Math.round(scores.reduce((s: number, p: any) => s + p.score, 0) / scores.length) : 0;
                    const steps = pembelajaran.steps || [];
                    const pct = steps.length > 0 ? Math.round((rows.filter((p: any) => p.completed).length / steps.length) * 100) : 0;
                    const segments = buildSegmentsForPembelajaran(steps, rows, pembelajaran.judul);
                    return (
                      <div key={siswa.id} className="flex flex-col gap-3 p-5 rounded-[2rem] bg-white/70 border border-[#E2E8F0]/50 overflow-visible">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#ffcb14] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {siswa.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#0077B6]">{siswa.name || siswa.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-2 bg-[#E6E6E6] rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-[#10B981] transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-[#7A7E86] w-10 text-right flex-shrink-0">{pct}%</span>
                              {scores.length > 0 && (
                                <span className="text-sm font-bold ml-2 flex-shrink-0" style={{ color: avg >= 85 ? "#10B981" : avg >= 70 ? "#F59E0B" : "#EF4444" }}>
                                  {avg}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="pl-0 sm:pl-14 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex-1 w-full">
                            <p className="text-[11px] text-[#64748B] mb-1">Percobaan per step — hover segmen untuk detail</p>
                            <LearningStepProgressBar segments={segments} />
                          </div>
                          <button
                            onClick={() => setSelectedStudentDetails({ student: siswa, progress: rows })}
                            className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-[#475569] text-xs font-bold hover:bg-[#E2E8F0] transition-all flex items-center gap-2"
                          >
                            <TrendingUp className="w-3 h-3" /> Rekap Jawaban
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <Users className="w-12 h-12 mb-3 text-[#CBD5E1]" />
                  <p className="text-sm text-[#94A3B8]">Belum ada siswa di kelas ini</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Materi Modal - Popup like student view */}
      {showMateriModal && selectedStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#56B6C6] to-[#56B6C6] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[#0077B6]">{selectedStep.judul || selectedStep.title}</h3>
                  <p className="text-sm text-[#64748B]">Step {pembelajaran.steps?.findIndex((s: any) => s.id === selectedStep.id) + 1}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${selectedStep.id}/baca-materi`)}
                  className="px-4 py-2 rounded-[2rem] bg-[#56B6C6] text-white text-sm font-semibold hover:bg-[#3E8A96] transition-all"
                >
                  Edit Materi
                </button>
                <button
                  onClick={handleCloseMateriModal}
                  className="w-10 h-10 flex items-center justify-center text-[#686868] hover:bg-[#F8FAFC] rounded-full"
                >
                  <ChevronDown className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div 
                className="materi-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: highlightMateriContent(selectedStep.content?.bacaMateri || '<p>Konten materi tidak tersedia</p>') }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748B]">
                  Preview materi seperti yang dilihat siswa
                </p>
                <button
                  onClick={handleCloseMateriModal}
                  className="px-6 py-3 rounded-[2rem] bg-[#64748B] text-white text-sm font-semibold hover:bg-[#475569] transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal - Popup like student view */}
      {showQuizModal && selectedStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[#0077B6]">Quiz: {selectedStep.judul || selectedStep.title}</h3>
                  <p className="text-sm text-[#64748B]">Step {pembelajaran.steps?.findIndex((s: any) => s.id === selectedStep.id) + 1}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${selectedStep.id}/quiz`)}
                  className="px-4 py-2 rounded-[2rem] bg-[#10B981] text-white text-sm font-semibold hover:bg-[#059669] transition-all"
                >
                  Edit Quiz
                </button>
                <button
                  onClick={handleCloseQuizModal}
                  className="w-10 h-10 flex items-center justify-center text-[#686868] hover:bg-[#F8FAFC] rounded-full"
                >
                  <ChevronDown className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedStep.content?.quiz?.soalList?.map((soal: any, index: number) => (
                  <div key={index} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2rem] p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-[#0077B6] mb-2">
                          {soal.pertanyaan || soal.question}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {soal.pilihan?.map((pilihan: any, pIdx: number) => (
                        <div key={pIdx} className="flex items-center gap-3 p-3 bg-white border border-[#E2E8F0] rounded-[1.5rem]">
                          <div className="w-6 h-6 rounded-full border-2 border-[#CBD5E1] flex items-center justify-center">
                            <span className="text-xs font-bold text-[#64748B]">{String.fromCharCode(65 + pIdx)}</span>
                          </div>
                          <p className="flex-1 text-sm text-[#0077B6]">{pilihan.text || pilihan}</p>
                          <div className="w-6 h-6 rounded-full border-2 border-[#CBD5E1]"></div>
                        </div>
                      )) || (
                        <div className="text-sm text-[#64748B]">Pilihan jawaban tidak tersedia</div>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-[#FEF3C7] rounded-[1.5rem]">
                      <p className="text-sm text-[#92400E]">
                        <strong>Jawaban Benar:</strong> {soal.jawabanBenar || soal.correctAnswer}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#64748B]">Quiz tidak tersedia</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748B]">
                  Preview quiz seperti yang dilihat siswa
                </p>
                <button
                  onClick={handleCloseQuizModal}
                  className="px-6 py-3 rounded-[2rem] bg-[#64748B] text-white text-sm font-semibold hover:bg-[#475569] transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Student Recap Modal */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#ffcb14] flex items-center justify-center text-white font-bold text-xl">
                  {selectedStudentDetails.student.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-[#0077B6]">{selectedStudentDetails.student.name}</h3>
                  <p className="text-sm text-[#64748B]">Rekap Progres Pembelajaran: {pembelajaran.judul}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetails(null)}
                className="w-10 h-10 flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {pembelajaran.steps?.map((step: any, sIdx: number) => {
                const stepProgress = selectedStudentDetails.progress.find((p: any) => p.step_id === step.id);
                const attempts = stepProgress?.answers?.attempts || (stepProgress?.completed ? 1 : 0);
                const wrongQuestions = stepProgress?.answers?.wrong_questions || [];
                const score = stepProgress?.score;
                
                return (
                  <div key={step.id} className="bg-[#F8FAFC] rounded-[2rem] p-6 border border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#56B6C6] flex items-center justify-center text-white font-bold text-sm">
                          {sIdx + 1}
                        </div>
                        <h4 className="font-bold text-[#0077B6]">{step.judul || step.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        {attempts > 0 && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempts >= 3 ? 'bg-[#FEE2E2] text-[#EF4444]' : attempts === 2 ? 'bg-[#FFEDD5] text-[#F97316]' : 'bg-[#DBEAFE] text-[#1E40AF]'}`}>
                            {attempts} Percobaan
                          </span>
                        )}
                        {score !== null && score !== undefined ? (
                          <span className="px-4 py-1.5 rounded-full bg-blue-50 text-[#0077B6] border border-[#00B4D8]/30 font-bold text-xs">
                            Nilai: {score} / 100
                          </span>
                        ) : step.tipe === 'baca_materi' ? (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                            {stepProgress?.completed ? "Materi Dibaca" : "Belum Dibaca"}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                            Belum Dikerjakan
                          </span>
                        )}
                        {stepProgress?.completed ? (
                          <CheckCircle className="w-6 h-6 text-[#10B981]" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
                        )}
                      </div>
                    </div>

                    {/* Step Detail Content & Expandable Answers */}
                    {stepProgress?.completed && (step.tipe === 'quiz' || step.tipe === 'code_editor') && (
                      <div className="mt-4 pt-4 border-t border-dashed border-[#E2E8F0] flex justify-end">
                        <button
                          onClick={() => {
                            setExpandedAnswers(prev => ({
                              ...prev,
                              [step.id]: !prev[step.id]
                            }));
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {expandedAnswers[step.id] ? "Sembunyikan Jawaban" : "Lihat Jawaban Siswa"}
                        </button>
                      </div>
                    )}

                    {/* Expanded Quiz Answers */}
                    {expandedAnswers[step.id] && step.tipe === 'quiz' && (
                      <div className="mt-4 p-4 rounded-2xl bg-white border border-[#CAF0F8] space-y-4 animate-fadeIn">
                        <p className="text-xs font-bold text-[#0077B6] uppercase tracking-wider mb-2">📝 Detail Jawaban Quiz:</p>
                        {step.content?.quiz?.soalList?.map((soal: any, qIdx: number) => {
                          const studentAnsVal = stepProgress?.answers?.submitted_answers?.[qIdx];
                          
                          // Check correctness:
                          let isCorrect = false;
                          if (typeof studentAnsVal === 'number' && studentAnsVal === soal.correctAnswer) {
                            isCorrect = true;
                          } else if (Array.isArray(studentAnsVal) && soal.options) {
                            const correctOptionText = soal.options[soal.correctAnswer];
                            if (studentAnsVal.join(' ') === correctOptionText) {
                              isCorrect = true;
                            }
                          }

                          let studentAnsText = "";
                          if (typeof studentAnsVal === 'number') {
                            studentAnsText = soal.pilihan?.[studentAnsVal] || soal.options?.[studentAnsVal] || "";
                          } else if (Array.isArray(studentAnsVal)) {
                            studentAnsText = studentAnsVal.join(' ');
                          } else {
                            studentAnsText = String(studentAnsVal || "-");
                          }

                          const correctAnsText = soal.pilihan?.[soal.correctAnswer] || soal.options?.[soal.correctAnswer] || soal.jawabanBenar || "";

                          return (
                            <div key={qIdx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <p className="text-sm font-semibold text-slate-800">{soal.pertanyaan || soal.question}</p>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 pl-7">
                                <div className={`p-2.5 rounded-xl border text-xs font-medium ${isCorrect ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]' : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'}`}>
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Jawaban Siswa</p>
                                  <p className="text-xs font-semibold">{studentAnsText || "(Kosong)"}</p>
                                </div>
                                {!isCorrect && (
                                  <div className="p-2.5 rounded-xl border border-[#86EFAC] bg-[#DCFCE7] text-[#166534] text-xs font-medium">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Jawaban Benar</p>
                                    <p className="text-xs font-semibold">{correctAnsText}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expanded Code Editor Answers */}
                    {expandedAnswers[step.id] && step.tipe === 'code_editor' && (
                      <div className="mt-4 p-4 rounded-2xl bg-white border border-[#CAF0F8] space-y-4 animate-fadeIn">
                        <p className="text-xs font-bold text-[#0077B6] uppercase tracking-wider mb-2">💻 Detail Kode Siswa:</p>
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-200">
                            <div className="bg-[#1E293B] px-3 py-2 flex items-center gap-1.5 justify-between">
                              <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                              </div>
                              <span className="text-[#94A3B8] text-[10px] font-mono">student_submission.html</span>
                            </div>
                            <pre className="p-4 bg-[#0F172A] text-[#E2E8F0] font-mono text-xs overflow-x-auto max-h-[300px] whitespace-pre-wrap leading-relaxed shadow-inner">
                              <code>{stepProgress?.answers?.submitted_code || "/* Siswa tidak mengirimkan kode */"}</code>
                            </pre>
                          </div>

                          {stepProgress?.answers?.submitted_code && (
                            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-200 min-h-[250px]">
                              <div className="bg-[#F8FAFC] px-3 py-2 border-b border-slate-200 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">Live Preview Render</span>
                              </div>
                              <iframe
                                title="Student Live Preview"
                                className="flex-1 bg-white w-full h-full min-h-[200px]"
                                sandbox="allow-scripts"
                                srcDoc={stepProgress?.answers?.submitted_code}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Standard details if not expanded */}
                    {!expandedAnswers[step.id] && (
                      <>
                        {wrongQuestions.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">⚠️ Pertanyaan yang Sering Salah / Terakhir Salah:</p>
                            {wrongQuestions.map((wq: any, wIdx: number) => (
                              <div key={wIdx} className="bg-white p-4 rounded-2xl border border-[#FEE2E2]">
                                <p className="text-sm font-semibold text-[#0077B6] mb-2">{wq.question}</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="flex-1 p-2 bg-[#FEE2E2] rounded-lg border border-[#FCA5A5]">
                                    <p className="text-[10px] text-[#991B1B] font-bold uppercase">Jawaban Siswa</p>
                                    <p className="text-xs text-[#DC2626]">{wq.selected}</p>
                                  </div>
                                  <div className="flex-1 p-2 bg-[#DCFCE7] rounded-lg border border-[#86EFAC]">
                                    <p className="text-[10px] text-[#166534] font-bold uppercase">Jawaban Benar</p>
                                    <p className="text-xs text-[#16A34A]">{wq.correct}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {attempts >= 3 && (
                              <div className="p-4 bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-[#D97706]" />
                                <p className="text-xs text-[#92400E]">
                                  <strong>Analisis Guru:</strong> Siswa ini kesulitan di step ini karena sudah mencoba {attempts} kali. Disarankan untuk memberikan bimbingan personal pada konsep ini.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : attempts > 0 ? (
                          <p className="text-sm text-[#10B981] font-medium flex items-center gap-2 mt-4">
                            <CheckCircle className="w-4 h-4" /> Siswa memahami materi ini dengan baik.
                          </p>
                        ) : (
                          <p className="text-sm text-[#94A3B8] italic mt-4">Belum dikerjakan</p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                onClick={() => setSelectedStudentDetails(null)}
                className="w-full py-4 rounded-[2rem] bg-[#0077B6] text-white font-bold hover:bg-[#152C46] transition-all"
              >
                Tutup Rekap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
