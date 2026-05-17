"use client";

import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ChevronLeft, Users, Check } from "lucide-react";

export default function PembagianKelompok() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const groups = [
    {
      id: 1,
      name: "Kelompok 1",
      leader: "Aster Seawalker",
      members: ["Sarah Johnson", "Mike Chen"],
      completedCount: 3,
      totalCount: 4,
      color: "bg-[#a855f7]",
      joined: true,
    },
    {
      id: 2,
      name: "Kelompok 2",
      leader: "John Doe",
      members: ["Jane Smith", "Tom Brown"],
      completedCount: 3,
      totalCount: 4,
      color: "bg-[#3b82f6]",
      joined: false,
    },
    {
      id: 3,
      name: "Kelompok 3",
      leader: "Alice Brown",
      members: ["Bob Wilson", "Carol Davis"],
      completedCount: 1,
      totalCount: 4,
      color: "bg-[#a855f7]",
      joined: false,
    },
    {
      id: 4,
      name: "Kelompok 4",
      leader: "Bob Wilson",
      members: ["Emma Garcia", "Liam Martinez"],
      completedCount: 2,
      totalCount: 4,
      color: "bg-[#3b82f6]",
      joined: false,
    },
  ];

  const steps = [
    { id: 1, title: "Orientasi pada Masalah", status: "active" },
    { id: 2, title: "Menyusun Rencana Proyek", status: "pending" },
    { id: 3, title: "Membuat Jadwal Proyek", status: "pending" },
    { id: 4, title: "Monitoring Pelaksanaan", status: "pending" },
    { id: 5, title: "Pengumpulan Proyek", status: "pending" },
    { id: 6, title: "Presentasi Proyek", status: "pending" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden"
    >
      <SideBarMurid />

      {/* Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute left-[426px] top-[120px] w-[894px] h-[202px] bg-[#1294f2] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)] relative"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/project")}
          className="absolute left-[30px] top-[20px] flex items-center gap-[12px] text-white opacity-50 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-[18px] h-[18px]" />
          <span className="font-['Inter'] font-light text-[8px] tracking-[-0.18px] leading-[22px]">
            Kembali ke Daftar Project
          </span>
        </button>

        {/* Progress Circle */}
        <div className="absolute right-[50px] top-[50%] -translate-y-1/2 w-[100px] h-[100px]">
          <svg className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeDasharray="283"
              strokeDashoffset="255"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-['Poppins'] font-bold text-[24px] text-white">10%</span>
            <span className="font-['Poppins'] text-[10px] text-white">Complete</span>
          </div>
        </div>

        {/* Title */}
        <div className="absolute left-[50px] top-[50%] -translate-y-1/2 right-[160px]">
          <p className="font-['Poppins'] font-bold text-[28px] uppercase text-white leading-[1.2] mb-[8px]">
            PEMBUATAN WEBSITE INFORMASI SEDERHANA MENGGUNAKAN HTML
          </p>
          <p className="font-['Poppins'] font-normal text-[16px] text-white leading-[1.4]">
            Project Based Learning - 8 Sintaks PJBL
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="absolute left-[426px] top-[334px] w-[894px] h-[570px] flex gap-[16px]">
        {/* Left Panel - Steps */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-[380px] bg-white rounded-[35px] p-[24px] overflow-y-auto"
        >
          <div className="space-y-[16px]">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
                className={`flex items-start gap-[12px] p-[16px] rounded-[16px] border-2 ${
                  step.status === "active"
                    ? "bg-[#f0f4ff] border-[#8b5cf6]"
                    : step.status === "completed"
                    ? "bg-[#dcfce7] border-[#10b981]"
                    : "bg-[#f8fafc] border-[#e2e8f0]"
                }`}
              >
                {/* Number/Icon */}
                <div
                  className={`w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === "active"
                      ? "bg-[#8b5cf6] text-white"
                      : step.status === "completed"
                      ? "bg-[#10b981] text-white"
                      : "bg-[#e2e8f0] text-[#94a3b8]"
                  }`}
                >
                  {step.status === "completed" ? (
                    <Check className="w-[16px] h-[16px]" />
                  ) : (
                    <span className="font-['Poppins'] font-bold text-[14px]">{step.id}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p
                    className={`font-['Poppins'] font-medium text-[14px] ${
                      step.status === "active"
                        ? "text-[#5b21b6]"
                        : step.status === "completed"
                        ? "text-[#065f46]"
                        : "text-[#64748b]"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.status === "active" && (
                    <span className="font-['Poppins'] text-[11px] text-[#8b5cf6]">Aktif</span>
                  )}
                  {step.status === "pending" && (
                    <span className="font-['Poppins'] text-[11px] text-[#94a3b8]">
                      Deadline: {index + 12} Jan
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Panel - Groups */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex-1 bg-[#8b5cf6] rounded-[35px] p-[32px] overflow-hidden"
        >
          <div className="flex items-center gap-[12px] mb-[24px]">
            <div className="w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center">
              <Users className="w-[24px] h-[24px] text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="font-['Poppins'] font-bold text-[24px] text-white">Pembagian Kelompok</h2>
              <p className="font-['Poppins'] text-[14px] text-white opacity-80">
                Pilih kelompok untuk mengerjakan proyek bersama
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-[16px] mb-[16px]">
            <p className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b] mb-[8px]">
              Pilih Kelompok Anda
            </p>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-2 gap-[16px] h-[calc(100%-180px)] overflow-y-auto pr-[8px]">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="bg-white rounded-[16px] p-[16px] cursor-pointer border-2 border-transparent hover:border-[#fbbf24] transition-all"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-[12px]">
                  <h3 className="font-['Poppins'] font-bold text-[16px] text-[#1e293b]">{group.name}</h3>
                  <span className="font-['Poppins'] text-[12px] text-[#64748b]">
                    {group.completedCount}/{group.totalCount}
                  </span>
                </div>

                {/* Leader */}
                <div className="flex items-center gap-[8px] mb-[8px]">
                  <div className={`w-[32px] h-[32px] ${group.color} rounded-full flex items-center justify-center`}>
                    <span className="font-['Poppins'] font-bold text-[14px] text-white">
                      {group.leader.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins'] font-medium text-[13px] text-[#1e293b] truncate">
                      {group.leader}
                    </p>
                    <p className="font-['Poppins'] text-[11px] text-[#64748b]">Ketua Kelompok</p>
                  </div>
                </div>

                {/* Members Label */}
                <p className="font-['Poppins'] font-medium text-[11px] text-[#64748b] mb-[6px]">Anggota:</p>

                {/* Members */}
                <div className="space-y-[4px] mb-[12px]">
                  {group.members.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-[6px]">
                      <div className="w-[4px] h-[4px] bg-[#64748b] rounded-full" />
                      <p className="font-['Poppins'] text-[11px] text-[#64748b]">{member}</p>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => navigate(`/project/${projectId}/orientasi`)}
                  className={`w-full py-[8px] rounded-[8px] font-['Poppins'] font-semibold text-[12px] transition-colors ${
                    group.joined
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                  }`}
                >
                  {group.joined ? "Gabung" : "Gabung"}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
