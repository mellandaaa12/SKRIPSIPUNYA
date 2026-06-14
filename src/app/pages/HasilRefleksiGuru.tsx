"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Sparkles, Smile, MessageSquare, AlertCircle, Download, BarChart2, Users } from "lucide-react";
import { getTeacherRefleksiStats, getUeqResponsesByMateri, supabase } from "../utils/api";
import { usePembelajaran } from "../context/PembelajaranContext";
import { motion } from "motion/react";
import { toast } from "sonner";

/** Nama kelas lengkap untuk UI, contoh: "XI Rekayasa Perangkat Lunak 1" */
function formatClassDisplayName(row: {
  grade?: string | null;
  subject?: string | null;
  name?: string | null;
}) {
  const g = (row.grade ?? "").trim();
  const s = (row.subject ?? "").trim();
  const n = (row.name ?? "").trim();
  const label = [g, s, n].filter(Boolean).join(" ");
  return label || "—";
}

/**
 * 📊 Google Forms-style Dynamic Vertical Bar Chart Component
 */
function GoogleFormsBarChart({ question, responses, questionIndex }: { question: any; responses: any[]; questionIndex: number }) {
  const minScale = question.minScale !== undefined ? question.minScale : 1;
  const maxScale = question.maxScale !== undefined ? question.maxScale : 7;
  const total = responses.length;

  // Initialize frequency map
  const freqs: Record<number, number> = {};
  for (let s = minScale; s <= maxScale; s++) {
    freqs[s] = 0;
  }

  // Count frequencies of student answers
  responses.forEach(r => {
    const ansObj = r.answers?.find((a: any) => a.questionId === question.id);
    if (ansObj && ansObj.answer !== undefined) {
      const val = parseInt(ansObj.answer, 10);
      if (!isNaN(val) && val >= minScale && val <= maxScale) {
        freqs[val] = (freqs[val] || 0) + 1;
      }
    }
  });

  const maxCount = Math.max(...Object.values(freqs), 1);
  
  // Create beautiful Y-axis steps based on maximum frequency
  const yMax = Math.ceil(maxCount * 1.15); // Add buffer at top for labels
  const yTicks: number[] = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(Math.round((yMax / tickCount) * i));
  }
  const uniqueYTicks = Array.from(new Set(yTicks)).sort((a, b) => a - b);

  const scaleValues = Array.from({ length: maxScale - minScale + 1 }, (_, i) => minScale + i);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm flex flex-col gap-4 animate-fadeIn">
      {/* Chart Card Header */}
      <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3.5">
        <div>
          <h4 className="font-bold text-sm text-slate-800 leading-normal">
            Pernyataan {questionIndex + 1}
            <span className="block text-xs font-normal text-slate-500 mt-1 leading-relaxed">{question.label}</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-1.5 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg w-fit border border-slate-100">
            {total} jawaban
          </p>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(question.label);
            toast.success("Teks pernyataan berhasil disalin");
          }}
          className="text-[10px] font-bold text-[#0077B6] hover:bg-[#F0F9FF] px-3 py-1.5 rounded-xl border border-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          Salin diagram
        </button>
      </div>

      {/* SVG Bar Chart */}
      <div className="w-full overflow-x-auto py-2">
        <div className="min-w-[550px] h-[220px] relative">
          <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
            {/* Grid lines and ticks */}
            {uniqueYTicks.map((tick, idx) => {
              const yRatio = tick / uniqueYTicks[uniqueYTicks.length - 1];
              const yPos = 180 - yRatio * 140; // Base axis at 180, grid height 140
              return (
                <g key={tick}>
                  <line 
                    x1="45" 
                    y1={yPos} 
                    x2="585" 
                    y2={yPos} 
                    stroke="#F1F5F9" 
                    strokeWidth="1" 
                    strokeDasharray={idx === 0 ? "0" : "4 4"}
                  />
                  <text 
                    x="30" 
                    y={yPos + 4} 
                    textAnchor="end" 
                    className="fill-slate-400 font-extrabold text-[10px] font-mono"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Scale Bars rendering count/percentages */}
            {scaleValues.map((val, idx) => {
              const count = freqs[val] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              const pctStr = pct.toFixed(1).replace('.', ',') + '%';
              
              // Spacing layout calculations
              const colWidth = 520 / scaleValues.length;
              const xPos = 50 + idx * colWidth + colWidth / 6;
              const barWidth = colWidth * 0.65;
              
              const yMaxTick = uniqueYTicks[uniqueYTicks.length - 1] || 1;
              const barHeight = (count / yMaxTick) * 140;
              const yPos = 180 - barHeight;

              return (
                <g key={val} className="group">
                  {/* Vertical Blue Bar */}
                  {count > 0 && (
                    <rect 
                      x={xPos} 
                      y={yPos} 
                      width={barWidth} 
                      height={barHeight} 
                      fill="#A0D2FF" 
                      className="transition-all duration-300 hover:fill-[#79B7ED] cursor-pointer"
                      rx="1"
                    />
                  )}
                  
                  {/* Data Text Label above the bar */}
                  <text 
                    x={xPos + barWidth / 2} 
                    y={yPos - 8} 
                    textAnchor="middle" 
                    className="fill-slate-600 font-bold text-[10px]"
                  >
                    {count > 0 ? `${count} (${pctStr})` : "0 (0%)"}
                  </text>

                  {/* Centered Scale Number under the column */}
                  <text 
                    x={xPos + barWidth / 2} 
                    y="202" 
                    textAnchor="middle" 
                    className="fill-slate-500 font-extrabold text-[11px]"
                  >
                    {val}
                  </text>
                  
                  {/* Small circle tick mark */}
                  <circle 
                    cx={xPos + barWidth / 2} 
                    cy="180" 
                    r="2" 
                    className="fill-slate-300"
                  />
                </g>
              );
            })}

            {/* Base Horizontal Axis line */}
            <line x1="45" y1="180" x2="585" y2="180" stroke="#CBD5E1" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * 📝 Descriptive / Paragraph text answers summary card
 */
function DescriptionSummaryCard({ question, responses, questionIndex }: { question: any; responses: any[]; questionIndex: number }) {
  const total = responses.length;
  const textAnswers = responses
    .map(r => {
      const ansObj = r.answers?.find((a: any) => a.questionId === question.id);
      return ansObj ? ansObj.answer : "";
    })
    .filter(ans => typeof ans === "string" && ans.trim().length > 0);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm flex flex-col gap-4 animate-fadeIn">
      <div className="border-b border-[#F1F5F9] pb-3.5">
        <h4 className="font-bold text-sm text-slate-800 leading-normal">
          Pernyataan {questionIndex + 1}
          <span className="block text-xs font-normal text-slate-500 mt-1 leading-relaxed">{question.label}</span>
        </h4>
        <p className="text-[11px] text-slate-400 mt-1.5 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg w-fit border border-slate-100">
          {textAnswers.length} jawaban dari {total} siswa
        </p>
      </div>

      <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
        {textAnswers.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">Belum ada jawaban untuk pertanyaan ini.</p>
        ) : (
          textAnswers.map((ans, idx) => (
            <div 
              key={idx} 
              className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0]/65 rounded-2xl text-xs text-[#334155] leading-relaxed hover:border-slate-300 transition-colors"
            >
              {ans}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function HasilRefleksiGuru() {
  const navigate = useNavigate();
  const { kelasId, materiId } = useParams();
  const { getPembelajaranById: getPembelajaran, getPembelajaranByKelasId } = usePembelajaran();
  
  const [stats, setStats] = useState<any>(null);
  const [refleksiData, setRefleksiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UEQ mandiri states
  const [activeTab, setActiveTab] = useState<"reflection" | "ueq">("reflection");
  const [ueqResponses, setUeqResponses] = useState<any[]>([]);
  const [loadingUeq, setLoadingUeq] = useState(false);
  
  // Google Forms inner tabs inside UEQ tab
  const [ueqSubTab, setUeqSubTab] = useState<"summary" | "individual">("summary");
  const [selectedSiswaIndex, setSelectedSiswaIndex] = useState(0);
  const [className, setClassName] = useState("XI RPL 1"); // fallback/default

  // Fetch pembelajaran list to populate context and prevent undefined on direct page refresh
  useEffect(() => {
    if (kelasId) {
      getPembelajaranByKelasId(kelasId);
    }
  }, [kelasId, getPembelajaranByKelasId]);

  const pembelajaran = materiId ? getPembelajaran(materiId) : null;

  // Retrieve class name dynamically when kelasId param is available
  useEffect(() => {
    if (kelasId) {
      const fetchClassName = async () => {
        try {
          const { data, error } = await supabase.from("classes").select("*").eq("id", kelasId).single();
          if (error) throw error;
          if (data) {
            setClassName(formatClassDisplayName(data));
          }
        } catch (err: any) {
          console.error("Error loading class info:", err);
        }
      };
      fetchClassName();
    }
  }, [kelasId]);

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

  useEffect(() => {
    if (materiId && activeTab === "ueq") {
      const fetchUeq = async () => {
        try {
          setLoadingUeq(true);
          const data = await getUeqResponsesByMateri(materiId);
          // Sort responses alphabetically by student name (siswa_name)
          const sorted = [...(data || [])].sort((a: any, b: any) =>
            (a.siswa_name || "").localeCompare(b.siswa_name || "")
          );
          setUeqResponses(sorted);
          setSelectedSiswaIndex(0); // Reset student slider index when data loads
        } catch (e) {
          console.error("Gagal mengambil respon UEQ:", e);
        } finally {
          setLoadingUeq(false);
        }
      };
      fetchUeq();
    }
  }, [materiId, activeTab]);

  // Aligned with the Excel layout from Screenshot 3
  const handleExportCSV = () => {
    if (!pembelajaran || ueqResponses.length === 0) {
      toast.error("Belum ada data respon kuesioner yang masuk.");
      return;
    }
    
    const questions = pembelajaran.ueqQuestions || [];
    if (questions.length === 0) {
      toast.error("Materi ini belum dikonfigurasi kuesioner UEQ mandiri.");
      return;
    }
    
    // Row 1: Merged Excel-like header title
    const row1 = ["DATA KUESIONER UEQ", "", "", ...questions.map(() => "")].join(",");
    
    // Row 2: Standard column headers (No, Nama Siswa, Kelas, P1, P2...)
    const row2 = ["No", "Nama Siswa", "Kelas", ...questions.map((_, idx) => `P${idx + 1}`)].join(",");
    
    // Rows 3+: Actual student scores/responses
    const dataRows = ueqResponses.map((r, index) => {
      const studentName = r.siswa_name || "Siswa";
      
      const questionAnswers = questions.map((q: any) => {
        const ansObj = r.answers?.find((a: any) => a.questionId === q.id);
        const ansVal = ansObj ? ansObj.answer : "";
        return ansVal !== undefined && ansVal !== null ? ansVal : "";
      });
      
      return [
        index + 1,
        `"${studentName.replace(/"/g, '""')}"`,
        `"${className.replace(/"/g, '""')}"`,
        ...questionAnswers
      ].join(",");
    });
    
    // Generate UTF-8 content with BOM (\uFEFF) to guarantee Excel formatting compatibility
    const csvContent = "\uFEFF" + [row1, row2, ...dataRows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DATA_UEQ_${pembelajaran.judul.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Spreadsheet evaluasi UEQ berhasil diunduh");
  };

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
          {/* Header Back Button */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            <button
              onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/materi/${materiId}`)}
              className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] hover:bg-[#0077B6] hover:border-[#0077B6] transition-all duration-300 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-[#0077B6] group-hover:text-white transition-colors" />
              <span className="text-sm font-bold text-[#0077B6] group-hover:text-white transition-colors">Kembali</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#0077B6] group-hover:bg-white transition-colors" />
            </button>

            <ProfileHeader />
          </div>

          {/* Title Card */}
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

          {/* Main Segmented Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-white shadow-lg inline-flex gap-1">
              <button
                onClick={() => setActiveTab("reflection")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === "reflection"
                    ? "bg-[#56B6C6] text-white shadow-md animate-scaleUp"
                    : "text-[#64748B] hover:text-[#0077B6] hover:bg-[#F8FAFC]"
                }`}
              >
                <Smile className="w-4 h-4" />
                Hasil Refleksi Pembelajaran
              </button>
              <button
                onClick={() => setActiveTab("ueq")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === "ueq"
                    ? "bg-[#56B6C6] text-white shadow-md animate-scaleUp"
                    : "text-[#64748B] hover:text-[#0077B6] hover:bg-[#F8FAFC]"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Evaluasi UEQ Mandiri
              </button>
            </div>
          </div>

          {activeTab === "reflection" ? (
            <>
              {/* Reflection Statistics Cards */}
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

              {/* Feedback List Table */}
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
                      </tr>
                    </thead>
                    <tbody>
                      {refleksiData.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-[#94A3B8]">
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* ==================== 📊 EVALUASI UEQ MANDIRI TAB ==================== */
            <div className="flex flex-col gap-6">
              {/* Header Box + Google Forms Sub-tabs Switcher */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/90 border border-white/95 rounded-[2.5rem] p-6 shadow-md">
                <div>
                  <h2 className="text-xl font-bold text-[#0077B6] flex items-center gap-2">
                    <BarChart2 className="w-6 h-6 text-[#56B6C6]" /> Evaluasi UEQ Mandiri ({ueqResponses.length} Jawaban)
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Analisis data pengalaman pengguna (UEQ) siswa
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Google Forms Sub-tabs selector */}
                  <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
                    <button
                      onClick={() => setUeqSubTab("summary")}
                      className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        ueqSubTab === "summary"
                          ? "bg-white text-[#0077B6] shadow-sm"
                          : "text-slate-500 hover:text-[#0077B6]"
                      }`}
                    >
                      Ringkasan
                    </button>
                    <button
                      onClick={() => setUeqSubTab("individual")}
                      className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        ueqSubTab === "individual"
                          ? "bg-white text-[#0077B6] shadow-sm"
                          : "text-slate-500 hover:text-[#0077B6]"
                      }`}
                    >
                      Individual
                    </button>
                  </div>
                  
                  {ueqResponses.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-all duration-300 shadow-md shadow-[#10B981]/20 hover:scale-[1.02] cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Unduh Spreadsheet (CSV)
                    </button>
                  )}
                </div>
              </div>

              {loadingUeq ? (
                <div className="py-12 bg-white/90 border border-white/95 rounded-[2.5rem] p-8 shadow-md text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56B6C6] mx-auto mb-4" />
                  <p className="text-sm text-[#64748B]">Memuat data respon UEQ...</p>
                </div>
              ) : ueqResponses.length === 0 ? (
                <div className="py-12 bg-white/90 border border-white/95 rounded-[2.5rem] p-8 shadow-md text-center text-[#94A3B8] border border-dashed border-[#E2E8F0]">
                  <AlertCircle className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                  <p className="text-sm font-semibold">Belum ada siswa yang mengisi kuesioner UEQ.</p>
                  <p className="text-xs mt-1">Siswa wajib menyelesaikan materi dan mengisi form UEQ di akhir materi.</p>
                </div>
              ) : (
                <>
                  {/* SUB TAB 1: SUMMARY / RINGKASAN DIAGRAM */}
                  {ueqSubTab === "summary" && (
                    <div className="flex flex-col gap-6">

                      {/* Google Forms Dynamic Charts Stack */}
                      <div className="bg-white/90 border border-white/95 rounded-[2.5rem] p-8 shadow-md flex flex-col gap-6">
                        <div className="border-b border-[#F1F5F9] pb-3.5 mb-2">
                          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                            <span>📊</span> DIAGRAM JAWABAN KUESIONER
                          </h3>
                        </div>
                        
                        <div className="flex flex-col gap-8">
                          {pembelajaran?.ueqQuestions?.map((q: any, idx: number) => {
                            if (q.type === "scale") {
                              return (
                                <GoogleFormsBarChart
                                  key={q.id}
                                  question={q}
                                  responses={ueqResponses}
                                  questionIndex={idx}
                                />
                              );
                            } else {
                              return (
                                <DescriptionSummaryCard
                                  key={q.id}
                                  question={q}
                                  responses={ueqResponses}
                                  questionIndex={idx}
                                />
                              );
                            }
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB TAB 2: INDIVIDUAL STUDENT VIEW */}
                  {ueqSubTab === "individual" && (
                    <div className="flex flex-col gap-6 animate-fadeIn">
                      {/* Dynamic Slider controls matching Google Forms Index Selector */}
                      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white/90 border border-white/95 rounded-[2.5rem] shadow-md">
                        <div className="flex items-center gap-3">
                          <button
                            disabled={selectedSiswaIndex === 0}
                            onClick={() => setSelectedSiswaIndex(prev => prev - 1)}
                            className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-extrabold shadow-sm"
                          >
                            &larr;
                          </button>
                          <span className="text-sm font-black text-[#334155] min-w-[80px] text-center">
                            {selectedSiswaIndex + 1} dari {ueqResponses.length}
                          </span>
                          <button
                            disabled={selectedSiswaIndex === ueqResponses.length - 1}
                            onClick={() => setSelectedSiswaIndex(prev => prev + 1)}
                            className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-extrabold shadow-sm"
                          >
                            &rarr;
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Pilih Responden:</span>
                          <select
                            value={selectedSiswaIndex}
                            onChange={(e) => setSelectedSiswaIndex(Number(e.target.value))}
                            className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#0077B6] font-bold outline-none cursor-pointer focus:border-[#56B6C6] shadow-sm max-w-xs sm:max-w-md"
                          >
                            {ueqResponses.map((res: any, idx: number) => (
                              <option key={res.id} value={idx}>
                                {idx + 1}. {res.siswa_name} ({res.siswa_email})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Individual completed form card matching Google Forms Completed Form Card */}
                      {(() => {
                        const res = ueqResponses[selectedSiswaIndex];
                        if (!res) return null;
                        
                        return (
                          <div className="bg-[#eff6ff]/35 border border-[#bfdbfe]/40 rounded-[2.5rem] p-6 sm:p-8 shadow-md flex flex-col gap-6">
                            {/* Student Metadata Box (styled like Google Forms top title block) */}
                            <div className="bg-white border-t-8 border-[#3b82f6] rounded-2xl p-6 shadow-sm flex flex-col gap-2">
                              <h3 className="text-lg font-black text-slate-800">{res.siswa_name}</h3>
                              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold text-slate-500 mt-1.5 border-t border-slate-100 pt-3">
                                <div>Email: <span className="text-[#0077B6] font-extrabold">{res.siswa_email}</span></div>
                                <div>Kelas: <span className="text-slate-700">{className}</span></div>
                                <div>Waktu Pengisian: <span className="text-slate-700 font-semibold">{new Date(res.created_at).toLocaleString("id-ID")}</span></div>
                              </div>
                            </div>
                            
                            {/* Completed scale/text answers checklist stack */}
                            <div className="flex flex-col gap-5">
                              {pembelajaran?.ueqQuestions?.map((q: any, qIdx: number) => {
                                const ansObj = res.answers?.find((a: any) => a.questionId === q.id);
                                const ansVal = ansObj ? ansObj.answer : null;
                                
                                return (
                                  <div key={q.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                                    <h4 className="text-xs font-bold text-slate-800 leading-normal">
                                      Pernyataan {qIdx + 1} <span className="text-red-500">*</span>
                                      <span className="block text-xs font-normal text-slate-500 mt-1">{q.label}</span>
                                    </h4>
                                    
                                    {/* Scale Question Circle Radio Buttons (Google Forms Style) */}
                                    {q.type === "scale" && (
                                      <div className="flex justify-between items-center px-4 py-5 bg-[#F8FAFC] rounded-2xl border border-slate-100 gap-2 overflow-x-auto">
                                        {/* Min Label */}
                                        {q.minLabel && q.minLabel.trim() ? (
                                          <div className="flex flex-col items-start max-w-[20%] flex-shrink-0">
                                            <span className="text-[10px] font-black text-amber-600 uppercase text-left leading-tight break-words" title={q.minLabel}>
                                              {q.minLabel}
                                            </span>
                                          </div>
                                        ) : null}

                                        {/* Scale values circles */}
                                        <div className="flex justify-center items-center gap-3 sm:gap-4 flex-1">
                                          {(() => {
                                            const minScale = q.minScale !== undefined ? q.minScale : 1;
                                            const maxScale = q.maxScale !== undefined ? q.maxScale : 7;
                                            const count = maxScale - minScale + 1;
                                            return Array.from({ length: count > 0 ? count : 7 }).map((_, numIdx) => {
                                              const val = minScale + numIdx;
                                              const isSelected = ansVal === val;
                                              return (
                                                <div 
                                                  key={val} 
                                                  className="flex flex-col items-center gap-2"
                                                >
                                                  <span className={`text-[10px] font-extrabold ${isSelected ? 'text-[#0077B6]' : 'text-slate-400'}`}>
                                                    {val}
                                                  </span>
                                                  <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    isSelected 
                                                      ? 'border-[#0077B6] bg-white scale-110 shadow-sm shadow-[#0077B6]/20' 
                                                      : 'border-slate-300 bg-white'
                                                  }`}>
                                                    <div className={`w-2.5 h-2.5 rounded-full ${
                                                      isSelected ? 'bg-[#0077B6]' : 'bg-transparent'
                                                    }`} />
                                                  </div>
                                                </div>
                                              );
                                            });
                                          })()}
                                        </div>

                                        {/* Max Label */}
                                        {q.maxLabel && q.maxLabel.trim() ? (
                                          <div className="flex flex-col items-end max-w-[20%] text-right flex-shrink-0">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase text-right leading-tight break-words" title={q.maxLabel}>
                                              {q.maxLabel}
                                            </span>
                                          </div>
                                        ) : null}
                                      </div>
                                    )}

                                    {/* Text/Paragraph completed answer field */}
                                    {(q.type === "text" || q.type === "paragraph") && (
                                      <div className="p-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                                        {ansVal || <span className="text-slate-400 italic">Siswa tidak mengisi jawaban.</span>}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
