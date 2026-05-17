"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Save, Loader, Sparkles, Plus, ChevronDown, BookOpen, AlertTriangle, CheckCircle } from "lucide-react";
import { usePembelajaran } from "../context/PembelajaranContext";
import { useAuth } from "../context/AuthContext";
import { pembelajaranAPI } from "../utils/api";
import { toast } from "sonner";

export default function EditMateriGuru() {
  const navigate = useNavigate();
  const { kelasId, materiId } = useParams();
  const { user } = useAuth();
  const { getPembelajaranById, getPembelajaranByKelasId } = usePembelajaran();
  const [judulPembelajaran, setJudulPembelajaran] = useState("");
  const [deskripsiSingkat, setDeskripsiSingkat] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const pembelajaran = materiId ? getPembelajaranById(materiId) : undefined;

  useEffect(() => {
    if (pembelajaran) {
      setJudulPembelajaran(pembelajaran.judul || "");
      setDeskripsiSingkat(pembelajaran.deskripsi || "");
    }
  }, [pembelajaran]);

  const handleSimpan = async () => {
    if (!judulPembelajaran || !deskripsiSingkat) {
      toast.error("Judul dan deskripsi harus diisi!");
      return;
    }

    if (!kelasId || !materiId) {
      toast.error("ID kelas atau materi tidak ditemukan!");
      return;
    }

    setSaving(true);
    try {
      await pembelajaranAPI.update(materiId, {
        judul: judulPembelajaran,
        deskripsi: deskripsiSingkat,
      });
      
      await getPembelajaranByKelasId(kelasId);
      toast.success("Materi berhasil diperbarui!");
      
      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`);
    } catch (error: any) {
      console.error("Failed to update materi:", error);
      toast.error(`Gagal memperbarui materi: ${error.message || "Silakan coba lagi"}`);
      setSaving(false);
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
      `}</style>

      <SideBarGuru />

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Left - Back Button */}
            <button
              onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`)}
              className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] hover:bg-[#0077B6] hover:border-[#0077B6] transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 text-[#0077B6] group-hover:text-white transition-colors" />
              <span className="text-sm font-bold text-[#0077B6] group-hover:text-white transition-colors">Kembali</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#0077B6] group-hover:bg-white transition-colors" />
            </button>

            {/* Right - User Profile */}
            <ProfileHeader />
          </div>

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-[#56B6C6]" />
                <h1 className="text-3xl font-bold text-[#56B6C6]">
                  Edit Materi Pembelajaran
                </h1>
              </div>
              <p className="text-base text-[#64748B]">
                Ubah konten materi dan kelola step-step pembelajaran
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn mb-6">
            <div className="flex flex-col gap-6">
              {/* Judul Pembelajaran */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#0077B6]">
                  Judul Materi <span className="text-[#EF4444]">*</span>
                </label>
                <p className="text-sm text-[#64748B]">
                  Contoh: HTML, CSS, JavaScript, Python, dll.
                </p>
                <input
                  type="text"
                  value={judulPembelajaran}
                  onChange={(e) => setJudulPembelajaran(e.target.value)}
                  placeholder="HTML"
                  className="w-full h-12 px-4 py-3 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Deskripsi Singkat */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#0077B6]">
                  Deskripsi Materi <span className="text-[#EF4444]">*</span>
                </label>
                <p className="text-sm text-[#64748B]">
                  Jelaskan topik apa saja yang akan dipelajari dalam materi ini
                </p>
                <textarea
                  value={deskripsiSingkat}
                  onChange={(e) => setDeskripsiSingkat(e.target.value)}
                  placeholder="Format halaman web, Teks, Tabel, List, hyperlink, form"
                  rows={3}
                  className="w-full px-4 py-3 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>


              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSimpan}
                  disabled={!judulPembelajaran || !deskripsiSingkat || saving || !user?.id}
                  className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#34D399] text-white rounded-[2.5rem] flex items-center gap-2 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 text-white animate-spin" />
                      <span className="text-sm font-semibold">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="text-sm font-semibold">Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Steps Section */}
          <div className="bg-white/85 border border-white/95 rounded-[2.5rem] p-8 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-[#56B6C6]" />
              <h2 className="text-xl font-bold text-[#0077B6]">Step Pembelajaran</h2>
              <span className="px-3 py-1 bg-[#DBEAFE] rounded-full text-xs font-bold text-[#1E40AF]">
                {stepCount} step
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {pembelajaran.steps?.length > 0 ? (
                pembelajaran.steps.map((step: any, index: number) => {
                  const hasMateri = !!step.content?.bacaMateri;
                  const hasLatihan = !!(step.content?.quiz?.aktif || step.content?.initialCode);
                  const isComplete = hasMateri && hasLatihan;
                  return (
                    <div key={step.id} className="bg-white/70 border border-[#E2E8F0]/50 hover:border-[#56B6C6] rounded-[2.5rem] p-6 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center text-white font-bold ${isComplete ? 'bg-gradient-to-br from-[#10B981] to-[#34D399]' : 'bg-gradient-to-br from-[#F59E0B] to-[#D97706]'}`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base text-[#0077B6]">{step.judul}</h3>
                            {isComplete ? (
                              <span className="px-2 py-0.5 bg-[#D1FAE5] rounded-full text-xs font-bold text-[#065F46] flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Lengkap
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#FEF3C7] rounded-full text-xs font-bold text-[#92400E] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Belum Lengkap
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#64748B] mb-2">{step.deskripsi}</p>
                          <div className="flex gap-2">
                            {hasMateri ? (
                              <span className="px-2 py-0.5 bg-[#DBEAFE] rounded-full text-xs font-semibold text-[#1E40AF]">📖 Materi ✓</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#FEE2E2] rounded-full text-xs font-semibold text-[#DC2626]">📖 Materi belum ada</span>
                            )}
                            {hasLatihan ? (
                              <span className="px-2 py-0.5 bg-[#D1FAE5] rounded-full text-xs font-semibold text-[#065F46]">📝 Latihan ✓</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#FEE2E2] rounded-full text-xs font-semibold text-[#DC2626]">📝 Latihan belum ada</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)} className="w-10 h-10 flex items-center justify-center text-[#686868] hover:bg-[#F8FAFC] rounded-full">
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedStep === step.id ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {expandedStep === step.id && (
                        <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                          {!hasMateri && (
                            <div className="mb-3 p-3 bg-[#FEE2E2] rounded-[1rem] flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                              <p className="text-xs text-[#DC2626] font-medium">Wajib tambahkan konten "Baca Materi" sebelum membuat soal!</p>
                            </div>
                          )}
                          <div className="flex gap-3">
                            <button onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/baca-materi`)} className="flex-1 bg-gradient-to-r from-[#56B6C6] to-[#56B6C6] rounded-[2rem] p-4 flex items-center gap-3 hover:opacity-90 transition-all">
                              <span className="text-lg">📖</span>
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-sm text-white">Baca Materi</p>
                                <p className="text-xs text-white/80">{step.content?.bacaMateri ? "Edit konten" : "⚠️ Tambah konten"}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                if (!hasMateri) {
                                  toast.warning("Tambahkan konten 'Baca Materi' terlebih dahulu sebelum membuat latihan!");
                                  return;
                                }
                                navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/code-editor`);
                              }}
                              className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-[2rem] p-4 flex items-center gap-3 hover:opacity-90 transition-all"
                            >
                              <span className="text-lg">💻</span>
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-sm text-white">Code Editor</p>
                                <p className="text-xs text-white/80">{step.content?.initialCode ? "Edit kode" : "Tambah kode"}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                if (!hasMateri) {
                                  toast.warning("Tambahkan konten 'Baca Materi' terlebih dahulu sebelum membuat quiz!");
                                  return;
                                }
                                navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/${step.id}/quiz`);
                              }}
                              className="flex-1 bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-[2rem] p-4 flex items-center gap-3 hover:opacity-90 transition-all"
                            >
                              <span className="text-lg">📝</span>
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-sm text-white">Quiz</p>
                                <p className="text-xs text-white/80">{step.content?.quiz?.aktif ? `${step.content.quiz.soalList.length} soal` : "Tambah soal"}</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="w-16 h-16 mb-4 text-[#CBD5E1]" />
                  <p className="font-semibold text-base text-[#64748B] mb-2">Belum ada step pembelajaran</p>
                  <p className="text-sm text-[#94A3B8]">Tambahkan step untuk melengkapi materi ini</p>
                </div>
              )}

              {/* Add Step Button */}
              <button onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}/step/buat`)} className="w-full bg-white/70 border-2 border-dashed border-[#56B6C6] rounded-[2.5rem] p-6 flex items-center justify-center gap-4 hover:bg-white/90 transition-all">
                <div className="w-12 h-12 border-2 border-dashed border-[#56B6C6] rounded-[1.5rem] flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#56B6C6]" strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-base text-[#0077B6]">Tambah Step Pembelajaran</p>
                  <p className="text-sm text-[#64748B]">Tambah step baru untuk materi ini</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
