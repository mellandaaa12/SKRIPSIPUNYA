"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Save, X, Plus, Loader, Sparkles, FileText, Code } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { usePembelajaran } from "../context/PembelajaranContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface Soal {
  id: string;
  pertanyaan: string;
  pilihan: { label: string; text: string }[];
  jawabanBenar: string;
  bantuan: string;
  code?: string;
  perintahCode?: string;
  quizType?: "pilihan_ganda" | "melengkapi_code";
}

export default function QuizGuru() {
  const navigate = useNavigate();
  const { kelasId, materiId, stepId } = useParams();
  const { preferences } = useSettings();
  const { session, user } = useAuth();
  const { getStepById, updateStepContent } = usePembelajaran();
  
  const [aktifkanQuiz, setAktifkanQuiz] = useState(false);
  const [nilaiMinimal, setNilaiMinimal] = useState("75");
  const [showTambahSoalModal, setShowTambahSoalModal] = useState(false);
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state untuk tambah soal
  const [pertanyaan, setPertanyaan] = useState("");
  const [pilihanList, setPilihanList] = useState<string[]>(["", "", "", ""]);
  const [jawabanBenar, setJawabanBenar] = useState("");
  const [bantuan, setBantuan] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [soalCode, setSoalCode] = useState("");
  const [soalPerintahCode, setSoalPerintahCode] = useState("");
  const [quizType, setQuizType] = useState<"pilihan_ganda" | "melengkapi_code">("pilihan_ganda");

  const step = materiId && stepId ? getStepById(materiId, stepId) : undefined;

  useEffect(() => {
    if (step?.content.quiz) {
      setAktifkanQuiz(step.content.quiz.aktif);
      setNilaiMinimal(step.content.quiz.nilaiMinimal.toString());
      setSoalList(step.content.quiz.soalList);
    }
  }, [step]);

  const handleTambahSoal = () => {
    if (!pertanyaan || !jawabanBenar || !bantuan) {
      toast.error("Pertanyaan, jawaban benar, dan bantuan harus diisi!");
      return;
    }

    if (pilihanList.some(p => !p.trim())) {
      toast.error("Semua pilihan jawaban harus diisi!");
      return;
    }

    const newSoal: Soal = {
      id: Date.now().toString(),
      pertanyaan,
      pilihan: pilihanList.map((text, idx) => ({
        label: String.fromCharCode(65 + idx),
        text: text
      })),
      jawabanBenar,
      bantuan,
      code: soalCode,
      perintahCode: soalPerintahCode,
      quizType: quizType,
    };
    setSoalList([...soalList, newSoal]);
    
    // Reset form
    setPertanyaan("");
    setPilihanList(["", "", "", ""]);
    setJawabanBenar("");
    setBantuan("");
    setSoalCode("");
    setSoalPerintahCode("");
    setQuizType("pilihan_ganda");
    setShowCodeInput(false);
    setShowTambahSoalModal(false);
    
    toast.success("Soal berhasil ditambahkan!");
  };

  const handleSimpan = async () => {
    if (!materiId || !stepId) {
      toast.error("ID materi atau step tidak ditemukan!");
      return;
    }

    if (aktifkanQuiz && soalList.length === 0) {
      toast.error("Tambahkan minimal 1 soal untuk mengaktifkan quiz!");
      return;
    }

    setSaving(true);
    try {
      await updateStepContent(materiId, stepId, {
        quiz: {
          aktif: aktifkanQuiz,
          nilaiMinimal: parseInt(nilaiMinimal),
          soalList: soalList,
        },
      });
      
      toast.success("Quiz berhasil disimpan!");
      
      navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`);
    } catch (error) {
      console.error("Failed to save quiz:", error);
      const errorMessage = error instanceof Error ? error.message : "Silakan coba lagi.";
      toast.error(`Gagal menyimpan quiz: ${errorMessage}`);
      setSaving(false);
    }
  };

  if (!step) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        <p className="font-['Poppins'] text-[18px] text-[#64748b]">Step tidak ditemukan</p>
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
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-[#56B6C6]" />
                <h1 className="text-3xl font-bold text-[#56B6C6]">
                  Buat Quiz
                </h1>
              </div>
              <p className="text-base text-[#64748B]">
                {step.judul}
              </p>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] p-8 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-scaleIn">
            <div className="flex flex-col gap-6">
              {/* Quiz Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#0077B6]">
                        Quiz
                      </h3>
                      <p className="text-sm text-[#64748B]">
                        Tambahkan quiz untuk menguji pemahaman siswa
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAktifkanQuiz(!aktifkanQuiz)}
                    className={`relative w-[52px] h-[28px] rounded-full transition-colors ${
                      aktifkanQuiz ? "bg-[#10B981]" : "bg-[#CBD5E1]"
                    }`}
                  >
                    <div
                      className={`absolute top-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform ${
                        aktifkanQuiz ? "right-[2px]" : "left-[2px]"
                      }`}
                    />
                  </button>
                </div>

                {aktifkanQuiz && (
                  <div className="bg-[#D1FAE5] rounded-[2rem] p-6">
                    {/* Nilai Minimal */}
                    <div className="mb-4">
                      <label className="font-semibold text-sm text-[#065F46] mb-2 block">
                        Nilai Minimal Kelulusan
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={nilaiMinimal}
                          onChange={(e) => setNilaiMinimal(e.target.value)}
                          min="0"
                          max="100"
                          className="w-24 h-12 px-4 py-3 border-2 border-[#10B981] rounded-[2rem] text-sm text-[#065F46] focus:border-[#059669] focus:outline-none transition-colors"
                        />
                        <p className="text-sm text-[#065F46]">
                          Siswa harus mendapat nilai minimal {nilaiMinimal} untuk lanjut ke step berikutnya
                        </p>
                      </div>
                    </div>

                    {/* List Soal */}
                    {soalList.length > 0 && (
                      <div className="mb-4">
                        <p className="font-semibold text-sm text-[#065F46] mb-3">
                          Soal yang sudah ditambahkan ({soalList.length})
                        </p>
                        <div className="flex flex-col gap-3">
                          {soalList.map((soal, index) => (
                            <div
                              key={soal.id}
                              className="bg-white rounded-[2rem] p-4 flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-[#0077B6] mb-1">
                                  {index + 1}. {soal.pertanyaan}
                                </p>
                                <p className="text-xs text-[#64748B]">
                                  Jawaban benar: {soal.jawabanBenar}
                                </p>
                                {soal.code && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[10px] font-bold text-[#1E40AF]">
                                      <Code className="w-2.5 h-2.5" />
                                      Ada Codingan
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${soal.quizType === 'melengkapi_code' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                                      {soal.quizType === 'melengkapi_code' ? '🧩 Melengkapi' : '🔘 Pilihan Ganda'}
                                    </span>
                                  </div>
                                )}
                                {!soal.code && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${soal.quizType === 'melengkapi_code' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                                      {soal.quizType === 'melengkapi_code' ? '🧩 Melengkapi' : '🔘 Pilihan Ganda'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  setSoalList(soalList.filter((s) => s.id !== soal.id))
                                }
                                className="text-[#EF4444] hover:bg-[#FEE2E2] w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                    {/* Tombol Tambah Soal */}
                    <button
                      onClick={() => setShowTambahSoalModal(true)}
                      className="w-full py-3 bg-white border-2 border-dashed border-[#10B981] rounded-[2rem] flex items-center justify-center gap-2 hover:bg-[#ECFDF5] transition-colors"
                    >
                      <Plus className="w-5 h-5 text-[#10B981]" />
                      <p className="font-semibold text-sm text-[#10B981]">
                        Tambah Soal Quiz
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSimpan}
                disabled={(aktifkanQuiz && soalList.length === 0) || saving}
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
                    <span className="text-sm font-semibold">Simpan Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Tambah Soal Quiz */}
      {showTambahSoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[2.5rem] w-[650px] max-h-[90vh] overflow-y-auto p-8">
            <h3 className="font-semibold text-2xl text-[#0077B6] mb-6">
              Tambah Soal Quiz
            </h3>

            {/* Pilihan Tipe Soal */}
            <div className="mb-6">
              <label className="font-semibold text-sm text-[#0077B6] mb-3 block">
                Pilih Tipe Soal <span className="text-[#EF4444]">*</span>
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setQuizType("pilihan_ganda")}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    quizType === "pilihan_ganda" ? "border-[#56B6C6] bg-[#F0F9FF]" : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${quizType === "pilihan_ganda" ? "bg-[#56B6C6] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-xs ${quizType === "pilihan_ganda" ? "text-[#56B6C6]" : "text-[#0077B6]"}`}>Pilihan Ganda</p>
                    <p className="text-[10px] text-[#64748B]">Soal standar ABC</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuizType("melengkapi_code")}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    quizType === "melengkapi_code" ? "border-[#7C3AED] bg-[#F5F3FF]" : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${quizType === "melengkapi_code" ? "bg-[#7C3AED] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-xs ${quizType === "melengkapi_code" ? "text-[#7C3AED]" : "text-[#0077B6]"}`}>Melengkapi Soal</p>
                    <p className="text-[10px] text-[#64748B]">Gunakan titik-titik (.......)</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Pertanyaan */}
            <div className="mb-5">
              <label className="font-semibold text-sm text-[#0077B6] mb-2 block">
                {quizType === "melengkapi_code" ? "Kalimat Soal (Gunakan ....... untuk bagian kosong)" : "Pertanyaan"} <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                placeholder={quizType === "melengkapi_code" ? "Contoh: Tag untuk membuat judul adalah ......." : "Tulis pertanyaan di sini..."}
                rows={3}
                className="w-full px-4 py-3 rounded-[2rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Tombol Tambah Codingan */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                  showCodeInput ? 'bg-[#56B6C6] border-[#56B6C6] text-white' : 'border-[#56B6C6] text-[#56B6C6] hover:bg-[#F0F9FF]'
                }`}
              >
                <Code className="w-4 h-4" />
                <span className="text-sm font-semibold">{showCodeInput ? 'Hapus Codingan' : 'Tambah Codingan'}</span>
              </button>
            </div>

            {/* Input Codingan & Perintah */}
            {showCodeInput && (
              <div className="mb-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] animate-fadeIn">
                <div className="mb-4">
                  <label className="font-semibold text-xs text-[#64748B] mb-2 block uppercase tracking-wider">
                    Contoh Codingan
                  </label>
                  <textarea
                    value={soalCode}
                    onChange={(e) => setSoalCode(e.target.value)}
                    placeholder="Contoh: <html>...</html>"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] font-mono text-xs text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] resize-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-[#64748B] mb-2 block uppercase tracking-wider">
                    Perintah Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={soalPerintahCode}
                    onChange={(e) => setSoalPerintahCode(e.target.value)}
                    placeholder="Contoh: Perhatikan kode di atas, apa fungsi dari tag..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-sm text-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0]"
                  />
                </div>
              </div>
            )}

            {/* Pilihan Jawaban */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-sm text-[#0077B6]">
                  Pilihan Jawaban <span className="text-[#EF4444]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (pilihanList.length >= 8) {
                      toast.error("Maksimal 8 pilihan jawaban!");
                      return;
                    }
                    setPilihanList([...pilihanList, ""]);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-[#56B6C6] text-[10px] font-bold text-[#56B6C6] hover:bg-[#F0F9FF] transition-all"
                >
                  <Plus className="w-3 h-3" />
                  Tambah Opsi ({String.fromCharCode(65 + pilihanList.length)})
                </button>
              </div>
              
              {pilihanList.map((pilihan, idx) => {
                const label = String.fromCharCode(65 + idx);
                return (
                  <div key={idx} className="flex items-center gap-3 mb-3 animate-fadeIn">
                    <input
                      type="radio"
                      name="jawabanBenar"
                      checked={jawabanBenar === label}
                      onChange={() => setJawabanBenar(label)}
                      className="w-5 h-5 accent-[#56B6C6]"
                    />
                    <div className="w-10 h-10 bg-gradient-to-b from-[#DBEAFE] to-[#BFDBFE] rounded-[1.5rem] flex items-center justify-center flex-shrink-0">
                      <p className="font-semibold text-sm text-[#1E40AF]">{label}</p>
                    </div>
                    <input
                      type="text"
                      value={pilihan}
                      onChange={(e) => {
                        const newList = [...pilihanList];
                        newList[idx] = e.target.value;
                        setPilihanList(newList);
                      }}
                      placeholder={`Opsi ${label}`}
                      className="flex-1 h-12 px-4 py-3 rounded-[2rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200"
                    />
                    {pilihanList.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newList = pilihanList.filter((_, i) => i !== idx);
                          setPilihanList(newList);
                          if (jawabanBenar === label) {
                            setJawabanBenar("");
                          } else if (jawabanBenar.charCodeAt(0) > label.charCodeAt(0)) {
                            setJawabanBenar(String.fromCharCode(jawabanBenar.charCodeAt(0) - 1));
                          }
                        }}
                        className="text-[#EF4444] hover:bg-[#FEE2E2] w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                        title="Hapus opsi ini"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              <p className="text-xs text-[#64748B] mt-2">
                * Pilih radio button untuk menandai jawaban yang benar. Gunakan tombol + Tambah Opsi untuk menambah opsi (A-H).
              </p>
            </div>

            {/* Bantuan untuk Siswa */}
            <div className="mb-6">
              <label className="font-semibold text-sm text-[#0077B6] mb-2 block">
                Bantuan untuk Siswa <span className="text-[#EF4444]">*</span>
              </label>
              <p className="text-xs text-[#64748B] mb-2">
                Bantuan ini akan muncul saat siswa menggunakan fitur "Butuh Bantuan" dengan menukarkan poin hint
              </p>
              <textarea
                value={bantuan}
                onChange={(e) => setBantuan(e.target.value)}
                placeholder="Berikan petunjuk atau bantuan untuk membantu siswa menjawab..."
                rows={3}
                className="w-full px-4 py-3 rounded-[2rem] bg-white/70 border border-[#E2E8F0] text-sm text-[#0077B6] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4ECF0] focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowTambahSoalModal(false)}
                className="flex-1 h-12 rounded-[2rem] border-2 border-[#56B6C6] font-semibold text-sm text-[#56B6C6] hover:bg-[#F0F9FF] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleTambahSoal}
                disabled={
                  !pertanyaan ||
                  pilihanList.some(p => !p.trim()) ||
                  !jawabanBenar ||
                  !bantuan
                }
                className="flex-1 h-12 rounded-[2rem] bg-gradient-to-r from-[#10B981] to-[#34D399] font-semibold text-sm text-white shadow-[0_8px_24px_-4px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
