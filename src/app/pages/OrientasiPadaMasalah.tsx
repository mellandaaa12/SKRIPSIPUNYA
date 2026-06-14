"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ChevronLeft, ChevronDown, Check, Lightbulb } from "lucide-react";

export default function OrientasiPadaMasalah() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  const sections = [
    {
      id: 1,
      title: "Studi Kasus dari Guru",
      status: "active",
      badge: "Aktif",
      content: {
        title: "Meningkatkan Engagement Website E-Learning",
        description:
          "Sebuah platform e-learning mengalami penurunan engagement pengguna sebesar 45% dalam 3 bulan terakhir. Tingkat penyelesaian kursus hanya 30%, dan feedback pengguna menyebutkan tampilan yang membosankan dan navigasi yang membingungkan.",
        resources: "Lihat Sumber Lengkap",
      },
    },
    {
      id: 2,
      title: "Merencanakan Rumusan Masalah",
      status: "pending",
      badge: "",
      content: {
        placeholder: "Diskusikan dengan kelompok Anda dan tuliskan masalah dari studi kasus",
      },
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
          onClick={() => navigate(`/project/${projectId}/kelompok`)}
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
            <span className="font-['Poppins'] text-[10px] text-white">Selesai</span>
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

        {/* Right Panel - Content */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex-1 rounded-[35px] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#ff8c42] px-[32px] py-[24px]">
            <div className="flex items-center gap-[12px]">
              <div className="w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center">
                <span className="font-['Poppins'] font-bold text-[20px] text-[#ff8c42]">1</span>
              </div>
              <div>
                <h2 className="font-['Poppins'] font-bold text-[24px] text-white">Orientasi pada Masalah</h2>
                <p className="font-['Poppins'] text-[14px] text-white opacity-90">
                  Mengamati studi kasus, merumuskan masalah, menentukan indikator, dan analisis
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="bg-white h-[calc(100%-96px)] overflow-y-auto p-[24px]">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                className="mb-[16px]"
              >
                {/* Section Header */}
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className={`w-full flex items-center justify-between p-[20px] rounded-[12px] border-2 transition-all ${
                    section.status === "active"
                      ? "bg-white border-[#ff8c42]"
                      : "bg-[#f8fafc] border-[#e2e8f0]"
                  }`}
                >
                  <div className="flex items-center gap-[12px]">
                    <div
                      className={`w-[32px] h-[32px] rounded-full flex items-center justify-center ${
                        section.status === "active" ? "bg-[#ff8c42]" : "bg-[#e2e8f0]"
                      }`}
                    >
                      <span
                        className={`font-['Poppins'] font-bold text-[14px] ${
                          section.status === "active" ? "text-white" : "text-[#94a3b8]"
                        }`}
                      >
                        {section.id}
                      </span>
                    </div>
                    <div className="text-left">
                      <p
                        className={`font-['Poppins'] font-semibold text-[16px] ${
                          section.status === "active" ? "text-[#1e293b]" : "text-[#64748b]"
                        }`}
                      >
                        {section.title}
                      </p>
                      {section.badge && (
                        <span className="font-['Poppins'] text-[11px] text-[#ff8c42]">{section.badge}</span>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-[20px] h-[20px] text-[#64748b]" />
                  </motion.div>
                </button>

                {/* Expandable Content */}
                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-[24px] bg-[#fffbeb] border-2 border-[#fde68a] rounded-b-[12px] mt-[-10px]">
                        {section.content.title && (
                          <>
                            <h3 className="font-['Poppins'] font-bold text-[18px] text-[#92400e] mb-[12px]">
                              {section.content.title}
                            </h3>
                            <p className="font-['Poppins'] text-[14px] text-[#78350f] leading-[1.6] mb-[16px]">
                              {section.content.description}
                            </p>
                            <div className="flex items-center gap-[8px] text-[#f59e0b] cursor-pointer hover:text-[#d97706] transition-colors">
                              <Lightbulb className="w-[16px] h-[16px]" />
                              <span className="font-['Poppins'] font-medium text-[13px]">
                                {section.content.resources}
                              </span>
                            </div>
                          </>
                        )}
                        {section.content.placeholder && (
                          <textarea
                            placeholder={section.content.placeholder}
                            className="w-full h-[120px] p-[16px] bg-white border border-[#e5e7eb] rounded-[8px] font-['Poppins'] text-[14px] text-[#1e293b] resize-none focus:outline-none focus:border-[#ff8c42]"
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
