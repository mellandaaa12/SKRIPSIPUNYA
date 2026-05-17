"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ArrowLeft, Plus, X, Users } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useProject } from "../context/ProjectContext";

// Mock data siswa (nanti bisa diambil dari context/API)
const MOCK_SISWA = [
  { id: "1", nama: "Aster Seawalker" },
  { id: "2", nama: "Sarah Johnson" },
  { id: "3", nama: "Mike Brown" },
  { id: "4", nama: "Emily Davis" },
  { id: "5", nama: "David Wilson" },
  { id: "6", nama: "Lisa Anderson" },
  { id: "7", nama: "Tom Martinez" },
  { id: "8", nama: "Anna Garcia" },
];

export default function PembagianKelompokGuru() {
  const navigate = useNavigate();
  const { kelasId, projectId } = useParams();
  const { preferences } = useSettings();
  const { getProjectById, addKelompok, deleteKelompok } = useProject();
  const [showTambahModal, setShowTambahModal] = useState(false);
  const [namaKelompok, setNamaKelompok] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState<string[]>([]);

  const project = projectId ? getProjectById(projectId) : undefined;
  
  // Get siswa yang belum masuk kelompok
  const siswaYangSudahMasuk = project?.kelompokList?.flatMap(k => k.anggotaList) || [];
  const siswaAvailable = MOCK_SISWA.filter(s => !siswaYangSudahMasuk.includes(s.nama));

  const handleTambahKelompok = () => {
    if (namaKelompok && selectedSiswa.length > 0 && projectId) {
      addKelompok(projectId, {
        nama: namaKelompok,
        anggotaList: selectedSiswa,
      });
      setNamaKelompok("");
      setSelectedSiswa([]);
      setShowTambahModal(false);
    }
  };

  const handleDeleteKelompok = (kelompokId: string) => {
    if (projectId) {
      deleteKelompok(projectId, kelompokId);
    }
  };

  const toggleSiswa = (namaSiswa: string) => {
    if (selectedSiswa.includes(namaSiswa)) {
      setSelectedSiswa(selectedSiswa.filter(s => s !== namaSiswa));
    } else {
      setSelectedSiswa([...selectedSiswa, namaSiswa]);
    }
  };

  if (!project) {
    return (
      <div className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden flex items-center justify-center">
        <p className="font-['Poppins'] text-[18px] text-[#64748b]">Proyek tidak ditemukan</p>
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
        className="absolute left-[426px] top-[120px] w-[894px] h-[135px] bg-[#1294f2] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        <button
          onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}`)}
          className="absolute left-[39px] top-[20px] flex items-center gap-[12px] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white opacity-50" strokeWidth={2} />
          <p className="font-['Inter'] font-light text-[8px] text-white tracking-[-0.18px] opacity-50">
            Kembali Ke Detail Proyek
          </p>
        </button>

        <div className="absolute left-[39px] top-[45px]">
          <h1 className="font-['Lato'] font-bold text-[48px] text-white uppercase leading-[1.2]">
            PEMBAGIAN KELOMPOK
          </h1>
          <p className="font-['Lato'] font-normal text-[16px] text-white capitalize leading-[1.4]">
            Step 0: Bagi Siswa Menjadi Kelompok Proyek
          </p>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute left-[426px] top-[268px] w-[894px] h-[636px] bg-white rounded-[35px] shadow-md"
      >
        <div className="p-[40px] h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-[24px]">
            <div>
              <h2 className="font-['Poppins'] font-bold text-[24px] text-[#1e293b]">
                Daftar Kelompok
              </h2>
              <p className="font-['Poppins'] text-[13px] text-[#64748b]">
                {project.kelompokList?.length || 0} kelompok • {siswaYangSudahMasuk.length}/{MOCK_SISWA.length} siswa terbagi
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTambahModal(true)}
              className="px-[20px] py-[12px] bg-gradient-to-b from-[#1294f2] to-[#56B6C6] rounded-full flex items-center gap-[8px] shadow-lg"
            >
              <Plus className="w-[18px] h-[18px] text-white" />
              <p className="font-['Poppins'] font-semibold text-[14px] text-white">
                Tambah Kelompok
              </p>
            </motion.button>
          </div>

          {/* Kelompok List */}
          {project.kelompokList && project.kelompokList.length > 0 ? (
            <div className="grid grid-cols-2 gap-[20px]">
              {project.kelompokList.map((kelompok, index) => (
                <motion.div
                  key={kelompok.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                  className="bg-gradient-to-b from-[#f0f9ff] to-[#D4ECF0] border-2 border-[#bae6fd] rounded-[16px] p-[20px]"
                >
                  <div className="flex items-start justify-between mb-[12px]">
                    <div className="flex items-center gap-[12px]">
                      <div className="w-[40px] h-[40px] bg-gradient-to-b from-[#1294f2] to-[#56B6C6] rounded-[10px] flex items-center justify-center">
                        <Users className="w-[20px] h-[20px] text-white" />
                      </div>
                      <div>
                        <p className="font-['Poppins'] font-bold text-[16px] text-[#0c4a6e]">
                          {kelompok.nama}
                        </p>
                        <p className="font-['Poppins'] text-[12px] text-[#0369a1]">
                          {kelompok.anggotaList?.length || 0} anggota
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteKelompok(kelompok.id)}
                      className="text-[#ef4444] hover:bg-[#fee2e2] w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-[16px] h-[16px]" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    {kelompok.anggotaList?.map((anggota, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-[8px] px-[12px] py-[8px] flex items-center gap-[8px]"
                      >
                        <div className="w-[24px] h-[24px] bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe] rounded-full flex items-center justify-center">
                          <p className="font-['Poppins'] font-bold text-[11px] text-[#1e40af]">
                            {idx + 1}
                          </p>
                        </div>
                        <p className="font-['Poppins'] text-[13px] text-[#1e293b]">
                          {anggota}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="w-[80px] h-[80px] bg-[#f0f9ff] rounded-full flex items-center justify-center mb-[16px]">
                <Users className="w-[40px] h-[40px] text-[#1294f2]" />
              </div>
              <p className="font-['Poppins'] font-semibold text-[18px] text-[#64748b] mb-[8px]">
                Belum ada kelompok
              </p>
              <p className="font-['Poppins'] text-[14px] text-[#94a3b8]">
                Mulai bagi siswa menjadi kelompok dengan tombol "Tambah Kelompok"
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Tambah Kelompok */}
      {showTambahModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[25px] w-[600px] max-h-[80vh] overflow-y-auto p-[40px]"
          >
            <h3 className="font-['Poppins'] font-bold text-[24px] text-[#1e293b] mb-[24px]">
              Tambah Kelompok Baru
            </h3>

            {/* Nama Kelompok */}
            <div className="mb-[24px]">
              <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b] mb-[8px] block">
                Nama Kelompok <span className="text-[#e74c3c]">*</span>
              </label>
              <input
                type="text"
                value={namaKelompok}
                onChange={(e) => setNamaKelompok(e.target.value)}
                placeholder="Contoh: Kelompok 1, Tim Alpha, dll."
                className="w-full h-[49px] px-[16px] py-[12px] border-2 border-[#e2e8f0] rounded-[10px] font-['Poppins'] text-[14px] text-[#1e293b] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#1294f2] focus:outline-none transition-colors"
              />
            </div>

            {/* Pilih Siswa */}
            <div className="mb-[24px]">
              <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b] mb-[12px] block">
                Pilih Anggota Kelompok <span className="text-[#e74c3c]">*</span>
              </label>
              <p className="font-['Poppins'] text-[12px] text-[#64748b] mb-[12px]">
                {selectedSiswa.length} siswa dipilih
              </p>
              <div className="grid grid-cols-2 gap-[12px] max-h-[300px] overflow-y-auto p-[4px]">
                {siswaAvailable.map((siswa) => (
                  <button
                    key={siswa.id}
                    onClick={() => toggleSiswa(siswa.nama)}
                    className={`p-[16px] rounded-[12px] border-2 transition-all text-left ${
                      selectedSiswa.includes(siswa.nama)
                        ? "bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe] border-[#1294f2]"
                        : "bg-white border-[#e2e8f0] hover:border-[#1294f2]"
                    }`}
                  >
                    <p
                      className={`font-['Poppins'] font-semibold text-[13px] ${
                        selectedSiswa.includes(siswa.nama) ? "text-[#1e40af]" : "text-[#1e293b]"
                      }`}
                    >
                      {siswa.nama}
                    </p>
                  </button>
                ))}
              </div>
              {siswaAvailable.length === 0 && (
                <p className="font-['Poppins'] text-[13px] text-[#94a3b8] text-center py-[20px]">
                  Semua siswa sudah masuk kelompok
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-[12px]">
              <button
                onClick={() => {
                  setShowTambahModal(false);
                  setNamaKelompok("");
                  setSelectedSiswa([]);
                }}
                className="flex-1 h-[41px] rounded-full border-2 border-[#1294f2] font-['Poppins'] font-semibold text-[14px] text-[#1294f2] hover:bg-[#f0f9ff] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleTambahKelompok}
                disabled={!namaKelompok || selectedSiswa.length === 0}
                className="flex-1 h-[41px] rounded-full bg-gradient-to-b from-[#46bd84] to-[#34d399] font-['Poppins'] font-semibold text-[14px] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan Kelompok
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}