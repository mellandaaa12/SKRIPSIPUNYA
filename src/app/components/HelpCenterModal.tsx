import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Book, Layout, Calendar, MessageCircle, Star, Info, Zap } from "lucide-react";

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpCenterModal({ isOpen, onClose }: HelpCenterModalProps) {
  const sections = [
    {
      title: "1. Menggunakan Dashboard",
      icon: <Layout className="w-5 h-5 text-[#56B6C6]" />,
      content: "• Klik tombol 'Check-in' berwarna oranye setiap hari untuk menjaga streak dan menambah Poin Bantuan.\n• Lihat 'Progress Tugas' untuk memantau seberapa banyak materi yang sudah kamu selesaikan.\n• Gunakan 'Daftar Tugas' di kanan bawah untuk mencatat agenda belajarmu sendiri."
    },
    {
      title: "2. Alur Pembelajaran Materi",
      icon: <Book className="w-5 h-5 text-[#10B981]" />,
      content: "• Klik menu 'Pembelajaran' di sidebar, lalu pilih salah satu kartu materi (contoh: Pemrograman Web).\n• Di dalam materi, klik 'Mulai Belajar' atau pilih salah satu langkah (Step).\n• Setiap materi biasanya terdiri dari: Membaca Materi, Latihan Kuis, dan Tantangan Coding."
    },
    {
      title: "3. Mengerjakan Kuis & Coding",
      icon: <Zap className="w-5 h-5 text-[#EF4444]" />,
      content: "• Pada halaman Kuis: Pilih jawaban yang benar lalu klik 'Kirim'. Jika sulit, klik 'Minta Bantuan' (menggunakan 1 poin).\n• Pada Code Editor: Tulis kodemu di area editor, lalu klik tombol 'Jalankan' untuk melihat hasil outputnya di sebelah kanan."
    },
    {
      title: "4. Jadwal & Forum Diskusi",
      icon: <Calendar className="w-5 h-5 text-[#8B5CF6]" />,
      content: "• Cek halaman 'Schedule' untuk melihat jam pelajaran hari ini.\n• Jika bingung dengan materi, klik 'Forum Diskusi'. Klik tombol 'Tanya Sesuatu' untuk membuat pertanyaan baru atau balas pertanyaan temanmu untuk saling membantu."
    },
    {
      title: "5. Mengatur Profil Akun",
      icon: <Star className="w-5 h-5 text-[#F59E0B]" />,
      content: "• Klik foto profilmu di sidebar atau header kanan atas untuk membuka pengaturan akun.\n• Klik ikon kamera untuk mengunggah foto profil baru dari galerimu. Klik 'Simpan' untuk memperbarui."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 bg-gradient-to-r from-[#56B6C6] to-[#4DC3E2] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-poppins">Pusat Bantuan</h2>
                  <p className="text-white/80 text-sm">Panduan lengkap penggunaan media pembelajaran</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#0077B6] mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  Mulai Dari Mana?
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Selamat datang, Siswa! Media pembelajaran ini dirancang untuk memudahkan kamu belajar Informatika secara mandiri dan interaktif. Silakan baca panduan di bawah ini untuk memahami setiap fitur.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {sections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-5 rounded-3xl border border-slate-100 hover:border-[#56B6C6]/30 hover:bg-[#F0FDF4]/50 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                        {section.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-[#0077B6] mb-1">{section.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-[#56B6C6] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Saya Mengerti
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
