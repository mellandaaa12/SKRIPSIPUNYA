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

export default function BuatMateriGuru() {
  const navigate = useNavigate();
  const { kelasId } = useParams();
  const { preferences } = useSettings();
  const { user } = useAuth();
  const { addPembelajaran } = usePembelajaran();

  const [judulPembelajaran, setJudulPembelajaran] = useState("");
  const [deskripsiSingkat, setDeskripsiSingkat] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── Save materi ─────────────────────────────────────────────────
  const handleSimpan = async () => {
    if (!judulPembelajaran || !deskripsiSingkat) {
      toast.error("Judul dan deskripsi harus diisi!");
      return;
    }
    if (!kelasId) {
      toast.error("ID kelas tidak ditemukan!");
      return;
    }

    setSaving(true);
    try {
      // Create pembelajaran
      const pembelajaranId = await addPembelajaran({
        judul: judulPembelajaran,
        deskripsi: deskripsiSingkat,
        classId: kelasId,
      }, user?.id);

      // Notify students
      if (kelasId && user?.id) {
        const { notifyClass } = await import("../utils/api");
        await notifyClass(kelasId, user.id, "materi", `Guru ${user.name} menambahkan materi baru: ${judulPembelajaran}`, "/pembelajaran");
      }

      toast.success("Materi berhasil dibuat!");
      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${pembelajaranId}`);
    } catch (error: any) {
      console.error("Failed to create materi:", error);
      toast.error(`Gagal membuat materi: ${error.message || "Silakan coba lagi"}`);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>

      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#D4ECF0]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#D4ECF0]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#DCFCE7]/30 blur-3xl" />
      </div>

      <SideBarGuru />

      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
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

          {/* Welcome Section */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-[#0077B6]" />
                <h1 className="text-3xl font-bold text-[#0077B6]">Buat Materi Baru</h1>
              </div>
              <p className="text-base text-[#64748B]">
                Buat materi pembelajaran dengan judul dan deskripsi yang jelas.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            <div className="flex flex-col gap-7">

              {/* ── JUDUL ─────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#0077B6]">
                  Judul Materi <span className="text-[#EF4444]">*</span>
                </label>
                <p className="text-xs text-[#94A3B8]">Contoh: HTML, CSS, JavaScript, Python, dll.</p>
                <input
                  type="text"
                  value={judulPembelajaran}
                  onChange={(e) => setJudulPembelajaran(e.target.value)}
                  placeholder="HTML"
                  className="w-full h-12 px-4 py-3 rounded-[2.5rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* ── DESKRIPSI ─────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-[#0077B6]">
                  Deskripsi Materi <span className="text-[#EF4444]">*</span>
                </label>
                <p className="text-xs text-[#94A3B8]">Jelaskan topik apa saja yang akan dipelajari</p>
                <textarea
                  value={deskripsiSingkat}
                  onChange={(e) => setDeskripsiSingkat(e.target.value)}
                  placeholder="Format halaman web, Teks, Tabel, List, hyperlink, form"
                  rows={3}
                  className="w-full px-4 py-3 rounded-[2rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* ── INFO BOX ──────────────────────────────────── */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[2rem] p-5">
                <p className="text-sm text-[#1E40AF] leading-relaxed">
                  💡 <strong>Tips:</strong> Setelah membuat materi ini, Anda bisa menambahkan step-step pembelajaran di dalamnya. Setiap step berisi konten baca materi dan latihan soal (quiz).
                </p>
              </div>

              {/* ── SAVE BUTTON ───────────────────────────────── */}
              <button
                onClick={handleSimpan}
                disabled={!judulPembelajaran || !deskripsiSingkat || saving || !user?.id}
                className="self-end inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white rounded-[2.5rem] shadow-[0_8px_24px_-4px_rgba(0,119,182,0.35)] hover:shadow-[0_12px_32px_-4px_rgba(0,119,182,0.45)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Materi
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