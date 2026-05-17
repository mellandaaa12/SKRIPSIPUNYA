"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Sparkles, Smile, Meh, Frown, MessageSquare, AlertCircle } from "lucide-react";
import { getTeacherRefleksiStats, getPembelajaranById } from "../utils/api";
import { usePembelajaran } from "../context/PembelajaranContext";
import { motion } from "motion/react";

export default function HasilRefleksiGuru() {
  const navigate = useNavigate();
  const { kelasId, materiId } = useParams();
  const { getPembelajaranById: getPembelajaran } = usePembelajaran();
  
  const [stats, setStats] = useState<any>(null);
  const [refleksiData, setRefleksiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const pembelajaran = materiId ? getPembelajaran(materiId) : null;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getTeacherRefleksiStats();
        
        // Filter for this specific materi if materiId is provided
        const filteredRefleksi = materiId 
          ? data.refleksi.filter((r: any) => r.materi_id === materiId)
          : data.refleksi;
          
        setRefleksiData(filteredRefleksi);
        
        // Recalculate stats for this materi
        let sangatPaham = 0, cukupPaham = 0, kurangPaham = 0;
        filteredRefleksi.forEach((r: any) => {
          if (r.pemahaman.includes('😄')) sangatPaham++;
          else if (r.pemahaman.includes('🙂')) cukupPaham++;
          else if (r.pemahaman.includes('😕')) kurangPaham++;
        });
        
        setStats({
          total: filteredRefleksi.length,
          sangatPaham,
          cukupPaham,
          kurangPaham
        });
      } catch (error) {
        console.error("Failed to fetch refleksi stats", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [materiId]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "transparent" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56B6C6] mx-auto mb-4" />
          <p className="text-sm text-[#64748B]">Memuat data refleksi...</p>
        </div>
      </div>
    );
  }

  const getPercentage = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      <SideBarGuru />

      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
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

          {/* Title Section */}
          <div className="mb-8">
            <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-[#56B6C6]" />
                <h1 className="text-3xl font-bold text-[#56B6C6]">
                  Hasil Refleksi Pembelajaran
                </h1>
              </div>
              <p className="text-base text-[#64748B]">
                Analisis tingkat pemahaman dan kendala siswa untuk materi: <strong>{pembelajaran?.judul || "Materi"}</strong>
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Sangat Paham */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 border border-white/95 rounded-[2rem] p-6 shadow-md relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#10B981]/10 rounded-full blur-xl" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] flex items-center justify-center text-2xl">😄</div>
                <span className="text-3xl font-black text-[#10B981]">{stats?.sangatPaham || 0}</span>
              </div>
              <h3 className="font-bold text-[#0077B6] mb-1">Sangat Paham</h3>
              <p className="text-xs text-[#64748B] mb-3">Siswa mengerti materi dengan baik</p>
              
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div className="bg-[#10B981] h-2 rounded-full" style={{ width: `${getPercentage(stats?.sangatPaham, stats?.total)}%` }} />
              </div>
              <p className="text-xs font-bold text-right mt-2 text-[#10B981]">{getPercentage(stats?.sangatPaham, stats?.total)}%</p>
            </motion.div>

            {/* Cukup Paham */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 border border-white/95 rounded-[2rem] p-6 shadow-md relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#F59E0B]/10 rounded-full blur-xl" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-2xl">🙂</div>
                <span className="text-3xl font-black text-[#F59E0B]">{stats?.cukupPaham || 0}</span>
              </div>
              <h3 className="font-bold text-[#0077B6] mb-1">Cukup Paham</h3>
              <p className="text-xs text-[#64748B] mb-3">Siswa cukup mengerti tapi butuh latihan</p>
              
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div className="bg-[#F59E0B] h-2 rounded-full" style={{ width: `${getPercentage(stats?.cukupPaham, stats?.total)}%` }} />
              </div>
              <p className="text-xs font-bold text-right mt-2 text-[#F59E0B]">{getPercentage(stats?.cukupPaham, stats?.total)}%</p>
            </motion.div>

            {/* Kurang Paham */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 border border-white/95 rounded-[2rem] p-6 shadow-md relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EF4444]/10 rounded-full blur-xl" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] flex items-center justify-center text-2xl">😕</div>
                <span className="text-3xl font-black text-[#EF4444]">{stats?.kurangPaham || 0}</span>
              </div>
              <h3 className="font-bold text-[#0077B6] mb-1">Kurang Paham</h3>
              <p className="text-xs text-[#64748B] mb-3">Siswa butuh bantuan ekstra</p>
              
              <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                <div className="bg-[#EF4444] h-2 rounded-full" style={{ width: `${getPercentage(stats?.kurangPaham, stats?.total)}%` }} />
              </div>
              <p className="text-xs font-bold text-right mt-2 text-[#EF4444]">{getPercentage(stats?.kurangPaham, stats?.total)}%</p>
            </motion.div>
          </div>

          {/* Feedback Table */}
          <div className="bg-white/90 border border-white/95 rounded-[2.5rem] p-8 shadow-md">
            <h2 className="text-xl font-bold text-[#0077B6] mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#56B6C6]" /> Detail Refleksi Siswa
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left">
                    <th className="py-4 px-4 font-semibold text-sm text-[#64748B]">Siswa</th>
                    <th className="py-4 px-4 font-semibold text-sm text-[#64748B]">Waktu</th>
                    <th className="py-4 px-4 font-semibold text-sm text-[#64748B]">Pemahaman</th>
                    <th className="py-4 px-4 font-semibold text-sm text-[#64748B]">Kendala</th>
                    <th className="py-4 px-4 font-semibold text-sm text-[#64748B]">Kesan</th>
                  </tr>
                </thead>
                <tbody>
                  {refleksiData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                        Belum ada siswa yang mengisi refleksi.
                      </td>
                    </tr>
                  ) : (
                    refleksiData.map((item: any) => (
                      <tr key={item.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <td className="py-4 px-4 font-medium text-[#0077B6]">{item.siswa_name}</td>
                        <td className="py-4 px-4 text-sm text-[#64748B]">
                          {new Date(item.created_at).toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            item.pemahaman.includes('😄') ? 'bg-[#D1FAE5] text-[#065F46]' :
                            item.pemahaman.includes('🙂') ? 'bg-[#FEF3C7] text-[#92400E]' :
                            'bg-[#FEE2E2] text-[#991B1B]'
                          }`}>
                            {item.pemahaman}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-[#475569] max-w-xs">
                          {item.kendala ? (
                            <div className="flex gap-2 items-start">
                              <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                              <p>{item.kendala}</p>
                            </div>
                          ) : <span className="text-[#CBD5E1]">-</span>}
                        </td>
                        <td className="py-4 px-4 text-sm text-[#475569] max-w-xs">
                          {item.kesan || <span className="text-[#CBD5E1]">-</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
