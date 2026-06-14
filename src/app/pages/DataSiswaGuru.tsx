"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Search as SearchIcon, BookOpen, Users, AlertTriangle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { usePembelajaran } from "../context/PembelajaranContext";

type TabType = "materi" | "siswa";

// Mock data siswa untuk kelas
const mockSiswaList = [
  {
    id: "1",
    nama: "Aster Seawalker",
    email: "aster@student.com",
    avatar: "A",
    color: "#ffcb14",
  },
  {
    id: "2",
    nama: "Sarah Johnson",
    email: "sarah@student.com",
    avatar: "S",
    color: "#ffcb14",
  },
  {
    id: "3",
    nama: "Mike Brown",
    email: "mike@student.com",
    avatar: "M",
    color: "#ffcb14",
  },
  {
    id: "4",
    nama: "Emma Davis",
    email: "emma@student.com",
    avatar: "E",
    color: "#ffcb14",
  },
];

// Mock data progress siswa per materi
const mockProgressData: { [key: string]: { [key: string]: { completed: number; total: number; quizAttempts: { score: number; passingScore: number }[] } } } = {
  "1": {
    "materi-1": {
      completed: 13,
      total: 20,
      quizAttempts: [
        { score: 85, passingScore: 75 },
        { score: 90, passingScore: 75 },
      ],
    },
  },
  "2": {
    "materi-1": {
      completed: 11,
      total: 20,
      quizAttempts: [
        { score: 80, passingScore: 75 },
        { score: 85, passingScore: 75 },
      ],
    },
  },
  "3": {
    "materi-1": {
      completed: 3,
      total: 20,
      quizAttempts: [
        { score: 35, passingScore: 75 },
        { score: 40, passingScore: 75 },
        { score: 45, passingScore: 75 },
        { score: 38, passingScore: 75 },
      ],
    },
  },
  "4": {
    "materi-1": {
      completed: 14,
      total: 20,
      quizAttempts: [
        { score: 88, passingScore: 75 },
      ],
    },
  },
};

