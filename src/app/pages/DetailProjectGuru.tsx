"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ArrowLeft, Plus, Eye } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useProject } from "../context/ProjectContext";

const SINTAKS_NAMES = [
  "Orientasi Pada Masalah",
  "Menyusun Rencana Proyek",
  "Menyusun Jadwal",
  "Monitor Pelaksanaan Proyek",
  "Menguji Hasil",
  "Evaluasi Pengalaman",
  "Presentasi Hasil",
  "Refleksi dan Penutup",
];

export default function DetailProjectGuru() {
  const navigate = useNavigate();
  const { kelasId, projectId } = useParams();
  const { preferences } = useSettings();
  const { getProjectById, isProjectComplete, hasKelompok } = useProject();

  const project = projectId ? getProjectById(projectId) : undefined;
  const isComplete = projectId ? isProjectComplete(projectId) : false;
  const kelompokReady = projectId ? hasKelompok(projectId) : false;

  if (!project) {
    return (
      <div className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden flex items-center justify-center">
        <p className="font-['Poppins'] text-[18px] text-[#64748b]">
          Proyek tidak ditemukan
        </p>
      </div>
    );
  }

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
        className="absolute left-[426px] top-[120px] w-[894px] h-[202px] bg-[#1294f2] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}`)}
          className="absolute left-[39px] top-[20px] flex items-center gap-[12px] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white opacity-50" strokeWidth={2} />
          <p className="font-['Inter'] font-light text-[8px] text-white tracking-[-0.18px] opacity-50">
            Kembali ke Daftar Kelas
          </p>
        </button>

        {/* Title */}
        <div className="absolute left-[78px] top-[47px]">
          <h1 className="font-['Lato'] font-bold text-[64px] text-white uppercase leading-[1.2]">
            {project.judul}
          </h1>
          <div className="flex items-center gap-[16px]">
            <p className="font-['Lato'] font-medium text-[20px] text-white capitalize tracking-[0.8px] leading-[1.4]">
              Kelola 8 Sintaks PJBL Dan Monitor Progress Siswa
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-[16px] py-[6px]">
              <p className="font-['Poppins'] font-semibold text-[14px] text-white">
                📅 Deadline: {new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute left-[426px] top-[342px] w-[894px] h-[565px] bg-white rounded-[35px] shadow-md"
      >
        <div className="p-[36px] h-full overflow-y-auto">
          {/* Progress Bar */}
          <div className="mb-[24px]">
            <div className="flex items-center justify-between mb-[8px]">
              <p className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                Progress Sintaks PJBL
              </p>
              <p className="font-['Poppins'] font-semibold text-[14px] text-[#1294f2]">
                {project.sintaksList.length}/8 Sintaks
              </p>
            </div>
            <div className="w-full h-[8px] bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1294f2] to-[#56B6C6] transition-all duration-500"
                style={{ width: `${(project.sintaksList.length / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 0: Pembagian Kelompok */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}/kelompok`)
            }
            className={`w-full rounded-[16px] p-[24px] flex items-center gap-[16px] transition-all mb-[24px] ${
              kelompokReady
                ? "bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe] border-2 border-[#1294f2]"
                : "bg-white border-2 border-dashed border-[#1294f2] hover:bg-[#f0f9ff]"
            }`}
          >
            <div
              className={`w-[48px] h-[48px] rounded-full flex items-center justify-center ${
                kelompokReady
                  ? "bg-gradient-to-b from-[#1294f2] to-[#56B6C6]"
                  : "bg-[#e2e8f0]"
              }`}
            >
              <p
                className={`font-['Poppins'] font-bold text-[16px] ${
                  kelompokReady ? "text-white" : "text-[#64748b]"
                }`}
              >
                0
              </p>
            </div>
            <div className="flex-1 text-left">
              <p
                className={`font-['Poppins'] font-bold text-[16px] mb-[4px] ${
                  kelompokReady ? "text-[#1e40af]" : "text-[#1e293b]"
                }`}
              >
                Step 0: Pembagian Kelompok
              </p>
              <p className="font-['Poppins'] text-[12px] text-[#64748b]">
                {kelompokReady
                  ? `${project.kelompokList?.length || 0} kelompok sudah dibuat`
                  : "Buat kelompok siswa untuk mengerjakan proyek ini"}
              </p>
            </div>
            {kelompokReady && (
              <div className="w-[24px] h-[24px] bg-[#10b981] rounded-full flex items-center justify-center">
                <p className="text-[14px] text-white">✓</p>
              </div>
            )}
          </motion.button>

          {/* Sintaks Stepper */}
          <div className="grid grid-cols-4 gap-[16px] mb-[24px]">
            {SINTAKS_NAMES.map((nama, index) => {
              const sintaks = project.sintaksList.find((s) => s.number === index + 1);
              const isCompleted = !!sintaks;
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isCompleted) {
                      // Navigate to view sintaks
                    } else {
                      navigate(
                        `/dashboard-guru/kelas/${kelasId}/project/${projectId}/sintaks/buat?number=${index + 1}`
                      );
                    }
                  }}
                  className={`p-[16px] rounded-[12px] border-2 transition-all ${
                    isCompleted
                      ? "bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe] border-[#1294f2]"
                      : "bg-white border-dashed border-[#e2e8f0] hover:border-[#1294f2]"
                  }`}
                >
                  <div className="flex items-center gap-[8px] mb-[4px]">
                    <div
                      className={`w-[24px] h-[24px] rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-gradient-to-b from-[#1294f2] to-[#56B6C6]"
                          : "bg-[#e2e8f0]"
                      }`}
                    >
                      <p
                        className={`font-['Poppins'] font-bold text-[11px] ${
                          isCompleted ? "text-white" : "text-[#64748b]"
                        }`}
                      >
                        {index + 1}
                      </p>
                    </div>
                    {isCompleted && (
                      <div className="w-[16px] h-[16px] bg-[#10b981] rounded-full flex items-center justify-center">
                        <p className="text-[10px] text-white">✓</p>
                      </div>
                    )}
                  </div>
                  <p
                    className={`font-['Poppins'] font-semibold text-[11px] text-left leading-[1.3] ${
                      isCompleted ? "text-[#1e40af]" : "text-[#64748b]"
                    }`}
                  >
                    {nama}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Sintaks List */}
          {project.sintaksList.length > 0 ? (
            <div className="flex flex-col gap-[12px] mb-[20px]">
              <h3 className="font-['Poppins'] font-bold text-[16px] text-[#1e293b]">
                Sintaks yang Sudah Dibuat
              </h3>
              {project.sintaksList.map((sintaks) => (
                <div
                  key={sintaks.id}
                  className="bg-white border-2 border-[#e9e9e9] rounded-[16px] p-[20px] hover:border-[#1294f2] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-[12px] mb-[4px]">
                        <div className="w-[32px] h-[32px] bg-gradient-to-b from-[#1294f2] to-[#56B6C6] rounded-[8px] flex items-center justify-center">
                          <p className="font-['Poppins'] font-bold text-[13px] text-white">
                            {sintaks.number}
                          </p>
                        </div>
                        <div>
                          <p className="font-['Poppins'] font-bold text-[14px] text-[#1e293b]">
                            Sintaks {sintaks.number}: {sintaks.nama}
                          </p>
                          <p className="font-['Poppins'] font-semibold text-[13px] text-[#64748b]">
                            {sintaks.judulTugas}
                          </p>
                        </div>
                      </div>
                      <p className="font-['Poppins'] text-[12px] text-[#64748b] mt-[8px]">
                        {sintaks.instruksiList.length} instruksi • {sintaks.deliverableList.length} deliverable
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px]">
              <p className="font-['Poppins'] font-semibold text-[18px] text-[#64748b] mb-[8px]">
                Belum ada sintaks
              </p>
              <p className="font-['Poppins'] text-[14px] text-[#94a3b8]">
                Mulai tambahkan sintaks PJBL dengan memilih nomor sintaks di atas
              </p>
            </div>
          )}

          {/* Monitor Button */}
          {isComplete && kelompokReady && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}/monitor`)
              }
              className="w-full bg-gradient-to-b from-[#46bd84] to-[#34d399] rounded-[16px] p-[24px] flex items-center justify-center gap-[16px] hover:shadow-lg transition-all"
            >
              <Eye className="w-[24px] h-[24px] text-white" strokeWidth={2} />
              <div className="text-left">
                <p className="font-['Poppins'] font-bold text-[16px] text-white">
                  Monitor Progress Siswa
                </p>
                <p className="font-['Poppins'] text-[12px] text-white/80">
                  8 Sintaks sudah lengkap, kini Anda dapat memantau progress siswa
                </p>
              </div>
            </motion.button>
          )}

          {!isComplete && (
            <div className="bg-[#fef3c7] border-2 border-[#f59e0b] rounded-[12px] p-[16px]">
              <p className="font-['Poppins'] text-[13px] text-[#92400e] leading-[1.6]">
                ⚠️ <strong>Perhatian:</strong> Anda harus menyelesaikan ke-8 sintaks PJBL terlebih dahulu sebelum dapat memantau progress siswa.
              </p>
            </div>
          )}

          {!kelompokReady && (
            <div className="bg-[#fef3c7] border-2 border-[#f59e0b] rounded-[12px] p-[16px]">
              <p className="font-['Poppins'] text-[13px] text-[#92400e] leading-[1.6]">
                ⚠️ <strong>Perhatian:</strong> Anda harus menambahkan kelompok siswa terlebih dahulu sebelum dapat memantau progress siswa.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}