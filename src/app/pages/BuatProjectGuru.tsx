"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ArrowLeft, Save, Loader } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useProject } from "../context/ProjectContext";
import { toast } from "sonner";

export default function BuatProjectGuru() {
  const navigate = useNavigate();
  const { kelasId } = useParams();
  const { preferences } = useSettings();
  const { addProject } = useProject();
  const [judulProject, setJudulProject] = useState("");
  const [deskripsiProject, setDeskripsiProject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSimpan = () => {
    if (!judulProject || !deskripsiProject || !deadline) {
      toast.error("Semua field harus diisi!");
      return;
    }

    if (!kelasId) {
      toast.error("ID kelas tidak ditemukan!");
      return;
    }

    setSaving(true);
    try {
      const projectId = addProject({
        judul: judulProject,
        deskripsi: deskripsiProject,
        kelasId: kelasId,
        deadline: deadline,
      });
      
      toast.success("Project berhasil dibuat!");
      
      // Navigate to DetailProjectGuru with the new project ID
      navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Gagal membuat project. Silakan coba lagi.");
      setSaving(false);
    }
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
        className="absolute left-[426px] top-[120px] w-[894px] h-[135px] bg-[#1294f2] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        <button
          onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}`)}
          className="absolute left-[39px] top-[20px] flex items-center gap-[12px] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white opacity-50" strokeWidth={2} />
          <p className="font-['Inter'] font-light text-[8px] text-white tracking-[-0.18px] opacity-50">
            Kembali ke Daftar Project
          </p>
        </button>

        <div className="absolute left-[39px] top-[45px]">
          <h1 className="font-['Lato'] font-bold text-[48px] text-white uppercase leading-[1.2]">
            BUAT PROJECT PJBL
          </h1>
          <p className="font-['Lato'] font-normal text-[16px] text-white capitalize leading-[1.4]">
            Buat Proyek Dengan 8 Sintaks Project Based Learning
          </p>
        </div>
      </motion.div>

      {/* Form Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute left-[426px] top-[268px] w-[894px] h-[636px] bg-white rounded-[35px] shadow-md"
      >
        <div className="p-[40px] h-full flex flex-col">
          {/* Heading */}
          <h2 className="font-['Poppins'] font-bold text-[24px] text-[#1e293b] mb-[31px]">
            Informasi Proyek
          </h2>

          {/* Form Fields */}
          <div className="flex flex-col gap-[20px] flex-1">
            {/* Judul Project */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                Judul Proyek <span className="text-[#e74c3c]">*</span>
              </label>
              <p className="font-['Poppins'] text-[12px] text-[#64748b]">
                Contoh: Website Portfolio, Sistem Informasi Perpustakaan, dll.
              </p>
              <input
                type="text"
                value={judulProject}
                onChange={(e) => setJudulProject(e.target.value)}
                placeholder="Proyek Website Portfolio"
                className="h-[53px] px-[20px] py-[14px] border-2 border-[#e2e8f0] rounded-[12px] font-['Poppins'] text-[14px] text-[#1e293b] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#1294f2] focus:outline-none transition-colors"
              />
            </div>

            {/* Deskripsi Project */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                Deskripsi Proyek <span className="text-[#e74c3c]">*</span>
              </label>
              <p className="font-['Poppins'] text-[12px] text-[#64748b]">
                Jelaskan tujuan proyek dan apa yang harus dikerjakan siswa
              </p>
              <textarea
                value={deskripsiProject}
                onChange={(e) => setDeskripsiProject(e.target.value)}
                placeholder="Siswa akan membuat website portfolio responsif dengan HTML, CSS, dan JavaScript..."
                className="h-[120px] px-[20px] py-[14px] border-2 border-[#e2e8f0] rounded-[12px] font-['Poppins'] text-[14px] text-[#1e293b] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#1294f2] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Deadline Project */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                Deadline Proyek <span className="text-[#e74c3c]">*</span>
              </label>
              <p className="font-['Poppins'] text-[12px] text-[#64748b]">
                Tentukan batas waktu pengerjaan proyek
              </p>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-[53px] px-[20px] py-[14px] border-2 border-[#e2e8f0] rounded-[12px] font-['Poppins'] text-[14px] text-[#1e293b] focus:border-[#1294f2] focus:outline-none transition-colors"
              />
            </div>

            {/* Info Box */}
            <div className="bg-[#dbeafe] border-2 border-[#1294f2] rounded-[12px] p-[16px]">
              <p className="font-['Poppins'] text-[13px] text-[#1e40af] leading-[1.6]">
                💡 <strong>Tips:</strong> Setelah membuat proyek ini, Anda harus menambahkan 8 sintaks PJBL untuk setiap tahapan pengerjaan. Setelah ke-8 sintaks selesai dibuat, baru Anda dapat memantau progress siswa.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            onClick={handleSimpan}
            disabled={!judulProject || !deskripsiProject || !deadline || saving}
            className="mt-auto self-end px-[16px] py-[17px] bg-gradient-to-b from-[#46bd84] to-[#34d399] rounded-full flex items-center gap-[10px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <Loader className="w-[18px] h-[18px] text-white animate-spin" />
                <p className="font-['Poppins'] font-semibold text-[14px] text-white tracking-[0.3px]">
                  Menyimpan...
                </p>
              </>
            ) : (
              <>
                <Save className="w-[18px] h-[18px] text-white" />
                <p className="font-['Poppins'] font-semibold text-[14px] text-white tracking-[0.3px]">
                  Simpan Proyek
                </p>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}