export default function DataSiswaGuru() {
  const navigate = useNavigate();
  const { kelasId } = useParams();
  const { preferences } = useSettings();
  const { pembelajaranList } = usePembelajaran();

  const [activeTab, setActiveTab] = useState<TabType>("siswa");
  const [searchQuery, setSearchQuery] = useState("");

  // Get materi untuk kelas ini
  const kelasMateriList = pembelajaranList.filter(m => m.classId === kelasId);

  // Calculate student progress
  const studentData = useMemo(() => {
    return mockSiswaList.map((siswa) => {
      const progressData = mockProgressData[siswa.id] || {};
      
      // Calculate overall progress across all materi
      let totalCompleted = 0;
      let totalSteps = 0;
      let allQuizAttempts: { score: number; passingScore: number }[] = [];
      
      Object.values(progressData).forEach((materiProgress) => {
        totalCompleted += materiProgress.completed;
        totalSteps += materiProgress.total;
        allQuizAttempts = [...allQuizAttempts, ...materiProgress.quizAttempts];
      });
      
      const progressPercentage = totalSteps > 0 ? Math.round((totalCompleted / totalSteps) * 100) : 0;
      
      // Calculate average score
      const averageScore = allQuizAttempts.length > 0
        ? Math.round(allQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / allQuizAttempts.length)
        : 0;
      
      // Detect if student needs attention
      // Criteria: Has attempted quiz 3+ times but still not reaching passing score
      const needsAttention = allQuizAttempts.length >= 3 && 
        allQuizAttempts.every(attempt => attempt.score < attempt.passingScore);
      
      return {
        ...siswa,
        progressPercentage,
        averageScore,
        needsAttention,
        quizAttempts: allQuizAttempts.length,
        isOnline: Math.random() > 0.5, // Mock online status
      };
    });
  }, []);

  // Filter students based on search
  const filteredStudents = studentData.filter((student) =>
    student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get color for score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "#46bd84";
    if (score >= 70) return "#ffcb14";
    return "#dc2626";
  };

  // Get progress color
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "#10B981";
    if (percentage >= 50) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden"
    >
      <SideBarGuru />

      {/* Header Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute left-80 top-[120px] w-[1000px] h-[202px] bg-gradient-to-r from-[#1294f2] to-[#0ea5e9] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}`)}
          className="absolute left-[39px] top-[20px] flex items-center gap-[12px] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white opacity-50" strokeWidth={2} />
          <p className="font-['Inter'] font-light text-[8px] text-white tracking-[-0.18px] opacity-50">
            Kembali Ke Detail Kelas
          </p>
        </button>

        {/* Title */}
        <div className="absolute left-[39px] top-[58px]">
          <h1 className="font-['Lato'] font-bold text-[48px] text-white uppercase leading-[1.2]">
            DATA SISWA
          </h1>
          <p className="font-['Lato'] font-normal text-[18px] text-white capitalize leading-[1.4] mt-[8px]">
            Kelola Dan Pantau Progress Siswa
          </p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute left-80 top-[335px] w-[1000px] flex gap-[16px]"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("materi")}
          className={`px-[32px] py-[12px] rounded-full flex items-center gap-[10px] transition-all ${
            activeTab === "materi"
              ? "bg-white shadow-lg"
              : "bg-white/50"
          }`}
        >
          <BookOpen className={`w-[18px] h-[18px] ${activeTab === "materi" ? "text-[#1294f2]" : "text-[#7a7e86]"}`} />
          <p className={`font-['Poppins'] font-semibold text-[14px] ${activeTab === "materi" ? "text-[#1294f2]" : "text-[#7a7e86]"}`}>
            Materi
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("siswa")}
          className={`px-[32px] py-[12px] rounded-full flex items-center gap-[10px] transition-all ${
            activeTab === "siswa"
              ? "bg-[#1294f2] shadow-lg"
              : "bg-white/50"
          }`}
        >
          <Users className={`w-[18px] h-[18px] ${activeTab === "siswa" ? "text-white" : "text-[#7a7e86]"}`} />
          <p className={`font-['Poppins'] font-semibold text-[14px] ${activeTab === "siswa" ? "text-white" : "text-[#7a7e86]"}`}>
            Siswa
          </p>
        </motion.button>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute left-80 top-[398px] w-[1000px] h-[506px] bg-white rounded-[35px] shadow-md overflow-hidden"
      >
        <div className="p-[35px] h-full overflow-y-auto">
          {/* Search Bar */}
          <div className="mb-[28px]">
            <div className="bg-[#f4f7fc] rounded-full px-[24px] py-[14px] flex items-center gap-[12px]">
              <SearchIcon className="w-[18px] h-[18px] text-[#7a7e86]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent font-['Poppins'] text-[14px] text-[#121212] placeholder:text-[#121212]/50 outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="relative">
            {/* Table Header */}
            <div className="flex items-center pb-[12px] border-b-2 border-[#e6e6e6] mb-[16px]">
              <div className="w-[243px]">
                <p className="font-['Poppins'] font-semibold text-[14px] text-[#7a7e86]">Nama</p>
              </div>
              <div className="w-[220px]">
                <p className="font-['Poppins'] font-semibold text-[14px] text-[#7a7e86]">Email</p>
              </div>
              <div className="w-[91px] text-center">
                <p className="font-['Poppins'] font-semibold text-[14px] text-[#7a7e86]">Progress</p>
              </div>
              <div className="w-[157px] text-center">
                <p className="font-['Poppins'] font-semibold text-[14px] text-[#7a7e86]">Rata-rata Nilai</p>
              </div>
              <div className="flex-1 text-center">
                <p className="font-['Poppins'] font-semibold text-[14px] text-[#7a7e86]">Ket</p>
              </div>
            </div>

            {/* Table Body */}
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[80px]">
                <Users className="w-[64px] h-[64px] text-[#cbd5e1] mb-[16px]" />
                <p className="font-['Poppins'] text-[16px] text-[#94a3b8]">
                  {searchQuery ? "Tidak ada siswa yang ditemukan" : "Belum ada siswa"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center py-[16px] border-b border-[#f5f5f5] hover:bg-[#f8fafc] transition-all"
                  >
                    {/* Nama */}
                    <div className="w-[243px] flex items-center gap-[12px]">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center shadow-md"
                          style={{ backgroundColor: student.color }}
                        >
                          {student.avatar && (student.avatar.startsWith("data:") || student.avatar.startsWith("http") || student.avatar.startsWith("/")) ? (
                            <img 
                              src={student.avatar} 
                              alt={student.nama} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <p className="font-['Poppins'] font-bold text-[16px] text-white">
                              {student.avatar}
                            </p>
                          )}
                        </div>
                        {student.isOnline ? (
                          <div className="absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] rounded-full bg-[#4ADE80] ring-2 ring-white" title="Online" />
                        ) : (
                          <div className="absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] rounded-full bg-[#94A3B8] ring-2 ring-white" title="Offline" />
                        )}
                      </div>
                      <p className="font-['Poppins'] font-medium text-[14px] text-[#1e293b]">
                        {student.nama}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="w-[220px]">
                      <p className="font-['Poppins'] text-[14px] text-[#7a7e86]">{student.email}</p>
                    </div>

                    {/* Progress */}
                    <div className="w-[91px] flex flex-col items-center group relative">
                      <div className="w-full bg-[#E2E8F0] h-[6px] rounded-full overflow-hidden mb-[6px] shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${student.progressPercentage}%`,
                            backgroundColor: getProgressColor(student.progressPercentage)
                          }}
                        />
                      </div>
                      <p className="font-['Poppins'] font-medium text-[12px] text-[#7a7e86]">
                        {student.progressPercentage}%
                      </p>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0077B6] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        Progress {student.progressPercentage}%
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0077B6]" />
                      </div>
                    </div>

                    {/* Rata-rata Nilai */}
                    <div className="w-[157px] text-center">
                      <p
                        className="font-['Poppins'] font-bold text-[14px]"
                        style={{ color: getScoreColor(student.averageScore) }}
                      >
                        {student.averageScore}
                      </p>
                    </div>

                    {/* Keterangan */}
                    <div className="flex-1 flex items-center justify-center">
                      {student.needsAttention ? (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="px-[16px] py-[8px] border-2 border-[#dc2626] rounded-full flex items-center gap-[8px] bg-[#fef2f2]"
                        >
                          <AlertTriangle className="w-[14px] h-[14px] text-[#dc2626]" />
                          <p className="font-['Poppins'] font-semibold text-[12px] text-[#dc2626]">
                            Butuh Perhatian
                          </p>
                        </motion.div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-[20px] py-[8px] border-2 border-[#1294f2] rounded-full"
                        >
                          <p className="font-['Poppins'] font-semibold text-[12px] text-[#1294f2]">
                            -
                          </p>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {filteredStudents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-[28px] grid grid-cols-3 gap-[20px]"
            >
              <div className="bg-gradient-to-br from-[#f0f9ff] to-[#D4ECF0] rounded-[16px] p-[20px]">
                <p className="font-['Poppins'] text-[12px] text-[#0369a1] mb-[8px]">Total Siswa</p>
                <p className="font-['Poppins'] font-bold text-[32px] text-[#0c4a6e]">
                  {filteredStudents.length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-[16px] p-[20px]">
                <p className="font-['Poppins'] text-[12px] text-[#92400e] mb-[8px]">
                  Rata-rata Progress
                </p>
                <p className="font-['Poppins'] font-bold text-[32px] text-[#78350f]">
                  {Math.round(
                    filteredStudents.reduce((sum, s) => sum + s.progressPercentage, 0) /
                      filteredStudents.length
                  )}
                  %
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#fee2e2] to-[#fecaca] rounded-[16px] p-[20px]">
                <p className="font-['Poppins'] text-[12px] text-[#991b1b] mb-[8px]">
                  Butuh Perhatian
                </p>
                <p className="font-['Poppins'] font-bold text-[32px] text-[#7f1d1d]">
                  {filteredStudents.filter((s) => s.needsAttention).length}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
