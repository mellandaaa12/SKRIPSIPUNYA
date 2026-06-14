"use client";

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Save, Loader, Sparkles } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { usePembelajaran } from "../context/PembelajaranContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { translateError } from "../utils/errorTranslator";

export default function BuatStepMateriGuru() {
  const navigate = useNavigate();
  const { kelasId, materiId } = useParams();
  const { preferences } = useSettings();
  const { session, user } = useAuth();
  const { addStep } = usePembelajaran();
  const [judulStep, setJudulStep] = useState("");
  const [deskripsiStep, setDeskripsiStep] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSimpan = async () => {
    if (!judulStep || !deskripsiStep) {
      toast.error("Judul dan deskripsi langkah harus diisi!");
      return;
    }

    if (!materiId) {
      toast.error("ID materi tidak ditemukan!");
      return;
    }

    setSaving(true);
    try {
      await addStep(materiId, {
        judul: judulStep,
        deskripsi: deskripsiStep,
        content: {},
        status: "draft",
      });
      
      toast.success("Langkah berhasil ditambahkan!");
      
      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`);
    } catch (error: any) {
      console.error("Failed to add step:", error);
      toast.error(translateError(error?.message || error) || "Gagal menambahkan langkah. Silakan coba lagi.");
      setSaving(false);
    }
  };

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
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#D4ECF0]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#D4ECF0]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#DCFCE7]/30 blur-3xl" />
      </div>

      <SideBarGuru />

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Left - Back Button */}
            <button
              onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] text-[#0077B6] hover:bg-white transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-semibold">Kembali</span>
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
                  Tambah Langkah Pembelajaran
                </h1>
              </div>
              <p className="text-base text-[#64748B]">
                Buat langkah pembelajaran baru untuk materi ini
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn">
            <div className="flex flex-col gap-6">
              {/* Judul Langkah */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#0077B6]">
                  Judul Langkah <span className="text-[#EF4444]">*</span>
                </label>
                <p className="text-sm text-[#64748B]">
                  Contoh: FORMAT HALAMAN WEB, TEKS DAN FORMATTING, TABEL, dll.
                </p>
                <input
                  type="text"
                  value={judulStep}
                  onChange={(e) => setJudulStep(e.target.value)}
                  placeholder="FORMAT HALAMAN WEB"
                  className="w-full h-12 px-4 py-3 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Deskripsi Langkah */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#0077B6]">
                  Deskripsi Langkah <span className="text-[#EF4444]">*</span>
                </label>
                <p className="text-sm text-[#64748B]">
                  Jelaskan secara singkat apa yang akan dipelajari di langkah ini
                </p>
                <textarea
                  value={deskripsiStep}
                  onChange={(e) => setDeskripsiStep(e.target.value)}
                  placeholder="Struktur dasar HTML dan elemen-elemen penting"
                  rows={3}
                  className="w-full px-4 py-3 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-[#DBEAFE] border-2 border-[#56B6C6] rounded-[2rem] p-6">
                <p className="text-sm text-[#1E40AF] leading-relaxed">
                  💡 <strong>Tips:</strong> Setelah membuat langkah ini, Anda bisa menambahkan konten "Baca Materi" dan "Kerjakan Latihan" dengan mengklik langkah yang sudah dibuat.
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSimpan}
                disabled={!judulStep || !deskripsiStep || saving}
                className="self-end px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#34D399] text-white rounded-[2.5rem] flex items-center gap-2 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 text-white animate-spin" />
                    <span className="text-sm font-semibold">Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="text-sm font-semibold">Simpan Langkah</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
