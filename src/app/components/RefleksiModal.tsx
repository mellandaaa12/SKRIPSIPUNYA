"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, PartyPopper, ExternalLink } from "lucide-react";
import { submitRefleksi } from "../utils/api";
import { toast } from "sonner";

interface RefleksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  materiId: string;
  template: string;
  pertanyaanKendala?: string;
  pertanyaanKesan?: string;
  onSuccess?: () => void;
}

export function RefleksiModal({ isOpen, onClose, materiId, template, pertanyaanKendala, pertanyaanKesan, onSuccess }: RefleksiModalProps) {
  const [pemahaman, setPemahaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [kesan, setKesan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UEQ completion state
  const [hasClickedUEQ, setHasClickedUEQ] = useState(false);

  // Parse template with delimiters
  const templateParts = template ? template.split("|||") : [];
  const actualTemplate = templateParts[0] || "Standar";
  const isUeqActive = templateParts[1] === "true";
  const ueqUrl = templateParts[2] || "";
  const ueqDescription = templateParts[3] || "";

  const isStandar = actualTemplate === "Standar";
  const isSingkat = actualTemplate === "Singkat";
  const isEmojiOnly = actualTemplate === "Emoji Only";

  const emojis = [
    { emoji: "😄", label: "Sangat Paham" },
    { emoji: "🙂", label: "Cukup Paham" },
    { emoji: "😕", label: "Kurang Paham" },
  ];

  const handleSubmit = async () => {
    if (!pemahaman) {
      toast.error("Silakan pilih tingkat pemahaman kamu!");
      return;
    }

    if (isUeqActive && !hasClickedUEQ) {
      toast.error("Silakan klik link kuesioner UEQ terlebih dahulu!");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRefleksi({
        materi_id: materiId,
        pemahaman,
        kendala: kendala || undefined,
        kesan: kesan || undefined,
      });

      toast.success("Refleksi berhasil dikirim!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Gagal mengirim refleksi:", error);
      toast.error("Gagal mengirim refleksi: " + (error.message || "Kesalahan sistem"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-[100]"
            onClick={() => {
              if (!isUeqActive || hasClickedUEQ) {
                onClose();
              } else {
                toast.warning("Harap klik link kuesioner UEQ terlebih dahulu!");
              }
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] z-[101] overflow-y-auto max-h-[90vh] border border-[#e2e8f0]"
          >
            {/* Header Area */}
            <div className="bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] p-8 text-center relative border-b border-[#bfdbfe]/50">
              {(!isUeqActive || hasClickedUEQ) && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-[#64748b] hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              <div className="w-20 h-20 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#0077B6] mb-2">Pembelajaran Selesai! 🎉</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d1fae5] text-[#059669] rounded-full text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Progress 100%</span>
              </div>
            </div>

            {/* Form Area */}
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-[#475569] font-medium text-lg mb-4">Bagaimana pemahaman kamu hari ini?</p>
                <div className="flex justify-center gap-4">
                  {emojis.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setPemahaman(`${item.emoji} ${item.label}`)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
                        pemahaman === `${item.emoji} ${item.label}`
                          ? "bg-[#eff6ff] border-2 border-[#3b82f6] scale-110 shadow-md"
                          : "bg-[#f8fafc] border-2 border-transparent hover:bg-[#f1f5f9] hover:scale-105"
                      }`}
                    >
                      <span className="text-4xl">{item.emoji}</span>
                      <span className={`text-xs font-semibold ${pemahaman === `${item.emoji} ${item.label}` ? "text-[#2563eb]" : "text-[#64748b]"}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {(isStandar || isSingkat) && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#0077B6] mb-2">
                    {pertanyaanKendala || "Apa kendala yang kamu alami?"} (Opsional)
                  </label>
                  <textarea
                    value={kendala}
                    onChange={(e) => setKendala(e.target.value)}
                    placeholder="Ceritakan kesulitanmu di sini..."
                    rows={2}
                    className="w-full p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all resize-none text-sm placeholder:text-[#94a3b8] text-[#1e293b]"
                  />
                </div>
              )}

              {isStandar && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#0077B6] mb-2">
                    {pertanyaanKesan || "Bagaimana pendapatmu tentang pembelajaran hari ini?"} (Opsional)
                  </label>
                  <textarea
                    value={kesan}
                    onChange={(e) => setKesan(e.target.value)}
                    placeholder="Tulis kesan dan pesanmu..."
                    rows={2}
                    className="w-full p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all resize-none text-sm placeholder:text-[#94a3b8] text-[#1e293b]"
                  />
                </div>
              )}

              {/* ── SEKSI EVALUASI UEQ (GOOGLE FORM) ── */}
              {isUeqActive && (
                <div className="mb-8 p-6 bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff] rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📊</span>
                    <h4 className="font-extrabold text-sm text-[#0077B6] uppercase tracking-wider">
                      Evaluasi Media (Kuesioner UEQ)
                    </h4>
                  </div>
                  
                  <p className="text-xs text-[#475569] leading-relaxed mb-4 font-semibold">
                    {ueqDescription || "Mohon luangkan waktu Anda sejenak untuk mengisi kuesioner UEQ guna mengevaluasi pengalaman penggunaan media pembelajaran ini."}
                  </p>
                  
                  <a
                    href={ueqUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setHasClickedUEQ(true);
                      toast.success("Membuka Google Form UEQ... Terima kasih telah mengisi!");
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                      hasClickedUEQ
                        ? "bg-[#10B981] shadow-emerald-500/20 hover:bg-[#059669]"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:scale-[1.02]"
                    }`}
                  >
                    <span>{hasClickedUEQ ? "✓ Kuesioner UEQ Telah Dibuka" : "Buka Kuesioner UEQ (Google Form)"}</span>
                    {!hasClickedUEQ && <ExternalLink className="w-4 h-4" />}
                  </a>
                  
                  <div className="mt-3">
                    {hasClickedUEQ ? (
                      <p className="text-[11px] font-bold text-[#10B981] flex items-center gap-1">
                        ✓ Terima kasih! Sekarang Anda dapat mengirim refleksi dan menutup modal.
                      </p>
                    ) : (
                      <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                        ⚠️ Wajib: Klik tombol di atas untuk membuka kuesioner sebelum mengirim!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !pemahaman || (isUeqActive && !hasClickedUEQ)}
                className="w-full py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  "Kirim Refleksi"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
