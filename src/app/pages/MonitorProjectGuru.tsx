"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ProfileHeader } from "../components/ProfileHeader";
import { ArrowLeft, Users, Check } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useProject } from "../context/ProjectContext";

export default function MonitorProjectGuru() {
  const navigate = useNavigate();
  const { kelasId, projectId } = useParams();
  const { preferences } = useSettings();
  const { getProjectById, isProjectComplete } = useProject();
  const [activeSintaks, setActiveSintaks] = useState(0);

  // Load real project data from context
  const project = getProjectById(projectId || "");

  if (!project) {
    return (
      <div className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden flex items-center justify-center">
        <SideBarGuru />
        <div className="text-center">
          <p className="font-['Poppins'] text-[18px] text-[#64748b]">Project tidak ditemukan</p>
          <button
            onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}`)}
            className="mt-4 px-6 py-2 bg-[#1294f2] text-white rounded-full"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const currentProject = project || {
    title: "PROYEK WEBSITE PORTFOLIO",
    subtitle: "Kelola 8 Sintaks PJBL Dan Monitor Progress Siswa",
  };

  const sintaksList = [
    { id: 0, label: "S0", title: "Pembagian Kelompok", color: "#46bd84" },
    { id: 1, label: "S1", title: "Orientasi pada Masalah", color: "#f59e0b" },
    { id: 2, label: "S2", title: "Menyusun Rencana Proyek", color: "#1294f2" },
    { id: 3, label: "S3", title: "Membuat Jadwal Proyek", color: "#56B6C6" },
    { id: 4, label: "S4", title: "Monitoring Pelaksanaan", color: "#10b981" },
    { id: 5, label: "S5", title: "Pengumpulan Proyek", color: "#ec4899" },
    { id: 6, label: "S6", title: "Presentasi Proyek", color: "#f97316" },
    { id: 7, label: "S7", title: "Penilaian dan Evaluasi", color: "#eab308" },
    { id: 8, label: "S8", title: "Refleksi", color: "#10b981" },
  ];

  // Get real kelompok data from project
  const kelompokList = project.kelompokList || [];

  // Transform kelompok data to match component format
  const kelompokData = kelompokList.map((kelompok, index) => {
    const colors = ["#9333ea", "#8b5cf6", "#a855f7", "#c084fc"];
    const firstAnggota = kelompok.anggotaList?.[0];
    const otherAnggota = kelompok.anggotaList?.slice(1) || [];
    
    return {
      id: kelompok.id,
      name: kelompok.nama,
      leader: { 
        name: firstAnggota || "Belum Ada Anggota", 
        role: "Ketua Kelompok" 
      },
      members: otherAnggota,
      progress: `0/${project.sintaksList?.length || 8}`,
      color: colors[index % colors.length],
    };
  });

  const getSintaksContent = (sintaksId: number) => {
    // Check if there's real sintaks data from project
    const realSintaks = project.sintaksList?.find(s => s.number === sintaksId);
    
    // If real sintaks exists, merge with default content structure
    if (realSintaks && sintaksId > 0) {
      return {
        title: realSintaks.nama,
        subtitle: realSintaks.judulTugas || "Sintaks pembelajaran project",
        description: realSintaks.deskripsiTugas,
        showResponsKelompok: true,
      };
    }

    // Default content for sintaks
    const contents: { [key: number]: any } = {
      0: {
        title: "Pembagian Kelompok",
        subtitle: "Kelola ketua kelompok dan anggota untuk mengerjakan proyek",
        showKelompok: true,
      },
      1: {
        title: "Orientasi pada Masalah (Sintaks 1)",
        subtitle: "Mengamati studi kasus, merumuskan masalah, menentukan indikator, dan analisis",
        description:
          "Sebuah platform e-learning mengalami penurunan engagement pengguna sebesar 40% dalam 3 bulan terakhir. Target penyelsaian kursus hanya 25%, dan feedback pengguna menunjukkan kesulitan yang membocarkan dan navigasi yang membingungkan.",
        showResponsKelompok: true,
      },
      2: {
        title: "Menyusun Rencana Proyek (Sintaks 2)",
        subtitle: "Buat Rencana Detail Selama Mengerjakan Proyek",
        guidelines: [
          "• Susun rencana pembuatan website informasi sederhana berdasarkan permasalahan yang telah dirumuskan.",
          "• Tentukan tujuan website, jumlah halaman HTML yang akan dibuat, serta pembagian tugas setiap anggota kelompok.",
        ],
        showResponsKelompok: true,
      },
      3: {
        title: "Membuat Jadwal Proyek (Sintaks 3)",
        subtitle: "Buat Timeline Pengerjaan Proyek",
        guidelines: [
          "• Susun jadwal pengerjaan proyek website secara berkelompok.",
          "• Tentukan waktu pengerjaan setiap tahap mulai dari penyusunan struktur HTML hingga penyelesaian website.",
        ],
        showResponsKelompok: true,
      },
      4: {
        title: "Monitoring Pelaksanaan (Sintaks 4)",
        subtitle: "Guru memantau progress dan jadwal tiap anggota",
        guidelines: [
          "• Laksanakan pembuatan website sesuai rencana dan jadwal yang telah disusun.",
          "• Gunakan struktur dokumen HTML yang benar dan tuliskan kode secara rapi. Unggah hasil pengerjaan sementara website untuk mendapatkan umpan balik dari guru.",
        ],
        showResponsKelompok: true,
      },
      5: {
        title: "Pengumpulan Proyek (Sintaks 5)",
        subtitle: "Upload hasil proyek yang telah dikerjakan",
        guidelines: [
          "• Lakukan peneli≠sahan akhir terhadap website yang telah dibuat.",
          "• Pastikan struktur dokumen HTML dan penggunaan tag telah sesuai dengan tuntunan.",
        ],
        showResponsKelompok: true,
      },
      6: {
        title: "Presentasi Proyek (Sintaks 6)",
        subtitle: "Upload file presentasi proyek",
        guidelines: [
          "• Siapkan bahan presentasi untuk menjelaskan website yang telah dibuat oleh kelompok.",
          "• Jelaskan struktur HTML dan fungsi tag yang digunakan pada website.",
        ],
        showResponsKelompok: true,
      },
      7: {
        title: "Penilaian dan Evaluasi (Sintaks 7)",
        subtitle: "Lihat Penilaian dari guru",
        showPenilaian: true,
      },
      8: {
        title: "Refleksi",
        subtitle: "Tulis Pengalaman Belajar Anda!!",
        showFeedback: true,
      },
    };
    return contents[sintaksId] || {
      title: "Pembagian Kelompok",
      subtitle: "Kelola ketua kelompok dan anggota untuk mengerjakan proyek",
      showKelompok: true,
    };
  };

  const currentContent = getSintaksContent(activeSintaks);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden"
    >
      <SideBarGuru />

      {/* Profile Header at top right */}
      <div className="absolute left-[426px] top-[40px] w-[894px] flex justify-end">
        <ProfileHeader />
      </div>

      {/* Header Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute left-[426px] top-[120px] w-[894px] h-[135px] bg-[#1294f2] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}`)}
          className="absolute left-[39px] top-[20px] flex items-center gap-[12px] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white opacity-50" strokeWidth={2} />
          <p className="font-['Inter'] font-light text-[8px] text-white tracking-[-0.18px] opacity-50">
            Kembali Ke Daftar Kelas
          </p>
        </button>

        {/* Title */}
        <div className="absolute left-[39px] top-[45px]">
          <h1 className="font-['Lato'] font-bold text-[32px] text-white uppercase leading-[1.2]">
            {project.judul}
          </h1>
          <p className="font-['Lato'] font-normal text-[13px] text-white capitalize leading-[1.4]">
            Monitor 8 Sintaks PJBL • Deadline: {new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* Sintaks Navigation Pills */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute left-[426px] top-[268px] w-[894px] h-[52px] bg-white rounded-[20px] shadow-md px-[20px] flex items-center gap-[12px] overflow-x-auto"
      >
        {sintaksList.map((sintaks, index) => (
          <button
            key={sintaks.id}
            onClick={() => setActiveSintaks(sintaks.id)}
            className={`min-w-[48px] h-[36px] rounded-full flex items-center justify-center font-['Poppins'] font-bold text-[12px] transition-all ${
              activeSintaks === sintaks.id
                ? "text-white shadow-lg"
                : "bg-[#f1f5f9] text-[#64748b]"
            }`}
            style={{
              backgroundColor: activeSintaks === sintaks.id ? sintaks.color : undefined,
            }}
          >
            {sintaks.id === 0 ? (
              <Check className="w-[18px] h-[18px]" />
            ) : (
              sintaks.label.replace("S", "")
            )}
          </button>
        ))}
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute left-[426px] top-[333px] w-[894px] h-[571px] bg-white rounded-[35px] shadow-md overflow-hidden"
      >
        <div className="p-[35px] h-full overflow-y-auto">
          {/* Sintaks Header */}
          <div
            className="w-full rounded-[20px] p-[24px] mb-[28px]"
            style={{ backgroundColor: sintaksList[activeSintaks].color }}
          >
            <h2 className="font-['Poppins'] font-bold text-[20px] text-white mb-[4px]">
              {currentContent.title}
            </h2>
            <p className="font-['Poppins'] text-[13px] text-white/90">{currentContent.subtitle}</p>
          </div>

          {/* Content based on Sintaks */}
          {currentContent.showKelompok && (
            <div>
              <div className="flex items-center justify-between mb-[24px]">
                <div>
                  <h3 className="font-['Poppins'] font-bold text-[18px] text-[#1e293b]">
                    Pembagian Kelompok
                  </h3>
                  <p className="font-['Poppins'] text-[13px] text-[#64748b]">
                    Kelola ketua kelompok dan anggota untuk mengerjakan proyek
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}/pembagian-kelompok`)}
                  className="px-[24px] py-[12px] bg-gradient-to-b from-[#56B6C6] to-[#0891b2] rounded-full flex items-center gap-[10px] shadow-lg"
                >
                  <Users className="w-[16px] h-[16px] text-white" />
                  <p className="font-['Poppins'] font-semibold text-[13px] text-white">
                    Tambah Kelompok
                  </p>
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-[20px]">
                {kelompokData.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-[80px]">
                    <div className="w-[100px] h-[100px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-[20px]">
                      <Users className="w-[50px] h-[50px] text-[#1294f2]" />
                    </div>
                    <h4 className="font-['Poppins'] font-semibold text-[18px] text-[#1e293b] mb-[8px]">
                      Belum Ada Kelompok
                    </h4>
                    <p className="font-['Poppins'] text-[14px] text-[#64748b] mb-[24px]">
                      Mulai buat kelompok untuk mengerjakan proyek ini
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}/pembagian-kelompok`)}
                      className="px-[32px] py-[14px] bg-gradient-to-b from-[#56B6C6] to-[#0891b2] rounded-full flex items-center gap-[12px] shadow-lg"
                    >
                      <Users className="w-[18px] h-[18px] text-white" />
                      <p className="font-['Poppins'] font-semibold text-[14px] text-white">
                        Buat Kelompok Pertama
                      </p>
                    </motion.button>
                  </div>
                ) : (
                  kelompokData.map((kelompok, index) => (
                    <motion.div
                      key={kelompok.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                      className="bg-white border-2 border-[#e2e8f0] rounded-[20px] p-[20px] hover:border-[#1294f2] transition-all"
                    >
                      <div className="flex items-center justify-between mb-[16px]">
                        <h4 className="font-['Poppins'] font-bold text-[16px] text-[#1e293b]">
                          {kelompok.name}
                        </h4>
                        <span
                          className="px-[12px] py-[4px] rounded-full font-['Poppins'] font-bold text-[11px] text-white"
                          style={{ backgroundColor: "#10b981" }}
                        >
                          {kelompok.progress}
                        </span>
                      </div>

                      {/* Leader */}
                      <div className="flex items-center gap-[12px] mb-[12px]">
                        <div
                          className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-['Poppins'] font-semibold text-[16px] text-white"
                          style={{ backgroundColor: kelompok.color }}
                        >
                          {kelompok.leader.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-['Poppins'] font-semibold text-[13px] text-[#1e293b]">
                            {kelompok.leader.name}
                          </p>
                          <p className="font-['Poppins'] text-[11px] text-[#64748b]">
                            {kelompok.leader.role}
                          </p>
                        </div>
                      </div>

                      {/* Members */}
                      {kelompok.members.length > 0 && (
                        <div>
                          <p className="font-['Poppins'] font-semibold text-[12px] text-[#64748b] mb-[8px]">
                            Anggota:
                          </p>
                          {kelompok.members.map((member, idx) => (
                            <div key={idx} className="flex items-center gap-[8px] mb-[6px]">
                              <div className="w-[6px] h-[6px] rounded-full bg-[#64748b]" />
                              <p className="font-['Poppins'] text-[12px] text-[#64748b]">
                                {member}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-[12px] pt-[12px] border-t border-[#e2e8f0] flex gap-[8px]">
                        <button className="flex-1 py-[8px] text-[12px] font-['Poppins'] font-semibold text-[#1294f2] hover:bg-[#f0f9ff] rounded-[8px] transition-all">
                          Progress
                        </button>
                        <button className="flex-1 py-[8px] text-[12px] font-['Poppins'] font-semibold text-[#1294f2] hover:bg-[#f0f9ff] rounded-[8px] transition-all">
                          1/8 Sintaks
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentContent.showResponsKelompok && (
            <div>
              {/* Description */}
              {currentContent.description && (
                <div className="bg-[#fef3c7] border-2 border-dashed border-[#f59e0b] rounded-[16px] p-[20px] mb-[24px]">
                  <div className="flex items-start gap-[12px] mb-[12px]">
                    <div className="w-[32px] h-[32px] rounded-full bg-[#f59e0b] flex items-center justify-center flex-shrink-0">
                      <p className="font-['Poppins'] font-bold text-[16px] text-white">S1</p>
                    </div>
                    <div>
                      <h4 className="font-['Poppins'] font-bold text-[14px] text-[#92400e] mb-[4px]">
                        Studi Kasus dari Guru
                      </h4>
                      <p className="font-['Poppins'] text-[13px] text-[#78350f] leading-[1.6]">
                        {currentContent.description}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-[8px] text-[#f59e0b] hover:underline mt-[12px]">
                    <p className="font-['Poppins'] text-[12px]">📎 Lihat sumber lengkap</p>
                  </button>
                </div>
              )}

              {/* Guidelines */}
              {currentContent.guidelines && (
                <div className="bg-[#f8fafc] border-2 border-dashed border-[#cbd5e1] rounded-[16px] p-[20px] mb-[24px]">
                  {currentContent.guidelines.map((guideline: string, idx: number) => (
                    <p
                      key={idx}
                      className="font-['Poppins'] text-[13px] text-[#475569] leading-[1.8] mb-[8px]"
                    >
                      {guideline}
                    </p>
                  ))}
                </div>
              )}

              {/* Respons Kelompok */}
              <h3 className="font-['Poppins'] font-bold text-[16px] text-[#1e293b] mb-[16px]">
                Respons Kelompok
              </h3>

              <div className="flex flex-col gap-[16px]">
                {kelompokData.slice(0, 2).map((kelompok, index) => (
                  <div
                    key={kelompok.id}
                    className="bg-white border border-[#e2e8f0] rounded-[16px] p-[20px]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                          {kelompok.name}
                        </h4>
                        <p className="font-['Poppins'] text-[12px] text-[#64748b]">
                          Ketua: {kelompok.leader.name}
                        </p>
                      </div>
                      <span className="bg-[#fef3c7] px-[16px] py-[6px] rounded-full">
                        <p className="font-['Poppins'] font-semibold text-[11px] text-[#92400e]">
                          ⏳ Belum Submit
                        </p>
                      </span>
                    </div>
                    <p className="font-['Poppins'] text-[12px] text-[#94a3b8] mt-[12px] italic">
                      Menunggu submission dari kelompok
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentContent.showPenilaian && (
            <div>
              <h3 className="font-['Poppins'] font-bold text-[18px] text-[#1e293b] mb-[20px]">
                Penilaian
              </h3>

              <div className="flex flex-col gap-[20px]">
                {kelompokData.slice(0, 1).map((kelompok) => (
                  <div
                    key={kelompok.id}
                    className="bg-white border border-[#e2e8f0] rounded-[20px] p-[24px]"
                  >
                    <h4 className="font-['Poppins'] font-semibold text-[15px] text-[#1e293b] mb-[16px]">
                      {kelompok.name}
                    </h4>
                    <p className="font-['Poppins'] text-[13px] text-[#64748b] mb-[16px]">
                      Ketua: {kelompok.leader.name}
                    </p>

                    <div className="bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe] rounded-[16px] p-[24px] flex items-center justify-between">
                      <div>
                        <p className="font-['Poppins'] font-semibold text-[14px] text-[#1e40af] mb-[4px]">
                          Nilai Kelompok
                        </p>
                      </div>
                      <div className="flex items-center gap-[16px]">
                        <p className="font-['Poppins'] font-bold text-[48px] text-[#1e40af]">
                          85
                        </p>
                        <button className="text-[#1e40af] hover:opacity-70">
                          <p className="font-['Poppins'] text-[12px] underline">✏️ Edit Nilai</p>
                        </button>
                      </div>
                    </div>

                    <div className="mt-[20px]">
                      <label className="flex items-center gap-[8px] mb-[8px]">
                        <input type="checkbox" className="w-[18px] h-[18px]" />
                        <p className="font-['Poppins'] text-[13px] text-[#64748b]">
                          Refleksi & Catatan
                        </p>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentContent.showFeedback && (
            <div>
              <h3 className="font-['Poppins'] font-bold text-[18px] text-[#1e293b] mb-[20px]">
                Feedback Siswa
              </h3>

              <div className="flex flex-col gap-[20px]">
                {kelompokData.slice(0, 1).map((kelompok) => (
                  <div
                    key={kelompok.id}
                    className="bg-white border border-[#e2e8f0] rounded-[20px] p-[24px]"
                  >
                    <h4 className="font-['Poppins'] font-semibold text-[15px] text-[#1e293b] mb-[12px]">
                      {kelompok.name}
                    </h4>
                    <p className="font-['Poppins'] text-[13px] text-[#64748b] mb-[16px]">
                      Ketua: {kelompok.leader.name}
                    </p>

                    <div className="bg-[#f8fafc] rounded-[12px] p-[16px] mb-[16px]">
                      <label className="flex items-center gap-[8px] mb-[12px]">
                        <input type="checkbox" className="w-[16px] h-[16px]" checked readOnly />
                        <p className="font-['Poppins'] font-semibold text-[13px] text-[#1e293b]">
                          Refleksi & Catatan
                        </p>
                      </label>
                      <p className="font-['Poppins'] text-[13px] text-[#475569] leading-[1.7]">
                        Melalui proyek pembuatan website berbasis HTML, kelompok kami mempelajari
                        pemahaman dasar tentang struktur dokumen HTML seperti penggunaan tag HTML,
                        head, body, serta berbagai elemen konten seperti heading, paragraf, gambar,
                        dan tautan. Kami juga mulai memahami pentingnya kerapihan struktur kode agar
                        tampilan website lebih mudah dibaca dan dikembangkan. Kendala yang kami
                        hadapi terutama pada kesalahan penulisan tag dan atribut yang menyebabkan
                        tampilan tidak sesuai...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}