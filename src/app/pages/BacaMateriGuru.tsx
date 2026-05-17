"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Save, Loader, Sparkles, BookOpen } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { usePembelajaran } from "../context/PembelajaranContext";
import { useAuth } from "../context/AuthContext";
import RichTextEditor from "../components/RichTextEditor";
import { toast } from "sonner";
import { supabase } from "../utils/supabase";

export default function BacaMateriGuru() {
  const navigate = useNavigate();
  const { kelasId, materiId, stepId } = useParams();
  const { preferences } = useSettings();
  const { session, user } = useAuth();
  const { getStepById, updateStepContent, getPembelajaranByKelasId } = usePembelajaran();
  const [kontenMateri, setKontenMateri] = useState("");
  const [saving, setSaving] = useState(false);
  const [stepData, setStepData] = useState<any>(null);
  const [loadingStep, setLoadingStep] = useState(true);

  // Fetch step data directly from Supabase — do not rely on context state alone
  useEffect(() => {
    const fetchStep = async () => {
      if (!materiId || !stepId) return;
      setLoadingStep(true);
      try {
        // Try context first (fast path)
        const fromContext = getStepById(materiId, stepId);
        if (fromContext) {
          setStepData(fromContext);
          if (fromContext.content?.bacaMateri) {
            setKontenMateri(fromContext.content.bacaMateri);
          }
          setLoadingStep(false);
          return;
        }

        // Fallback: fetch directly from Supabase
        const { data, error } = await supabase
          .from("pembelajaran")
          .select("steps")
          .eq("id", materiId)
          .single();

        if (error) throw error;

        const steps = Array.isArray(data?.steps) ? data.steps : [];
        const found = steps.find((s: any) => s.id === stepId);
        if (found) {
          setStepData(found);
          if (found.content?.bacaMateri) {
            setKontenMateri(found.content.bacaMateri);
          }
        }
      } catch (err) {
        console.error("Error loading step:", err);
        toast.error("Gagal memuat data step.");
      } finally {
        setLoadingStep(false);
      }
    };
    fetchStep();
  }, [materiId, stepId]);

  const handleSimpan = async () => {
    if (!kontenMateri || !materiId || !stepId) {
      toast.error("Konten materi tidak boleh kosong!");
      return;
    }

    setSaving(true);
    try {
      // Fetch current steps directly from Supabase to avoid stale context state
      const { data: currentData, error: fetchErr } = await supabase
        .from("pembelajaran")
        .select("steps")
        .eq("id", materiId)
        .single();

      if (fetchErr) throw new Error(fetchErr.message);

      const currentSteps = Array.isArray(currentData?.steps) ? currentData.steps : [];
      const newSteps = currentSteps.map((s: any) =>
        s.id === stepId
          ? { ...s, content: { ...s.content, bacaMateri: kontenMateri } }
          : s
      );

      const { error: updateErr } = await supabase
        .from("pembelajaran")
        .update({ steps: newSteps })
        .eq("id", materiId);

      if (updateErr) throw new Error(updateErr.message);

      // Also update context state so other pages see updated data
      try {
        await updateStepContent(materiId, stepId, { bacaMateri: kontenMateri });
      } catch {
        // context update failure is non-critical — DB already saved
      }

      toast.success("Materi berhasil disimpan!");
      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`);
    } catch (error: any) {
      console.error("Failed to save:", error);
      toast.error(`Gagal menyimpan materi: ${error.message || "Silakan coba lagi."}`);
      setSaving(false);
    }
  };

  if (loadingStep) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-[#0077B6] animate-spin" />
          <p className="font-['Poppins'] text-[16px] text-[#64748b]">Memuat materi...</p>
        </div>
      </div>
    );
  }

  if (!stepData) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <div className="flex flex-col items-center gap-3">
          <p className="font-['Poppins'] text-[18px] text-[#64748b]">Step tidak ditemukan</p>
          <button
            onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`)}
            className="px-4 py-2 bg-[#0077B6] text-white rounded-full text-sm"
          >
            Kembali
          </button>
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
      `}</style>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#00B4D8]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#00B4D8]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
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
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-[#0077B6]" />
                <h1 className="text-3xl font-bold text-[#0077B6]">
                  Baca Materi
                </h1>
              </div>
              <p className="text-base text-[#64748B]">
                {stepData.judul}
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] animate-scaleIn">
            <div className="flex flex-col gap-6">
              {/* Konten Baca Materi */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-base text-[#0077B6]">
                    Konten Baca Materi
                  </h3>
                </div>
                <p className="text-sm text-[#64748B]">
                  Tuliskan konten materi yang akan dibaca oleh siswa. Gunakan rich text editor untuk format teks, tambah gambar, dan link.
                </p>

                {/* Rich Text Editor */}
                <RichTextEditor
                  content={kontenMateri}
                  onChange={setKontenMateri}
                  placeholder="Tulis konten materi yang akan dibaca siswa di sini..."
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSimpan}
                disabled={!kontenMateri || saving}
                className="self-end px-6 py-3 bg-gradient-to-r from-[#0077B6] to-[#0077B6] text-white rounded-[2.5rem] flex items-center gap-2 shadow-[0_8px_24_px_-4px_rgba(0,119,182,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(0,119,182,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 text-white animate-spin" />
                    <span className="text-sm font-semibold">Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="text-sm font-semibold">Simpan Materi</span>
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
