"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, PartyPopper, HelpCircle } from "lucide-react";
import { submitRefleksi, submitUeqResponses } from "../utils/api";
import { toast } from "sonner";

interface RefleksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  materiId: string;
  template: string;
  pertanyaanKendala?: string;
  pertanyaanKesan?: string;
  ueqQuestions?: any[];
  onSuccess?: () => void;
}

export function RefleksiModal({ isOpen, onClose, materiId, template, pertanyaanKendala, pertanyaanKesan, ueqQuestions = [], onSuccess }: RefleksiModalProps) {
  const [pemahaman, setPemahaman] = useState("");
  const [kendala, setKendala] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom UEQ answers state
  const [ueqAnswers, setUeqAnswers] = useState<Record<string, any>>({});

  // Parse template with delimiters
  const templateParts = template ? template.split("|||") : [];
  const actualTemplate = templateParts[0] || "Standar";
  const isUeqActive = templateParts[1] === "true";
  const ueqUrl = templateParts[2] || "";
  const ueqDescription = templateParts[3] || "";

  const emojis = [
    { emoji: "😄", label: "Sangat Paham" },
    { emoji: "🙂", label: "Cukup Paham" },
    { emoji: "😕", label: "Kurang Paham" },
  ];

  const needsKendala = pemahaman.includes("Kurang Paham");

  const isAllUeqAnswered = !isUeqActive || ueqQuestions.every(q => {
    const ans = ueqAnswers[q.id];
    if (q.type === "scale") return typeof ans === "number";
    return typeof ans === "string" && ans.trim().length > 0;
  });

  const canSubmit =
    !!pemahaman &&
    (!needsKendala || kendala.trim().length > 0) &&
    isAllUeqAnswered;

  const handleSubmit = async () => {
    if (!pemahaman) {
      toast.error("Silakan pilih tingkat pemahaman kamu!");
      return;
    }

    if (needsKendala && !kendala.trim()) {
      toast.error("Silakan isi jawaban kendala kamu!");
      return;
    }

    if (isUeqActive && !isAllUeqAnswered) {
      toast.error("Silakan lengkapi seluruh kuesioner UEQ terlebih dahulu!");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRefleksi({
        materi_id: materiId,
        pemahaman,
        kendala: needsKendala ? kendala.trim() : undefined,
        kesan: undefined,
      });

      if (isUeqActive && ueqQuestions.length > 0) {
        const formattedAnswers = ueqQuestions.map(q => ({
          questionId: q.id,
          type: q.type,
          label: q.label,
          answer: ueqAnswers[q.id]
        }));
        await submitUeqResponses({
          materi_id: materiId,
          answers: formattedAnswers
        });
      }

      toast.success("Refleksi dan evaluasi berhasil dikirim!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Gagal mengirim refleksi:", error);
      toast.error("Gagal mengirim data: " + (error.message || "Kesalahan sistem"));
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
              if (isAllUeqAnswered) {
                onClose();
              } else {
                toast.warning("Harap lengkapi kuesioner UEQ terlebih dahulu!");
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
              {(isAllUeqAnswered) && (
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

              {needsKendala && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#0077B6] mb-2">
                    {pertanyaanKendala || "Apa kendala yang kamu alami?"}
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

              {/* ── SEKSI EVALUASI UEQ (NATIVE RESPONDER FORM) ── */}
              {isUeqActive && ueqQuestions.length > 0 && (
                <div className="mb-8 p-6 bg-gradient-to-br from-[#f8fafc] to-[#eff6ff] rounded-3xl border border-[#dbeafe] shadow-md relative overflow-visible">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-xl">📊</span>
                    <h4 className="font-extrabold text-sm text-[#0077B6] uppercase tracking-wider">
                      Evaluasi Pengalaman Pengguna (UEQ)
                    </h4>
                  </div>
                  
                  <p className="text-xs text-[#64748B] leading-relaxed mb-6 font-medium bg-white p-3 rounded-2xl border border-[#e2e8f0]">
                    {ueqDescription || "Mohon luangkan waktu Anda sejenak untuk mengisi kuesioner UEQ guna mengevaluasi pengalaman penggunaan media pembelajaran ini."}
                  </p>

                  <div className="flex flex-col gap-6">
                    {ueqQuestions.map((q, idx) => {
                      const answer = ueqAnswers[q.id];
                      return (
                        <div key={q.id} className="flex flex-col gap-2.5">
                          <label className="block text-xs font-bold text-[#1e293b] leading-normal">
                            {idx + 1}. {q.label} <span className="text-red-500">*</span>
                          </label>

                          {q.type === 'scale' && (
                            <div className="flex justify-between items-center px-4 py-5 bg-white rounded-3xl border border-[#e2e8f0] shadow-sm gap-2">
                              {/* Min Label */}
                              {q.minLabel && q.minLabel.trim() ? (
                                <div className="flex flex-col items-start max-w-[22%]">
                                  <span className="text-[10px] font-bold text-amber-600 uppercase text-left leading-tight break-words" title={q.minLabel}>
                                    {q.minLabel}
                                  </span>
                                </div>
                              ) : null}

                              {/* Scale Options Grid */}
                              <div className="flex justify-center items-center gap-3 sm:gap-4 flex-1">
                                {(() => {
                                  const minScale = q.minScale !== undefined ? q.minScale : 1;
                                  const maxScale = q.maxScale !== undefined ? q.maxScale : 7;
                                  const count = maxScale - minScale + 1;
                                  return Array.from({ length: count > 0 ? count : 7 }).map((_, numIdx) => {
                                    const val = minScale + numIdx;
                                    const isSelected = answer === val;
                                    return (
                                      <div 
                                        key={val} 
                                        onClick={() => setUeqAnswers(prev => ({ ...prev, [q.id]: val }))}
                                        className="flex flex-col items-center gap-2 cursor-pointer group"
                                      >
                                        {/* Number Label */}
                                        <span className={`text-[11px] font-black transition-colors ${isSelected ? 'text-[#0077B6]' : 'text-slate-400 group-hover:text-[#0077B6]'}`}>
                                          {val}
                                        </span>
                                        
                                        {/* Outer Radio Circle */}
                                        <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isSelected 
                                            ? 'border-[#0077B6] bg-white scale-110 shadow-sm shadow-[#0077B6]/20' 
                                            : 'border-slate-300 bg-white group-hover:border-[#0077B6]'
                                        }`}>
                                          {/* Inner Selected Dot */}
                                          <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                                            isSelected ? 'bg-[#0077B6] scale-100' : 'bg-transparent scale-50'
                                          }`} />
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>

                              {/* Max Label */}
                              {q.maxLabel && q.maxLabel.trim() ? (
                                <div className="flex flex-col items-end max-w-[22%] text-right">
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase text-right leading-tight break-words" title={q.maxLabel}>
                                    {q.maxLabel}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          )}

                          {q.type === 'text' && (
                            <input
                              type="text"
                              value={answer || ""}
                              onChange={(e) => setUeqAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Ketik jawaban singkat Anda..."
                              className="w-full p-3.5 bg-white border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-xs text-[#1e293b]"
                            />
                          )}

                          {q.type === 'paragraph' && (
                            <textarea
                              value={answer || ""}
                              onChange={(e) => setUeqAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Ketik umpan balik lengkap Anda..."
                              rows={3}
                              className="w-full p-3.5 bg-white border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-xs text-[#1e293b] resize-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    {isAllUeqAnswered ? (
                      <p className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">
                        ✓ Seluruh kuesioner UEQ telah dijawab. Terima kasih!
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                        ⚠️ Harap lengkapi semua pertanyaan kuesioner di atas!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
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
